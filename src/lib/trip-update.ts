/**
 * Trip 상태 전환 도메인 로직 — API와 Server Action 양쪽에서 재사용.
 */
import {
  AuditAction,
  DispatchOrderStatus,
  NotificationType,
  SettlementStatus,
  TripStampAction,
  TripStatus,
} from '@prisma/client';
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';
import { canTransitionTripStatus, TRIP_STATUS_TIMESTAMP } from '@/lib/trip-state';
import { calculateSettlement } from '@/lib/settlements';
import { createNotification } from '@/lib/notifications';

const TRIP_NOTIFICATION_BY_STATUS: Partial<
  Record<TripStatus, { type: NotificationType; label: string }>
> = {
  [TripStatus.DEPARTED]: { type: NotificationType.TRIP_DEPARTED, label: '출발 보고' },
  [TripStatus.LOADED]: { type: NotificationType.TRIP_LOADED, label: '상차 완료' },
  [TripStatus.UNLOADED]: { type: NotificationType.TRIP_UNLOADED, label: '하차 완료' },
  [TripStatus.COMPLETED]: { type: NotificationType.TRIP_COMPLETED, label: '운송 완료' },
  [TripStatus.CANCELLED]: { type: NotificationType.TRIP_CANCELLED, label: '운송 취소' },
};

/** TripStatus → TripStampAction 매핑. PENDING/IN_TRANSIT은 액션 버튼 없음. */
const STATUS_TO_STAMP_ACTION: Partial<Record<TripStatus, TripStampAction>> = {
  [TripStatus.DEPARTED]: TripStampAction.DEPARTED,
  [TripStatus.LOADED]: TripStampAction.LOADED,
  [TripStatus.UNLOADED]: TripStampAction.UNLOADED,
  [TripStatus.COMPLETED]: TripStampAction.COMPLETED,
  [TripStatus.CANCELLED]: TripStampAction.CANCELLED,
};

export interface LocationStampInput {
  latitude: number;
  longitude: number;
  accuracyM: number | null;
}

export type UpdateError =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'NO_ASSIGN'
  | 'INVALID_TRANSITION'
  | 'CANCEL_GRACE_EXCEEDED';

export interface UpdateResult {
  tripId: string;
  status: TripStatus;
  settlementId: string | null;
}

export async function updateTripStatus(opts: {
  userId: string;
  isAdmin: boolean;
  tripId: string;
  nextStatus: TripStatus;
  reason?: string;
  /** 액션 직전 navigator.geolocation 1회 호출 결과. 권한 거부면 미전달. */
  location?: LocationStampInput | null;
}): Promise<Result<UpdateResult, UpdateError>> {
  const trip = await prisma.trip.findUnique({
    where: { id: opts.tripId },
    include: { dispatchOrder: true, driver: { include: { user: true } } },
  });
  if (!trip) return err('NOT_FOUND');

  if (!opts.isAdmin && trip.driver.user.id !== opts.userId) return err('FORBIDDEN');

  const activeAssign = await prisma.dispatchAssign.findFirst({
    where: { dispatchOrderId: trip.dispatchOrderId, cancelledAt: null },
    orderBy: { acceptedAt: 'desc' },
  });
  if (!activeAssign) return err('NO_ASSIGN');

  const validation = canTransitionTripStatus({
    from: trip.status,
    to: opts.nextStatus,
    acceptedAt: activeAssign.acceptedAt,
    isAdmin: opts.isAdmin,
  });
  if (!validation.ok) return err(validation.error);

  const now = new Date();
  const tsField = TRIP_STATUS_TIMESTAMP[opts.nextStatus];

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.trip.update({
      where: { id: trip.id },
      data: {
        status: opts.nextStatus,
        ...(tsField ? { [tsField]: now } : {}),
        ...(opts.nextStatus === TripStatus.CANCELLED ? { cancelReason: opts.reason } : {}),
      },
    });

    let settlementId: string | null = null;
    if (opts.nextStatus === TripStatus.COMPLETED) {
      const breakdown = calculateSettlement(trip.dispatchOrder.fare);
      const s = await tx.settlement.create({
        data: {
          tripId: trip.id,
          fare: breakdown.fare,
          platformFee: breakdown.platformFee,
          driverPayout: breakdown.driverPayout,
          status: SettlementStatus.DRAFT,
        },
      });
      settlementId = s.id;
      await tx.dispatchOrder.update({
        where: { id: trip.dispatchOrderId },
        data: { status: DispatchOrderStatus.COMPLETED },
      });
    }

    if (opts.nextStatus === TripStatus.CANCELLED) {
      await tx.dispatchAssign.update({
        where: { id: activeAssign.id },
        data: { cancelledAt: now, cancelReason: opts.reason },
      });
      await tx.dispatchOrder.update({
        where: { id: trip.dispatchOrderId },
        data: {
          status: opts.isAdmin ? DispatchOrderStatus.CANCELLED : DispatchOrderStatus.OPEN,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: opts.userId,
        entity: 'Trip',
        entityId: trip.id,
        action: AuditAction.STATUS_CHANGE,
        before: { status: trip.status },
        after: { status: updated.status, settlementId },
      },
    });

    // 위치 스탬프 — 권한 받았을 때만 (best-effort, 실패해도 액션은 성공).
    const stampAction = STATUS_TO_STAMP_ACTION[opts.nextStatus];
    if (stampAction && opts.location) {
      try {
        await tx.tripLocationStamp.upsert({
          where: { uniq_trip_stamp: { tripId: trip.id, action: stampAction } },
          update: {
            latitude: opts.location.latitude,
            longitude: opts.location.longitude,
            accuracyM: opts.location.accuracyM ?? undefined,
            capturedAt: now,
          },
          create: {
            tripId: trip.id,
            action: stampAction,
            latitude: opts.location.latitude,
            longitude: opts.location.longitude,
            accuracyM: opts.location.accuracyM ?? undefined,
            capturedAt: now,
          },
        });
      } catch (e) {
        console.error('[trip-update] location stamp failed', e);
      }
    }

    // 포워더 알림 — 출발/상차/하차/완료/취소 모두 안내.
    const tripNoti = TRIP_NOTIFICATION_BY_STATUS[opts.nextStatus];
    if (tripNoti) {
      const driverName = trip.driver.user.name;
      const orderNo = trip.dispatchOrder.orderNo;
      await createNotification(
        {
          userId: trip.dispatchOrder.forwarderUserId,
          type: tripNoti.type,
          title: `${driverName} · ${tripNoti.label}`,
          body:
            opts.nextStatus === TripStatus.CANCELLED && opts.reason
              ? `${orderNo} · ${opts.reason}`
              : `${orderNo} · ${trip.dispatchOrder.originRegion} → ${trip.dispatchOrder.port}`,
          link: `/forwarder/dispatch/${trip.dispatchOrderId}`,
          metadata: { tripId: trip.id, orderNo, status: opts.nextStatus },
        },
        tx,
      );
    }

    return { tripId: updated.id, status: updated.status, settlementId };
  });

  return ok(result);
}
