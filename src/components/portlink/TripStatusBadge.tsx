/**
 * 7단계 Trip 상태 뱃지. 색상 + 한국어 라벨 매핑 단일 진실의 원천.
 */
import { TripStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<TripStatus, string> = {
  [TripStatus.PENDING]: '대기',
  [TripStatus.DEPARTED]: '출발',
  [TripStatus.LOADED]: '상차 완료',
  [TripStatus.IN_TRANSIT]: '이동중',
  [TripStatus.UNLOADED]: '하차 완료',
  [TripStatus.COMPLETED]: '운송 완료',
  [TripStatus.CANCELLED]: '취소',
};

const STATUS_CLS: Record<TripStatus, string> = {
  [TripStatus.PENDING]: 'bg-slate-100 text-slate-700',
  [TripStatus.DEPARTED]: 'bg-brand-info/10 text-brand-info',
  [TripStatus.LOADED]: 'bg-brand-info/10 text-brand-info',
  [TripStatus.IN_TRANSIT]: 'bg-brand-orange-light text-brand-orange-dark',
  [TripStatus.UNLOADED]: 'bg-brand-info/10 text-brand-info',
  [TripStatus.COMPLETED]: 'bg-brand-success/10 text-brand-success',
  [TripStatus.CANCELLED]: 'bg-brand-error/10 text-brand-error',
};

export function TripStatusBadge({ status, className }: { status: TripStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-caption font-medium',
        STATUS_CLS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const TRIP_STATUS_LABEL = STATUS_LABEL;
