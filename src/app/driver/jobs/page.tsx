/**
 * /driver/jobs — 가용 배차 리스트.
 * 차주의 차량 차종에 매칭되는 OPEN 배차만 노출, pickupAt 빠른 순.
 */
import { redirect } from 'next/navigation';
import { DispatchOrderStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DispatchCard } from '@/components/portlink/DispatchCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: '가용 배차' };

export default async function DriverJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  // 관리자가 /driver/* 접근 시에는 빈 리스트 (관리자는 차량 없음)
  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
    include: { vehicles: { where: { isActive: true } } },
  });
  const types = driver ? Array.from(new Set(driver.vehicles.map((v) => v.type))) : [];

  const orders = types.length
    ? await prisma.dispatchOrder.findMany({
        where: {
          status: DispatchOrderStatus.OPEN,
          containerType: { in: types },
        },
        orderBy: { pickupAt: 'asc' },
        take: 50,
      })
    : [];

  return (
    <main className="px-4 pb-6 pt-4">
      <header className="mb-4">
        <h1 className="text-h1 font-bold text-brand-navy">가용 배차</h1>
        <p className="mt-1 text-body-sm text-slate-500">
          {session.user.role === UserRole.DRIVER
            ? `차주님의 차종에 맞는 배차 ${orders.length}건`
            : '관리자 모드'}
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-body text-slate-500">현재 가용 배차가 없습니다</p>
          <p className="mt-1 text-caption text-slate-400">잠시 후 다시 확인해주세요</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <DispatchCard
                orderNo={order.orderNo}
                originRegion={order.originRegion}
                port={order.port}
                containerType={order.containerType}
                pickupAt={order.pickupAt}
                fare={order.fare}
                variant="driver"
                href={`/driver/jobs/${order.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
