/**
 * GET /api/notifications — 본인 알림 최신 20건 + 미읽음 카운트.
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRecentNotifications, getUnreadCount } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 },
    );
  }
  const [items, unread] = await Promise.all([
    getRecentNotifications(session.user.id, 20),
    getUnreadCount(session.user.id),
  ]);
  return NextResponse.json({
    ok: true,
    data: {
      items: items.map((n: (typeof items)[number]) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      unreadCount: unread,
    },
  });
}
