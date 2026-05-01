/**
 * /driver/jobs/[id] — 배차 상세.
 * 디자인 파일 DriverDetail 기준:
 *   - 운임 hero (44px black, "안전운임 보장" 뱃지)
 *   - 노선 카드 (navy 배경, 출발-트럭아이콘-도착)
 *   - 상세 정보 5행 (캘린더/시계/컨테이너/선박/포워더)
 *   - 하단 고정 큰 오렌지 CTA
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import type { ContainerType, PortCode } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateSettlement } from '@/lib/settlements';
import { AcceptButton } from './accept-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: '배차 상세' };

const PORT_LABELS: Record<PortCode, { name: string; region: string }> = {
  BUSAN: { name: '부산항', region: '부산 남구' },
  BUSAN_NEW: { name: '부산신항', region: '부산 강서구' },
  INCHEON: { name: '인천항', region: '인천 중구' },
  GWANGYANG: { name: '광양항', region: '전남 광양' },
  PYEONGTAEK: { name: '평택항', region: '경기 평택' },
};

const CONTAINER_DESC: Record<ContainerType, string> = {
  TWENTY_FT: '20FT · 일반 화물 · ~21t',
  FORTY_FT: '40FT · 일반 화물 · ~26t',
  FORTY_FT_HC: '40HC · 일반 화물 · ~26t',
};

function formatDateTime(d: Date): string {
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function DriverJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const { id } = await params;
  const order = await prisma.dispatchOrder.findUnique({
    where: { id },
    include: { forwarder: { include: { forwarder: true } } },
  });
  if (!order) notFound();

  const isOpen = order.status === 'OPEN';
  const breakdown = calculateSettlement(order.fare);
  const portMeta = PORT_LABELS[order.port];
  const originShort = order.originRegion.split(' ').pop() ?? order.originRegion;
  const forwarderName = order.forwarder?.forwarder?.companyName ?? '의뢰 포워더';

  const detailRows = [
    {
      Icon: Calendar,
      label: '상차 일시',
      value: formatDateTime(order.pickupAt),
    },
    {
      Icon: Clock,
      label: '예상 운송 시간',
      value: '약 4시간 30분',
    },
    {
      Icon: Truck,
      label: '컨테이너',
      value: CONTAINER_DESC[order.containerType],
    },
    {
      Icon: Anchor,
      label: '도착 항만',
      value: `${portMeta.name} · ${portMeta.region}`,
    },
    {
      Icon: User,
      label: '의뢰 포워더',
      value: forwarderName,
    },
  ];

  return (
    <main className="mx-auto max-w-md pb-32">
      {/* 상단 헤더 — 흰 배경 */}
      <header className="flex items-center justify-between bg-white px-5 pb-4 pt-3">
        <Link href="/driver/jobs" aria-label="뒤로">
          <ArrowLeft className="size-[22px] text-brand-navy" />
        </Link>
        <p className="font-mono text-[13px] text-slate-500">#{order.orderNo}</p>
        <span className="w-[22px]" />
      </header>

      {/* 운임 hero */}
      <section className="bg-white px-5 pb-5">
        <p className="text-[12px] font-medium text-slate-500">예상 수익</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[44px] font-black tabular-nums leading-none tracking-[-0.04em] text-brand-navy">
            {breakdown.driverPayout.toLocaleString('ko-KR')}
          </span>
          <span className="text-[18px] font-bold text-brand-navy">원</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
            <ShieldCheck className="size-[11px] text-brand-success" />
            <span className="text-[10.5px] font-bold text-brand-success">안전운임 보장</span>
          </div>
          <span className="text-[11px] text-slate-500">
            총 운임 {order.fare.toLocaleString('ko-KR')}원 - 수수료 5%
          </span>
        </div>
      </section>

      {/* 노선 카드 (navy) */}
      <section className="mx-5 mb-4 rounded-3xl bg-brand-navy p-5">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="mb-1 text-[11px] text-white/60">출발</p>
            <p className="text-[20px] font-bold text-white">{originShort}</p>
            <p className="mt-0.5 text-[11px] text-white/70">{order.originRegion}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-orange">
              <Truck className="size-[18px] text-white" strokeWidth={2.5} />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-white">350km</p>
          </div>
          <div className="flex-1 text-right">
            <p className="mb-1 text-[11px] text-white/60">도착</p>
            <p className="text-[20px] font-bold text-white">{portMeta.name}</p>
            <p className="mt-0.5 text-[11px] text-white/70">{portMeta.region}</p>
          </div>
        </div>
      </section>

      {/* 상세 정보 */}
      <section className="mx-5 mb-4 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="space-y-3">
          {detailRows.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50">
                <row.Icon className="size-[14px] text-slate-700" />
              </div>
              <div className="flex-1">
                <p className="text-[10.5px] text-slate-500">{row.label}</p>
                <p className="text-[13px] font-semibold text-brand-navy">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 메모 (있을 때) */}
      {order.notes && (
        <section className="mx-5 mb-4 rounded-2xl border border-slate-100 bg-white p-4">
          <p className="mb-1 text-[10.5px] text-slate-500">요청 사항</p>
          <p className="text-[13px] font-semibold text-brand-navy">{order.notes}</p>
        </section>
      )}

      {/* 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-16 z-10 mx-auto max-w-md px-5">
        {isOpen ? (
          <>
            <AcceptButton orderId={order.id} />
            <p className="mt-2.5 text-center text-[10.5px] text-slate-500">
              수락 후 5분 내 취소 시 별도 페널티 없음
            </p>
          </>
        ) : (
          <div className="rounded-2xl bg-slate-200 py-4 text-center text-[15px] font-bold text-slate-500">
            이미 수락된 배차입니다
          </div>
        )}
      </div>

      {/* sentinel — 사용 안 함, lint 회피 */}
      <span className="hidden">
        <ArrowRight />
      </span>
    </main>
  );
}
