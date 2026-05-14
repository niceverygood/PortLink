/**
 * POST /api/account/delete
 * Body: { confirm: "탈퇴" }
 *
 * 본인 한정 회원 탈퇴(soft delete).
 * - 익명화 + status=SUSPENDED + deletedAt 기록.
 * - 성공 시 클라이언트가 signOut 호출해 세션 종료.
 *
 * App Store Guideline 5.1.1(v): 앱 내에서 시작 → 확인 → 완료까지 가능해야 함.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { deleteAccount } from '@/lib/account-delete';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  confirm: z.literal('탈퇴', { message: '확인 문구가 일치하지 않습니다' }),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }

  try {
    Body.parse(await req.json());
  } catch (e) {
    const message =
      e instanceof z.ZodError ? (e.issues[0]?.message ?? '잘못된 요청') : '잘못된 요청';
    return NextResponse.json(apiErr('INVALID_INPUT', message), { status: 400 });
  }

  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    undefined;
  const userAgent = req.headers.get('user-agent') ?? undefined;

  const result = await deleteAccount(session.user.id, { ipAddress, userAgent });
  if (!result.ok) {
    const map: Record<string, { status: number; message: string }> = {
      NOT_FOUND: { status: 404, message: '존재하지 않는 계정입니다' },
      ALREADY_DELETED: { status: 409, message: '이미 탈퇴된 계정입니다' },
      ACTIVE_TRIP: {
        status: 409,
        message: '진행 중인 운송이 있어 탈퇴할 수 없습니다. 운송 완료 후 다시 시도해 주세요.',
      },
      PENDING_SETTLEMENT: { status: 409, message: '미확정 정산이 남아 있어 탈퇴할 수 없습니다' },
      ADMIN_FORBIDDEN: {
        status: 403,
        message: '관리자 계정은 앱에서 탈퇴할 수 없습니다',
      },
    };
    const info = map[result.error] ?? { status: 400, message: '탈퇴 처리 실패' };
    return NextResponse.json(apiErr(result.error, info.message), { status: info.status });
  }

  return NextResponse.json(apiOk({ deleted: true }));
}
