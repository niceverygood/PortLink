'use client';

/**
 * 차주 운임 검증 위젯 — Stage 8 §6-1.
 *
 * 약정 < 법정 최소액 → 빨간 경고 + 부족액 + 신고서 CTA
 * 약정 ≥ 법정 최소액 → 초록 안전 표시
 *
 * 가산방식 등 상세는 토글로 펼침.
 * 신고서 생성은 /driver/report?orderId=... 로 navigate (7번 작업의 페이지).
 */
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown, ChevronUp, FileWarning, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VerifierProps {
  orderId: string;
  agreedFareKrw: number;
  legalMinKrw: number; // finalConsignmentRate
  distanceKm: number;
  surcharges: Array<{ code: string; rate: number; description?: string }>;
  effectiveSurchargeRate: number;
  surchargeAmountKrw: number;
  waitingFeeKrw: number;
  noticeNumber: string;
}

function formatKRW(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function SafeFreightVerifier(props: VerifierProps) {
  const [open, setOpen] = useState(false);
  const shortfall = props.legalMinKrw - props.agreedFareKrw;
  const isShort = shortfall > 0;

  return (
    <section
      className={cn(
        'mx-5 mb-4 rounded-2xl border-2 p-4',
        isShort ? 'border-rose-300 bg-rose-50/60' : 'border-emerald-300 bg-emerald-50/60',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            isShort ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600',
          )}
        >
          {isShort ? (
            <AlertTriangle className="size-[18px]" />
          ) : (
            <ShieldCheck className="size-[18px]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            법정 최저 안전위탁운임
          </p>
          <p
            className={cn(
              'mt-0.5 text-[24px] font-black tabular-nums tracking-[-0.03em]',
              isShort ? 'text-rose-700' : 'text-emerald-700',
            )}
          >
            ★ {formatKRW(props.legalMinKrw)}
          </p>
          <p className="mt-0.5 text-[12px] text-slate-600">
            현재 약정 운임:{' '}
            <span className="font-semibold text-slate-800">{formatKRW(props.agreedFareKrw)}</span>
          </p>
          {isShort ? (
            <p className="mt-1 text-[12.5px] font-bold text-rose-700">
              ⚠️ 법정 최소액보다{' '}
              <span className="text-[14px] tabular-nums">{formatKRW(shortfall)}</span> 부족합니다
            </p>
          ) : (
            <p className="mt-1 text-[12.5px] text-emerald-700">법정 안전운임 이상입니다</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          상세 내역 {open ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {isShort && (
          <Link
            href={`/driver/report?orderId=${props.orderId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-rose-700"
          >
            <FileWarning className="size-3.5" />
            신고서 만들기
          </Link>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[12px]">
          <Row label="기준 거리 (터미널 내 포함)" value={`${props.distanceKm.toFixed(1)} km`} />
          <Row label="법정 최저 (안전위탁운임)" value={formatKRW(props.legalMinKrw)} bold />
          <Row label="할증 적용액" value={formatKRW(props.surchargeAmountKrw)} />
          <Row label="대기료 (있는 경우)" value={formatKRW(props.waitingFeeKrw)} />
          {props.surcharges.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500">적용 할증 (가산방식)</p>
              <ul className="mt-1 space-y-0.5">
                {props.surcharges.map((s) => (
                  <li key={s.code} className="flex justify-between text-[11.5px]">
                    <span className="text-slate-700">
                      · {s.description ?? s.code} ({(s.rate * 100).toFixed(0)}%)
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-[10.5px] text-amber-800">
                가산방식: 1순위 100% + 2·3순위 50%씩, 4순위부터 무시. 실효 할증률{' '}
                <span className="font-bold">
                  {(props.effectiveSurchargeRate * 100).toFixed(1)}%
                </span>
              </p>
            </div>
          )}
          <p className="mt-2 border-t border-slate-200 pt-2 text-[10.5px] text-slate-500">
            데이터 출처: {props.noticeNumber}
          </p>
        </div>
      )}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cn('tabular-nums text-slate-800', bold && 'font-bold')}>{value}</span>
    </div>
  );
}
