/**
 * 포워더의 Row-level 권한 헬퍼.
 * 포워더 사용자가 본인 데이터만 보도록 모든 쿼리에 forwarderUserId 강제.
 * CARRIER/ADMIN은 별도 정책 (현재는 본인 데이터만, ADMIN은 전체 보기 — Stage 6 확장).
 */
import type { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';

export interface ScopeOpts {
  userId: string;
  role: UserRole;
}

/** DispatchOrder 쿼리에 적용할 where 부분. */
export function dispatchOrderScope(opts: ScopeOpts): Prisma.DispatchOrderWhereInput {
  if (opts.role === UserRole.ADMIN) return {};
  if (opts.role === UserRole.FORWARDER) return { forwarderUserId: opts.userId };
  // CARRIER 등은 추후. 현재는 빈 결과.
  return { id: '__none__' };
}

/** Settlement 쿼리에 적용할 where. */
export function settlementScope(opts: ScopeOpts): Prisma.SettlementWhereInput {
  if (opts.role === UserRole.ADMIN) return {};
  if (opts.role === UserRole.FORWARDER) {
    return { trip: { dispatchOrder: { forwarderUserId: opts.userId } } };
  }
  return { id: '__none__' };
}
