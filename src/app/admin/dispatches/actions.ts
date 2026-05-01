'use server';

import { revalidatePath } from 'next/cache';
import { TripStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { updateTripStatus } from '@/lib/trip-update';

export async function forceCancelTripAction(opts: {
  tripId: string;
  reason: string;
}): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return { ok: false, message: '관리자 권한이 필요합니다' };
  }
  if (!opts.reason.trim()) {
    return { ok: false, message: '취소 사유를 입력하세요' };
  }

  const result = await updateTripStatus({
    userId: session.user.id,
    isAdmin: true,
    tripId: opts.tripId,
    nextStatus: TripStatus.CANCELLED,
    reason: opts.reason.trim(),
  });

  if (!result.ok) return { ok: false, message: result.error };

  revalidatePath('/admin/dispatches');
  revalidatePath('/admin/dashboard');
  return { ok: true };
}
