/**
 * Trip 상태 머신.
 *
 * 정상 흐름 (단방향):
 *   PENDING → DEPARTED → LOADED → IN_TRANSIT → UNLOADED → COMPLETED
 *
 * CANCELLED는 PENDING 또는 DEPARTED 단계에서만 가능 (수락 후 5분 grace 내).
 * grace 초과 후 취소는 ADMIN만 (일반 차주 거부).
 */
import { TripStatus } from '@prisma/client';
import { BUSINESS_RULES } from '@/config/business-rules';
import { err, ok, type Result } from '@/lib/result';

export const TRIP_STATUS_FLOW: Record<TripStatus, ReadonlyArray<TripStatus>> = {
  [TripStatus.PENDING]: [TripStatus.DEPARTED, TripStatus.CANCELLED],
  [TripStatus.DEPARTED]: [TripStatus.LOADED, TripStatus.CANCELLED],
  [TripStatus.LOADED]: [TripStatus.IN_TRANSIT],
  [TripStatus.IN_TRANSIT]: [TripStatus.UNLOADED],
  [TripStatus.UNLOADED]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export type TransitionError =
  | 'INVALID_TRANSITION' // 상태 머신상 허용되지 않는 전환
  | 'CANCEL_GRACE_EXCEEDED'; // 수락 후 5분 초과 — 일반 차주는 취소 불가

export function canTransitionTripStatus(opts: {
  from: TripStatus;
  to: TripStatus;
  acceptedAt: Date;
  now?: Date;
  isAdmin?: boolean;
}): Result<void, TransitionError> {
  const { from, to, acceptedAt, isAdmin } = opts;
  const now = opts.now ?? new Date();

  const allowed = TRIP_STATUS_FLOW[from];
  if (!allowed.includes(to)) return err('INVALID_TRANSITION');

  if (to === TripStatus.CANCELLED && !isAdmin) {
    const elapsedMs = now.getTime() - acceptedAt.getTime();
    if (elapsedMs > BUSINESS_RULES.CANCEL_GRACE_MINUTES * 60_000) {
      return err('CANCEL_GRACE_EXCEEDED');
    }
  }

  return ok(undefined);
}

/** 상태 전환 시 같이 세팅되어야 하는 timestamp 컬럼명. */
export const TRIP_STATUS_TIMESTAMP: Partial<
  Record<TripStatus, 'departedAt' | 'loadedAt' | 'unloadedAt' | 'completedAt' | 'cancelledAt'>
> = {
  [TripStatus.DEPARTED]: 'departedAt',
  [TripStatus.LOADED]: 'loadedAt',
  [TripStatus.UNLOADED]: 'unloadedAt',
  [TripStatus.COMPLETED]: 'completedAt',
  [TripStatus.CANCELLED]: 'cancelledAt',
};
