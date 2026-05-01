/**
 * GET /api/safe-rate?originRegion=&port=&containerType=
 *
 * 가장 최신 active SafeRate 1건 또는 null 반환.
 * 권한: 인증된 모든 사용자.
 */
import { z } from 'zod';
import { ContainerType, PortCode, UserRole } from '@prisma/client';
import { jsonOk, parseQuery, requireRole } from '@/lib/api';
import { getSafeRate } from '@/lib/safe-rate';

const Query = z.object({
  originRegion: z.string().min(1, 'originRegion 필요'),
  port: z.nativeEnum(PortCode),
  containerType: z.nativeEnum(ContainerType),
});

const ALLOWED: ReadonlyArray<UserRole> = [
  UserRole.DRIVER,
  UserRole.CARRIER,
  UserRole.FORWARDER,
  UserRole.ADMIN,
];

export async function GET(req: Request) {
  const authR = await requireRole(ALLOWED);
  if (!authR.ok) return authR.response;

  const queryR = parseQuery(new URL(req.url), Query);
  if (!queryR.ok) return queryR.response;

  const rate = await getSafeRate(queryR.data);
  return jsonOk(rate);
}
