/**
 * 차주 아바타 — 이름 첫 글자 + 평점 + 차종.
 * 시드 차주 데이터 기준 (rating 0~5, 1자리 소수).
 */
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  rating?: number;
  vehicleType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZE = { sm: 'size-8 text-body-sm', md: 'size-10 text-body', lg: 'size-12 text-h2' };

export function DriverAvatar({ name, rating, vehicleType, size = 'md', className }: Props) {
  const initial = name.slice(0, 1);
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-brand-orange-light font-semibold text-brand-orange-dark',
          AVATAR_SIZE[size],
        )}
      >
        {initial}
      </div>
      <div className="flex flex-col">
        <span className="text-body font-medium text-slate-900">{name}</span>
        <span className="flex items-center gap-2 text-caption text-slate-500">
          {rating !== undefined && (
            <span className="inline-flex items-center gap-0.5">
              <Star className="size-3 fill-brand-warning text-brand-warning" />
              <span className="tabular-nums">{rating.toFixed(1)}</span>
            </span>
          )}
          {vehicleType && <span>{vehicleType}</span>}
        </span>
      </div>
    </div>
  );
}
