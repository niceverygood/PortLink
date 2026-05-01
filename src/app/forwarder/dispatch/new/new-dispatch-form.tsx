'use client';

import { useEffect, useState, useTransition } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ContainerType, type PortCode } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CONTAINER_TYPE_LABEL } from '@/lib/prisma-enums';
import { formatKRW } from '@/lib/format';
import { createDispatchOrderAction, fetchSafeRateAction } from './actions';

interface RegionOption {
  name: string;
  province: string;
}

const PORT_OPTIONS: { value: PortCode; label: string }[] = [
  { value: 'BUSAN', label: '부산항' },
  { value: 'BUSAN_NEW', label: '부산신항' },
  { value: 'INCHEON', label: '인천항' },
  { value: 'GWANGYANG', label: '광양항' },
  { value: 'PYEONGTAEK', label: '평택항' },
];

const TYPE_OPTIONS: { value: ContainerType; label: string; subtitle: string }[] = [
  { value: ContainerType.TWENTY_FT, label: '20FT', subtitle: '6m, ~21t' },
  { value: ContainerType.FORTY_FT, label: '40FT', subtitle: '12m, ~26t' },
  { value: ContainerType.FORTY_FT_HC, label: '40HC', subtitle: '12m·하이큐브' },
];

const PORT_LABEL_MAP: Record<PortCode, string> = {
  BUSAN: '부산항',
  BUSAN_NEW: '부산신항',
  INCHEON: '인천항',
  GWANGYANG: '광양항',
  PYEONGTAEK: '평택항',
};

export function NewDispatchForm({ regions }: { regions: RegionOption[] }) {
  const [pending, startTransition] = useTransition();
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // STEP 1
  const [originRegion, setOriginRegion] = useState('');
  const [originAddress, setOriginAddress] = useState('');

  // STEP 2
  const [port, setPort] = useState<PortCode | ''>('');
  const [containerType, setContainerType] = useState<ContainerType | ''>(ContainerType.FORTY_FT);

  // STEP 3
  const [pickupAt, setPickupAt] = useState('');
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');

  // 안전운임 자동 조회
  const [safeRate, setSafeRate] = useState<number | null>(null);
  const [safeRateLoading, setSafeRateLoading] = useState(false);
  const [matchingDriverCount, setMatchingDriverCount] = useState<number | null>(null);

  // 구간/차종 변경 시 안전운임 자동 조회 + 운임 비어있으면 자동 채움
  useEffect(() => {
    if (originRegion && port && containerType) {
      setSafeRateLoading(true);
      fetchSafeRateAction({
        originRegion,
        port: port as PortCode,
        containerType: containerType as ContainerType,
      })
        .then((res) => {
          if (res.ok) {
            setSafeRate(res.baseFare);
            if (res.baseFare && !fare) setFare(String(res.baseFare));
          }
        })
        .finally(() => setSafeRateLoading(false));
    }
    // fare 의존성 제외 — 안전운임 조회는 구간/차종 변경 시에만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originRegion, port, containerType]);

  // 차종별 매칭 가능 차주 더미값 (시드 기준 — 추후 admin/api로 실측)
  useEffect(() => {
    if (containerType) {
      setMatchingDriverCount(
        containerType === ContainerType.TWENTY_FT
          ? 1
          : containerType === ContainerType.FORTY_FT_HC
            ? 1
            : 3,
      );
    }
  }, [containerType]);

  const fareNumber = Number(fare) || 0;
  const minAllowed = safeRate ? Math.round(safeRate * 0.9) : null;
  const fareInvalid = minAllowed !== null && fareNumber > 0 && fareNumber < minAllowed;
  const platformFee = fareNumber > 0 ? Math.round(fareNumber * 0.05) : 0;
  const driverPayout = fareNumber > 0 ? fareNumber - platformFee : 0;

  const canSubmit =
    originRegion.length > 0 &&
    originAddress.length > 0 &&
    port &&
    containerType &&
    pickupAt &&
    fareNumber > 0 &&
    !fareInvalid;

  function submit() {
    setSubmitErr(null);
    startTransition(async () => {
      const result = await createDispatchOrderAction({
        originRegion,
        originAddress,
        port: port as PortCode,
        containerType: containerType as ContainerType,
        pickupAt: new Date(pickupAt).toISOString(),
        fare: fareNumber,
        notes: notes || undefined,
      });
      if (result && !result.ok) setSubmitErr(result.message);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 폼 (왼쪽 2/3) */}
      <div className="rounded-xl border border-slate-100 bg-white p-7 lg:col-span-2">
        {/* STEP 1 */}
        <section className="mb-7">
          <StepLabel n={1} title="운송 구간" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[11.5px] font-semibold text-slate-700">출발지</Label>
              <Select value={originRegion} onValueChange={setOriginRegion}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="시군구 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {regions.map((r) => (
                    <SelectItem key={r.name} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11.5px] font-semibold text-slate-700">도착 항만</Label>
              <Select value={port} onValueChange={(v) => setPort(v as PortCode)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="항만 선택" />
                </SelectTrigger>
                <SelectContent>
                  {PORT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="originAddress" className="text-[11.5px] font-semibold text-slate-700">
              상세 주소
            </Label>
            <Input
              id="originAddress"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="예: 한진물류센터 1번 게이트"
            />
          </div>
        </section>

        {/* STEP 2 */}
        <section className="mb-7">
          <StepLabel n={2} title="컨테이너 정보" />
          <div className="grid grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((t) => {
              const active = containerType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setContainerType(t.value)}
                  className={
                    'rounded-lg border px-4 py-3 text-center transition-colors ' +
                    (active
                      ? 'border-brand-navy bg-brand-navy text-white'
                      : 'border-slate-200 bg-white text-brand-navy hover:bg-slate-50')
                  }
                >
                  <p className="text-[14px] font-bold">{t.label}</p>
                  <p
                    className={
                      'mt-0.5 text-[10.5px] ' + (active ? 'text-white/70' : 'text-slate-500')
                    }
                  >
                    {t.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 3 */}
        <section>
          <StepLabel n={3} title="일정 · 운임" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pickupAt" className="text-[11.5px] font-semibold text-slate-700">
                상차 희망 시각
              </Label>
              <Input
                id="pickupAt"
                type="datetime-local"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fare" className="text-[11.5px] font-semibold text-slate-700">
                운임 (원)
              </Label>
              <Input
                id="fare"
                type="number"
                inputMode="numeric"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="안전운임 자동 입력"
              />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="notes" className="text-[11.5px] font-semibold text-slate-700">
              메모 (선택)
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 컨테이너 번호는 상차 시 확정"
            />
          </div>
          {fareInvalid && (
            <p className="mt-2 text-[11.5px] text-brand-error">
              안전운임 한도(90%) 미만입니다. {formatKRW(minAllowed!)} 이상 입력하세요.
            </p>
          )}
          {submitErr && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{submitErr}</AlertDescription>
            </Alert>
          )}
        </section>
      </div>

      {/* 사이드 (오른쪽 1/3) */}
      <div className="space-y-4">
        {/* 안전운임 hero (navy 그라디언트) */}
        <div
          className="rounded-xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #0A2540 0%, #061B2E 100%)' }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldCheck className="size-[13px] text-brand-orange" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-orange">
              안전운임제 자동조회
            </span>
          </div>
          <p className="mb-3 text-[11.5px] text-slate-300">
            {originRegion ? originRegion.split(' ').pop() : '-'} →{' '}
            {port ? PORT_LABEL_MAP[port as PortCode] : '-'} /{' '}
            {containerType ? CONTAINER_TYPE_LABEL[containerType as ContainerType] : '-'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-[36px] font-black tabular-nums leading-none tracking-[-0.04em]">
              {safeRateLoading ? '…' : safeRate !== null ? safeRate.toLocaleString('ko-KR') : '0'}
            </span>
            <span className="text-[14px] font-medium">원</span>
          </div>
          <p className="mt-2 text-[10.5px] text-slate-400">
            {safeRate ? '국토부 고시 운임 · 변경 불가' : '구간 선택 필요'}
          </p>
        </div>

        {/* 비용 분해 */}
        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <p className="mb-3 text-[12px] font-bold text-brand-navy">비용 분해</p>
          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between text-slate-700">
              <span>차주 운임</span>
              <span className="font-semibold tabular-nums">{formatKRW(driverPayout)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>플랫폼 수수료 (5%)</span>
              <span className="tabular-nums">{formatKRW(platformFee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold text-brand-navy">
              <span>총 결제액</span>
              <span className="tabular-nums">{formatKRW(fareNumber)}</span>
            </div>
          </div>
        </div>

        {/* 매칭 가능 차주 */}
        <div className="rounded-xl border border-slate-100 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold text-brand-navy">매칭 가능 차주</span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-brand-success">
              실시간
            </span>
          </div>
          <div className="mb-2 flex items-baseline gap-1">
            <span className="text-[28px] font-bold tabular-nums text-brand-navy">
              {matchingDriverCount ?? 0}
            </span>
            <span className="text-[12px] text-slate-500">명 가능</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {containerType
              ? `차종 ${CONTAINER_TYPE_LABEL[containerType as ContainerType]} 매칭 차주`
              : '차종 선택 필요'}
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          disabled={!canSubmit || pending}
          onClick={submit}
          className="w-full rounded-xl bg-brand-orange py-3.5 text-[14px] font-bold text-white shadow-md transition-colors hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {pending ? '등록 중…' : '배차 등록'}
        </button>
      </div>
    </div>
  );
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
        STEP {n}
      </p>
      <h3 className="text-[15px] font-bold text-brand-navy">{title}</h3>
    </div>
  );
}
