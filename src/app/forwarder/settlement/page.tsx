/**
 * /forwarder/settlement — 본인 의뢰의 정산 목록.
 * DRAFT 정산은 "확정 발행" 버튼으로 CONFIRMED + TaxInvoice 발행.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { settlementScope } from '@/lib/forwarder-scope';
import { PortBadge } from '@/components/portlink/PortBadge';
import { KpiCard } from '@/components/forwarder/KpiCard';
import { formatKRW } from '@/lib/format';
import { IssueButton } from './issue-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: '정산' };

const STATUS_LABEL = {
  DRAFT: '미발행',
  CONFIRMED: '발행 완료',
  PAID: '지급 완료',
  CANCELLED: '취소',
} as const;

const STATUS_BADGE_CLS = {
  DRAFT: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-brand-success/10 text-brand-success',
  PAID: 'bg-brand-info/10 text-brand-info',
  CANCELLED: 'bg-brand-error/10 text-brand-error',
} as const;

export default async function ForwarderSettlementPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect('/login?kind=forwarder');

  const settlements = await prisma.settlement.findMany({
    where: settlementScope({ userId: session.user.id, role: session.user.role }),
    include: {
      trip: { include: { dispatchOrder: true, driver: { include: { user: true } } } },
      taxInvoice: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const draftCount = settlements.filter((s) => s.status === 'DRAFT').length;
  const totalFare = settlements.reduce((a, s) => a + s.fare, 0);
  const totalFee = settlements.reduce((a, s) => a + s.platformFee, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 font-semibold text-slate-900">정산</h1>
        <p className="mt-1 text-body-sm text-slate-500">
          본인 의뢰의 정산 {settlements.length}건 (미발행 {draftCount}건)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="총 운임 합계" value={formatKRW(totalFare)} />
        <KpiCard label="총 플랫폼 수수료" value={formatKRW(totalFee)} hint="런칭 5%" />
        <KpiCard
          label="발행 대기"
          value={`${draftCount}건`}
          hint={draftCount > 0 ? '확정 발행 버튼 클릭' : '없음'}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-caption uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 text-left">배차</th>
              <th className="px-4 py-2 text-left">차주</th>
              <th className="px-4 py-2 text-left">출발</th>
              <th className="px-4 py-2 text-left">항만</th>
              <th className="px-4 py-2 text-right">총 운임</th>
              <th className="px-4 py-2 text-right">차주 수령</th>
              <th className="px-4 py-2 text-right">수수료</th>
              <th className="px-4 py-2 text-left">세금계산서</th>
              <th className="px-4 py-2 text-left">상태</th>
              <th className="px-4 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  정산 내역이 없습니다
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="px-4 py-2 font-mono text-caption text-slate-700">
                    {s.trip.dispatchOrder.orderNo}
                  </td>
                  <td className="px-4 py-2">{s.trip.driver.user.name}</td>
                  <td className="px-4 py-2">{s.trip.dispatchOrder.originRegion}</td>
                  <td className="px-4 py-2">
                    <PortBadge port={s.trip.dispatchOrder.port} />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatKRW(s.fare)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatKRW(s.driverPayout)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatKRW(s.platformFee)}</td>
                  <td className="px-4 py-2 font-mono text-caption text-slate-600">
                    {s.taxInvoice?.invoiceNo ?? '-'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-caption font-medium ${STATUS_BADGE_CLS[s.status]}`}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {s.status === 'DRAFT' ? (
                      <IssueButton settlementId={s.id} />
                    ) : (
                      <span className="text-caption text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
