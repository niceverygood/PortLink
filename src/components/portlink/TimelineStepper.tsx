/**
 * 운송 진행 stepper.
 * 5단계 (PENDING은 출발 전 대기, CANCELLED 별도 처리):
 *   대기 → 출발 → 상차 → 이동중 → 하차 → 완료
 *
 * 현재 status에 따라 done/active/pending 시각 분기.
 */
import { TripStatus } from '@prisma/client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  status: TripStatus;
  label: string;
}

const STEPS: ReadonlyArray<Step> = [
  { status: TripStatus.PENDING, label: '대기' },
  { status: TripStatus.DEPARTED, label: '출발' },
  { status: TripStatus.LOADED, label: '상차' },
  { status: TripStatus.IN_TRANSIT, label: '이동중' },
  { status: TripStatus.UNLOADED, label: '하차' },
  { status: TripStatus.COMPLETED, label: '완료' },
];

function statusIndex(s: TripStatus): number {
  return STEPS.findIndex((step) => step.status === s);
}

export function TimelineStepper({ current }: { current: TripStatus }) {
  if (current === TripStatus.CANCELLED) {
    return (
      <div className="rounded-3xl border border-brand-error/30 bg-brand-error/5 p-4 text-center text-body-sm text-brand-error">
        취소된 운송입니다
      </div>
    );
  }

  const curIdx = statusIndex(current);

  return (
    <ol className="flex items-start justify-between gap-1">
      {STEPS.map((step, idx) => {
        const done = idx < curIdx;
        const active = idx === curIdx;
        const pending = idx > curIdx;
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'relative flex size-8 items-center justify-center rounded-full text-caption font-semibold',
                done && 'bg-brand-success text-white',
                active && 'bg-brand-orange text-white ring-4 ring-brand-orange-light',
                pending && 'bg-slate-100 text-slate-400',
              )}
            >
              {done ? <Check className="size-4" /> : idx + 1}
              {idx < STEPS.length - 1 && (
                <span
                  className={cn(
                    'absolute left-full top-1/2 h-0.5 w-full -translate-y-1/2',
                    done ? 'bg-brand-success' : 'bg-slate-200',
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                'text-caption',
                done || active ? 'font-medium text-slate-900' : 'text-slate-400',
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export const TRIP_STEPS = STEPS;
