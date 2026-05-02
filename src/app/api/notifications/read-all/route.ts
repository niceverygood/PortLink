/**
 * POST /api/notifications/read-all — 본인 미읽음 전체 처리.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 },
    );
  }
  const updated = await markAllAsRead(session.user.id);
  return NextResponse.json({ ok: true, data: { updated } });
}
