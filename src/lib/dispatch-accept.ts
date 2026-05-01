/**
 * 배차 수락 도메인 로직 — API 라우트와 Server Action 양쪽에서 재사용.
 */
import { AuditAction, DispatchOrderStatus, Prisma, TripStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';

export type AcceptError =
  | 'NOT_FOUND'
  | 'NOT_OPEN'
  | 'TYPE_MISMATCH'
  | 'NO_VEHICLE'
  | 'DRIVER_NOT_FOUND'
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
      return ok({ orderId: order.id, tripId: trip.id });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return err('ALREADY_ACCEPTED');
    }
    throw e;
  }
}
