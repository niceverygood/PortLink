'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CalcResult {
  finalConsignmentRate: number;
  finalInterCarrierRate: number;
  finalTransportRate: number;
  margin: number;
  breakdown: {
    distanceKm: number;
    baseConsignment: number;
    surchargeAmount: number;
    effectiveSurchargeRate: number;
    waitingFee: number;
  };
}

const PORT_OPTIONS = [
  { value: '', label: '직접 입력 (항만 출발 아님)' },
  { value: 'BUSAN_OLD_PORT', label: '부산북항 (+3.3km)' },
  { value: 'BUSAN_NEW_PORT', label: '부산신항 (+3.3km)' },
  { value: 'INCHEON_PORT', label: '인천항 (+1km)' },
  { value: 'INCHEON_NEW_PORT', label: '인천신항 (+2km)' },
  { value: 'GWANGYANG_PORT', label: '광양항 (+4km)' },
  { value: 'PYEONGTAEK_PORT', label: '평택항 (+2km)' },
  { value: 'ULSAN_NEW_PORT', label: '울산신항 (+2km)' },
];

const SURCHARGE_OPTIONS = [
  { code: 'REEFER', label: '냉동·냉장 (30%)', rate: 0.3 },
  { code: 'TANK_CONTAINER', label: '탱크 (30%)', rate: 0.3 },
  { code: 'HAZARDOUS', label: '위험물 (30%)', rate: 0.3 },
  { code: 'EXPLOSIVE', label: '화약류 (100%)', rate: 1.0 },
  { code: 'INCHEON_ORIGIN', label: '인천기점 (20%)', rate: 0.2 },
  { code: 'PYEONGTAEK_ORIGIN', label: '평택기점 (18%)', rate: 0.18 },
  { code: 'ROUGH_ROAD', label: '험로·오지 (20%)', rate: 0.2 },
  { code: 'NIGHT', label: '심야 22-06시 (20%)', rate: 0.2 },
  { code: 'HOLIDAY', label: '공휴일 (20%)', rate: 0.2 },
];

function fmt(n: number) {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function CalculatorClient() {
  const [distance, setDistance] = useState('100');
  const [port, setPort] = useState('');
  const [container, setContainer] = useState<'TWENTY_FT' | 'FORTY_FT' | 'FORTY_FIVE_FT'>(
    'FORTY_FT',
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalcResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/freight/calculate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          originDistanceKm: Number(distance),
          originPortCode: port || undefined,
          containerType: container,
          surcharges: SURCHARGE_OPTIONS.filter((s) => selected.has(s.code)).map((s) => ({
            code: s.code,
            rate: s.rate,
            description: s.label,
          })),
          shipmentDate: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? '계산 실패');
        return;
      }
      setResult(json.data);
    } finally {
      setLoading(false);
    }
  }

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label className="text-[12px] font-bold text-brand-navy">편도 거리 (km)</label>
          <input
            type="number"
            min="1"
            max="550"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px] tabular-nums"
            required
          />
          <a
            href={`https://map.naver.com/v5/?c=14135500.0,4517000.0,7,0,0,0,dh`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-[10.5px] text-brand-orange underline"
          >
            네이버지도에서 거리 확인하기 →
          </a>
        </div>
        <div>
          <label className="text-[12px] font-bold text-brand-navy">출발 항만 (선택)</label>
          <select
            value={port}
            onChange={(e) => setPort(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
          >
            {PORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[12px] font-bold text-brand-navy">컨테이너 종류</label>
          <select
            value={container}
            onChange={(e) => setContainer(e.target.value as typeof container)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-[14px]"
          >
            <option value="TWENTY_FT">20FT</option>
            <option value="FORTY_FT">40FT</option>
            <option value="FORTY_FIVE_FT">45FT (40FT × 1.125)</option>
          </select>
        </div>
        <div>
          <label className="text-[12px] font-bold text-brand-navy">할증</label>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {SURCHARGE_OPTIONS.map((s) => (
              <label
                key={s.code}
                className="flex cursor-pointer items-center gap-1.5 text-[11.5px]"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.code)}
                  onChange={() => toggle(s.code)}
                />
                {s.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10.5px] text-slate-500">
            가산방식: 1순위 100% + 2·3순위 50%, 4순위부터 무시
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy py-3 text-[14px] font-bold text-white hover:bg-brand-navy-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          계산하기
        </button>
        {error && <p className="text-center text-[12px] text-rose-700">{error}</p>}
      </form>

      <div className="space-y-3">
        {result ? (
          <>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-[11px] font-bold uppercase text-emerald-800">
                차주 수령액 (안전위탁운임)
              </p>
              <p className="mt-1 text-[28px] font-black tabular-nums text-emerald-700">
                ★ {fmt(result.finalConsignmentRate)}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <p className="text-[11px] font-bold uppercase text-sky-800">
                화주 청구액 (안전운송운임)
              </p>
              <p className="mt-1 text-[24px] font-black tabular-nums text-sky-700">
                {fmt(result.finalTransportRate)}
              </p>
              <p className="mt-1 text-[11px] text-sky-700">마진 {fmt(result.margin)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[12px]">
              <p className="mb-2 font-bold text-brand-navy">계산 내역</p>
              <Row
                label="기준 거리 (터미널 포함)"
                value={`${result.breakdown.distanceKm.toFixed(1)} km`}
              />
              <Row label="기본 운임 (40FT 기준)" value={fmt(result.breakdown.baseConsignment)} />
              <Row label="할증 적용액" value={fmt(result.breakdown.surchargeAmount)} />
              <Row
                label="실효 할증률"
                value={`${(result.breakdown.effectiveSurchargeRate * 100).toFixed(1)}%`}
              />
              <Row label="대기료" value={fmt(result.breakdown.waitingFee)} />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-[12px] text-slate-400">
            거리·컨테이너·할증 입력 후 계산하기
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-800">{value}</span>
    </div>
  );
}
