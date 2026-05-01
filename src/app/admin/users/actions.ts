'use server';

import { revalidatePath } from 'next/cache';
import { AuditAction, UserRole, type UserStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export type UserStatusActionResult = { ok: true } | { ok: false; message: string };

export async function updateUserStatusAction(
  userId: string,
  next: UserStatus,
): Promise<UserStatusActionResult> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return { ok: false, message: '관리자 권한이 필요합니다' };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: '사용자를 찾을 수 없습니다' };
  if (target.id === session.user.id) {
    return { ok: false, message: '본인 상태는 변경할 수 없습니다' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: next },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      entity: 'User',
      entityId: userId,
      action: AuditAction.UPDATE,
      before: { status: target.status },
      after: { status: next },
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard');
  return { ok: true };
}
