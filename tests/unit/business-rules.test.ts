import { describe, expect, it } from 'vitest';
import { BUSINESS_RULES } from '@/config/business-rules';

describe('BUSINESS_RULES', () => {
  it('플랫폼 수수료는 안전운임 한도 이하여야 한다', () => {
    expect(BUSINESS_RULES.PLATFORM_FEE_RATE).toBeLessThanOrEqual(
      BUSINESS_RULES.LEGAL_MAX_BROKERAGE,
    );
  });

  it('항만 코드는 5종', () => {
    expect(BUSINESS_RULES.PORTS).toHaveLength(5);
  });

  it('운송 상태는 7단계', () => {
    expect(BUSINESS_RULES.TRIP_STATUSES).toHaveLength(7);
  });

  it('타임존은 Asia/Seoul', () => {
    expect(BUSINESS_RULES.TIMEZONE).toBe('Asia/Seoul');
  });
});
