/**
 * POST /api/auth/signup/driver
 * Body: { phone: "010-XXXX-XXXX", code: "NNNNNN", name?: string }
 * Response: { ok: true, data: { driverCode } } | { ok: false, error: { code, message } }
 *
 * 가입 흐름:
 *   1. OTP code peek (consume=false) — 클라이언트가 곧이어 signIn('phone-otp')으로 consume + 세션 발급
 *   2. phone 중복 검사
 *   3. driver_code_seq에서 다음 번호 발급 (D-NNNN 포맷)
 *   4. User(status=ACTIVE, role=DRIVER) + TruckDriver(licenseNo/bank 모두 null) 트랜잭션 생성
 *   5. 클라이언트는 응답 받자마자 signIn(phone-otp) 호출 → /driver/onboarding 자동 이동
 *
 * 약속 사항(App Store 3.2 회신문):
 *   - 운영자 승인 단계 없음 (status=ACTIVE 즉시)
 *   - 화물운송종사자 자격증은 첫 화물 수락 전 onboarding에서 입력 (가입 시 nullable)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyOtp } from '@/lib/auth/otp';
import { apiErr, apiOk } from '@/lib/result';

const Body = z.object({
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '휴대폰 형식이 010-XXXX-XXXX 이어야 합니다'),
  code: z.string().regex(/^\d{6}$/, '인증번호는 6자리 숫자여야 합니다'),
  name: z.string().trim().min(1, '이름을 입력하세요').max(50).optional(),
});

async function nextDriverCode(): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('driver_code_seq')`;
  const num = Number(rows[0]?.nextval ?? 0);
  return `D-${num.toString().padStart(4, '0')}`;
}

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const message =
      e instanceof z.ZodError ? (e.issues[0]?.message ?? '잘못된 요청') : '잘못된 요청';
    return NextResponse.json(apiErr('INVALID_INPUT', message), { status: 400 });
  }

  const { phone, code, name } = parsed;

  // 1. OTP 검증 (소진 안 함 — 직후 signIn에서 소진)
  const verifyResult = await verifyOtp({ phone, code, consume: false });
  if (!verifyResult.ok) {
    return NextResponse.json(apiErr('OTP_INVALID', '인증번호가 올바르지 않거나 만료되었습니다.'), {
      status: 400,
    });
  }

  // 2. 중복 phone 확인
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json(
      apiErr('PHONE_ALREADY_REGISTERED', '이미 가입된 휴대폰 번호입니다. 로그인 화면으로 이동하세요.'),
      { status: 409 },
    );
  }

  // 3. 시퀀스 발급 + 트랜잭션 생성
  try {
    const driverCode = await nextDriverCode();
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone,
          name: name ?? `차주 ${driverCode}`,
          role: UserRole.DRIVER,
          status: UserStatus.ACTIVE,
        },
      });
      await tx.truckDriver.create({
        data: {
          userId: user.id,
          driverCode,
          // licenseNo / bankName / bankAccount 모두 null — onboarding에서 입력
        },
      });
      return { userId: user.id, driverCode };
    });

    return NextResponse.json(apiOk({ driverCode: created.driverCode }));
  } catch (e) {
    // 동시 동일 phone 가입 등 race — Prisma P2002 unique 충돌
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        apiErr('PHONE_ALREADY_REGISTERED', '이미 가입된 휴대폰 번호입니다.'),
        { status: 409 },
      );
    }
    console.error('[signup/driver] unexpected error', e);
    return NextResponse.json(apiErr('INTERNAL', '가입 중 오류가 발생했습니다.'), { status: 500 });
  }
}
