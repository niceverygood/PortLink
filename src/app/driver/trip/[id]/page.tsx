/**
 * /driver/trip/[id] — 진행중 운송 상세 + 다음 단계 CTA.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { TripStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TimelineStepper } from '@/components/portlink/TimelineStepper';
import { PortBadge } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { PriceDisplay } from '@/components/portlink/PriceDisplay';
import { EmptyRunNoticeCard } from './EmptyRunNoticeCard';
import { NearbyOpenRecommendation } from './NearbyOpenRecommendation';
import { TripActionButton } from './action-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: '운송 진행' };

const NEXT_STATUS_LABEL: Partial<Record<TripStatus, { next: TripStatus; label: string }>> = {
  [TripStatus.PENDING]: { next: TripStatus.DEPARTED, label: '출발했어요' },
  [TripStatus.DEPARTED]: { next: TripStatus.LOADED, label: '상차 완료' },
  [TripStatus.LOADED]: { next: TripStatus.IN_TRANSIT, label: '이동 시작' },
  [TripStatus.IN_TRANSIT]: { next: TripStatus.UNLOADED, label: '하차 완료' },
  [TripStatus.UNLOADED]: { next: TripStatus.COMPLETED, label: '운송 완료' },
};

export default async function DriverTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      dispatchOrder: { include: { forwarder: { include: { forwarder: true } } } },
      driver: { include: { user: true } },
      emptyRunCharge: true,
    },
  });
  if (!trip) notFound();

  const isOwner = trip.driver.user.id === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) redirect('/driver/trip');

  const nextAction = NEXT_STATUS_LABEL[trip.status];
  const contactPhone = trip.dispatchOrder.forwarder?.forwarder?.contactPhone;

  return (
    <main className="px-4 pb-32 pt-4">
      <Link
        href="/driver/trip"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-slate-500"
      >
        <ArrowLeft className="size-4" /> 진행중 운송
      </Link>

      <header className="mb-4">
        <span className="text-caption font-medium text-slate-500">
          {trip.dispatchOrder.orderNo}
        </span>
        <h1 className="mt-1 text-h1 font-bold text-brand-navy">
          {trip.dispatchOrder.originRegion}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-body-sm text-slate-500">
          → <PortBadge port={trip.dispatchOrder.port} />
        </div>
      </header>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <TimelineStepper current={trip.status} />
      </section>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-body-sm text-slate-500">운임</span>
          <ContainerTypeIcon type={trip.dispatchOrder.containerType} size="md" withLabel />
        </div>
        <PriceDisplay amount={trip.dispatchOrder.fare} size="lg" tone="navy" />
      </section>

      {trip.emptyRunCharge && (
        <EmptyRunNoticeCard
          chargeId={trip.emptyRunCharge.id}
          distanceKm={Number(trip.emptyRunCharge.distanceKm)}
          chargeKrw={trip.emptyRunCharge.chargeKrw}
          orderNo={trip.dispatchOrder.orderNo}
        />
      )}

      <section className="mb-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <div>
            <div className="text-caption text-slate-500">출발 주소</div>
            <div className="mt-0.5 text-body text-slate-900">
              {trip.dispatchOrder.originAddress}
            </div>
          </div>
        </div>
      </section>

      {contactPhone && (
        <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center justify-between text-body font-medium text-brand-navy"
          >
            <span className="inline-flex items-center gap-2">
              <Phone className="size-5" /> 화주 즉시 통화
            </span>
            <span className="tabular-nums text-slate-700">{contactPhone}</span>
          </a>
        </section>
      )}

      {trip.status === TripStatus.COMPLETED && <NearbyOpenRecommendation tripId={trip.id} />}

      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md px-4">
        {nextAction ? (
          <TripActionButton
            tripId={trip.id}
            nextStatus={nextAction.next}
            label={nextAction.label}
          />
        ) : trip.status === TripStatus.COMPLETED ? (
          <Link
            href="/driver/settlement"
            className="block rounded-3xl bg-brand-success py-4 text-center text-h2 font-semibold text-white shadow-md"
          >
            정산 확인
          </Link>
        ) : trip.status === TripStatus.CANCELLED ? (
          <div className="rounded-3xl bg-slate-200 py-4 text-center text-body font-medium text-slate-500">
            취소된 운송
          </div>
        ) : null}
      </div>
    </main>
  );
}
