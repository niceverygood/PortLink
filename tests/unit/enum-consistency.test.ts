import { describe, expect, it } from 'vitest';
import { ContainerType, PortCode, TripStatus } from '@prisma/client';
import { BUSINESS_RULES } from '@/config/business-rules';
import { CONTAINER_TYPE_TO_WIRE } from '@/lib/prisma-enums';

/**
 * Prisma enum의 wire value(@map된 문자열)와 business-rules.ts 상수가 일치해야
 * 시드/쿼리/UI 표시가 어긋나지 않는다.
 *
 * Prisma 6에서 enum의 client 식별자(예: FORTY_FT_HC)는 wire value(40FT_HC)와 다름.
 * 그래서 ContainerType은 매핑 테이블을 거쳐 비교한다.
 */
describe('Prisma enum ↔ BUSINESS_RULES 일치', () => {
  it('ContainerType wire 값', () => {
    const wireValues = Object.values(CONTAINER_TYPE_TO_WIRE).sort();
    const ruleValues = [...BUSINESS_RULES.CONTAINER_TYPES].sort();
    expect(wireValues).toEqual(ruleValues);
  });

  it('CONTAINER_TYPE_TO_WIRE는 모든 Prisma identifier를 커버', () => {
    const prismaIdentifiers = Object.values(ContainerType).sort();
    const mappedIdentifiers = Object.keys(CONTAINER_TYPE_TO_WIRE).sort();
    expect(mappedIdentifiers).toEqual(prismaIdentifiers);
  });

  it('PortCode (식별자=wire value)', () => {
    const prismaValues = Object.values(PortCode).sort();
    const ruleValues = BUSINESS_RULES.PORTS.map((p) => p.code).sort();
    expect(prismaValues).toEqual(ruleValues);
  });

  it('TripStatus 7단계 (식별자=wire value)', () => {
    const prismaValues = Object.values(TripStatus).sort();
    const ruleValues = [...BUSINESS_RULES.TRIP_STATUSES].sort();
    expect(prismaValues).toEqual(ruleValues);
    expect(prismaValues).toHaveLength(7);
  });
});
