/**
 * PATCH /api/trips/:id/status
 * 도메인 로직은 lib/trip-update.ts.
 */
import { z } from 'zod';
import { TripStatus, UserRole } from '@prisma/client';
import { jsonErr, jsonOk, parseBody, requireRole } from '@/lib/api';
import { updateTripStatus, type UpdateError } from '@/lib/trip-update';

const Body = z.object({
  status: z.nativeEnum(TripStatus),
  reason: z.string().max(200).optional(),
});

const ERROR_MAP: Record<UpdateError, { code: string; message: string; status: number }> = {
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Trip을 찾을 수 없습니다', status: 404 },
  FORBIDDEN: { code: 'FORBIDDEN', message: '본인의 운송만 변경 가능합니다', status: 403 },
  NO_ASSIGN: { code: 'NO_ASSIGN', message: '활성 배정이 없습니다', status: 409 },
  INVALID_TRANSITION: {
    code: 'INVALID_TRANSITION',
    message: '허용되지 않는 상태 전환입니다',
    status: 400,
  },
  CANCEL_GRACE_EXCEEDED: {
    code: 'CANCEL_GRACE_EXCEEDED',
    message: '수락 후 5분이 지나 취소할 수 없습니다',
    status: 409,
  },
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authR = await requireRole([UserRole.DRIVER, UserRole.ADMIN]);
  if (!authR.ok) return authR.response;

  const { id: tripId } = await ctx.params;
  if (!tripId) return jsonErr('INVALID_PARAMS', '잘못된 trip id');

  const bodyR = await parseBody(req, Body);
  if (!bodyR.ok) return bodyR.response;

  const result = await updateTripStatus({
    userId: authR.session.user.id,
    isAdmin: authR.session.user.role === UserRole.ADMIN,
    tripId,
    nextStatus: bodyR.data.status,
    reason: bodyR.data.reason,
  });

  if (!result.ok) {
    const m = ERROR_MAP[result.error];
    return jsonErr(m.code, m.message, m.status);
  }
  return jsonOk(result.value);
}
