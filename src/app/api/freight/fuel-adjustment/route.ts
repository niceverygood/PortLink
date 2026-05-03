/**
 * GET /api/freight/fuel-adjustment
 * 현재 분기에 적용중인 유가 조정값. 없으면 null.
 * 비회원 가능 (공개 정보).
 */
import { NextResponse } from 'next/server';
import { apiOk } from '@/lib/result';
import { getCurrentFuelAdjustment } from '@/lib/safe-freight/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const adj = await getCurrentFuelAdjustment();
  return NextResponse.json(
    apiOk({
      current: adj
        ? {
            quarterStart: adj.quarterStartDate,
            quarterEnd: adj.quarterEndDate,
            averageDieselPrice: adj.averageDieselPrice,
            baselinePrice: adj.baselinePrice,
            adjustmentRate: Number(adj.adjustmentRate),
            appliedFrom: adj.appliedFrom,
            appliedTo: adj.appliedTo,
          }
        : null,
    }),
  );
}
