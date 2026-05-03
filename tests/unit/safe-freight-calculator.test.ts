/**
 * 안전운임 v2 계산 엔진 — 스펙 §8 6개 케이스.
 * 출처: 국토교통부고시 제2026-55호, 별첨 safeFreightCalculator.ts.
 */
import { describe, expect, it } from 'vitest';
import { calculateSafeFreight } from '@/lib/safe-freight/calculator';

const SHIP_DATE = new Date('2026-06-15'); // 시행 기간 내 임의 날짜

describe('calculateSafeFreight', () => {
  it('1. 표준: 부산신항 → 수원 380km 40FT 할증 없음', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 380,
      originPortCode: 'BUSAN_NEW_PORT', // +3.3km → 383.3 → round 383 → 다음 anchor 390
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 990km anchor 운임표 기준 차주 위탁운임 985,300원 (수당·대기료 0).
    expect(r.value.finalConsignmentRate).toBe(985_300);
    expect(r.value.breakdown.effectiveSurchargeRate).toBe(0);
  });

  it('2. 냉동: 부산신항 → 안산 390km 40FT REEFER 30%', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 390,
      originPortCode: 'BUSAN_NEW_PORT', // +3.3 → 393.3 → 393 → 다음 anchor 400
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
      surcharges: [{ code: 'REEFER', rate: 0.3, description: '냉동' }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // baseConsignment = 1,002,800 (400km anchor) × 30% = 300,840원
    expect(r.value.breakdown.baseConsignment).toBe(1_002_800);
    expect(r.value.breakdown.surchargeAmount).toBe(300_840);
    expect(r.value.breakdown.effectiveSurchargeRate).toBe(0.3);
  });

  it('3. 가산방식 — 3개 할증 [30,20,20] → 50%', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 60,
      originPortCode: 'INCHEON_PORT', // +1km → 61 → next anchor 70
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
      surcharges: [
        { code: 'REEFER', rate: 0.3 },
        { code: 'INCHEON_ORIGIN', rate: 0.2 },
        { code: 'ROUGH_ROAD', rate: 0.2 },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 30% + 20%×0.5 + 20%×0.5 = 50%
    expect(r.value.breakdown.effectiveSurchargeRate).toBeCloseTo(0.5, 5);
  });

  it('4. 다중할증 4개 → 상위 3개만 적용 (HOLIDAY 무시)', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
      surcharges: [
        { code: 'RESTRICTED_AREA', rate: 0.3 },
        { code: 'REEFER', rate: 0.3 },
        { code: 'ROUGH_ROAD', rate: 0.2 },
        { code: 'HOLIDAY', rate: 0.2 }, // 4번째 → 무시되어야 함
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // sort desc → [30,30,20,20]. top3=[30,30,20]. 30 + 30×0.5 + 20×0.5 = 55%
    expect(r.value.breakdown.effectiveSurchargeRate).toBeCloseTo(0.55, 5);
  });

  it('5. 대기료: 항만 2시간(120분) 대기 → 40,000원', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
      waitingMinutesAtPort: 120, // free 60 + 청구 60 = 30분당 20,000 × 2 = 40,000
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.breakdown.waitingFee).toBe(40_000);
  });

  it('6. 유효기간 외: 2027-01-01 → OUT_OF_EFFECTIVE_PERIOD', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FT',
      shipmentDate: new Date('2027-01-01'),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe('OUT_OF_EFFECTIVE_PERIOD');
  });

  // 보너스: 가산방식 helper 단위 검증
  it('가산방식 helper: 빈 배열 → 0', () => {
    const r = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
      surcharges: [],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.breakdown.effectiveSurchargeRate).toBe(0);
    expect(r.value.breakdown.surchargeAmount).toBe(0);
  });

  // 보너스: 45FT는 40FT × 1.125
  it('45FT는 40FT × 1.125', () => {
    const r40 = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FT',
      shipmentDate: SHIP_DATE,
    });
    const r45 = calculateSafeFreight({
      originDistanceKm: 100,
      containerType: 'FORTY_FIVE_FT',
      shipmentDate: SHIP_DATE,
    });
    expect(r40.ok && r45.ok).toBe(true);
    if (!r40.ok || !r45.ok) return;
    expect(r45.value.breakdown.baseConsignment).toBe(
      Math.round(r40.value.breakdown.baseConsignment * 1.125),
    );
  });
});
