'use server';

import { revalidatePath } from 'next/cache';
import { UserRole, type TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { updateTripStatus, type UpdateError } from '@/lib/trip-update';

const ERROR_MESSAGE: Record<UpdateError, string> = {
  NOT_FOUND: 'Trip을 찾을 수 없습니다',
  FORBIDDEN: '본인의 운송만 변경 가능합니다',
  NO_ASSIGN: '활성 배정이 없습니다',
  INVALID_TRANSITION: '허용되지 않는 상태 전환입니다',
  CANCEL_GRACE_EXCEEDED: '수락 후 5분이 지나 취소할 수 없습니다',
};

export async function updateTripStatusAction(opts: {
  tripId: string;
  nextStatus: TripStatus;
}): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: '로그인이 필요합니다' };

  const result = await updateTripStatus({
    userId: session.user.id,
    isAdmin: session.user.role === UserRole.ADMIN,
    tripId: opts.tripId,
    nextStatus: opts.nextStatus,
  });

  if (!result.ok) return { ok: false, message: ERROR_MESSAGE[result.error] };

  revalidatePath('/driver/trip');
  revalidatePath(`/driver/trip/${opts.tripId}`);
  revalidatePath('/driver/jobs');
  revalidatePath('/driver/settlement');
  return { ok: true };
}
