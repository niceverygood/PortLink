/**
 * 안전운임 청구서 / 신고서 PDF 생성에 필요한 공통 데이터 빌더.
 * - 청구서: 화주에게 보내는 안전운송운임 기준 청구
 * - 신고서: 차주가 미지급 신고할 때 사용. 약정 < 법정 차액 + 면책 문구 포함.
 *
 * 이 파일은 PDF 라이브러리 의존 없이 순수 데이터만 빌드.
 * 실제 PDF 렌더링은 7번/8번에서 @react-pdf/renderer로 처리.
 */
import { DispatchOrderStatus, NotificationType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { calculateSafeFreight } from '@/lib/safe-freight/calculator';
import type { TERMINAL_INNER_DISTANCE_KM } from '../../../prisma/seeds/safe-freight-2026';

type PortKey = keyof typeof TERMINAL_INNER_DISTANCE_KM;

/** PortCode → calculator의 TERMINAL_INNER_DISTANCE_KM 키 매핑. */
const PORT_TO_TERMINAL_KEY: Record<string, PortKey> = {
  BUSAN: 'BUSAN_OLD_PORT',
  BUSAN_NEW: 'BUSAN_NEW_PORT',
  INCHEON: 'INCHEON_PORT',
  GWANGYANG: 'GWANGYANG_PORT',
  PYEONGTAEK: 'PYEONGTAEK_PORT',
};

export interface InvoiceData {
  dispatchOrder: {
    id: string;
    orderNo: string;
    originRegion: string;
    originAddress: string;
    port: string;
    containerType: string;
    containerNo: string | null;
    pickupAt: Date;
    fare: number; // 약정 운임 (DispatchOrder.fare)
  };
  forwarder: {
    companyName: string;
    representative: string;
  };
  driver?: {
    name: string;
    code: string;
    plateNo: string;
  };
  /** 안전운임 v2 계산 결과 (이 배차에 대해 실시간 계산). */
  safeFreight: {
    distanceKm: number;
    finalConsignmentRateKrw: number; // 차주 수령액 법정 최저
    finalTransportRateKrw: number; // 화주 청구액 법정 최저
    surchargeAmountKrw: number;
    waitingFeeKrw: number;
    appliedSurcharges: { code: string; rate: number; description?: string }[];
    snapshotMeta: {
      noticeNumber: string;
      effectiveFrom: Date;
      effectiveTo: Date;
    };
  };
  /** 약정 vs 법정 차액 (미지급 신고용). 양수면 부족액. */
  shortfallKrw: number;
  generatedAt: Date;
}

export type BuildInvoiceError =
  | 'NOT_FOUND'
  | 'NOT_COMPLETED'
  | 'CALC_FAILED'
  | 'NO_PORT'
  | 'NO_DRIVER';

/** dispatchOrderId 기준으로 청구서/신고서 공통 데이터를 빌드.
 * 실패 사유는 호출자가 분기. */
export async function buildInvoiceData(opts: {
  dispatchOrderId: string;
  /** 신고서일 땐 distanceKm 사용자 입력으로 override 가능. 없으면 임시 추정. */
  overrideDistanceKm?: number;
}): Promise<{ ok: true; data: InvoiceData } | { ok: false; error: BuildInvoiceError }> {
  const order = await prisma.dispatchOrder.findUnique({
    where: { id: opts.dispatchOrderId },
    include: {
      forwarder: { include: { forwarder: true } },
      trip: { include: { driver: { include: { user: true } }, vehicle: true } },
    },
  });
  if (!order) return { ok: false, error: 'NOT_FOUND' };

  const portKey = PORT_TO_TERMINAL_KEY[order.port];
  if (!portKey) return { ok: false, error: 'NO_PORT' };

  // 거리: override 우선, 없으면 데모용 임시값. 정식 운영에선 네이버지도 결과를 DispatchOrder에 저장.
  const distanceKm =
    opts.overrideDistanceKm ?? estimateDistanceForDemo(order.port, order.originRegion);

  const calc = calculateSafeFreight({
    originDistanceKm: distanceKm,
    originPortCode: portKey,
    containerType:
      order.containerType === 'FORTY_FT_HC'
        ? 'FORTY_FT'
        : (order.containerType as 'TWENTY_FT' | 'FORTY_FT' | 'FORTY_FIVE_FT'),
    shipmentDate: order.pickupAt,
  });
  if (!calc.ok) return { ok: false, error: 'CALC_FAILED' };

  const driverInfo =
    order.trip && order.trip.driver
      ? {
          name: order.trip.driver.user.name,
          code: order.trip.driver.driverCode,
          plateNo: order.trip.vehicle?.plateNo ?? '',
        }
      : undefined;

  return {
    ok: true,
    data: {
      dispatchOrder: {
        id: order.id,
        orderNo: order.orderNo,
        originRegion: order.originRegion,
        originAddress: order.originAddress,
        port: order.port,
        containerType: order.containerType,
        containerNo: order.containerNo,
        pickupAt: order.pickupAt,
        fare: order.fare,
      },
      forwarder: {
        companyName: order.forwarder.forwarder?.companyName ?? order.forwarder.name,
        representative: order.forwarder.forwarder?.representative ?? '',
      },
      driver: driverInfo,
      safeFreight: {
        distanceKm: calc.value.breakdown.distanceKm,
        finalConsignmentRateKrw: calc.value.finalConsignmentRate,
        finalTransportRateKrw: calc.value.finalTransportRate,
        surchargeAmountKrw: calc.value.breakdown.surchargeAmount,
        waitingFeeKrw: calc.value.breakdown.waitingFee,
        appliedSurcharges: calc.value.breakdown.appliedSurcharges,
        snapshotMeta: {
          noticeNumber: calc.value.ruleVersionSnapshot.noticeNumber,
          effectiveFrom: calc.value.ruleVersionSnapshot.effectiveFrom,
          effectiveTo: calc.value.ruleVersionSnapshot.effectiveTo,
        },
      },
      shortfallKrw: Math.max(0, calc.value.finalConsignmentRate - order.fare),
      generatedAt: new Date(),
    },
  };
}

/** 데모/MVP용 거리 추정. 정식엔 네이버지도 결과 DB 저장. */
function estimateDistanceForDemo(port: string, originRegion: string): number {
  // 매우 거친 추정. 사용자 거리 입력을 받는 것이 베스트.
  const fallback: Record<string, number> = {
    부산항: 400,
    부산신항: 410,
    인천항: 50,
    평택항: 80,
    광양항: 350,
  };
  // originRegion에서 도시 이름 부분 추출
  for (const [city, km] of Object.entries(fallback)) {
    if (originRegion.includes(city)) return km;
  }
  return 200;
}

export { NotificationType, DispatchOrderStatus };
