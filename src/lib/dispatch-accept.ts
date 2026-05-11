/**
 * 배차 수락 도메인 로직 — API 라우트와 Server Action 양쪽에서 재사용.
 */
import {
  AuditAction,
  DispatchOrderStatus,
  NotificationType,
  Prisma,
  TripStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';
import { createNotification } from '@/lib/notifications';
import { detectAndRecordEmptyRun } from '@/lib/empty-run';

export type AcceptError =
  | 'NOT_FOUND'
  | 'NOT_OPEN'
  | 'TYPE_MISMATCH'
  | 'NO_VEHICLE'
  | 'DRIVER_NOT_FOUND'
  | 'INCOMPLETE_PROFILE' // 화물자동차 운수사업법 — licenseNo/bankAccount 미입력 시 차단 (onboarding 강제)
  | 'ALREADY_ACCEPTED';

export interface AcceptResult {
  orderId: string;
  tripId: string;
}

export async function acceptDispatchOrder(opts: {
  userId: string;
  orderId: string;
}): Promise<Result<AcceptResult, AcceptError>> {
  const driver = await prisma.truckDriver.findUnique({
    where: { userId: opts.userId },
    include: { vehicles: { where: { isActive: true } } },
  });
  if (!driver) return err('DRIVER_NOT_FOUND');
  if (driver.vehicles.length === 0) return err('NO_VEHICLE');
  // 화물자동차 운수사업법 — 자격증 + 정산 계좌 등록 후에만 paid freight 수락 가능.
  // 가입 직후 nullable로 두고 첫 수락 시점에 onboarding으로 강제 리다이렉트.
  if (!driver.licenseNo || !driver.bankName || !driver.bankAccount) {
    return err('INCOMPLETE_PROFILE');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.dispatchOrder.findUnique({ where: { id: opts.orderId } });
      if (!order) return err('NOT_FOUND' as const);
      if (order.status !== DispatchOrderStatus.OPEN) return err('NOT_OPEN' as const);

      const vehicle = driver.vehicles.find((v) => v.type === order.containerType);
      if (!vehicle) return err('TYPE_MISMATCH' as const);

      const assign = await tx.dispatchAssign.create({
        data: { dispatchOrderId: order.id, driverId: driver.id },
      });
      const updated = await tx.dispatchOrder.update({
        where: { id: order.id },
        data: { status: DispatchOrderStatus.ASSIGNED },
      });
      const trip = await tx.trip.create({
        data: {
          dispatchOrderId: order.id,
          driverId: driver.id,
          vehicleId: vehicle.id,
          status: TripStatus.PENDING,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: opts.userId,
          entity: 'DispatchOrder',
          entityId: order.id,
          action: AuditAction.STATUS_CHANGE,
          before: { status: order.status },
          after: { status: updated.status, assignId: assign.id, tripId: trip.id },
        },
      });
      // 포워더에게 수락 알림 — 같은 트랜잭션에서 best-effort 생성.
      const driverUser = await tx.user.findUnique({
        where: { id: opts.userId },
        select: { name: true },
      });
      await createNotification(
        {
          userId: order.forwarderUserId,
          type: NotificationType.DISPATCH_ACCEPTED,
          title: `${driverUser?.name ?? '차주'}님이 배차를 수락했습니다`,
          body: `${order.orderNo} · ${order.originRegion} → ${order.port}`,
          link: `/forwarder/dispatch/${order.id}`,
          metadata: { orderId: order.id, orderNo: order.orderNo, tripId: trip.id },
        },
        tx,
      );
      return ok({ orderId: order.id, tripId: trip.id });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return err('ALREADY_ACCEPTED');
    }
    throw e;
  } finally {
    // 트랜잭션 외부에서 best-effort 공차 운행 감지 — 실패해도 수락 자체엔 영향 X.
    // (driver, order는 위 트랜잭션이 성공해야만 valid 상태)
    if (driver) {
      void detectAndRecordEmptyRunBestEffort({
        driverId: driver.id,
        orderId: opts.orderId,
      });
    }
  }
}

/** 트랜잭션 외부 best-effort. order 정보를 한 번 더 fetch (트랜잭션 결과를 반환받지 않으므로).
 * 어떤 실패도 호출자에게 throw하지 않음. */
async function detectAndRecordEmptyRunBestEffort(opts: {
  driverId: string;
  orderId: string;
}): Promise<void> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { dispatchOrderId: opts.orderId },
      include: { dispatchOrder: { select: { originRegion: true, containerType: true } } },
    });
    if (!trip) return;
    await detectAndRecordEmptyRun({
      driverId: opts.driverId,
      newTripId: trip.id,
      newDispatchOrderOriginRegion: trip.dispatchOrder.originRegion,
      newContainerType: trip.dispatchOrder.containerType,
    });
  } catch (e) {
    console.error('[empty-run] detect failed', e);
  }
}
