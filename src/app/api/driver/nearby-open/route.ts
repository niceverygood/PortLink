/**
 * GET /api/driver/nearby-open?lat=&lng=&excludeTripId=
 *
 * 차주 현재 좌표 기준 가장 가까운 OPEN 배차 1건 추천 (B-3).
 * 본인 차종에 매칭되는 OPEN만 후보. excludeTripId가 있으면 그 dispatchOrder는 제외.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DispatchOrderStatus, UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { prisma } from '@/lib/db';
import { getRegionCoord } from '@/config/geocoords';
import { haversineMeters } from '@/lib/distance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  excludeTripId: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(apiErr('UNAUTHORIZED', '로그인이 필요합니다'), { status: 401 });
  }
  if (session.user.role !== UserRole.DRIVER && session.user.role !== UserRole.ADMIN) {
    return NextResponse.json(apiErr('FORBIDDEN', '차주만 접근 가능'), { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    lat: url.searchParams.get('lat'),
    lng: url.searchParams.get('lng'),
    excludeTripId: url.searchParams.get('excludeTripId') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(apiErr('INVALID_QUERY', parsed.error.message), { status: 400 });
  }

  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
    include: { vehicles: { where: { isActive: true } } },
  });
  if (!driver) {
    return NextResponse.json(apiErr('NO_DRIVER', '차주 프로필 없음'), { status: 404 });
  }
  const types = Array.from(new Set(driver.vehicles.map((v) => v.type)));
  if (types.length === 0) {
    return NextResponse.json(apiOk({ recommendation: null }));
  }

  // 제외할 dispatchOrderId 결정
  let excludeOrderId: string | undefined;
  if (parsed.data.excludeTripId) {
    const t = await prisma.trip.findUnique({
      where: { id: parsed.data.excludeTripId },
      select: { dispatchOrderId: true },
    });
    excludeOrderId = t?.dispatchOrderId;
  }

  const candidates = await prisma.dispatchOrder.findMany({
    where: {
      status: DispatchOrderStatus.OPEN,
      containerType: { in: types },
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
    },
    orderBy: { pickupAt: 'asc' },
    take: 30,
  });

  // JS에서 거리 계산 → 가장 가까운 1건
  let best: { order: (typeof candidates)[number]; distM: number } | null = null;
  for (const o of candidates) {
    const c = getRegionCoord(o.originRegion);
    if (!c) continue;
    const distM = haversineMeters(parsed.data.lat, parsed.data.lng, c.lat, c.lng);
    if (!best || distM < best.distM) best = { order: o, distM };
  }
  if (!best) return NextResponse.json(apiOk({ recommendation: null }));

  return NextResponse.json(
    apiOk({
      recommendation: {
        id: best.order.id,
        orderNo: best.order.orderNo,
        originRegion: best.order.originRegion,
        port: best.order.port,
        containerType: best.order.containerType,
        fare: best.order.fare,
        pickupAt: best.order.pickupAt,
        distanceM: Math.round(best.distM),
      },
    }),
  );
}
