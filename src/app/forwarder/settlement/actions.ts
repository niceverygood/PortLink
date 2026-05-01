'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { issueSettlement, type IssueError } from '@/lib/settlement-issue';

const ERROR_MESSAGE: Record<IssueError, string> = {
  NOT_FOUND: '정산을 찾을 수 없습니다',
  NOT_DRAFT: '이미 발행된 정산입니다',
  FORBIDDEN: '본인 의뢰의 정산만 발행할 수 있습니다',
  ALREADY_INVOICED: '이미 세금계산서가 발행되었습니다',
};

export async function issueSettlementAction(
  settlementId: string,
): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== UserRole.FORWARDER) {
    return { ok: false, message: '포워더 권한이 필요합니다' };
  }

  const result = await issueSettlement({
    settlementId,
    forwarderUserId: session.user.id,
  });

  if (!result.ok) return { ok: false, message: ERROR_MESSAGE[result.error] };

  revalidatePath('/forwarder/settlement');
  revalidatePath('/forwarder/dashboard');
  return { ok: true };
}
