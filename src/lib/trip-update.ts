/**
 * Trip 상태 전환 도메인 로직 — API와 Server Action 양쪽에서 재사용.
 */
import { AuditAction, DispatchOrderStatus, SettlementStatus, TripStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';
import { canTransitionTripStatus, TRIP_STATUS_TIMESTAMP } from '@/lib/trip-state';
import { calculateSettlement } from '@/lib/settlements';

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

    return { tripId: updated.id, status: updated.status, settlementId };
  });

  return ok(result);
}
