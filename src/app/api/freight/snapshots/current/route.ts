/**
 * GET /api/freight/snapshots/current
 *
 * 현재 유효 시점의 SafeFreightYearlySnapshot 메타 + 할증 코드 + 항만 터미널 거리.
 * 운임표 자체는 너무 커서 미포함 (필요 시 별도 endpoint).
 * 비회원 가능.
 */
import { NextResponse } from 'next/server';
import { apiErr, apiOk } from '@/lib/result';
import { getCurrentYearlySnapshot, TERMINAL_INNER_DISTANCE_KM } from '@/lib/safe-freight/queries';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getCurrentYearlySnapshot();
  if (!snapshot) {
    return NextResponse.json(apiErr('NO_ACTIVE_SNAPSHOT', '현재 유효 안전운임 고시 없음'), {
      status: 404,
    });
  }

  const surcharges = await prisma.surchargeRule.findMany({
    where: { yearlySnapshotId: snapshot.id },
    orderBy: { rate: 'desc' },
    select: { code: true, description: true, rate: true },
  });

  const rateRowCount = await prisma.safeFreightRate.count({
    where: { yearlySnapshotId: snapshot.id },
  });

  return NextResponse.json(
    apiOk({
      snapshot: {
        fiscalYear: snapshot.fiscalYear,
        noticeNumber: snapshot.noticeNumber,
        noticeDate: snapshot.noticeDate,
        effectiveFrom: snapshot.effectiveFrom,
        effectiveTo: snapshot.effectiveTo,
      },
      counts: {
        rates: rateRowCount,
        surcharges: surcharges.length,
      },
      surcharges: surcharges.map((s) => ({
        code: s.code,
        description: s.description,
        rate: Number(s.rate),
      })),
      terminalInnerDistanceKm: TERMINAL_INNER_DISTANCE_KM,
    }),
  );
}
