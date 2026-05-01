/**
 * /driver/jobs/[id] — 배차 상세 + "지금 수락" CTA.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Phone } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PriceDisplay } from '@/components/portlink/PriceDisplay';
import { PortBadge } from '@/components/portlink/PortBadge';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { AcceptButton } from './accept-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 상세' };

export default async function DriverJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const { id } = await params;
  const order = await prisma.dispatchOrder.findUnique({
    where: { id },
    include: { forwarder: { include: { forwarder: true } } },
  });
  if (!order) notFound();

  const pickupAt = order.pickupAt.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const isOpen = order.status === 'OPEN';
  const contactPhone = order.forwarder?.forwarder?.contactPhone;

  return (
    <main className="px-4 pb-32 pt-4">
      <Link
        href="/driver/jobs"
        className="mb-4 inline-flex items-center gap-1 text-body-sm text-slate-500"
      >
        <ArrowLeft className="size-4" /> 가용 배차 목록
      </Link>

      <header className="mb-4">
        <span className="text-caption font-medium text-slate-500">{order.orderNo}</span>
        <h1 className="mt-1 text-h1 font-bold text-brand-navy">{order.originRegion}</h1>
      </header>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-body-sm text-slate-500">운임</span>
          <ContainerTypeIcon type={order.containerType} size="md" withLabel />
        </div>
        <PriceDisplay amount={order.fare} size="hero" tone="navy" />
      </section>

      <section className="mb-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm">
        <Row icon={<MapPin className="size-5 text-slate-400" />} label="출발">
          <div className="font-medium text-slate-900">{order.originRegion}</div>
          <div className="text-body-sm text-slate-500">{order.originAddress}</div>
        </Row>
        <Row icon={<MapPin className="size-5 text-slate-400" />} label="도착 항만">
          <PortBadge port={order.port} />
        </Row>
        <Row icon={<Calendar className="size-5 text-slate-400" />} label="상차 희망">
          <span className="text-body text-slate-900">{pickupAt}</span>
        </Row>
        {order.notes && (
          <Row icon={<span className="size-5 text-slate-400">📝</span>} label="요청 사항">
            <span className="text-body-sm text-slate-700">{order.notes}</span>
          </Row>
        )}
      </section>

      {contactPhone && (
        <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
          <a
            href={`tel:${contactPhone}`}
            className="flex items-center justify-between text-body font-medium text-brand-navy"
          >
            <span className="inline-flex items-center gap-2">
              <Phone className="size-5" /> 화주 담당자 통화
            </span>
            <span className="tabular-nums text-slate-700">{contactPhone}</span>
          </a>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md px-4">
        {isOpen ? (
          <AcceptButton orderId={order.id} />
        ) : (
          <div className="rounded-3xl bg-slate-200 py-4 text-center text-body font-medium text-slate-500">
            이미 수락된 배차입니다
          </div>
        )}
      </div>
    </main>
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
      <div className="flex-1">
        <div className="text-caption text-slate-500">{label}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
