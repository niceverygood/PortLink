/**
 * 공차 운행 자동 감지 (안전운임 제14조).
 *
 * 트리거: 차주가 OPEN 배차 수락 직후 (acceptDispatchOrder 안에서 best-effort 호출).
 *
 * 감지 흐름:
 *   1. 차주의 직전 COMPLETED trip A 조회 (없으면 skip)
 *   2. trip A의 LocationStamp(UNLOADED 또는 COMPLETED) 좌표 fetch (없으면 skip — 위치 권한 거부)
 *   3. 새 trip B의 originRegion 좌표 fetch (REGION_COORDS 사전)
 *   4. 두 좌표 거리 계산 (Haversine)
 *   5. ≥ 10km이면 EmptyRunCharge 생성
 *      · 보상액 = SafeFreightRate(거리, containerType, CONSIGNMENT) × 0.5
 *
 * Settlement 자동 합산은 Stage 9. MVP에선 차주 화면 안내만.
 */
import { ContainerType, RateType, TripStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getRegionCoord } from '@/config/geocoords';
import { haversineMeters } from '@/lib/distance';

const EMPTY_RUN_THRESHOLD_KM = 10; // 제14조 기준
const COMPENSATION_RATE = 0.5; // 왕복운임의 50%

export interface DetectResult {
  detected: boolean;
  reason?:
    | 'NO_PREV_TRIP'
    | 'NO_PREV_LOCATION'
    | 'NO_DESTINATION_COORD'
    | 'BELOW_THRESHOLD'
    | 'NO_RATE_TABLE_MATCH';
  distanceKm?: number;
  chargeKrw?: number;
  basedOnTripId?: string;
}

/** 차주가 새 trip을 수락한 직후 호출. 트랜잭션 외부에서 best-effort 실행. */
export async function detectAndRecordEmptyRun(opts: {
  driverId: string;
  newTripId: string;
  newDispatchOrderOriginRegion: string;
  newContainerType: ContainerType;
}): Promise<DetectResult> {
  // 1) 직전 COMPLETED trip
  const prevTrip = await prisma.trip.findFirst({
    where: { driverId: opts.driverId, status: TripStatus.COMPLETED },
    orderBy: { completedAt: 'desc' },
    include: {
      locationStamps: { where: { action: { in: ['UNLOADED', 'COMPLETED'] } } },
    },
  });
  if (!prevTrip) return { detected: false, reason: 'NO_PREV_TRIP' };

  // 2) 직전 trip의 마지막 위치 (UNLOADED 우선, 없으면 COMPLETED)
  const stamp =
    prevTrip.locationStamps.find((s) => s.action === 'UNLOADED') ??
    prevTrip.locationStamps.find((s) => s.action === 'COMPLETED');
  if (!stamp) return { detected: false, reason: 'NO_PREV_LOCATION' };

  // 3) 새 trip 출발지 좌표
  const dest = getRegionCoord(opts.newDispatchOrderOriginRegion);
  if (!dest) return { detected: false, reason: 'NO_DESTINATION_COORD' };

  // 4) 거리
  const distM = haversineMeters(
    Number(stamp.latitude),
    Number(stamp.longitude),
    dest.lat,
    dest.lng,
  );
  const distKm = distM / 1000;
  if (distKm < EMPTY_RUN_THRESHOLD_KM) {
    return { detected: false, reason: 'BELOW_THRESHOLD', distanceKm: distKm };
  }

  // 5) 보상액 계산 — 안전위탁운임 표 lookup
  const roundedKm = Math.max(1, Math.round(distKm));
  const containerForLookup =
    opts.newContainerType === ContainerType.FORTY_FT_HC
      ? ContainerType.FORTY_FT
      : opts.newContainerType;
  const rate = await prisma.safeFreightRate.findFirst({
    where: {
      containerType: containerForLookup,
      rateType: RateType.CONSIGNMENT,
      distanceKm: { gte: roundedKm },
    },
    orderBy: { distanceKm: 'asc' },
  });
  if (!rate) {
    return { detected: false, reason: 'NO_RATE_TABLE_MATCH', distanceKm: distKm };
  }
  const chargeKrw = Math.round((rate.amountKrw * COMPENSATION_RATE) / 10) * 10;

  // 멱등 — 같은 trip에 중복 감지되어도 한 번만.
  await prisma.emptyRunCharge.upsert({
    where: { tripId: opts.newTripId },
    update: {
      basedOnTripId: prevTrip.id,
      distanceKm: new (await import('@prisma/client/runtime/library')).Decimal(distKm.toFixed(2)),
      chargeKrw,
      containerType: opts.newContainerType,
    },
    create: {
      tripId: opts.newTripId,
      basedOnTripId: prevTrip.id,
      distanceKm: new (await import('@prisma/client/runtime/library')).Decimal(distKm.toFixed(2)),
      chargeKrw,
      containerType: opts.newContainerType,
    },
  });

  return {
    detected: true,
    distanceKm: distKm,
    chargeKrw,
    basedOnTripId: prevTrip.id,
  };
}

/** 시연/디버그용 export. */
export const __test__ = { EMPTY_RUN_THRESHOLD_KM, COMPENSATION_RATE };
