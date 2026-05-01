/**
 * 배차 의뢰 도메인 헬퍼.
 * - generateOrderNo: D{YY}-{NNNN} 시퀀셜 (현재 연도 기준 max+1, P2002 발생 시 caller가 retry)
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

const YEAR_PREFIX = `D${String(new Date().getFullYear()).slice(-2)}-`;

export async function generateOrderNo(tx: Prisma.TransactionClient = prisma): Promise<string> {
  const last = await tx.dispatchOrder.findFirst({
    where: { orderNo: { startsWith: YEAR_PREFIX } },
    orderBy: { orderNo: 'desc' },
    select: { orderNo: true },
  });

  const nextNum = last ? Number(last.orderNo.slice(YEAR_PREFIX.length)) + 1 : 1;
  return `${YEAR_PREFIX}${String(nextNum).padStart(4, '0')}`;
}
