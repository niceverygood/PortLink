/**
 * GET /api/settlements/preview?month=YYYY-MM
 *
 * 역할별 정산 미리보기:
 *   DRIVER     → 본인 trip의 settlement 합계 (driverPayout 위주)
 *   FORWARDER  → 본인 의뢰의 settlement 합계 (fare/platformFee 위주)
 *   ADMIN      → 전체 GMV/수수료
 */
import { z } from 'zod';
import { UserRole, type Prisma } from '@prisma/client';
import { jsonErr, jsonOk, parseQuery, requireRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { BUSINESS_RULES } from '@/config/business-rules';

const Query = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'month는 YYYY-MM 형식'),
});

export async function GET(req: Request) {
  const authR = await requireRole([UserRole.DRIVER, UserRole.FORWARDER, UserRole.ADMIN]);
  if (!authR.ok) return authR.response;

  const queryR = parseQuery(new URL(req.url), Query);
  if (!queryR.ok) return queryR.response;

  const [year, month] = queryR.data.month.split('-').map(Number);
  if (!year || !month) return jsonErr('INVALID_MONTH', '잘못된 month');

  // 월 경계 (Asia/Seoul 기준 — DB는 UTC 저장이지만 UI 컨벤션상 KST)
  // KST = UTC+9. KST 자정 = UTC 전날 15:00.
  const fromUtc = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0));
  const toUtc = new Date(Date.UTC(year, month, 1, -9, 0, 0));

  const role = authR.session.user.role;
  const userId = authR.session.user.id;

  const where: Prisma.SettlementWhereInput = {
    createdAt: { gte: fromUtc, lt: toUtc },
  };

  if (role === UserRole.DRIVER) {
    const driver = await prisma.truckDriver.findUnique({ where: { userId } });
    if (!driver) return jsonErr('DRIVER_NOT_FOUND', '차주 프로필이 없습니다', 404);
    where.trip = { driverId: driver.id };
  } else if (role === UserRole.FORWARDER) {
    where.trip = { dispatchOrder: { forwarderUserId: userId } };
  }

  const settlements = await prisma.settlement.findMany({
    where,
    include: {
      trip: {
        include: { dispatchOrder: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totals = settlements.reduce(
    (acc, s) => {
      acc.totalFare += s.fare;
      acc.totalPlatformFee += s.platformFee;
      acc.totalDriverPayout += s.driverPayout;
      return acc;
    },
    { totalFare: 0, totalPlatformFee: 0, totalDriverPayout: 0 },
  );

  return jsonOk({
    month: queryR.data.month,
    timezone: BUSINESS_RULES.TIMEZONE,
    count: settlements.length,
    ...totals,
    items: settlements,
  });
}
