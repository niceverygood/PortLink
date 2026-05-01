/**
 * 정산 발행 — DRAFT → CONFIRMED + TaxInvoice 자동 생성.
 * 한 트랜잭션에서 처리. Settlement.status가 이미 CONFIRMED 이상이면 거부.
 */
import { Prisma, SettlementStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';
import { AuditAction } from '@prisma/client';

export type IssueError = 'NOT_FOUND' | 'NOT_DRAFT' | 'FORBIDDEN' | 'ALREADY_INVOICED';

function generateInvoiceNo(prefix = 'INV'): string {
  // YY-MMDD-XXXX 형태 (XXXX는 timestamp 마지막 4자리)
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const tail = String(now.getTime()).slice(-4);
  return `${prefix}-${yy}${mm}${dd}-${tail}`;
}

export async function issueSettlement(opts: {
  settlementId: string;
  forwarderUserId: string;
}): Promise<Result<{ settlementId: string; invoiceNo: string }, IssueError>> {
  try {
    return await prisma.$transaction(async (tx) => {
      const s = await tx.settlement.findUnique({
        where: { id: opts.settlementId },
        include: { trip: { include: { dispatchOrder: true } }, taxInvoice: true },
      });
      if (!s) return err('NOT_FOUND' as const);
      if (s.trip.dispatchOrder.forwarderUserId !== opts.forwarderUserId) {
        return err('FORBIDDEN' as const);
      }
      if (s.status !== SettlementStatus.DRAFT) return err('NOT_DRAFT' as const);
      if (s.taxInvoice) return err('ALREADY_INVOICED' as const);

      const updated = await tx.settlement.update({
        where: { id: s.id },
        data: { status: SettlementStatus.CONFIRMED, confirmedAt: new Date() },
      });

      const invoiceNo = generateInvoiceNo();
      await tx.taxInvoice.create({
        data: {
          settlementId: s.id,
          invoiceNo,
          amount: s.driverPayout,
          taxAmount: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: opts.forwarderUserId,
          entity: 'Settlement',
          entityId: s.id,
          action: AuditAction.STATUS_CHANGE,
          before: { status: s.status },
          after: { status: updated.status, invoiceNo },
        },
      });

      return ok({ settlementId: s.id, invoiceNo });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return err('ALREADY_INVOICED');
    }
    throw e;
  }
}
