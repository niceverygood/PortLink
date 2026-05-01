/**
 * 운임/정산 표시. 정수 KRW + 천단위 콤마 + "원".
 * tabular-nums로 자릿수 정렬.
 */
import { formatKRW } from '@/lib/format';
import { cn } from '@/lib/utils';

const SIZE_CLS: Record<NonNullable<PriceDisplayProps['size']>, string> = {
  sm: 'text-body-sm',
  md: 'text-body font-medium',
  lg: 'text-h2 font-semibold',
  hero: 'text-display font-bold',
};

interface PriceDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  /** 색상 override. 기본은 currentColor. 차주 화면 강조 시 brand-orange. */
  tone?: 'default' | 'orange' | 'navy' | 'success';
}

export function PriceDisplay({
  amount,
  size = 'md',
  className,
  tone = 'default',
}: PriceDisplayProps) {
  const toneCls =
    tone === 'orange'
      ? 'text-brand-orange'
      : tone === 'navy'
        ? 'text-brand-navy'
        : tone === 'success'
          ? 'text-brand-success'
          : '';
  return (
    <span className={cn('tabular-nums tracking-tight', SIZE_CLS[size], toneCls, className)}>
      {formatKRW(amount)}
    </span>
  );
}
