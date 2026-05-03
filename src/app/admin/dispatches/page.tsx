/**
 * /admin/dispatches — 전체 배차 모니터링 (관리자, scope 무시).
 * 상단 KPI 4개 + 테이블. Trip 강제 취소 액션.
 */
import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/forwarder/Topbar';
import { KpiCard } from '@/components/forwarder/KpiCard';
import { CircleDollarSign, Clock, Truck, XCircle } from 'lucide-react';
import { formatKRW } from '@/lib/format';
import { DispatchesTable, type AdminDispatchRow } from './dispatches-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 모니터링' };

/** KPI 4종 + 최근 100건 조회를 30초 캐시. admin은 모두 동일한 데이터라 글로벌 캐시 가능. */
const fetchDashboardData = unstable_cache(
  async (fromIso: string, toIso: string) => {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    const [openCount, activeTripCount, completedToday, cancelledToday, orders] = await Promise.all([
      prisma.dispatchOrder.count({ where: { status: 'OPEN' } }),
      prisma.trip.count({ where: { status: { in: ACTIVE_TRIP } } }),
      prisma.dispatchOrder.count({
        where: { status: 'COMPLETED', updatedAt: { gte: from, lt: to } },
      }),
      prisma.dispatchOrder.count({
        where: { status: 'CANCELLED', updatedAt: { gte: from, lt: to } },
      }),
      prisma.dispatchOrder.findMany({
        include: {
          forwarder: { include: { forwarder: true } },
          trip: { include: { driver: { include: { user: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);
    return { openCount, activeTripCount, completedToday, cancelledToday, orders };
  },
  ['admin-dispatches-dashboard-v1'],
  { revalidate: 30, tags: ['dispatch-list'] },
);

const ACTIVE_TRIP: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.DEPARTED,
  TripStatus.LOADED,
  TripStatus.IN_TRANSIT,
  TripStatus.UNLOADED,
];

function kstToday(): { from: Date; to: Date } {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  const from = new Date(Date.UTC(y, m, d, -9, 0, 0));
  const to = new Date(Date.UTC(y, m, d + 1, -9, 0, 0));
  return { from, to };
}

export default async function AdminDispatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=admin');

  const { from, to } = kstToday();

  const { openCount, activeTripCount, completedToday, cancelledToday, orders } =
    await fetchDashboardData(from.toISOString(), to.toISOString());

  const rows: AdminDispatchRow[] = orders.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    forwarderName: o.forwarder?.forwarder?.companyName ?? '-',
    originRegion: o.originRegion,
    port: o.port,
    containerType: o.containerType,
    fare: o.fare,
    status: o.status,
    tripId: o.trip?.id ?? null,
    tripStatus: o.trip?.status ?? null,
    driverName: o.trip?.driver.user.name ?? null,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <>
      <Topbar title="배차 모니터링" subtitle={`전체 배차 ${rows.length}건 (KST 오늘 기준 KPI)`} />
      <div className="flex-1 space-y-4 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="매칭 대기"
            value={String(openCount)}
            unit="건"
            Icon={Clock}
            accent="info"
          />
          <KpiCard
            label="진행중"
            value={String(activeTripCount)}
            unit="건"
            Icon={Truck}
            accent="orange"
          />
          <KpiCard
            label="오늘 완료"
            value={String(completedToday)}
            unit="건"
            Icon={CircleDollarSign}
            accent="success"
          />
          <KpiCard
            label="오늘 취소"
            value={String(cancelledToday)}
            unit="건"
            Icon={XCircle}
            accent="navy"
          />
        </div>

        <DispatchesTable rows={rows} />
      </div>
    </>
  );
}

void formatKRW;
