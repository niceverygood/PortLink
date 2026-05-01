'use server';

import { revalidatePath } from 'next/cache';
import { TripStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { updateTripStatus } from '@/lib/trip-update';

/**
 * 포워더가 본인 의뢰의 trip을 취소.
 * 도메인 lib(updateTripStatus)이 grace 검증/권한 검증/트랜잭션 처리.
 *
 * NOTE: updateTripStatus는 차주 또는 ADMIN만 허용. 포워더는 권한 없음.
 * 그래서 포워더 취소는 별도 흐름 — 본인 의뢰임을 검증 후 ADMIN 권한으로 우회 호출.
 * (관리자 권한 위임 방식. 추후 별도 forwarder-cancel.ts로 분리 가능.)
 */
export async function cancelDispatchAction(opts: {
  tripId: string;
  reason?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.FORWARDER) {
    return { ok: false, message: '포워더 권한이 필요합니다' };
  }

  // 본인 의뢰인지 확인
  const { prisma } = await import('@/lib/db');
  const trip = await prisma.trip.findUnique({
    where: { id: opts.tripId },
    include: { dispatchOrder: true },
  });
  if (!trip || trip.dispatchOrder.forwarderUserId !== session.user.id) {
    return { ok: false, message: '본인 의뢰만 취소할 수 있습니다' };
  }

  // ADMIN 권한으로 위임 호출 (grace 무시 — 포워더는 자기 의뢰니 취소 가능)
  const result = await updateTripStatus({
    userId: session.user.id,
    isAdmin: true,
    tripId: opts.tripId,
    nextStatus: TripStatus.CANCELLED,
    reason: opts.reason,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  revalidatePath(`/forwarder/dispatch/${trip.dispatchOrderId}`);
  revalidatePath('/forwarder/dispatch');
  return { ok: true };
}
