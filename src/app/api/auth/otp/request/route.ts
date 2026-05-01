/**
 * POST /api/auth/otp/request
 * Body: { phone: "010-XXXX-XXXX" }
 * Response: { ok: true, data: { expiresAt } } | { ok: false, error: { code, message } }
 *
 * 응답 메시지는 사용자 존재 여부를 노출하지 않음 (enumeration 방지).
 * 실패 사유 중 COOLDOWN만 사용자에게 알려도 안전.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requestOtp } from '@/lib/auth/otp';
import { apiErr, apiOk } from '@/lib/result';

const Body = z.object({
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '휴대폰 형식이 010-XXXX-XXXX 이어야 합니다'),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const message =
      e instanceof z.ZodError ? (e.issues[0]?.message ?? '잘못된 요청') : '잘못된 요청';
    return NextResponse.json(apiErr('INVALID_INPUT', message), { status: 400 });
  }

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined;

  const result = await requestOtp({ phone: parsed.phone, ipAddress });
  if (!result.ok) {
    if (result.error === 'COOLDOWN') {
      return NextResponse.json(apiErr('COOLDOWN', '잠시 후 다시 시도하세요 (1분 1회).'), {
        status: 429,
      });
    }
    return NextResponse.json(apiErr('INVALID_PHONE', '휴대폰 형식을 확인하세요.'), { status: 400 });
  }

  return NextResponse.json(apiOk({ expiresAt: result.value.expiresAt.toISOString() }));
}
