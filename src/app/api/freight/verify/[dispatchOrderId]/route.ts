/**
 * GET /api/freight/verify/[dispatchOrderId]
 *
 * 차주 운임 검증 위젯 데이터 — 가벼운 client-fetch 용.
 * /api/freight/invoice 와 동일 데이터지만 권한이 다름:
 *  - 차주: 본인 trip만
 *  - 포워더: 본인 발주만
 *  - admin: 전부
 *
 * SafeFreightVerifier 컴포넌트가 페이지 진입 후 useEffect로 호출.
 * → 차주 jobs 상세 페이지 SSR 단계에서 buildInvoiceData 제거 가능.
 */
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { buildInvoiceData } from '@/lib/safe-freight/invoice-data';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ dispatchOrderId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  const role = session.user.role;
  const { dispatchOrderId } = await ctx.params;

  // 권한 체크 — 차주: 본인 trip / 포워더: 본인 발주 / admin: pass
  if (role === UserRole.DRIVER) {
    const driver = await prisma.truckDriver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!driver) {
      return NextResponse.json(apiErr('FORBIDDEN', '차주 프로필 없음'), { status: 403 });
    }
    const own = await prisma.trip.findFirst({
      where: { dispatchOrderId, driverId: driver.id },
      select: { id: true },
    });
    if (!own) {
      // OPEN 배차도 차주가 검증 화면에서 미리 볼 수 있게 허용 (수락 전 의사결정 보조).
      const isOpen = await prisma.dispatchOrder.findFirst({
        where: { id: dispatchOrderId, status: 'OPEN' },
        select: { id: true },
      });
      if (!isOpen) {
        return NextResponse.json(apiErr('FORBIDDEN', '본인 trip 또는 OPEN 배차만 조회'), {
          status: 403,
        });
      }
    }
  } else if (role === UserRole.FORWARDER) {
    const own = await prisma.dispatchOrder.findFirst({
      where: { id: dispatchOrderId, forwarderUserId: session.user.id },
      select: { id: true },
    });
    if (!own) {
      return NextResponse.json(apiErr('FORBIDDEN', '본인 발주 배차만 조회'), { status: 403 });
    }
  } else if (role !== UserRole.ADMIN && role !== UserRole.CARRIER) {
    return NextResponse.json(apiErr('FORBIDDEN', '권한 없음'), { status: 403 });
  }

  const built = await buildInvoiceData({ dispatchOrderId });
  if (!built.ok) {
    return NextResponse.json(apiErr(built.error, '검증 데이터 생성 실패'), { status: 400 });
  }

  return NextResponse.json(
    apiOk({
      orderId: built.data.dispatchOrder.id,
      agreedFareKrw: built.data.dispatchOrder.fare,
      legalMinKrw: built.data.safeFreight.finalConsignmentRateKrw,
      distanceKm: built.data.safeFreight.distanceKm,
      surcharges: built.data.safeFreight.appliedSurcharges,
      surchargeAmountKrw: built.data.safeFreight.surchargeAmountKrw,
      waitingFeeKrw: built.data.safeFreight.waitingFeeKrw,
      noticeNumber: built.data.safeFreight.snapshotMeta.noticeNumber,
      shortfallKrw: built.data.shortfallKrw,
    }),
  );
}
