/**
 * 차주 가용 배차 카드 — 디자인 파일 DriverList의 카드 스타일.
 * - rounded-3xl + shadow-sm
 * - 운임 hero (32px black, 만원 단위 강조)
 * - 출발/트럭/도착 회색 박스
 * - "긴급" 뱃지 (urgent prop)
 * - "지금 수락하기" 큰 오렌지 CTA + ArrowRight
 */
import Link from 'next/link';
import { ArrowRight, Calendar, Truck } from 'lucide-react';
import type { ContainerType, PortCode } from '@prisma/client';
import { CONTAINER_TYPE_LABEL } from '@/lib/prisma-enums';

const PORT_SHORT: Record<PortCode, string> = {
  BUSAN: '부산항',
  BUSAN_NEW: '부산신항',
  INCHEON: '인천항',
  GWANGYANG: '광양항',
  PYEONGTAEK: '평택항',
};

interface Props {
  id: string;
  orderNo: string;
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  pickupAt: string;
  fare: number;
  urgent?: boolean;
  /** 차주 현재 위치 ↔ 출발지 거리 표시 (B 위치 기반 매칭). 없으면 미표시. */
  distanceLabel?: string;
}

function formatPickup(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function JobCard({
  id,
  orderNo,
  originRegion,
  port,
  containerType,
  pickupAt,
  fare,
  urgent = false,
  distanceLabel,
}: Props) {
  const fareManwon = Math.round(fare / 10_000);
  const originShort = originRegion.split(' ').pop() ?? originRegion;
  const portShort = PORT_SHORT[port];

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      {urgent && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-orange px-2 py-0.5">
          <span className="text-[10px] font-bold text-white">⚡ 긴급</span>
        </div>
      )}

      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">
            운임 · {orderNo}
            {distanceLabel && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                내 위치 {distanceLabel}
              </span>
            )}
          </p>
          <p className="text-[32px] font-black tabular-nums leading-none tracking-[-0.04em] text-brand-navy">
            {fareManwon}
            <span className="ml-1 text-[18px] font-bold">만원</span>
          </p>
        </div>
        <span className="inline-block rounded-lg bg-brand-navy px-2.5 py-1 text-[11px] font-bold text-white">
          {CONTAINER_TYPE_LABEL[containerType]}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
        <div className="flex-1 text-center">
          <p className="mb-0.5 text-[10px] text-slate-500">출발</p>
          <p className="text-[15px] font-bold text-brand-navy">{originShort}</p>
        </div>
        <div className="flex flex-col items-center px-2">
          <Truck className="size-[18px] text-brand-orange" strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-center">
          <p className="mb-0.5 text-[10px] text-slate-500">도착</p>
          <p className="text-[15px] font-bold text-brand-navy">{portShort}</p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Calendar className="size-[13px] text-slate-500" />
        <span className="text-[12px] font-medium text-slate-700">
          {formatPickup(pickupAt)} 출발
        </span>
      </div>

      <Link
        href={`/driver/jobs/${id}`}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-orange py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-brand-orange-dark"
      >
        지금 수락하기
        <ArrowRight className="size-4" strokeWidth={3} />
      </Link>
    </div>
  );
}
