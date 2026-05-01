/**
 * PATCH /api/trips/:id/status
 *
 * Trip 상태 머신 전환. 권한: 본인 trip 차주 또는 ADMIN.
 * COMPLETED 전환 시 같은 트랜잭션에서 DispatchOrder.status=COMPLETED + Settlement DRAFT 생성.
 * CANCELLED 전환 시 DispatchAssign.cancelledAt 세팅 + DispatchOrder.status=OPEN(차주) 또는 CANCELLED(관리자) 복원.
 */
import { z } from 'zod';
import {
  AuditAction,
  DispatchOrderStatus,
  SettlementStatus,
  TripStatus,
  UserRole,
} from '@prisma/client';
import { jsonErr, jsonOk, parseBody, requireRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { canTransitionTripStatus, TRIP_STATUS_TIMESTAMP } from '@/lib/trip-state';
import { calculateSettlement } from '@/lib/settlements';

const Body = z.object({
  status: z.nativeEnum(TripStatus),
  reason: z.string().max(200).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authR = await requireRole([UserRole.DRIVER, UserRole.ADMIN]);
  if (!authR.ok) return authR.response;

  const { id: tripId } = await ctx.params;
  if (!tripId) return jsonErr('INVALID_PARAMS', '잘못된 trip id');

  const bodyR = await parseBody(req, Body);
  if (!bodyR.ok) return bodyR.response;
  const { status: nextStatus, reason } = bodyR.data;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { dispatchOrder: true, driver: { include: { user: true } } },
  });
  if (!trip) return jsonErr('NOT_FOUND', 'Trip을 찾을 수 없습니다', 404);

  const isAdmin = authR.session.user.role === UserRole.ADMIN;
  const isOwnerDriver = trip.driver.user.id === authR.session.user.id;
  if (!isAdmin && !isOwnerDriver) {
    return jsonErr('FORBIDDEN', '본인의 운송만 변경 가능합니다', 403);
  }

  // 활성 배정 조회 (acceptedAt 기준 grace 검증용)
  const activeAssign = await prisma.dispatchAssign.findFirst({
    where: { dispatchOrderId: trip.dispatchOrderId, cancelledAt: null },
    orderBy: { acceptedAt: 'desc' },
  });
  if (!activeAssign) return jsonErr('NO_ASSIGN', '활성 배정이 없습니다', 409);

  const validation = canTransitionTripStatus({
    from: trip.status,
    to: nextStatus,
    acceptedAt: activeAssign.acceptedAt,
    isAdmin,
  });
  if (!validation.ok) {
    if (validation.error === 'INVALID_TRANSITION') {
      return jsonErr(
        'INVALID_TRANSITION',
        `${trip.status} → ${nextStatus} 전환은 허용되지 않습니다`,
      );
    }
    return jsonErr(
      'CANCEL_GRACE_EXCEEDED',
      `수락 후 ${5}분이 지나 일반 차주는 취소할 수 없습니다`,
      409,
    );
  }

  try {
    const now = new Date();
    const tsField = TRIP_STATUS_TIMESTAMP[nextStatus];
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: nextStatus,
          ...(tsField ? { [tsField]: now } : {}),
          ...(nextStatus === TripStatus.CANCELLED ? { cancelReason: reason } : {}),
        },
      });

      let settlement = null;
      if (nextStatus === TripStatus.COMPLETED) {
        const breakdown = calculateSettlement(trip.dispatchOrder.fare);
        settlement = await tx.settlement.create({
          data: {
            tripId: trip.id,
            fare: breakdown.fare,
            platformFee: breakdown.platformFee,
            driverPayout: breakdown.driverPayout,
            status: SettlementStatus.DRAFT,
          },
        });
        await tx.dispatchOrder.update({
          where: { id: trip.dispatchOrderId },
          data: { status: DispatchOrderStatus.COMPLETED },
        });
      }

      if (nextStatus === TripStatus.CANCELLED) {
        await tx.dispatchAssign.update({
          where: { id: activeAssign.id },
          data: { cancelledAt: now, cancelReason: reason },
        });
        await tx.dispatchOrder.update({
          where: { id: trip.dispatchOrderId },
          data: {
            status: isAdmin ? DispatchOrderStatus.CANCELLED : DispatchOrderStatus.OPEN,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: authR.session.user.id,
          entity: 'Trip',
          entityId: trip.id,
          action: AuditAction.STATUS_CHANGE,
          before: { status: trip.status },
          after: { status: updated.status, settlementId: settlement?.id },
        },
      });

      return { trip: updated, settlement };
    });

    return jsonOk(result);
  } catch (e) {
    throw e;
  }
}
