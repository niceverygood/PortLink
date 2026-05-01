'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { acceptDispatchOrder, type AcceptError } from '@/lib/dispatch-accept';

const ERROR_MESSAGE: Record<AcceptError, string> = {
  NOT_FOUND: '배차를 찾을 수 없습니다',
  NOT_OPEN: '이미 다른 차주가 수락한 배차입니다',
  TYPE_MISMATCH: '차종에 맞는 차량이 없습니다',
  NO_VEHICLE: '활성 차량이 없습니다',
  DRIVER_NOT_FOUND: '차주 프로필이 없습니다',
  ALREADY_ACCEPTED: '이미 다른 차주가 수락한 배차입니다',
};

export async function acceptOrderAction(
  orderId: string,
): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.DRIVER) {
    return { ok: false, message: '권한이 없습니다' };
  }

  const result = await acceptDispatchOrder({
    userId: session.user.id,
    orderId,
  });

  if (!result.ok) {
    return { ok: false, message: ERROR_MESSAGE[result.error] };
  }

  revalidatePath('/driver/jobs');
  revalidatePath('/driver/trip');
  redirect(`/driver/trip/${result.value.tripId}`);
}
