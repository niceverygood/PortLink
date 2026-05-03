/**
 * 이상 거래 탐지 룰 4종.
 * - 단순 SQL 집계 기반, 추가 의존성 0.
 * - 각 함수는 탐지된 항목 리스트 반환 (계약: 최대 50건).
 * - Phase 2에서 룰 추가/스코어링 도입 검토.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { BUSINESS_RULES } from '@/config/business-rules';

const MAX_RESULTS = 50;

export interface FareViolationItem {
  orderId: string;
  orderNo: string;
  originRegion: string;
  port: string;
  containerType: string;
  fare: number;
  safeRateBaseFare: number;
  shortfall: number;
  createdAt: Date;
}

export interface DriverCancelItem {
  driverId: string;
  driverCode: string;
  driverName: string;
  cancelCount: number;
  since: Date;
}

export interface OtpAbuseItem {
  phone: string;
  count: number;
  since: Date;
}

export interface GpsSpoofingItem {
  tripId: string;
  orderNo: string;
  driverCode: string;
  driverName: string;
  fromAction: string;
  toAction: string;
  distanceKm: number;
  elapsedMin: number;
  /** 평균 속도 km/h. */
  avgSpeedKmh: number;
}

export interface SuspiciousLocationItem {
  tripId: string;
  orderNo: string;
  driverCode: string;
  driverName: string;
  loadedLat: number;
  loadedLng: number;
  unloadedLat: number;
  unloadedLng: number;
  distanceM: number;
  capturedAt: Date;
}

export interface DuplicateAddressItem {
  originAddress: string;
  count: number;
  forwarderUserIds: string[];
}

/**
 * Rule 1 — 안전운임 한도 위반.
 * `fare < baseFare × (1 − LEGAL_MAX_BROKERAGE)` 인 dispatch_orders.
 * SafeRate 마스터에 매칭되는 행만 (없으면 검사 패스).
 */
export async function findFareViolations(): Promise<FareViolationItem[]> {
  // raw SQL로 dispatch_orders × safe_rates 매칭
  const rows = await prisma.$queryRaw<
    Array<{
      order_id: string;
      order_no: string;
      origin_region: string;
      port: string;
      container_type: string;
      fare: number;
      base_fare: number;
      created_at: Date;
    }>
  >`
    SELECT o.id AS order_id, o.order_no, o.origin_region, o.port::text AS port,
           o.container_type::text AS container_type, o.fare, sr.base_fare,
           o.created_at
    FROM dispatch_orders o
    JOIN LATERAL (
      SELECT base_fare FROM safe_rates s
      WHERE s.origin_region = o.origin_region
        AND s.port = o.port
        AND s.container_type = o.container_type
        AND s.effective_from <= o.created_at
      ORDER BY s.effective_from DESC
      LIMIT 1
    ) sr ON TRUE
    WHERE o.fare < (sr.base_fare * ${1 - BUSINESS_RULES.LEGAL_MAX_BROKERAGE})
    ORDER BY o.created_at DESC
    LIMIT ${MAX_RESULTS}
  `;

  return rows.map((r) => ({
    orderId: r.order_id,
    orderNo: r.order_no,
    originRegion: r.origin_region,
    port: r.port,
    containerType: r.container_type,
    fare: r.fare,
    safeRateBaseFare: r.base_fare,
    shortfall: Math.round(r.base_fare * (1 - BUSINESS_RULES.LEGAL_MAX_BROKERAGE)) - r.fare,
    createdAt: r.created_at,
  }));
}

/**
 * Rule 2 — 차주별 24h 취소 3건+ (DispatchAssign.cancelledAt 기준).
 */
export async function findDriverCancelAbuse(threshold = 3): Promise<DriverCancelItem[]> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);

  const grouped = await prisma.dispatchAssign.groupBy({
    by: ['driverId'],
    where: { cancelledAt: { gte: since } },
    _count: { _all: true },
    having: { driverId: { _count: { gte: threshold } } },
  });

  if (grouped.length === 0) return [];

  const drivers = await prisma.truckDriver.findMany({
    where: { id: { in: grouped.map((g) => g.driverId) } },
    include: { user: true },
  });

  return grouped
    .map((g) => {
      const d = drivers.find((dd) => dd.id === g.driverId);
      if (!d) return null;
      return {
        driverId: d.id,
        driverCode: d.driverCode,
        driverName: d.user.name,
        cancelCount: g._count._all,
        since,
      };
    })
    .filter((x): x is DriverCancelItem => !!x)
    .slice(0, MAX_RESULTS);
}

/**
 * Rule 3 — 같은 phone에 OTP 요청 1h 내 10회+ (잠재 침해).
 */
export async function findOtpAbuse(threshold = 10): Promise<OtpAbuseItem[]> {
  const since = new Date(Date.now() - 3600 * 1000);

  const grouped = await prisma.otpCode.groupBy({
    by: ['phone'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    having: { phone: { _count: { gte: threshold } } },
  });

  return grouped
    .map((g) => ({ phone: g.phone, count: g._count._all, since }))
    .slice(0, MAX_RESULTS);
}

/**
 * Rule 4 — 같은 originAddress에 5건+ dispatch_orders (잠재 자동화/스팸).
 */
export async function findDuplicateAddress(threshold = 5): Promise<DuplicateAddressItem[]> {
  const grouped = await prisma.dispatchOrder.groupBy({
    by: ['originAddress'],
    _count: { _all: true },
    having: { originAddress: { _count: { gte: threshold } } },
  });

  if (grouped.length === 0) return [];

  // 어느 forwarder가 등록했는지 표시용
  const orders = await prisma.dispatchOrder.findMany({
    where: { originAddress: { in: grouped.map((g) => g.originAddress) } },
    select: { originAddress: true, forwarderUserId: true },
    distinct: ['originAddress', 'forwarderUserId'],
  });

  return grouped
    .map((g) => ({
      originAddress: g.originAddress,
      count: g._count._all,
      forwarderUserIds: orders
        .filter((o) => o.originAddress === g.originAddress)
        .map((o) => o.forwarderUserId),
    }))
    .slice(0, MAX_RESULTS);
}

/** Rule 5 — 위치 스탬프 의심:
 * LOADED 좌표와 UNLOADED 좌표가 1km 이내 → 실제 운송 안 했을 가능성.
 * 두 스탬프 모두 있는 trip만 대상. */
export async function findSuspiciousLocation(thresholdM = 1000): Promise<SuspiciousLocationItem[]> {
  // 두 스탬프가 모두 있는 trip 조회 → JS에서 거리 계산 (Haversine).
  // PostgreSQL PostGIS가 없으므로 메모리에서 처리. trip 수 ~100 단위라 OK.
  const trips = await prisma.trip.findMany({
    where: {
      locationStamps: {
        some: { action: 'LOADED' },
      },
      AND: { locationStamps: { some: { action: 'UNLOADED' } } },
    },
    include: {
      locationStamps: { where: { action: { in: ['LOADED', 'UNLOADED'] } } },
      driver: { include: { user: true } },
      dispatchOrder: { select: { orderNo: true } },
    },
    take: 200,
    orderBy: { updatedAt: 'desc' },
  });

  const result: SuspiciousLocationItem[] = [];
  for (const t of trips) {
    const loaded = t.locationStamps.find((s) => s.action === 'LOADED');
    const unloaded = t.locationStamps.find((s) => s.action === 'UNLOADED');
    if (!loaded || !unloaded) continue;
    const lat1 = Number(loaded.latitude);
    const lng1 = Number(loaded.longitude);
    const lat2 = Number(unloaded.latitude);
    const lng2 = Number(unloaded.longitude);
    const distanceM = haversineMeters(lat1, lng1, lat2, lng2);
    if (distanceM <= thresholdM) {
      result.push({
        tripId: t.id,
        orderNo: t.dispatchOrder.orderNo,
        driverCode: t.driver.driverCode,
        driverName: t.driver.user.name,
        loadedLat: lat1,
        loadedLng: lng1,
        unloadedLat: lat2,
        unloadedLng: lng2,
        distanceM: Math.round(distanceM),
        capturedAt: unloaded.capturedAt,
      });
      if (result.length >= MAX_RESULTS) break;
    }
  }
  return result;
}

/** Haversine — 두 위경도 간 직선 거리 (meter). */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Rule 6 — GPS spoofing 의심:
 * 같은 trip 안에서 인접 stamp 시간차 < 10분 + 거리 > 50km이면 비현실적 점프.
 * 평균속도 300km/h 이상 → 좌표 조작 가능성. */
export async function findGpsSpoofing(opts?: {
  windowMs?: number;
  distanceKmThreshold?: number;
}): Promise<GpsSpoofingItem[]> {
  const windowMs = opts?.windowMs ?? 10 * 60 * 1000;
  const distThKm = opts?.distanceKmThreshold ?? 50;

  const trips = await prisma.trip.findMany({
    where: {
      locationStamps: { some: {} },
    },
    include: {
      locationStamps: { orderBy: { capturedAt: 'asc' } },
      driver: { include: { user: true } },
      dispatchOrder: { select: { orderNo: true } },
    },
    take: 200,
    orderBy: { updatedAt: 'desc' },
  });

  const result: GpsSpoofingItem[] = [];
  for (const t of trips) {
    if (t.locationStamps.length < 2) continue;
    for (let i = 1; i < t.locationStamps.length; i += 1) {
      const prev = t.locationStamps[i - 1]!;
      const curr = t.locationStamps[i]!;
      const elapsedMs = curr.capturedAt.getTime() - prev.capturedAt.getTime();
      if (elapsedMs <= 0) continue;
      const distKm =
        haversineMeters(
          Number(prev.latitude),
          Number(prev.longitude),
          Number(curr.latitude),
          Number(curr.longitude),
        ) / 1000;
      if (elapsedMs < windowMs && distKm > distThKm) {
        const avgSpeedKmh = distKm / (elapsedMs / 3_600_000);
        result.push({
          tripId: t.id,
          orderNo: t.dispatchOrder.orderNo,
          driverCode: t.driver.driverCode,
          driverName: t.driver.user.name,
          fromAction: prev.action,
          toAction: curr.action,
          distanceKm: Number(distKm.toFixed(1)),
          elapsedMin: Number((elapsedMs / 60_000).toFixed(1)),
          avgSpeedKmh: Math.round(avgSpeedKmh),
        });
        if (result.length >= MAX_RESULTS) return result;
        break; // 한 trip 안에서 첫 의심점만 보고 (중복 노이즈 회피)
      }
    }
  }
  return result;
}

/** 6 룰 일괄 실행. 대시보드/리스트 페이지에서 사용. */
export async function runAllAnomalyRules(): Promise<{
  fareViolations: FareViolationItem[];
  driverCancels: DriverCancelItem[];
  otpAbuse: OtpAbuseItem[];
  duplicateAddress: DuplicateAddressItem[];
  suspiciousLocations: SuspiciousLocationItem[];
  gpsSpoofing: GpsSpoofingItem[];
}> {
  const [
    fareViolations,
    driverCancels,
    otpAbuse,
    duplicateAddress,
    suspiciousLocations,
    gpsSpoofing,
  ] = await Promise.all([
    findFareViolations(),
    findDriverCancelAbuse(),
    findOtpAbuse(),
    findDuplicateAddress(),
    findSuspiciousLocation(),
    findGpsSpoofing(),
  ]);
  return {
    fareViolations,
    driverCancels,
    otpAbuse,
    duplicateAddress,
    suspiciousLocations,
    gpsSpoofing,
  };
}

// Prisma 사용으로 import 경고 회피
void Prisma;
