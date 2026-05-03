/**
 * POST /api/freight/report/[dispatchOrderId]
 *
 * 차주 미지급 신고서 데이터 반환.
 * 약정 < 법정 최저인 경우만 활성 (shortfallKrw > 0).
 *
 * 권한:
 *  - 해당 배차의 trip.driver 본인만 (admin도 가능)
 *
 * Body: { distanceKm?: number }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { buildInvoiceData } from '@/lib/safe-freight/invoice-data';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z
  .object({
    distanceKm: z.number().int().positive().max(2000).optional(),
    /** 'pdf'면 application/pdf 바이너리, 그 외/누락 시 JSON. */
    format: z.enum(['json', 'pdf']).optional(),
  })
  .optional();

export async function POST(req: Request, ctx: { params: Promise<{ dispatchOrderId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  const role = session.user.role;
  if (role !== UserRole.DRIVER && role !== UserRole.ADMIN) {
    return NextResponse.json(apiErr('FORBIDDEN', '차주 본인 또는 관리자만 신고서 생성 가능'), {
      status: 403,
    });
  }

  const { dispatchOrderId } = await ctx.params;

  let raw: unknown = undefined;
  try {
    if (req.headers.get('content-length')) raw = await req.json();
  } catch {
    /* noop */
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(apiErr('INVALID_INPUT', parsed.error.message), { status: 400 });
  }

  // 차주는 본인 trip만
  if (role === UserRole.DRIVER) {
    const driver = await prisma.truckDriver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!driver) {
      return NextResponse.json(apiErr('DRIVER_PROFILE_NOT_FOUND', '차주 프로필 없음'), {
        status: 403,
      });
    }
    const own = await prisma.trip.findFirst({
      where: { dispatchOrderId, driverId: driver.id },
      select: { id: true },
    });
    if (!own) {
      return NextResponse.json(apiErr('FORBIDDEN', '본인이 수락한 배차만 신고 가능'), {
        status: 403,
      });
    }
  }

  const built = await buildInvoiceData({
    dispatchOrderId,
    overrideDistanceKm: parsed.data?.distanceKm,
  });
  if (!built.ok) {
    return NextResponse.json(apiErr(built.error, '신고서 생성 실패'), { status: 400 });
  }

  if (built.data.shortfallKrw <= 0) {
    return NextResponse.json(
      apiErr('NO_SHORTFALL', '약정 운임이 법정 최저액 이상입니다. 신고 대상이 아닙니다.'),
      { status: 422 },
    );
  }

  const disclaimer = {
    header: '본 자료는 PortLink가 입력 데이터를 기반으로 자동 생성한 참고 자료입니다.',
    middle: `데이터 출처: ${built.data.safeFreight.snapshotMeta.noticeNumber}, 계산 시점: ${built.data.generatedAt.toISOString()}.`,
    footer:
      '신고 여부와 신고 내용에 대한 책임은 차주 본인에게 있으며, PortLink는 신고 결과에 대해 어떠한 법적 책임도 부담하지 않습니다.',
  };

  // PDF 요청이면 바이너리 응답 — @react-pdf/renderer는 server-only이므로 dynamic import.
  if (parsed.data?.format === 'pdf') {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { NonpaymentReportPdf } = await import('@/lib/safe-freight/pdf-templates');
    const buffer = await renderToBuffer(NonpaymentReportPdf({ data: built.data, disclaimer }));
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${built.data.dispatchOrder.orderNo}.pdf"`,
      },
    });
  }

  return NextResponse.json(
    apiOk({
      ...built.data,
      // 면책 문구 (§3 — 강하게)
      disclaimer,
    }),
  );
}
