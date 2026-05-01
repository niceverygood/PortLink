/**
 * POST /api/dispatch-orders/:id/accept
 *
 * 차주(DRIVER)가 OPEN 상태 배차를 수락. 도메인 로직은 lib/dispatch-accept.ts.
 */
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { jsonErr, jsonOk, requireRole } from '@/lib/api';
import { acceptDispatchOrder, type AcceptError } from '@/lib/dispatch-accept';

const Params = z.object({ id: z.string().min(1) });

const ERROR_MAP: Record<AcceptError, { code: string; message: string; status: number }> = {
  NOT_FOUND: { code: 'NOT_FOUND', message: '배차를 찾을 수 없습니다', status: 404 },
  NOT_OPEN: { code: 'NOT_OPEN', message: '이미 다른 차주가 수락한 배차입니다', status: 409 },
  TYPE_MISMATCH: { code: 'TYPE_MISMATCH', message: '차종에 맞는 차량이 없습니다', status: 400 },
  NO_VEHICLE: { code: 'NO_VEHICLE', message: '활성 차량이 없습니다', status: 400 },
  DRIVER_NOT_FOUND: { code: 'DRIVER_NOT_FOUND', message: '차주 프로필이 없습니다', status: 404 },
  ALREADY_ACCEPTED: {
    code: 'ALREADY_ACCEPTED',
    message: '이미 다른 차주가 수락한 배차입니다',
    status: 409,
  },
};

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authR = await requireRole([UserRole.DRIVER]);
  if (!authR.ok) return authR.response;

  const params = Params.safeParse(await ctx.params);
  if (!params.success) return jsonErr('INVALID_PARAMS', '잘못된 경로 매개변수');

  const result = await acceptDispatchOrder({
    userId: authR.session.user.id,
    orderId: params.data.id,
  });

  if (!result.ok) {
    const m = ERROR_MAP[result.error];
    return jsonErr(m.code, m.message, m.status);
  }

  return jsonOk(result.value, 201);
}
