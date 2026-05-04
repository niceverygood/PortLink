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

/**
 * App Store 심사 전용 OTP 우회 — 다음 4조건 모두 만족 시에만 적용:
 *   1. env REVIEW_OTP_BYPASS = 6자리 코드 설정
 *   2. env REVIEW_DEMO_PHONES = "010-3000-0001,010-3000-0002,..." 형식
 *   3. 요청 phone이 위 화이트리스트에 포함
 *   4. 입력 코드가 REVIEW_OTP_BYPASS와 일치
 *
 * 운영 활성 조건: Vercel 환경변수에 세 값을 설정해야만 작동.
 * 미설정 시 함수는 항상 false 반환 → 일반 OTP 검증으로 진행.
 *
 * 위 우회는 OtpCode 테이블을 건드리지 않으므로 이력 추적 불가 — 심사용 한정.
 */
function isReviewBypass(phone: string, code: string): boolean {
  const bypassCode = process.env.REVIEW_OTP_BYPASS;
  if (!bypassCode || !/^\d{6}$/.test(bypassCode)) return false;
  if (code !== bypassCode) return false;

  const allowList = (process.env.REVIEW_DEMO_PHONES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (allowList.length === 0) return false;

  return allowList.includes(phone);
}

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

  // 심사 우회 — 환경변수 + 화이트리스트 phone에 한해 OTP 검증을 통과시킨다.
  // OtpCode row를 만들지 않으므로 이력은 별도 audit log로 별도 기록 권장.
  if (isReviewBypass(phone, code)) {
    console.warn(`[OTP] review bypass used (phone=${phone})`);
    return ok({ phone });
  }

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
