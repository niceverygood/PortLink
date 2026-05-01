/**
 * /forwarder/dashboard — KPI 4종 + 항만 분포 + 최근 배차 테이블.
 * Row-level: 본인 forwarder 데이터만.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PortCode, TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope, settlementScope } from '@/lib/forwarder-scope';
import { KpiCard } from '@/components/forwarder/KpiCard';
import { PortDistributionBar } from '@/components/forwarder/PortDistributionBar';
import { TripStatusBadge } from '@/components/portlink/TripStatusBadge';
import { PortBadge } from '@/components/portlink/PortBadge';
import { formatKRW } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: '대시보드' };

function kstMonthBoundary(year: number, month: number) {
  const fromUtc = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0));
  const toUtc = new Date(Date.UTC(year, month, 1, -9, 0, 0));
  return { fromUtc, toUtc };
}

const ACTIVE_TRIP: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.DEPARTED,
  TripStatus.LOADED,
  TripStatus.IN_TRANSIT,
  TripStatus.UNLOADED,
];

export default async function ForwarderDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect('/login?kind=forwarder');

  const scope = { userId: session.user.id, role: session.user.role };
  const orderScope = dispatchOrderScope(scope);
  const setScope = settlementScope(scope);

  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth() + 1;
  const { fromUtc, toUtc } = kstMonthBoundary(year, month);

  const [monthlySettlements, activeTrips, activeDriverCount, monthlyOrdersByPort, recentOrders] =
    await Promise.all([
      prisma.settlement.findMany({
        where: { ...setScope, createdAt: { gte: fromUtc, lt: toUtc } },
      }),
      prisma.trip.count({
        where: {
          status: { in: ACTIVE_TRIP },
          dispatchOrder: orderScope,
        },
      }),
      prisma.truckDriver.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.dispatchOrder.groupBy({
        by: ['port'],
        where: { ...orderScope, createdAt: { gte: fromUtc, lt: toUtc } },
        _count: { _all: true },
      }),
      prisma.dispatchOrder.findMany({
        where: orderScope,
        include: { trip: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

  const totalGmv = monthlySettlements.reduce((a, s) => a + s.fare, 0);
  const totalFee = monthlySettlements.reduce((a, s) => a + s.platformFee, 0);

  const portCounts: Record<PortCode, number> = {
    [PortCode.BUSAN]: 0,
    [PortCode.BUSAN_NEW]: 0,
    [PortCode.INCHEON]: 0,
    [PortCode.GWANGYANG]: 0,
    [PortCode.PYEONGTAEK]: 0,
  };
  for (const row of monthlyOrdersByPort) {
    portCounts[row.port] = row._count._all;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 font-semibold text-slate-900">대시보드</h1>
        <p className="mt-1 text-body-sm text-slate-500">
          {year}년 {month}월 (Asia/Seoul 기준)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="이번 달 GMV"
          value={formatKRW(totalGmv)}
          hint={`정산 ${monthlySettlements.length}건 합계`}
        />
        <KpiCard label="플랫폼 수수료" value={formatKRW(totalFee)} hint="런칭 5%" />
        <KpiCard label="진행중 배차" value={`${activeTrips}건`} hint="PENDING~UNLOADED" />
        <KpiCard label="가용 차주" value={`${activeDriverCount}명`} hint="ACTIVE 상태" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PortDistributionBar counts={portCounts} />
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-body font-semibold text-slate-900">최근 배차 8건</h2>
              <Link
                href="/forwarder/dispatch"
                className="text-body-sm text-brand-navy hover:underline"
              >
                전체 →
              </Link>
            </div>
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-caption uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 text-left">번호</th>
                  <th className="px-4 py-2 text-left">출발</th>
                  <th className="px-4 py-2 text-left">항만</th>
                  <th className="px-4 py-2 text-left">상태</th>
                  <th className="px-4 py-2 text-right">운임</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      등록된 배차가 없습니다
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-caption text-slate-700">
                        <Link href={`/forwarder/dispatch/${o.id}`} className="hover:underline">
                          {o.orderNo}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-slate-900">{o.originRegion}</td>
                      <td className="px-4 py-2">
                        <PortBadge port={o.port} />
                      </td>
                      <td className="px-4 py-2">
                        {o.trip ? (
                          <TripStatusBadge status={o.trip.status} />
                        ) : (
                          <span className="text-caption text-slate-500">{o.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatKRW(o.fare)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
