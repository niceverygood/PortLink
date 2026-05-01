/**
 * 정산 계산 + 운임 한도 검증.
 *
 * - KRW 정수 강제 (CLAUDE.md §3 NEVER float)
 * - 수수료 = round(fare × PLATFORM_FEE_RATE)
 * - 차주 수령 = fare − platformFee
 * - 안전운임 한도: 입력 fare가 마스터 baseFare의 (1 − LEGAL_MAX_BROKERAGE) 미만이면 거부
 */
import { BUSINESS_RULES } from '@/config/business-rules';
import { err, ok, type Result } from '@/lib/result';

export interface SettlementBreakdown {
  fare: number;
  platformFee: number;
  driverPayout: number;
}

/** 정산 분해 — 양수 정수 fare에서 platformFee/driverPayout 계산. */
export function calculateSettlement(fare: number): SettlementBreakdown {
  if (!Number.isInteger(fare) || fare <= 0) {
    throw new Error(`fare must be positive integer, got ${fare}`);
  }
  const platformFee = Math.round(fare * BUSINESS_RULES.PLATFORM_FEE_RATE);
  const driverPayout = fare - platformFee;
  return { fare, platformFee, driverPayout };
}

export type FareValidationError = 'BELOW_LEGAL_MIN' | 'NEGATIVE_FARE' | 'NOT_INTEGER';

/**
 * 입력 fare가 안전운임 baseFare의 (1 − LEGAL_MAX_BROKERAGE) 이상인지 검증.
 * baseFare가 null이면 검증 패스 (마스터 미등록 구간은 포워더 자율).
 */
export function validateFareWithinLimit(
  fare: number,
  safeRateBaseFare: number | null,
): Result<void, FareValidationError> {
  if (!Number.isInteger(fare)) return err('NOT_INTEGER');
  if (fare <= 0) return err('NEGATIVE_FARE');
  if (safeRateBaseFare === null) return ok(undefined);

  const minAllowed = Math.round(safeRateBaseFare * (1 - BUSINESS_RULES.LEGAL_MAX_BROKERAGE));
  if (fare < minAllowed) return err('BELOW_LEGAL_MIN');
  return ok(undefined);
}
