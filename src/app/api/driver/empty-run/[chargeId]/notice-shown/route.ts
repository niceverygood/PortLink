/**
 * POST /api/driver/empty-run/[chargeId]/notice-shown
 *
 * 차주가 trip 상세에서 공차 운행 §14 안내 카드를 본 시점을 기록.
 * status DETECTED → NOTICE_SHOWN (이미 NOTICE_SHOWN/PDF_DOWNLOADED면 noop).
 *
 * fire-and-forget 호출용. 실패해도 사용자에겐 노출 X.
 */
import { NextResponse } from 'next/server';
import { EmptyRunChargeStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, ctx: { params: Promise<{ chargeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  const { chargeId } = await ctx.params;

  const charge = await prisma.emptyRunCharge.findUnique({
    where: { id: chargeId },
    include: { trip: { include: { driver: { include: { user: true } } } } },
  });
  if (!charge) {
    return NextResponse.json(apiErr('NOT_FOUND', '청구 자료 없음'), { status: 404 });
  }

  const isOwner = charge.trip.driver.user.id === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json(apiErr('FORBIDDEN', '본인 trip만 가능'), { status: 403 });
  }

  // 이미 NOTICE_SHOWN 이상이면 downgrade 안 함
  if (charge.status === EmptyRunChargeStatus.DETECTED) {
    await prisma.emptyRunCharge.update({
      where: { id: chargeId },
      data: {
        status: EmptyRunChargeStatus.NOTICE_SHOWN,
        noticeShownAt: new Date(),
      },
    });
  }

  return NextResponse.json(apiOk({ status: 'NOTICE_SHOWN' }));
}
