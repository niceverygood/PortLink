import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Accent = 'orange' | 'success' | 'info' | 'navy';

interface Props {
  label: string;
  value: string;
  /** 단위 라벨 (예: "건", "명", "원"). value 옆에 작게. */
  unit?: string;
  /** 보조 설명. trend가 없을 때 사용. */
  hint?: string;
  trend?: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  Icon?: LucideIcon;
  accent?: Accent;
  className?: string;
}

const ACCENT_BG: Record<Accent, string> = {
  orange: 'bg-brand-orange-light',
  success: 'bg-emerald-50',
  info: 'bg-sky-50',
  navy: 'bg-slate-100',
};
const ACCENT_FG: Record<Accent, string> = {
  orange: 'text-brand-orange-dark',
  success: 'text-brand-success',
  info: 'text-brand-info',
  navy: 'text-brand-navy',
};
const TREND_FG = {
  up: 'text-brand-success',
  down: 'text-brand-error',
  flat: 'text-slate-500',
} as const;

export function KpiCard({
  label,
  value,
  unit,
  hint,
  trend,
  trendLabel,
  trendDirection = 'up',
  Icon,
  accent = 'info',
  className,
}: Props) {
  const TrendIcon =
    trendDirection === 'down' ? TrendingDown : trendDirection === 'flat' ? Minus : TrendingUp;
  return (
    <div className={cn('rounded-xl border border-slate-100 bg-white p-5 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
        {Icon && (
          <div
            className={cn('flex size-7 items-center justify-center rounded-lg', ACCENT_BG[accent])}
          >
            <Icon className={cn('size-[15px]', ACCENT_FG[accent])} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold tabular-nums tracking-[-0.03em] text-brand-navy">
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-slate-500">{unit}</span>}
      </div>
      {trend ? (
        <div className="mt-2 flex items-center gap-1 text-[11.5px]">
          <TrendIcon className={cn('size-[11px]', TREND_FG[trendDirection])} />
          <span className={cn('font-semibold', TREND_FG[trendDirection])}>{trend}</span>
          {trendLabel && <span className="text-slate-500">{trendLabel}</span>}
        </div>
      ) : hint ? (
        <div className="mt-2 text-[11.5px] text-slate-500">{hint}</div>
      ) : null}
    </div>
  );
}
