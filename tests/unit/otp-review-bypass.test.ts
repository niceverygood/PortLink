import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

// prisma 클라이언트는 우회 경로에선 호출돼선 안 됨 — mock으로 검증.
vi.mock('@/lib/db', () => ({
  prisma: {
    otpCode: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { verifyOtp } from '@/lib/auth/otp';
import { prisma } from '@/lib/db';

describe('verifyOtp — review bypass', () => {
  const ENV_KEEP = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.REVIEW_OTP_BYPASS;
    delete process.env.REVIEW_DEMO_PHONES;
  });

  afterEach(() => {
    process.env = { ...ENV_KEEP };
  });

  it('환경변수 미설정이지만 review-notes.md 명시 phone + 999999 → fallback 우회 OK (prisma 미호출)', async () => {
    const res = await verifyOtp({ phone: '010-3000-0001', code: '999999' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.phone).toBe('010-3000-0001');
    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
  });

  it('환경변수 미설정 + fallback 화이트리스트 외 phone → 일반 경로 (NOT_FOUND)', async () => {
    const res = await verifyOtp({ phone: '010-9999-9999', code: '999999' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('NOT_FOUND');
    expect(prisma.otpCode.findFirst).toHaveBeenCalledOnce();
  });

  it('환경변수 미설정 + fallback phone이지만 코드 999999 아님 → 일반 경로', async () => {
    const res = await verifyOtp({ phone: '010-3000-0001', code: '111111' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('NOT_FOUND');
    expect(prisma.otpCode.findFirst).toHaveBeenCalledOnce();
  });

  it('우회 활성 + 화이트리스트 phone + 일치 코드 → 즉시 OK, prisma 미호출', async () => {
    process.env.REVIEW_OTP_BYPASS = '999999';
    process.env.REVIEW_DEMO_PHONES = '010-3000-0001,010-3000-0002';

    const res = await verifyOtp({ phone: '010-3000-0001', code: '999999' });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.phone).toBe('010-3000-0001');
    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
  });

  it('우회 활성이지만 phone이 화이트리스트 외 → 일반 경로', async () => {
    process.env.REVIEW_OTP_BYPASS = '999999';
    process.env.REVIEW_DEMO_PHONES = '010-3000-0001';

    const res = await verifyOtp({ phone: '010-9999-9999', code: '999999' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('NOT_FOUND');
    expect(prisma.otpCode.findFirst).toHaveBeenCalledOnce();
  });

  it('우회 활성이지만 입력 코드 다름 → 일반 경로', async () => {
    process.env.REVIEW_OTP_BYPASS = '999999';
    process.env.REVIEW_DEMO_PHONES = '010-3000-0001';

    const res = await verifyOtp({ phone: '010-3000-0001', code: '111111' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('NOT_FOUND');
    expect(prisma.otpCode.findFirst).toHaveBeenCalledOnce();
  });

  it('REVIEW_OTP_BYPASS만 설정 + REVIEW_DEMO_PHONES 비어있으면 env invalid → fallback 적용 (review phone + 999999는 통과)', async () => {
    process.env.REVIEW_OTP_BYPASS = '999999';

    const res = await verifyOtp({ phone: '010-3000-0001', code: '999999' });
    expect(res.ok).toBe(true);
    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
  });

  it('REVIEW_OTP_BYPASS 형식 비6자리면 env invalid → fallback 적용 (입력 코드 5자리는 통과 안 됨)', async () => {
    process.env.REVIEW_OTP_BYPASS = '12345'; // 5자리
    process.env.REVIEW_DEMO_PHONES = '010-3000-0001';

    const res = await verifyOtp({ phone: '010-3000-0001', code: '12345' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('NOT_FOUND');
    expect(prisma.otpCode.findFirst).toHaveBeenCalledOnce();
  });

  it('fallback phone 5종 (D-0001 ~ D-0005) 모두 999999로 통과', async () => {
    for (const phone of [
      '010-3000-0001',
      '010-3000-0002',
      '010-3000-0003',
      '010-3000-0004',
      '010-3000-0005',
    ]) {
      const res = await verifyOtp({ phone, code: '999999' });
      expect(res.ok).toBe(true);
    }
    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
  });

  it('App Store 5.1.1(v) 회원 탈퇴 시연용 화이트리스트(010-3000-9001~9005)도 통과', async () => {
    for (const phone of [
      '010-3000-9001',
      '010-3000-9002',
      '010-3000-9003',
      '010-3000-9004',
      '010-3000-9005',
    ]) {
      const res = await verifyOtp({ phone, code: '999999' });
      expect(res.ok).toBe(true);
    }
    expect(prisma.otpCode.findFirst).not.toHaveBeenCalled();
  });
});
