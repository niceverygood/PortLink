import { describe, expect, it } from 'vitest';
import { calculateSettlement, validateFareWithinLimit } from '@/lib/settlements';
import { BUSINESS_RULES } from '@/config/business-rules';

describe('calculateSettlement', () => {
  it('기본 5% 수수료 — 합계 항상 일치', () => {
    const r = calculateSettlement(800_000);
    expect(r.fare).toBe(800_000);
    expect(r.platformFee).toBe(40_000);
    expect(r.driverPayout).toBe(760_000);
    expect(r.platformFee + r.driverPayout).toBe(r.fare);
  });

  it('반올림 경계 — 정수 보장', () => {
    // 99,999 × 0.05 = 4,999.95 → round = 5000
    const r = calculateSettlement(99_999);
    expect(Number.isInteger(r.platformFee)).toBe(true);
    expect(Number.isInteger(r.driverPayout)).toBe(true);
    expect(r.platformFee + r.driverPayout).toBe(99_999);
  });

  it('수수료율은 BUSINESS_RULES와 동기화', () => {
    const r = calculateSettlement(1_000_000);
    expect(r.platformFee).toBe(Math.round(1_000_000 * BUSINESS_RULES.PLATFORM_FEE_RATE));
  });

  it('float/0/음수 거부', () => {
    expect(() => calculateSettlement(800_000.5)).toThrow();
    expect(() => calculateSettlement(0)).toThrow();
    expect(() => calculateSettlement(-1)).toThrow();
  });
});

describe('validateFareWithinLimit', () => {
  it('안전운임 90% 이상이면 통과', () => {
    // base 800,000 × 0.9 = 720,000
    expect(validateFareWithinLimit(720_000, 800_000).ok).toBe(true);
    expect(validateFareWithinLimit(800_000, 800_000).ok).toBe(true);
    expect(validateFareWithinLimit(900_000, 800_000).ok).toBe(true);
  });

  it('안전운임 90% 미만이면 거부', () => {
    const r = validateFareWithinLimit(719_999, 800_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('BELOW_LEGAL_MIN');
  });

  it('마스터 미등록(null)이면 통과', () => {
    expect(validateFareWithinLimit(100_000, null).ok).toBe(true);
  });

  it('float/0/음수 거부', () => {
    expect(validateFareWithinLimit(100.5, 800_000).ok).toBe(false);
    expect(validateFareWithinLimit(0, 800_000).ok).toBe(false);
    expect(validateFareWithinLimit(-1, 800_000).ok).toBe(false);
  });
});
