/**
 * OTP 발급/검증 — Mock SMS provider.
 * 실제 SMS는 Phase 2(NHN Cloud)에서 연동.
 *
 * 발급: 6자리 숫자, TTL 5분, 동일 phone 1분 내 재요청 거부.
 * 검증: phone+code 매칭, 만료 안 됨, consumedAt NULL, attempts < 5.
 *       성공 시 consumedAt 세팅. 실패 시 attempts 증가.
 */
import { prisma } from '@/lib/db';
import { err, ok, type Result } from '@/lib/result';
import { BUSINESS_RULES } from '@/config/business-rules';

const TTL_MS = 5 * 60_000;
const REQUEST_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

export type OtpRequestError = 'COOLDOWN' | 'INVALID_PHONE';
export type OtpVerifyError = 'NOT_FOUND' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'WRONG_CODE';

function generateCode(): string {
  // 6자리, 첫 자리도 0 가능 (사용자 입력 편의 위해 padStart)
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

function isValidKoreanPhone(phone: string): boolean {
  return /^010-\d{4}-\d{4}$/.test(phone);
}

export async function requestOtp(opts: {
  phone: string;
  ipAddress?: string;
}): Promise<Result<{ phone: string; expiresAt: Date }, OtpRequestError>> {
  const { phone, ipAddress } = opts;
  if (!isValidKoreanPhone(phone)) {
    return err('INVALID_PHONE');
  }

  const recent = await prisma.otpCode.findFirst({
    where: { phone, createdAt: { gte: new Date(Date.now() - REQUEST_COOLDOWN_MS) } },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) return err('COOLDOWN');

  const code = generateCode();
  const expiresAt = new Date(Date.now() + TTL_MS);

  await prisma.otpCode.create({
    data: { phone, code, expiresAt, ipAddress },
  });

  // Mock SMS — 콘솔 출력. CLAUDE.md §3 ALWAYS 한국어 메시지 + 영어 키.
  console.info(
    `[Mock SMS] PortLink 인증번호 ${code} (phone=${phone}, ttl=${TTL_MS / 1000}s, tz=${BUSINESS_RULES.TIMEZONE})`,
  );

  return ok({ phone, expiresAt });
}

export async function verifyOtp(opts: {
  phone: string;
  code: string;
}): Promise<Result<{ phone: string }, OtpVerifyError>> {
  const { phone, code } = opts;

  // 가장 최근 활성 OTP 1건만 본다.
  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return err('NOT_FOUND');
  if (otp.expiresAt < new Date()) return err('EXPIRED');
  if (otp.attempts >= MAX_ATTEMPTS) return err('TOO_MANY_ATTEMPTS');

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return err('WRONG_CODE');
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return ok({ phone });
}
