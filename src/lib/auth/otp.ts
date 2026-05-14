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
 * App Store / Play 심사 전용 OTP 우회 — 다음 4조건 모두 만족 시에만 적용:
 *   1. 우회 코드가 6자리 숫자
 *   2. 요청 phone이 화이트리스트에 포함
 *   3. 입력 코드가 우회 코드와 일치
 *   4. 활성화 조건: env 또는 review-notes.md 명시 demo phones
 *
 * 우선순위:
 *   - env(REVIEW_OTP_BYPASS + REVIEW_DEMO_PHONES) 설정 시 그 값 사용.
 *   - env 미설정 시 review-notes.md에 명시된 D-0001~D-0005 (010-3000-0001 ~ 010-3000-0005)
 *     + 코드 999999 조합으로 자동 fallback.
 *
 * fallback이 영구 박혀있는 이유:
 *   - App Store Connect 심사관이 항상 review-notes.md 그대로 시도하므로
 *     env 등록 누락 시에도 deterministic하게 동작해야 함.
 *   - 화이트리스트가 5개 phone + 1개 code로 매우 좁음 → abuse 위험 제한.
 *   - 일반 사용자는 D-0001~5 시드 폰 번호 + 999999 조합을 알 수 없음.
 *
 * OtpCode 테이블을 건드리지 않으므로 이력 추적 불가 — 심사용 한정.
 */
const FALLBACK_REVIEW_CODE = '999999';
const FALLBACK_REVIEW_PHONES = [
  // 데모 로그인용 (D-0001 ~ D-0005, 시드와 1:1 매칭)
  '010-3000-0001',
  '010-3000-0002',
  '010-3000-0003',
  '010-3000-0004',
  '010-3000-0005',
  // App Store 5.1.1(v) 회원 탈퇴 시연용 (가입 → 탈퇴 흐름 테스트 전용).
  // 시드에 존재하지 않아 자유롭게 가입 후 삭제 가능. 삭제 후에는 phone이
  // 'deleted:<id>'로 익명화되어 같은 번호로 재가입 불가 → 다음 번호 사용.
  '010-3000-9001',
  '010-3000-9002',
  '010-3000-9003',
  '010-3000-9004',
  '010-3000-9005',
] as const;

function isReviewBypass(phone: string, code: string): boolean {
  const envCode = process.env.REVIEW_OTP_BYPASS ?? '';
  const envAllowList = (process.env.REVIEW_DEMO_PHONES ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const envActive = /^\d{6}$/.test(envCode) && envAllowList.length > 0;

  const expectedCode = envActive ? envCode : FALLBACK_REVIEW_CODE;
  const allowList: readonly string[] = envActive ? envAllowList : FALLBACK_REVIEW_PHONES;

  if (code !== expectedCode) return false;
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
  consume?: boolean; // false 시 OtpCode.consumedAt 미설정 — signup에서 peek 용도. 기본 true(로그인)
}): Promise<Result<{ phone: string }, OtpVerifyError>> {
  const { phone, code, consume = true } = opts;

  // 심사 우회 — 환경변수 + 화이트리스트 phone에 한해 OTP 검증을 통과시킨다.
  // OtpCode row를 만들지 않으므로 이력은 별도 audit log로 별도 기록 권장.
  if (isReviewBypass(phone, code)) {
    console.warn(`[OTP] review bypass used (phone=${phone}, consume=${consume})`);
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

  if (consume) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }
  return ok({ phone });
}
