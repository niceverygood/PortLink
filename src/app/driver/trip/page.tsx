/**
 * /driver/trip — 차주의 진행중 운송(들).
 * COMPLETED/CANCELLED 제외, 가장 최근 1건이 우선 표시.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Truck } from 'lucide-react';
import { TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TripStatusBadge } from '@/components/portlink/TripStatusBadge';
import { PortBadge } from '@/components/portlink/PortBadge';
import { PriceDisplay } from '@/components/portlink/PriceDisplay';

export const dynamic = 'force-dynamic';
export const metadata = { title: '진행중 운송' };

const ACTIVE = [
  TripStatus.PENDING,
  TripStatus.DEPARTED,
  TripStatus.LOADED,
  TripStatus.IN_TRANSIT,
  TripStatus.UNLOADED,
];

export default async function DriverTripPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
  });

  const trips = driver
    ? await prisma.trip.findMany({
        where: { driverId: driver.id, status: { in: ACTIVE } },
        include: { dispatchOrder: true },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  return (
    <main className="px-4 pb-6 pt-4">
      <header className="mb-4">
        <h1 className="text-h1 font-bold text-brand-navy">진행중 운송</h1>
        <p className="mt-1 text-body-sm text-slate-500">{trips.length}건</p>
      </header>

      {trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Truck className="mx-auto mb-3 size-10 text-slate-300" />
          <p className="text-body text-slate-500">진행중인 운송이 없습니다</p>
          <Link
            href="/driver/jobs"
            className="mt-4 inline-block text-body-sm text-brand-orange underline"
          >
            가용 배차 보기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/driver/trip/${trip.id}`}
                className="block rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-caption font-medium text-slate-500">
                    {trip.dispatchOrder.orderNo}
                  </span>
                  <TripStatusBadge status={trip.status} />
                </div>
                <div className="mb-3 text-h2 font-semibold text-slate-900">
                  {trip.dispatchOrder.originRegion}
                </div>
                <div className="mb-4 flex items-center gap-2 text-body-sm text-slate-500">
                  → <PortBadge port={trip.dispatchOrder.port} />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-caption text-slate-500">운임</span>
                  <PriceDisplay amount={trip.dispatchOrder.fare} size="lg" tone="navy" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
