/**
 * 안전운임 v2 — DB 조회 헬퍼.
 * 계산 엔진은 정적 시드(safe-freight-2026.ts)를 직접 import해서 동작하지만
 * UI/메타 응답은 DB에서 조회해야 운영 시 갱신 일관성 유지.
 */
import { TERMINAL_INNER_DISTANCE_KM } from '../../../prisma/seeds/safe-freight-2026';
import { prisma } from '@/lib/db';

/** 현재 일자 기준 유효한 연도별 스냅샷 1건 (없으면 null). */
export async function getCurrentYearlySnapshot(now: Date = new Date()) {
  return prisma.safeFreightYearlySnapshot.findFirst({
    where: {
      effectiveFrom: { lte: now },
      effectiveTo: { gte: now },
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}

/** 현재 분기에 적용중인 유가 조정값 (없으면 null). */
export async function getCurrentFuelAdjustment(now: Date = new Date()) {
  return prisma.fuelPriceAdjustment.findFirst({
    where: {
      appliedFrom: { lte: now },
      appliedTo: { gte: now },
    },
    orderBy: { appliedFrom: 'desc' },
  });
}

/** 항만 코드 → 터미널 내 거리 lookup 노출. */
export { TERMINAL_INNER_DISTANCE_KM };
