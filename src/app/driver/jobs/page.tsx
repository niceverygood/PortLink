/**
 * /driver/jobs — 가용 배차 리스트.
 * 차주의 차량 차종에 매칭되는 OPEN 배차만 노출, pickupAt 빠른 순.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { DispatchOrderStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { JobCard } from './job-card';
import { calculateSettlement } from '@/lib/settlements';

export const dynamic = 'force-dynamic';
export const metadata = { title: '가용 배차' };

const URGENT_THRESHOLD_HOURS = 24; // 픽업까지 24h 미만 = 긴급

export default async function DriverJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
    include: { vehicles: { where: { isActive: true } } },
  });
  const types = driver ? Array.from(new Set(driver.vehicles.map((v) => v.type))) : [];

  const orders = types.length
    ? await prisma.dispatchOrder.findMany({
        where: { status: DispatchOrderStatus.OPEN, containerType: { in: types } },
        orderBy: { pickupAt: 'asc' },
        take: 50,
      })
    : [];

  const now = Date.now();
  const enriched = orders.map((o) => ({
    order: o,
    urgent: o.pickupAt.getTime() - now < URGENT_THRESHOLD_HOURS * 3600_000,
    payout: calculateSettlement(o.fare).driverPayout,
  }));

  const totalPayout = enriched.reduce((a, e) => a + e.payout, 0);
  const urgentCount = enriched.filter((e) => e.urgent).length;
  const driverName =
    session.user.role === UserRole.DRIVER ? (session.user.name ?? '차주') : '관리자';

  return (
    <main className="mx-auto max-w-md">
      {/* HERO */}
      <header className="bg-brand-navy px-5 pb-5 pt-4 text-white">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/driver/jobs" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-white">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0A2540"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="22" x2="12" y2="8" />
                <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
              </svg>
            </span>
            <span className="text-[14px] font-bold tracking-tight">PortLink</span>
          </Link>
          <NotificationBell variant="dark" />
        </div>

        <p className="mb-1 text-[13px] text-white/70">오늘 가능한 배차</p>
        <h1 className="text-[32px] font-black leading-none tracking-[-0.04em] text-white">
          {orders.length}건 대기중
        </h1>

        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-xl bg-white/10 p-2.5">
            <p className="text-[10px] text-white/60">예상 수익</p>
            <p className="text-[15px] font-bold tabular-nums text-white">
              {totalPayout.toLocaleString('ko-KR')}원
            </p>
          </div>
          <div
            className="flex-1 rounded-xl border p-2.5"
            style={{ background: 'rgba(255,107,53,0.2)', borderColor: '#FF6B35' }}
          >
            <p className="text-[10px] text-[#FF8C61]">긴급</p>
            <p className="text-[15px] font-bold text-brand-orange">{urgentCount}건</p>
          </div>
        </div>
      </header>

      {/* 카드 리스트 */}
      <div className="space-y-3 px-4 pb-4 pt-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-body text-slate-500">현재 가용 배차가 없습니다</p>
            <p className="mt-1 text-caption text-slate-400">
              {driverName}님의 차종에 맞는 배차가 곧 올라옵니다
            </p>
          </div>
        ) : (
          enriched.map(({ order, urgent }) => (
            <JobCard
              key={order.id}
              id={order.id}
              orderNo={order.orderNo}
              originRegion={order.originRegion}
              port={order.port}
              containerType={order.containerType}
              pickupAt={order.pickupAt.toISOString()}
              fare={order.fare}
              urgent={urgent}
            />
          ))
        )}
      </div>
    </main>
  );
}
