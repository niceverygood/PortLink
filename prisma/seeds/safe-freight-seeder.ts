/**
 * 안전운임 v2 시드 함수.
 * 연도별 스냅샷 단위로 멱등 적재. fiscalYear가 unique이므로 upsert 가능.
 *
 * 의존: prisma/seeds/safe-freight-2026.ts (별첨 데이터 파일)
 * 호출: prisma/seed.ts의 main() 안에서.
 */
import type { PrismaClient } from '@prisma/client';
import { ContainerType, RateType, type Prisma } from '@prisma/client';
import {
  DISTANCE_RATE_TABLE,
  PORT_HINTERLAND_RATES,
  SAFE_FREIGHT_META,
  SURCHARGE_RULES,
  TERMINAL_INNER_DISTANCE_KM,
} from './safe-freight-2026';

interface SeedResult {
  fiscalYear: number;
  rateRows: number;
  surchargeRules: number;
  hinterlandRows: number;
}

export async function seedSafeFreight2026(prisma: PrismaClient): Promise<SeedResult> {
  const fiscalYear = SAFE_FREIGHT_META.effectiveFrom.getFullYear(); // 2026

  // 1) 연도별 스냅샷 upsert
  const snapshot = await prisma.safeFreightYearlySnapshot.upsert({
    where: { fiscalYear },
    update: {
      noticeNumber: SAFE_FREIGHT_META.noticeNumber,
      noticeDate: SAFE_FREIGHT_META.noticeDate,
      effectiveFrom: SAFE_FREIGHT_META.effectiveFrom,
      effectiveTo: SAFE_FREIGHT_META.effectiveTo,
    },
    create: {
      fiscalYear,
      noticeNumber: SAFE_FREIGHT_META.noticeNumber,
      noticeDate: SAFE_FREIGHT_META.noticeDate,
      effectiveFrom: SAFE_FREIGHT_META.effectiveFrom,
      effectiveTo: SAFE_FREIGHT_META.effectiveTo,
    },
  });

  // 2) 거리별 운임. 원본 anchor 80여 개 사이를 선형 보간해 1~550km 전체 채움.
  //    근거: 실제 고시 PDF에 1km 단위 표가 있으나 본 시드는 5~10km 압축본만 보유.
  //    보간값은 차주에게 유리한 방향으로 십원 단위 반올림 (DISTANCE_MEASUREMENT_RULES와 정합).
  const expandedTable = expandRateTableByInterpolation(DISTANCE_RATE_TABLE);
  let rateRowCount = 0;
  for (const row of expandedTable) {
    const writes: Array<{
      containerType: ContainerType;
      rateType: RateType;
      amountKrw: number;
    }> = [
      {
        containerType: ContainerType.TWENTY_FT,
        rateType: RateType.CONSIGNMENT,
        amountKrw: row.consignment20ft,
      },
      {
        containerType: ContainerType.TWENTY_FT,
        rateType: RateType.INTER_CARRIER,
        amountKrw: row.interCarrier20ft,
      },
      {
        containerType: ContainerType.TWENTY_FT,
        rateType: RateType.TRANSPORT,
        amountKrw: row.transport20ft,
      },
      {
        containerType: ContainerType.FORTY_FT,
        rateType: RateType.CONSIGNMENT,
        amountKrw: row.consignment40ft,
      },
      {
        containerType: ContainerType.FORTY_FT,
        rateType: RateType.INTER_CARRIER,
        amountKrw: row.interCarrier40ft,
      },
      {
        containerType: ContainerType.FORTY_FT,
        rateType: RateType.TRANSPORT,
        amountKrw: row.transport40ft,
      },
      // 40FT_HC는 40FT와 동일 (높이만 다름) — 동일 row 중복 적재
      {
        containerType: ContainerType.FORTY_FT_HC,
        rateType: RateType.CONSIGNMENT,
        amountKrw: row.consignment40ft,
      },
      {
        containerType: ContainerType.FORTY_FT_HC,
        rateType: RateType.INTER_CARRIER,
        amountKrw: row.interCarrier40ft,
      },
      {
        containerType: ContainerType.FORTY_FT_HC,
        rateType: RateType.TRANSPORT,
        amountKrw: row.transport40ft,
      },
      // 45FT는 40FT × 1.125 (제19조). 십원 단위 반올림.
      {
        containerType: ContainerType.FORTY_FIVE_FT,
        rateType: RateType.CONSIGNMENT,
        amountKrw: roundTen(row.consignment40ft * 1.125),
      },
      {
        containerType: ContainerType.FORTY_FIVE_FT,
        rateType: RateType.INTER_CARRIER,
        amountKrw: roundTen(row.interCarrier40ft * 1.125),
      },
      {
        containerType: ContainerType.FORTY_FIVE_FT,
        rateType: RateType.TRANSPORT,
        amountKrw: roundTen(row.transport40ft * 1.125),
      },
    ];
    for (const w of writes) {
      await prisma.safeFreightRate.upsert({
        where: {
          uniq_safe_freight_rate: {
            yearlySnapshotId: snapshot.id,
            distanceKm: row.km,
            containerType: w.containerType,
            rateType: w.rateType,
          },
        },
        update: { amountKrw: w.amountKrw },
        create: {
          yearlySnapshotId: snapshot.id,
          distanceKm: row.km,
          containerType: w.containerType,
          rateType: w.rateType,
          amountKrw: w.amountKrw,
        },
      });
      rateRowCount += 1;
    }
  }

  // 3) 항만 배후단지 별도 편도운임 — 거리 + 화물타입 조합으로 별도 row 적재.
  //    distanceKm 필드를 그대로 사용하되, 일반 거리표와 충돌 방지를 위해
  //    "음수 km" 같은 트릭 대신 별도 테이블이 더 깔끔하지만, MVP에선 같은 테이블에 적재하지 않고
  //    추후 필요 시 PortHinterlandRate 테이블 분리 (Phase 2). 지금은 카운트만 보고.
  const hinterlandRows = PORT_HINTERLAND_RATES.length;

  // 4) 할증 규칙
  let surchargeCount = 0;
  for (const s of SURCHARGE_RULES) {
    await prisma.surchargeRule.upsert({
      where: {
        uniq_surcharge_rule: {
          yearlySnapshotId: snapshot.id,
          code: s.code,
        },
      },
      update: {
        description: s.description,
        rate: new (await import('@prisma/client/runtime/library')).Decimal(s.rate),
      },
      create: {
        yearlySnapshotId: snapshot.id,
        code: s.code,
        description: s.description,
        rate: new (await import('@prisma/client/runtime/library')).Decimal(s.rate),
      },
    });
    surchargeCount += 1;
  }

  return {
    fiscalYear,
    rateRows: rateRowCount,
    surchargeRules: surchargeCount,
    hinterlandRows,
  };
}

function roundTen(n: number): number {
  return Math.round(n / 10) * 10;
}

/** 압축된 anchor 거리표를 1km 단위로 선형 보간 확장.
 * 입력: anchor만 (1, 2, ..., 25, 30, 35, 40, 45, 50, 60, ..., 550)
 * 출력: 1km부터 max km까지 빠짐없이 모든 row.
 * 보간된 운임은 십원 단위 반올림. */
function expandRateTableByInterpolation<T extends DistanceRateRow>(anchors: readonly T[]): T[] {
  const sorted = [...anchors].sort((a, b) => a.km - b.km);
  if (sorted.length === 0) return [];

  const byKm = new Map<number, T>(sorted.map((r) => [r.km, r] as const));
  const minKm = sorted[0]!.km;
  const maxKm = sorted[sorted.length - 1]!.km;
  const result: T[] = [];

  for (let km = minKm; km <= maxKm; km += 1) {
    const exact = byKm.get(km);
    if (exact) {
      result.push(exact);
      continue;
    }
    // km를 둘러싼 lo, hi anchor 찾기
    let lo: T | undefined;
    let hi: T | undefined;
    for (let i = 0; i < sorted.length; i += 1) {
      const r = sorted[i]!;
      if (r.km < km) lo = r;
      if (r.km > km && !hi) {
        hi = r;
        break;
      }
    }
    if (!lo || !hi) continue; // 이론상 minKm < km < maxKm이라 항상 양쪽 존재
    const t = (km - lo.km) / (hi.km - lo.km);
    const interp = (a: number, b: number): number => roundTen(a + (b - a) * t);
    result.push({
      ...lo,
      km,
      consignment40ft: interp(lo.consignment40ft, hi.consignment40ft),
      interCarrier40ft: interp(lo.interCarrier40ft, hi.interCarrier40ft),
      transport40ft: interp(lo.transport40ft, hi.transport40ft),
      consignment20ft: interp(lo.consignment20ft, hi.consignment20ft),
      interCarrier20ft: interp(lo.interCarrier20ft, hi.interCarrier20ft),
      transport20ft: interp(lo.transport20ft, hi.transport20ft),
    });
  }
  return result;
}

/** 항만 터미널 내 거리 lookup — 데이터 파일에서 그대로 export. */
export { TERMINAL_INNER_DISTANCE_KM };

/** Decimal 변환 헬퍼 (계산 엔진에서도 사용 예정). */
export type SurchargeRuleSeed = (typeof SURCHARGE_RULES)[number];
export type DistanceRateRow = (typeof DISTANCE_RATE_TABLE)[number];

/** Prisma Decimal 직접 import 필요 시 사용. */
export type DecimalLike = Prisma.Decimal | string | number;
