/**
 * POST /api/notifications/[id]/read — 단일 알림 읽음 처리.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markAsRead } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const updated = await markAsRead({ userId: session.user.id, notificationId: id });
  return NextResponse.json({ ok: true, data: { updated } });
}
