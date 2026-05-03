/**
 * POST /api/freight/invoice/[dispatchOrderId]
 *
 * 화주 청구서 데이터(JSON) 반환. PDF 렌더링은 클라이언트가 별도 호출 (8번 작업)
 * 또는 응답 헤더에 `application/pdf`로 PDF 바이너리 직접 반환 (8번에서 결정).
 *
 * 권한:
 *  - admin: 모든 배차
 *  - forwarder: 본인 발주 배차만
 *  - 그 외: 거부
 *
 * Body: { distanceKm?: number } — override
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
    format: z.enum(['json', 'pdf']).optional(),
  })
  .optional();

export async function POST(req: Request, ctx: { params: Promise<{ dispatchOrderId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  const role = session.user.role;
  if (role !== UserRole.ADMIN && role !== UserRole.FORWARDER) {
    return NextResponse.json(apiErr('FORBIDDEN', '청구서는 포워더/관리자만 발급 가능'), {
      status: 403,
    });
  }

  const { dispatchOrderId } = await ctx.params;

  let raw: unknown = undefined;
  try {
    if (req.headers.get('content-length')) raw = await req.json();
  } catch {
    /* body 없으면 무시 */
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(apiErr('INVALID_INPUT', parsed.error.message), { status: 400 });
  }

  // forwarder는 본인 발주만
  if (role === UserRole.FORWARDER) {
    const own = await prisma.dispatchOrder.findFirst({
      where: { id: dispatchOrderId, forwarderUserId: session.user.id },
      select: { id: true },
    });
    if (!own) {
      return NextResponse.json(apiErr('FORBIDDEN', '본인 발주 배차만 청구 가능'), { status: 403 });
    }
  }

  const built = await buildInvoiceData({
    dispatchOrderId,
    overrideDistanceKm: parsed.data?.distanceKm,
  });
  if (!built.ok) {
    const statusMap: Record<typeof built.error, number> = {
      NOT_FOUND: 404,
      NOT_COMPLETED: 400,
      CALC_FAILED: 422,
      NO_PORT: 400,
      NO_DRIVER: 400,
    };
    return NextResponse.json(apiErr(built.error, errorMessage(built.error)), {
      status: statusMap[built.error] ?? 400,
    });
  }

  if (parsed.data?.format === 'pdf') {
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { FreightInvoicePdf } = await import('@/lib/safe-freight/pdf-templates');
    const buffer = await renderToBuffer(FreightInvoicePdf({ data: built.data }));
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${built.data.dispatchOrder.orderNo}.pdf"`,
      },
    });
  }

  return NextResponse.json(apiOk(built.data));
}

function errorMessage(code: string): string {
  switch (code) {
    case 'NOT_FOUND':
      return '배차를 찾을 수 없습니다';
    case 'CALC_FAILED':
      return '안전운임 계산 실패';
    case 'NO_PORT':
      return '항만 정보 없음';
    default:
      return '청구서 생성 실패';
  }
}
