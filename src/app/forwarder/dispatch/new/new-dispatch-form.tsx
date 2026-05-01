'use client';

import { useState, useTransition } from 'react';
import { ContainerType, type PortCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
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

const TYPE_OPTIONS: ContainerType[] = [
  ContainerType.TWENTY_FT,
  ContainerType.FORTY_FT,
  ContainerType.FORTY_FT_HC,
];

type Step = 1 | 2 | 3;

export function NewDispatchForm({ regions }: { regions: RegionOption[] }) {
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // Step 1
  const [originRegion, setOriginRegion] = useState('');
  const [originAddress, setOriginAddress] = useState('');

  // Step 2
  const [port, setPort] = useState<PortCode | ''>('');
  const [containerType, setContainerType] = useState<ContainerType | ''>('');
  const [pickupAt, setPickupAt] = useState('');

  // Step 3
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');
  const [safeRate, setSafeRate] = useState<number | null>(null);
  const [safeRateLoading, setSafeRateLoading] = useState(false);

  const step1Done = originRegion.length > 0 && originAddress.length > 0;
  const step2Done = port && containerType && pickupAt;
  const step3Done = fare && Number(fare) > 0;

  function goStep(next: Step) {
    setSubmitErr(null);
    if (next === 3 && step2Done && safeRate === null) {
      // Step 2 → 3 진입 시 안전운임 자동 조회
      setSafeRateLoading(true);
      fetchSafeRateAction({
        originRegion,
        port: port as PortCode,
        containerType: containerType as ContainerType,
      })
        .then((res) => {
          if (res.ok) setSafeRate(res.baseFare);
        })
        .finally(() => setSafeRateLoading(false));
    }
    setStep(next);
  }

  function submit() {
    setSubmitErr(null);
    startTransition(async () => {
      const result = await createDispatchOrderAction({
        originRegion,
        originAddress,
        port: port as PortCode,
        containerType: containerType as ContainerType,
        pickupAt: new Date(pickupAt).toISOString(),
        fare: Number(fare),
        notes: notes || undefined,
      });
      if (result && !result.ok) setSubmitErr(result.message);
      // ok면 redirect됨
    });
  }

  // 안전운임 한도 90% 미만 경고
  const fareNumber = Number(fare);
  const minAllowed = safeRate ? Math.round(safeRate * 0.9) : null;
  const fareInvalid = minAllowed !== null && fareNumber > 0 && fareNumber < minAllowed;

  return (
    <div className="space-y-4">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-h2 font-semibold">출발지</h2>
          <div className="space-y-2">
            <Label>시군구</Label>
            <Select value={originRegion} onValueChange={setOriginRegion}>
              <SelectTrigger>
                <SelectValue placeholder="출발 시군구 선택" />
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
          <div className="space-y-2">
            <Label htmlFor="originAddress">상세 주소</Label>
            <Input
              id="originAddress"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="예: 한진물류센터 1번 게이트"
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!step1Done} onClick={() => goStep(2)}>
              다음
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-h2 font-semibold">항만 · 차종 · 시각</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>도착 항만</Label>
              <Select value={port} onValueChange={(v) => setPort(v as PortCode)}>
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
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
            <div className="space-y-2">
              <Label>차종</Label>
              <Select
                value={containerType}
                onValueChange={(v) => setContainerType(v as ContainerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CONTAINER_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickupAt">상차 희망 시각</Label>
            <Input
              id="pickupAt"
              type="datetime-local"
              value={pickupAt}
              onChange={(e) => setPickupAt(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => goStep(1)}>
              이전
            </Button>
            <Button disabled={!step2Done} onClick={() => goStep(3)}>
              다음
            </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-h2 font-semibold">운임 · 메모</h2>

          <div className="rounded-md bg-slate-50 p-3 text-body-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">안전운임 마스터</span>
              {safeRateLoading ? (
                <span className="text-slate-400">조회 중…</span>
              ) : safeRate !== null ? (
                <span className="font-medium tabular-nums">{formatKRW(safeRate)}</span>
              ) : (
                <span className="text-slate-400">미등록 구간 (자율)</span>
              )}
            </div>
            {safeRate !== null && (
              <div className="mt-1 text-caption text-slate-500">
                한도 (90%): <span className="tabular-nums">{formatKRW(minAllowed!)}</span> 이상 등록
                가능
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fare">운임 (원)</Label>
            <Input
              id="fare"
              type="number"
              inputMode="numeric"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              placeholder="예: 800000"
            />
            {fareInvalid && (
              <p className="text-caption text-brand-error">
                안전운임 한도 미만입니다. {formatKRW(minAllowed!)} 이상 입력하세요.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">메모 (선택)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 컨테이너 번호는 상차 시 확정"
            />
          </div>

          {submitErr && (
            <Alert variant="destructive">
              <AlertDescription>{submitErr}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => goStep(2)}>
              이전
            </Button>
            <Button
              disabled={!step3Done || fareInvalid || pending}
              onClick={submit}
              className="bg-brand-navy hover:bg-brand-navy-dark"
            >
              {pending ? '등록 중…' : '배차 등록'}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ['출발지', '항만·차종·시각', '운임'];
  return (
    <ol className="flex items-center gap-2 text-body-sm">
      {labels.map((l, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <li key={l} className="flex items-center gap-1.5">
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-caption font-semibold',
                done && 'bg-brand-success text-white',
                active && 'bg-brand-navy text-white',
                !done && !active && 'bg-slate-200 text-slate-500',
              )}
            >
              {n}
            </span>
            <span className={cn(active ? 'font-medium text-slate-900' : 'text-slate-500')}>
              {l}
            </span>
            {n < 3 && <span className="ml-1 text-slate-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
