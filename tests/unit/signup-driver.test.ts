// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockTruckDriverCreate = vi.fn();
const mockQueryRaw = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    truckDriver: {
      create: (...args: unknown[]) => mockTruckDriverCreate(...args),
    },
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/auth/otp', () => ({
  verifyOtp: vi.fn(),
}));

import { POST } from '@/app/api/auth/signup/driver/route';
import { verifyOtp } from '@/lib/auth/otp';

const verifyOtpMock = vi.mocked(verifyOtp);

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/auth/signup/driver', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup/driver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path — phone + OTP 유효 + 신규 phone → 201 + driverCode 발급 + 트랜잭션 호출', async () => {
    verifyOtpMock.mockResolvedValue({ ok: true, value: { phone: '010-9000-0001' } });
    mockUserFindUnique.mockResolvedValue(null);
    mockQueryRaw.mockResolvedValue([{ nextval: BigInt(1000) }]);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        user: { create: mockUserCreate.mockResolvedValue({ id: 'u_new' }) },
        truckDriver: { create: mockTruckDriverCreate.mockResolvedValue({}) },
      }),
    );

    const res = await POST(makeReq({ phone: '010-9000-0001', code: '999999' }));
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.data.driverCode).toBe('D-1000');
    expect(verifyOtpMock).toHaveBeenCalledWith({
      phone: '010-9000-0001',
      code: '999999',
      consume: false, // signup은 OTP 소진 안 함
    });
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('중복 phone — findUnique에서 기존 user 발견 → 409 PHONE_ALREADY_REGISTERED + 트랜잭션 안 호출', async () => {
    verifyOtpMock.mockResolvedValue({ ok: true, value: { phone: '010-9000-0002' } });
    mockUserFindUnique.mockResolvedValue({ id: 'u_existing', phone: '010-9000-0002' });

    const res = await POST(makeReq({ phone: '010-9000-0002', code: '999999' }));
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('PHONE_ALREADY_REGISTERED');
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('OTP 실패 — verifyOtp 에러 → 400 OTP_INVALID + DB 호출 없음', async () => {
    verifyOtpMock.mockResolvedValue({ ok: false, error: 'WRONG_CODE' });

    const res = await POST(makeReq({ phone: '010-9000-0003', code: '111111' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('OTP_INVALID');
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('phone 형식 불량 → 400 INVALID_INPUT (zod 검증)', async () => {
    const res = await POST(makeReq({ phone: '01099990000', code: '999999' }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('INVALID_INPUT');
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
