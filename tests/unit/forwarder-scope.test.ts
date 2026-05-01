import { describe, expect, it } from 'vitest';
import { UserRole } from '@prisma/client';
import { dispatchOrderScope, settlementScope } from '@/lib/forwarder-scope';

describe('forwarder-scope', () => {
  it('FORWARDER는 본인 데이터만 (forwarderUserId 강제)', () => {
    const w = dispatchOrderScope({ userId: 'u1', role: UserRole.FORWARDER });
    expect(w).toEqual({ forwarderUserId: 'u1' });
  });

  it('ADMIN은 전체 (조건 없음)', () => {
    const w = dispatchOrderScope({ userId: 'u1', role: UserRole.ADMIN });
    expect(w).toEqual({});
  });

  it('CARRIER 등은 빈 결과 (현재 정책)', () => {
    const w = dispatchOrderScope({ userId: 'u1', role: UserRole.CARRIER });
    expect(w).toEqual({ id: '__none__' });
  });

  it('Settlement도 동일 규칙', () => {
    const w = settlementScope({ userId: 'u1', role: UserRole.FORWARDER });
    expect(w).toEqual({ trip: { dispatchOrder: { forwarderUserId: 'u1' } } });
    expect(settlementScope({ userId: 'u1', role: UserRole.ADMIN })).toEqual({});
  });
});
