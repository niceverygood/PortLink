/**
 * /driver/settlement — 차주 본인의 월별 정산.
 * 이번 달 총 수령액 hero + 항목 리스트.
 */
import { redirect } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PriceDisplay } from '@/components/portlink/PriceDisplay';
import { PortBadge } from '@/components/portlink/PortBadge';
import { BUSINESS_RULES } from '@/config/business-rules';

export const dynamic = 'force-dynamic';
export const metadata = { title: '월별 정산' };

function kstMonthBoundary(year: number, month: number) {
  // KST 월 경계 (UTC 환산)
  const fromUtc = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0));
  const toUtc = new Date(Date.UTC(year, month, 1, -9, 0, 0));
  return { fromUtc, toUtc };
}

const STATUS_LABEL = {
  DRAFT: '대기',
  CONFIRMED: '확정',
  PAID: '지급 완료',
  CANCELLED: '취소',
} as const;

export default async function DriverSettlementPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const driver = await prisma.truckDriver.findUnique({ where: { userId: session.user.id } });

  const now = new Date();
  // KST 기준 현재 연/월 (UTC + 9h)
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth() + 1;
  const { fromUtc, toUtc } = kstMonthBoundary(year, month);

  const settlements = driver
    ? await prisma.settlement.findMany({
        where: {
          createdAt: { gte: fromUtc, lt: toUtc },
          trip: { driverId: driver.id },
        },
        include: { trip: { include: { dispatchOrder: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const totals = settlements.reduce(
    (a, s) => ({
      payout: a.payout + s.driverPayout,
      count: a.count + 1,
    }),
    { payout: 0, count: 0 },
  );

  return (
    <main className="px-4 pb-6 pt-4">
      <header className="mb-4">
        <h1 className="text-h1 font-bold text-brand-navy">월별 정산</h1>
        <p className="mt-1 text-body-sm text-slate-500">
          {year}년 {month}월 ({BUSINESS_RULES.TIMEZONE} 기준)
        </p>
      </header>

      <section className="mb-4 rounded-3xl bg-brand-navy p-6 text-white shadow-md">
        <div className="text-body-sm text-white/70">이번 달 수령 합계</div>
        <PriceDisplay amount={totals.payout} size="hero" className="mt-1 block text-white" />
        <div className="mt-3 text-body-sm text-white/80">총 {totals.count}건</div>
      </section>

      {settlements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Wallet className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="text-body text-slate-500">이번 달 정산 내역이 없습니다</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {settlements.map((s) => (
            <li key={s.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-caption font-medium text-slate-500">
                  {s.trip.dispatchOrder.orderNo}
                </span>
                <span className="text-caption font-medium text-brand-info">
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="mb-3 flex items-center gap-2 text-body font-medium text-slate-900">
                {s.trip.dispatchOrder.originRegion}
                <span className="text-slate-400">→</span>
                <PortBadge port={s.trip.dispatchOrder.port} />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-caption text-slate-500">차주 수령</span>
                <PriceDisplay amount={s.driverPayout} size="lg" tone="success" />
              </div>
              <div className="mt-1 flex items-center justify-between text-caption text-slate-400">
                <span>운임 {s.fare.toLocaleString('ko-KR')}원</span>
                <span>플랫폼 수수료 {s.platformFee.toLocaleString('ko-KR')}원</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
