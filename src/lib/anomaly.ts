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

/** 4 룰 일괄 실행. 대시보드/리스트 페이지에서 사용. */
export async function runAllAnomalyRules(): Promise<{
  fareViolations: FareViolationItem[];
  driverCancels: DriverCancelItem[];
  otpAbuse: OtpAbuseItem[];
  duplicateAddress: DuplicateAddressItem[];
}> {
  const [fareViolations, driverCancels, otpAbuse, duplicateAddress] = await Promise.all([
    findFareViolations(),
    findDriverCancelAbuse(),
    findOtpAbuse(),
    findDuplicateAddress(),
  ]);
  return { fareViolations, driverCancels, otpAbuse, duplicateAddress };
}

// Prisma 사용으로 import 경고 회피
void Prisma;
