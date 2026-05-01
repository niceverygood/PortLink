/**
 * POST /api/dispatch-orders/:id/accept
 *
 * 차주(DRIVER)가 OPEN 상태 배차를 수락. 트랜잭션 내에서:
 *   1. order = OPEN 상태 확인
 *   2. driver의 활성 차량 1대 + 차종 매칭 확인
 *   3. INSERT DispatchAssign  ← partial unique index 충돌 시 P2002 → 409 ALREADY_ACCEPTED
 *   4. UPDATE DispatchOrder.status = ASSIGNED
 *   5. INSERT Trip (PENDING)
 *   6. AuditLog STATUS_CHANGE
 */
import { z } from 'zod';
import { AuditAction, DispatchOrderStatus, Prisma, TripStatus, UserRole } from '@prisma/client';
import { jsonErr, jsonOk, requireRole } from '@/lib/api';
import { prisma } from '@/lib/db';

const Params = z.object({ id: z.string().min(1) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authR = await requireRole([UserRole.DRIVER]);
  if (!authR.ok) return authR.response;

  const params = Params.safeParse(await ctx.params);
  if (!params.success) return jsonErr('INVALID_PARAMS', '잘못된 경로 매개변수');
  const orderId = params.data.id;

  // 차주 프로필 + 활성 차량 조회 (트랜잭션 밖에서 미리 — 가벼운 read)
  const driver = await prisma.truckDriver.findUnique({
    where: { userId: authR.session.user.id },
    include: { vehicles: { where: { isActive: true } } },
  });
  if (!driver) return jsonErr('DRIVER_NOT_FOUND', '차주 프로필이 없습니다', 404);
  if (driver.vehicles.length === 0) return jsonErr('NO_VEHICLE', '활성 차량이 없습니다');

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.dispatchOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new HandledError('NOT_FOUND', '배차를 찾을 수 없습니다', 404);
      if (order.status !== DispatchOrderStatus.OPEN) {
        throw new HandledError('NOT_OPEN', '이미 다른 차주가 수락한 배차입니다', 409);
      }

      // 차종 매칭되는 차량 1대 선택
      const vehicle = driver.vehicles.find((v) => v.type === order.containerType);
      if (!vehicle) {
        throw new HandledError(
          'TYPE_MISMATCH',
          `차종(${order.containerType})에 맞는 차량이 없습니다`,
          400,
        );
      }

      const assign = await tx.dispatchAssign.create({
        data: {
          dispatchOrderId: order.id,
          driverId: driver.id,
        },
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
          actorUserId: authR.session.user.id,
          entity: 'DispatchOrder',
          entityId: order.id,
          action: AuditAction.STATUS_CHANGE,
          before: { status: order.status },
          after: { status: updated.status, assignId: assign.id, tripId: trip.id },
        },
      });

      return { order: updated, assign, trip };
    });

    return jsonOk(result, 201);
  } catch (e) {
    if (e instanceof HandledError) return jsonErr(e.code, e.message, e.status);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return jsonErr('ALREADY_ACCEPTED', '이미 다른 차주가 수락한 배차입니다', 409);
    }
    throw e;
  }
}

class HandledError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
