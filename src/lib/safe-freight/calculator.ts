/**
 * 안전운임 계산 핵심 로직
 *
 * 출처: 국토교통부고시 제2026-55호 [별표 1] 부대조항
 */

import {
  DISTANCE_RATE_TABLE,
  TERMINAL_INNER_DISTANCE_KM,
  WAITING_FEE_RULES,
  EMPTY_RUN_RULE,
  FT45_MULTIPLIER,
  SAFE_FREIGHT_META,
  type FreightRateRow,
  type SurchargeCode,
} from '../../../prisma/seeds/safe-freight-2026';

// ============================================================================
// 타입
// ============================================================================

export type ContainerType = 'TWENTY_FT' | 'FORTY_FT' | 'FORTY_FIVE_FT';

export type RateType = 'CONSIGNMENT' | 'INTER_CARRIER' | 'TRANSPORT';

export type AppliedSurcharge = {
  code: SurchargeCode | string;
  rate: number;
  description?: string;
};

export type CalculationInput = {
  originDistanceKm: number; // 기점-종점 간 거리 (km)
  originPortCode?: keyof typeof TERMINAL_INNER_DISTANCE_KM; // 항만 출발 시 터미널 내 거리 자동 가산
  containerType: ContainerType;
  surcharges?: AppliedSurcharge[];
  waitingMinutesAtPort?: number;
  waitingMinutesAtFactory?: number;
  emptyReturnKm?: number; // 10km 이상 공차회송 시
  shipmentDate: Date;
  isRoundTrip?: boolean; // 기본값 true. 수도권 화주공장+의왕ICD 조건만 false
  inchconReturn?: boolean; // 의왕ICD 편도 + 인천터미널 반납 시 +40,000원
  cargoWeightTon?: number; // 중량물 할증 자동 계산용
  isPTA?: boolean; // 테레프탈산 여부 (20FT 21톤부터 할증)
};

export type CalculationResult =
  | { ok: true; value: CalculationOutput }
  | { ok: false; error: CalculationError };

export type CalculationError =
  | 'OUT_OF_EFFECTIVE_PERIOD'
  | 'DISTANCE_OUT_OF_RANGE'
  | 'INVALID_INPUT';

export type CalculationOutput = {
  finalConsignmentRate: number; // 차주 수령액 (운수사→차주)
  finalInterCarrierRate: number; // 운수사 간 운임
  finalTransportRate: number; // 화주 청구액 (화주→운수사)
  margin: number; // 화주~차주 차액 (운송사 마진)
  breakdown: {
    distanceKm: number;
    baseConsignment: number;
    baseInterCarrier: number;
    baseTransport: number;
    surchargeAmount: number; // 위탁운임 기준 할증액
    appliedSurcharges: AppliedSurcharge[];
    effectiveSurchargeRate: number; // 가산방식 적용 후 최종 할증률
    waitingFee: number;
    emptyReturnFee: number;
    additionalFees: number;
  };
  ruleVersionSnapshot: typeof SAFE_FREIGHT_META;
};

// ============================================================================
// 핵심 함수: 가산방식 할증 계산 (제22조)
// ============================================================================

/**
 * 가산방식 할증률 계산
 *
 * 규칙:
 * 1. 가장 높은 할증률 1개를 우선 적용 (100%)
 * 2. 나머지는 50%씩만 적용
 * 3. 할증 항목이 3개 초과 시 할증률 높은 순서대로 3개까지만 합산
 *
 * 예: [100%, 80%, 20%, 20%]
 *   → 100% + 80%×0.5 + 20%×0.5 = 100% + 40% + 10% = 150%
 */
export function calculateEffectiveSurchargeRate(surcharges: AppliedSurcharge[]): number {
  if (surcharges.length === 0) return 0;

  // 할증률 내림차순 정렬, 상위 3개만 추출
  const sorted = [...surcharges].sort((a, b) => b.rate - a.rate).slice(0, 3);

  let totalRate = 0;
  if (sorted[0]) totalRate += sorted[0].rate; // 1순위 100%
  if (sorted[1]) totalRate += sorted[1].rate * 0.5; // 2순위 50%
  if (sorted[2]) totalRate += sorted[2].rate * 0.5; // 3순위 50%

  return totalRate;
}

// ============================================================================
// 거리별 운임 조회
// ============================================================================

/**
 * 거리(km)에 해당하는 운임 row 조회 (정확히 일치하는 km, 또는 가장 가까운 km)
 *
 * 시드 테이블에는 1, 2, 3...25, 30, 35, 40...이런 식으로 점프하는 구간이 있음.
 * 정확히 일치하지 않으면 양쪽 가까운 값을 보간하거나, 큰 쪽으로 올림 처리.
 *
 * 안전한 정책: 차주에게 유리하게 큰 쪽으로 올림 (보수적 추정)
 */
export function findRateRow(distanceKm: number): FreightRateRow | null {
  const rounded = Math.round(distanceKm);
  if (rounded < 1) return null;

  // 정확히 일치
  const exact = DISTANCE_RATE_TABLE.find((r: FreightRateRow) => r.km === rounded);
  if (exact) return exact;

  // 가장 가까운 큰 값 (차주에게 유리한 방향)
  const nextLarger = DISTANCE_RATE_TABLE.find((r: FreightRateRow) => r.km > rounded);
  if (nextLarger) return nextLarger;

  // 테이블 최대값 초과
  return null;
}

// ============================================================================
// 중량물 할증 계산 (제23조 가)
// ============================================================================

/**
 * 컨테이너 내품 무게에 따른 할증률 계산
 *
 * - 40FT: 23톤 초과부터 1톤당 10%, 최대 40%까지(7톤 초과)
 * - 20FT: 20톤 초과부터 1톤당 10%
 * - PTA(테레프탈산) 20FT: 21톤 초과부터 1톤당 10%
 */
export function calculateWeightSurcharge(
  containerType: ContainerType,
  cargoWeightTon: number,
  isPTA = false,
): number {
  let baselineTon: number;

  if (containerType === 'FORTY_FT' || containerType === 'FORTY_FIVE_FT') {
    baselineTon = 23;
  } else {
    baselineTon = isPTA ? 21 : 20;
  }

  const overTon = Math.max(0, Math.ceil(cargoWeightTon - baselineTon));
  return Math.min(0.4, overTon * 0.1); // 최대 40% 상한
}

// ============================================================================
// 대기료 계산 (제24조)
// ============================================================================

export function calculateWaitingFee(
  containerType: ContainerType,
  waitingMinutesAtPort: number,
  waitingMinutesAtFactory: number,
): number {
  const portFreeMin = WAITING_FEE_RULES.PORT_FREE_MINUTES;
  const factoryFreeMin =
    containerType === 'TWENTY_FT'
      ? WAITING_FEE_RULES.FACTORY_20FT_FREE_MINUTES
      : WAITING_FEE_RULES.FACTORY_40FT_FREE_MINUTES;

  const portChargeable = Math.max(0, waitingMinutesAtPort - portFreeMin);
  const factoryChargeable = Math.max(0, waitingMinutesAtFactory - factoryFreeMin);

  // 30분당 20,000원 (30분 단위 올림 처리하지 않음 - 정확히 30분 단위로 청구)
  const portFee = Math.floor(portChargeable / 30) * WAITING_FEE_RULES.RATE_PER_30MIN_KRW;
  const factoryFee = Math.floor(factoryChargeable / 30) * WAITING_FEE_RULES.RATE_PER_30MIN_KRW;

  return portFee + factoryFee;
}

// ============================================================================
// 메인 계산 함수
// ============================================================================

export function calculateSafeFreight(input: CalculationInput): CalculationResult {
  // 유효기간 체크
  if (
    input.shipmentDate < SAFE_FREIGHT_META.effectiveFrom ||
    input.shipmentDate > SAFE_FREIGHT_META.effectiveTo
  ) {
    return { ok: false, error: 'OUT_OF_EFFECTIVE_PERIOD' };
  }

  // 항만 터미널 내 거리 자동 가산
  let totalDistanceKm = input.originDistanceKm;
  if (input.originPortCode && TERMINAL_INNER_DISTANCE_KM[input.originPortCode]) {
    totalDistanceKm += TERMINAL_INNER_DISTANCE_KM[input.originPortCode];
  }

  // 거리별 운임 조회
  const rateRow = findRateRow(totalDistanceKm);
  if (!rateRow) {
    return { ok: false, error: 'DISTANCE_OUT_OF_RANGE' };
  }

  // 컨테이너 종류별 기본 운임
  let baseConsignment: number;
  let baseInterCarrier: number;
  let baseTransport: number;

  if (input.containerType === 'TWENTY_FT') {
    baseConsignment = rateRow.consignment20ft;
    baseInterCarrier = rateRow.interCarrier20ft;
    baseTransport = rateRow.transport20ft;
  } else {
    baseConsignment = rateRow.consignment40ft;
    baseInterCarrier = rateRow.interCarrier40ft;
    baseTransport = rateRow.transport40ft;
  }

  // 45FT는 40FT의 112.5%
  if (input.containerType === 'FORTY_FIVE_FT') {
    baseConsignment = Math.round(baseConsignment * FT45_MULTIPLIER);
    baseInterCarrier = Math.round(baseInterCarrier * FT45_MULTIPLIER);
    baseTransport = Math.round(baseTransport * FT45_MULTIPLIER);
  }

  // 할증 처리 - 중량물 할증 자동 추가
  const allSurcharges: AppliedSurcharge[] = [...(input.surcharges ?? [])];
  if (input.cargoWeightTon !== undefined) {
    const weightRate = calculateWeightSurcharge(
      input.containerType,
      input.cargoWeightTon,
      input.isPTA,
    );
    if (weightRate > 0) {
      allSurcharges.push({
        code: 'HEAVY_CARGO',
        rate: weightRate,
        description: `중량물 할증 ${(weightRate * 100).toFixed(0)}%`,
      });
    }
  }

  // 가산방식 적용
  const effectiveSurchargeRate = calculateEffectiveSurchargeRate(allSurcharges);
  const surchargeAmount = Math.round((baseConsignment * effectiveSurchargeRate) / 10) * 10; // 십원 반올림

  // 대기료
  const waitingFee = calculateWaitingFee(
    input.containerType,
    input.waitingMinutesAtPort ?? 0,
    input.waitingMinutesAtFactory ?? 0,
  );

  // 공차 회송 (10km 이상 공차 시 왕복운임의 50%)
  let emptyReturnFee = 0;
  if (input.emptyReturnKm && input.emptyReturnKm >= EMPTY_RUN_RULE.MINIMUM_KM) {
    const emptyRow = findRateRow(input.emptyReturnKm);
    if (emptyRow) {
      const baseEmpty =
        input.containerType === 'TWENTY_FT' ? emptyRow.consignment20ft : emptyRow.consignment40ft;
      emptyReturnFee = Math.round((baseEmpty * EMPTY_RUN_RULE.RATE) / 10) * 10;
    }
  }

  // 인천터미널 반납 추가비 (의왕ICD 편도 시)
  const additionalFees = input.inchconReturn ? 40_000 : 0;

  // 최종 합산
  const finalConsignmentRate =
    baseConsignment + surchargeAmount + waitingFee + emptyReturnFee + additionalFees;

  // 운송운임 / 운수사업자간 운임도 동일 할증률 적용
  // (단, 인천기점/평택기점 할증은 위탁운임에만 적용 - 별도 처리 필요)
  const transportSurchargeAmount = Math.round((baseTransport * effectiveSurchargeRate) / 10) * 10;
  const interCarrierSurchargeAmount =
    Math.round((baseInterCarrier * effectiveSurchargeRate) / 10) * 10;

  const finalTransportRate =
    baseTransport + transportSurchargeAmount + waitingFee + emptyReturnFee + additionalFees;
  const finalInterCarrierRate =
    baseInterCarrier + interCarrierSurchargeAmount + waitingFee + emptyReturnFee + additionalFees;

  return {
    ok: true,
    value: {
      finalConsignmentRate,
      finalInterCarrierRate,
      finalTransportRate,
      margin: finalTransportRate - finalConsignmentRate,
      breakdown: {
        distanceKm: totalDistanceKm,
        baseConsignment,
        baseInterCarrier,
        baseTransport,
        surchargeAmount,
        appliedSurcharges: allSurcharges,
        effectiveSurchargeRate,
        waitingFee,
        emptyReturnFee,
        additionalFees,
      },
      ruleVersionSnapshot: SAFE_FREIGHT_META,
    },
  };
}
