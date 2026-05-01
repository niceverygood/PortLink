/**
 * /forwarder/dashboard — KPI 4종 + 항만 분포 + 최근 배차 테이블.
 * Row-level: 본인 forwarder 데이터만.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CircleDollarSign, Plus, Truck, Users, Clock } from 'lucide-react';
import { PortCode, TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope, settlementScope } from '@/lib/forwarder-scope';
import { Topbar } from '@/components/forwarder/Topbar';
import { KpiCard } from '@/components/forwarder/KpiCard';
import { PortDistributionBar } from '@/components/forwarder/PortDistributionBar';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { PORT_LABEL_MAP } from '@/components/portlink/PortBadge';
import { TRIP_STATUS_LABEL } from '@/components/portlink/TripStatusBadge';
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

const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-slate-400',
  DEPARTED: 'bg-brand-info',
  LOADED: 'bg-brand-info',
  IN_TRANSIT: 'bg-brand-orange',
  UNLOADED: 'bg-brand-info',
  COMPLETED: 'bg-brand-success',
  CANCELLED: 'bg-brand-error',
  OPEN: 'bg-slate-400',
  ASSIGNED: 'bg-brand-info',
};
const STATUS_FG: Record<string, string> = {
  PENDING: 'text-slate-500',
  DEPARTED: 'text-brand-info',
  LOADED: 'text-brand-info',
  IN_TRANSIT: 'text-brand-orange-dark',
  UNLOADED: 'text-brand-info',
  COMPLETED: 'text-brand-success',
  CANCELLED: 'text-brand-error',
  OPEN: 'text-slate-500',
  ASSIGNED: 'text-brand-info',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  OPEN: '매칭 대기',
  ASSIGNED: '배정됨',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

function formatToday(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

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
        where: { status: { in: ACTIVE_TRIP }, dispatchOrder: orderScope },
      }),
      prisma.truckDriver.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.dispatchOrder.groupBy({
        by: ['port'],
        where: { ...orderScope, createdAt: { gte: fromUtc, lt: toUtc } },
        _count: { _all: true },
      }),
      prisma.dispatchOrder.findMany({
        where: orderScope,
        include: { trip: { include: { driver: { include: { user: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

  const totalGmv = monthlySettlements.reduce((a, s) => a + s.fare, 0);
  // GMV → "만원" 단위 (디자인 파일 패턴)
  const gmvManwon =
    totalGmv >= 10_000 ? Math.round(totalGmv / 10_000).toLocaleString('ko-KR') : '0';

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
    <>
      <Topbar
        title="대시보드"
        subtitle={formatToday()}
        actions={
          <Link
            href="/forwarder/dispatch/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-navy-dark"
          >
            <Plus className="size-[15px]" strokeWidth={2.5} />
            배차 등록
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="진행중 배차"
            value={String(activeTrips)}
            unit="건"
            Icon={Truck}
            accent="orange"
            hint={activeTrips > 0 ? '실시간 진행' : '대기'}
          />
          <KpiCard
            label="이번 달 GMV"
            value={gmvManwon}
            unit="만원"
            Icon={CircleDollarSign}
            accent="success"
            hint={`정산 ${monthlySettlements.length}건 합계`}
          />
          <KpiCard
            label="플랫폼 수수료"
            value={formatKRW(monthlySettlements.reduce((a, s) => a + s.platformFee, 0))}
            Icon={Clock}
            accent="info"
            hint="런칭 5%"
          />
          <KpiCard
            label="활성 차주"
            value={String(activeDriverCount)}
            unit="명"
            Icon={Users}
            accent="success"
            hint="ACTIVE 상태"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[14px] font-bold text-brand-navy">최근 배차</h2>
              <Link
                href="/forwarder/dispatch"
                className="text-[12px] font-medium text-brand-orange hover:underline"
              >
                전체 보기 →
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['ID', '노선', '차종', '차주', '상태', '운임'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-slate-400">
                      등록된 배차가 없습니다
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => {
                    const status = o.trip?.status ?? o.status;
                    const statusLabel = o.trip
                      ? TRIP_STATUS_LABEL[o.trip.status]
                      : ORDER_STATUS_LABEL[o.status];
                    return (
                      <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <Link
                            href={`/forwarder/dispatch/${o.id}`}
                            className="font-mono text-[12px] text-slate-500 hover:underline"
                          >
                            #{o.orderNo}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-navy">
                            {o.originRegion.split(' ').pop()}
                            <ArrowRight className="size-[11px] text-slate-400" />
                            {PORT_LABEL_MAP[o.port]}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <ContainerTypeIcon type={o.containerType} size="sm" withLabel />
                        </td>
                        <td className="px-5 py-3 text-[12.5px] text-slate-700">
                          {o.trip?.driver.user.name ?? '-'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold">
                            <span
                              className={`size-1.5 rounded-full ${STATUS_DOT[status] ?? 'bg-slate-400'}`}
                            />
                            <span className={STATUS_FG[status] ?? 'text-slate-500'}>
                              {statusLabel}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] font-bold tabular-nums text-brand-navy">
                          {o.fare.toLocaleString('ko-KR')}
                          <span className="ml-0.5 text-[11px] font-normal text-slate-500">원</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <PortDistributionBar counts={portCounts} />
          </div>
        </div>
      </div>
    </>
  );
}
