/**
 * GET /api/driver/empty-run/[chargeId]/pdf
 *
 * 공차 운행 §14 보상 청구 양식 PDF (참고용).
 * - 차주 본인 trip의 charge만 (admin도 가능)
 * - PDF 바이너리 + status PDF_DOWNLOADED 업데이트 (멱등 — 재다운로드여도 status downgrade 안 함)
 *
 * PortLink는 자동 청구 X — 양식만 제공. 차주가 직접 화주/운수사에 발송.
 */
import { NextResponse } from 'next/server';
import { EmptyRunChargeStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr } from '@/lib/result';
import { prisma } from '@/lib/db';
import { getRegionCoord } from '@/config/geocoords';
import { getCurrentYearlySnapshot } from '@/lib/safe-freight/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ chargeId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  const { chargeId } = await ctx.params;

  const charge = await prisma.emptyRunCharge.findUnique({
    where: { id: chargeId },
    include: {
      trip: {
        include: {
          driver: { include: { user: true } },
          vehicle: true,
          dispatchOrder: { include: { forwarder: { include: { forwarder: true } } } },
          locationStamps: { where: { action: { in: ['UNLOADED', 'COMPLETED'] } } },
        },
      },
    },
  });
  if (!charge) {
    return NextResponse.json(apiErr('NOT_FOUND', '청구 자료를 찾을 수 없습니다'), { status: 404 });
  }

  // 권한 — 차주 본인 또는 admin
  const isOwner = charge.trip.driver.user.id === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) {
    return NextResponse.json(apiErr('FORBIDDEN', '본인 trip만 다운로드 가능'), { status: 403 });
  }

  // 직전 trip의 마지막 좌표 조회 (basedOnTripId)
  const prevStamp = await prisma.tripLocationStamp.findFirst({
    where: { tripId: charge.basedOnTripId, action: { in: ['UNLOADED', 'COMPLETED'] } },
    orderBy: { capturedAt: 'desc' },
  });
  if (!prevStamp) {
    return NextResponse.json(apiErr('NO_BASE_LOCATION', '직전 운송지 좌표 없음'), { status: 422 });
  }

  // 다음 trip 출발지 추정 좌표
  const dest = getRegionCoord(charge.trip.dispatchOrder.originRegion);
  if (!dest) {
    return NextResponse.json(apiErr('NO_DEST_COORD', '출발지 좌표 사전에 없음'), { status: 422 });
  }

  // 안전운임 고시 메타
  const snapshot = await getCurrentYearlySnapshot();
  const noticeNumber = snapshot?.noticeNumber ?? '국토교통부고시';

  // PDF 렌더 (server-only dynamic import)
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const { EmptyRunClaimPdf } = await import('@/lib/safe-freight/pdf-templates');
  const buffer = await renderToBuffer(
    EmptyRunClaimPdf({
      data: {
        newTrip: {
          orderNo: charge.trip.dispatchOrder.orderNo,
          originRegion: charge.trip.dispatchOrder.originRegion,
          originAddress: charge.trip.dispatchOrder.originAddress,
          pickupAt: charge.trip.dispatchOrder.pickupAt,
        },
        forwarder: {
          companyName:
            charge.trip.dispatchOrder.forwarder?.forwarder?.companyName ??
            charge.trip.dispatchOrder.forwarder?.name ??
            '—',
          representative: charge.trip.dispatchOrder.forwarder?.forwarder?.representative ?? '',
        },
        driver: {
          name: charge.trip.driver.user.name,
          code: charge.trip.driver.driverCode,
          plateNo: charge.trip.vehicle?.plateNo ?? '',
        },
        emptyRun: {
          distanceKm: Number(charge.distanceKm),
          chargeKrw: charge.chargeKrw,
          containerType: charge.containerType,
          fromLat: Number(prevStamp.latitude),
          fromLng: Number(prevStamp.longitude),
          fromCapturedAt: prevStamp.capturedAt,
          toLat: dest.lat,
          toLng: dest.lng,
        },
        generatedAt: new Date(),
        noticeNumber,
      },
    }),
  );

  // status 전이 — DETECTED/NOTICE_SHOWN → PDF_DOWNLOADED. 이미 PDF_DOWNLOADED면 noop.
  if (charge.status !== EmptyRunChargeStatus.PDF_DOWNLOADED) {
    await prisma.emptyRunCharge.update({
      where: { id: chargeId },
      data: {
        status: EmptyRunChargeStatus.PDF_DOWNLOADED,
        pdfDownloadedAt: new Date(),
      },
    });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="empty-run-claim-${charge.trip.dispatchOrder.orderNo}.pdf"`,
    },
  });
}
