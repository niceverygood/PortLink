/**
 * /forwarder/dispatch/[id] — 본인 의뢰 상세 + 차주 매칭/배정 현황 + 취소.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Phone, Hash } from 'lucide-react';
import { DispatchOrderStatus, TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { dispatchOrderScope } from '@/lib/forwarder-scope';
import { PortBadge } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { TripStatusBadge } from '@/components/portlink/TripStatusBadge';
import { TimelineStepper } from '@/components/portlink/TimelineStepper';
import { DriverAvatar } from '@/components/portlink/DriverAvatar';
import { Topbar } from '@/components/forwarder/Topbar';
import { CancelButton } from './cancel-button';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';
import { formatKRW } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 상세' };

const STATUS_LABEL: Record<DispatchOrderStatus, string> = {
  OPEN: '매칭 대기',
  ASSIGNED: '배정됨',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export default async function DispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) redirect('/login?kind=forwarder');

  const { id } = await params;
  const order = await prisma.dispatchOrder.findFirst({
    where: { id, ...dispatchOrderScope({ userId: session.user.id, role: session.user.role }) },
    include: {
      trip: {
        include: {
          driver: { include: { user: true, vehicles: true } },
          settlement: true,
          locationStamps: { orderBy: { capturedAt: 'asc' } },
          emptyRunCharge: true,
        },
      },
      assigns: { include: { driver: { include: { user: true } } } },
    },
  });
  if (!order) notFound();

  // 매칭 가능 차주 후보 (OPEN 상태일 때만)
  const candidates =
    order.status === DispatchOrderStatus.OPEN
      ? await prisma.truckDriver.findMany({
          where: {
            user: { status: 'ACTIVE' },
            vehicles: { some: { type: order.containerType, isActive: true } },
          },
          include: { user: true, vehicles: { where: { isActive: true } } },
          take: 12,
          orderBy: { rating: 'desc' },
        })
      : [];

  const pickupAt = order.pickupAt.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const trip = order.trip;
  const canCancel =
    !!trip && trip.status !== TripStatus.COMPLETED && trip.status !== TripStatus.CANCELLED;

  // 청구서 PDF 다운로드 가능 여부 — 환적은 안전운임 적용 제외 (Stage 8 §10).
  const invoiceDisabled = order.shipmentType === 'TRANSSHIPMENT';
  const invoiceDisabledReason = invoiceDisabled
    ? '환적 컨테이너는 안전운임 적용 제외 — 청구서 발급 불가'
    : undefined;

  return (
    <>
      <Topbar
        title={`배차 #${order.orderNo}`}
        subtitle={order.originRegion}
        actions={
          <InvoiceDownloadButton
            orderId={order.id}
            orderNo={order.orderNo}
            variant="outline"
            disabled={invoiceDisabled}
            disabledReason={invoiceDisabledReason}
          />
        }
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        <Link
          href="/forwarder/dispatch"
          className="inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" /> 배차 목록
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-caption text-slate-500">{order.orderNo}</div>
            <h1 className="mt-1 text-h1 font-semibold text-slate-900">{order.originRegion}</h1>
            <div className="mt-1 flex items-center gap-2 text-body-sm">
              <span className="text-slate-500">→</span>
              <PortBadge port={order.port} />
              <span className="text-slate-300">·</span>
              <ContainerTypeIcon type={order.containerType} size="sm" withLabel />
              <span className="text-slate-300">·</span>
              {trip ? (
                <TripStatusBadge status={trip.status} />
              ) : (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-caption text-slate-700">
                  {STATUS_LABEL[order.status]}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-caption text-slate-500">운임</div>
            <div className="mt-1 text-h1 font-semibold tabular-nums text-brand-navy">
              {formatKRW(order.fare)}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              담당자님, 청구서 PDF를 다운받으실 수 있습니다
            </p>
            <div className="mt-1 flex justify-end">
              <InvoiceDownloadButton
                orderId={order.id}
                orderNo={order.orderNo}
                variant="primary"
                disabled={invoiceDisabled}
                disabledReason={invoiceDisabledReason}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-lg border bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 text-body font-semibold">배차 정보</h2>
            <dl className="space-y-3 text-body-sm">
              <Row icon={<MapPin className="size-4 text-slate-400" />} label="출발">
                <div className="font-medium text-slate-900">{order.originRegion}</div>
                <div className="text-slate-500">{order.originAddress}</div>
              </Row>
              <Row icon={<MapPin className="size-4 text-slate-400" />} label="도착 항만">
                <PortBadge port={order.port} />
              </Row>
              <Row icon={<Calendar className="size-4 text-slate-400" />} label="상차 희망">
                <span className="tabular-nums text-slate-900">{pickupAt}</span>
              </Row>
              {order.containerNo && (
                <Row icon={<Hash className="size-4 text-slate-400" />} label="컨테이너 번호">
                  <span className="font-mono text-slate-900">{order.containerNo}</span>
                </Row>
              )}
              {order.notes && (
                <Row icon={<Phone className="size-4 text-slate-400" />} label="메모">
                  <span className="text-slate-700">{order.notes}</span>
                </Row>
              )}
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 text-body font-semibold">매칭 현황</h2>
            {!trip && order.status === DispatchOrderStatus.OPEN && (
              <div>
                <div className="mb-3 text-body-sm text-slate-700">
                  매칭 가능 차주 <span className="font-semibold">{candidates.length}명</span>
                </div>
                <ul className="space-y-2">
                  {candidates.slice(0, 5).map((d) => (
                    <li key={d.id} className="rounded-md bg-slate-50 p-2">
                      <DriverAvatar
                        name={d.user.name}
                        rating={Number(d.rating)}
                        vehicleType={d.vehicles[0]?.type}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
                {candidates.length > 5 && (
                  <div className="mt-2 text-caption text-slate-500">
                    외 {candidates.length - 5}명
                  </div>
                )}
              </div>
            )}

            {trip && (
              <div className="space-y-3">
                <DriverAvatar
                  name={trip.driver.user.name}
                  rating={Number(trip.driver.rating)}
                  vehicleType={trip.driver.vehicles[0]?.type}
                  size="md"
                />
                <div className="text-caption text-slate-500">
                  <Phone className="mr-1 inline size-3" />
                  {trip.driver.user.phone}
                </div>
                <div className="border-t pt-3">
                  <TimelineStepper current={trip.status} />
                </div>
                {trip.locationStamps.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="mb-2 text-caption font-semibold text-slate-700">위치 스탬프</p>
                    <ul className="space-y-1.5 text-[11.5px]">
                      {trip.locationStamps.map((s) => {
                        const lat = Number(s.latitude).toFixed(5);
                        const lng = Number(s.longitude).toFixed(5);
                        const acc = s.accuracyM ? `±${Math.round(Number(s.accuracyM))}m` : '—';
                        return (
                          <li key={s.id} className="flex items-center justify-between gap-2">
                            <span className="font-mono text-slate-500">{s.action}</span>
                            <a
                              href={`https://map.naver.com/v5/?lng=${lng}&lat=${lat}&zoom=14&type=0`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono tabular-nums text-brand-orange underline"
                            >
                              {lat}, {lng}
                            </a>
                            <span className="tabular-nums text-slate-400">{acc}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {order.status === DispatchOrderStatus.CANCELLED && (
              <div className="rounded-md bg-brand-error/5 p-3 text-body-sm text-brand-error">
                취소된 배차입니다
              </div>
            )}
          </section>
        </div>

        {trip?.settlement && (
          <section className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 text-body font-semibold">정산</h2>
            <div className="grid grid-cols-3 gap-4 text-body-sm">
              <KV label="총 운임" value={formatKRW(trip.settlement.fare)} />
              <KV label="플랫폼 수수료" value={formatKRW(trip.settlement.platformFee)} />
              <KV label="차주 수령" value={formatKRW(trip.settlement.driverPayout)} />
            </div>
            <div className="mt-2 text-caption text-slate-500">상태: {trip.settlement.status}</div>
          </section>
        )}

        {trip?.emptyRunCharge && (
          <section className="rounded-lg border-2 border-emerald-300 bg-emerald-50/60 p-5">
            <h2 className="mb-2 text-body font-semibold text-emerald-900">
              ⚡ 공차 운행 보상 청구 (§14)
            </h2>
            <p className="text-[12.5px] text-emerald-800">
              차주가 직전 운송지에서{' '}
              <span className="font-bold tabular-nums">
                {Number(trip.emptyRunCharge.distanceKm).toFixed(1)}km
              </span>{' '}
              공차 이동했습니다. 안전운임 제14조에 따라{' '}
              <span className="font-bold tabular-nums">
                {formatKRW(trip.emptyRunCharge.chargeKrw)}
              </span>
              의 보상을 청구할 수 있습니다.
            </p>
          </section>
        )}

        {canCancel && trip && (
          <section className="rounded-lg border border-brand-error/20 bg-brand-error/5 p-4">
            <CancelButton tripId={trip.id} />
          </section>
        )}
      </div>
    </>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="grid flex-1 grid-cols-3 gap-2">
        <dt className="text-slate-500">{label}</dt>
        <dd className="col-span-2">{children}</dd>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-caption text-slate-500">{label}</div>
      <div className="mt-1 font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}
