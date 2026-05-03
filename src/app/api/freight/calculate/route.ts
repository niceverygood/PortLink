/**
 * POST /api/freight/calculate
 *
 * 안전운임 자동 계산 — 비회원도 호출 가능 (랜딩의 공개 계산기 사용).
 * 단, 운수사업자 간 운임(INTER_CARRIER)은 admin/carrier 역할만 응답에 노출 (§5 RBAC).
 *
 * Body: CalculationInput JSON (shipmentDate는 ISO string)
 * Response: ApiResult<CalculationOutput> (INTER_CARRIER 필드는 권한 없으면 0)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk } from '@/lib/result';
import { calculateSafeFreight } from '@/lib/safe-freight/calculator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SurchargeSchema = z.object({
  code: z.string().min(1),
  rate: z.number().min(0).max(3),
  description: z.string().optional(),
});

const InputSchema = z.object({
  originDistanceKm: z.number().int().positive(),
  originPortCode: z.string().optional(),
  containerType: z.enum(['TWENTY_FT', 'FORTY_FT', 'FORTY_FIVE_FT']),
  surcharges: z.array(SurchargeSchema).optional(),
  waitingMinutesAtPort: z.number().int().nonnegative().optional(),
  waitingMinutesAtFactory: z.number().int().nonnegative().optional(),
  emptyReturnKm: z.number().int().nonnegative().optional(),
  shipmentDate: z.string().datetime(),
  isRoundTrip: z.boolean().optional(),
  inchconReturn: z.boolean().optional(),
  cargoWeightTon: z.number().nonnegative().optional(),
  isPTA: z.boolean().optional(),
});

const PORT_CODE_KEYS = new Set([
  'BUSAN_OLD_PORT',
  'BUSAN_NEW_PORT',
  'INCHEON_PORT',
  'INCHEON_NEW_PORT',
  'INCHEON_PASSENGER',
  'GWANGYANG_PORT',
  'PYEONGTAEK_PORT',
  'ULSAN_OLD_PORT',
  'ULSAN_NEW_PORT',
  'POHANG_PORT',
  'GUNSAN_PORT',
  'MASAN_PORT',
  'DAESAN_PORT',
  'UIWANG_ICD',
]);

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(apiErr('INVALID_JSON', 'JSON body 파싱 실패'), { status: 400 });
  }

  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(apiErr('INVALID_INPUT', parsed.error.message), { status: 400 });
  }
  const input = parsed.data;

  // originPortCode는 calculator의 TERMINAL_INNER_DISTANCE_KM 키와 정합 필요.
  if (input.originPortCode && !PORT_CODE_KEYS.has(input.originPortCode)) {
    return NextResponse.json(
      apiErr('INVALID_PORT_CODE', `지원하지 않는 항만 코드: ${input.originPortCode}`),
      { status: 400 },
    );
  }

  const r = calculateSafeFreight({
    originDistanceKm: input.originDistanceKm,
    originPortCode: input.originPortCode as Parameters<
      typeof calculateSafeFreight
    >[0]['originPortCode'],
    containerType: input.containerType,
    surcharges: input.surcharges,
    waitingMinutesAtPort: input.waitingMinutesAtPort,
    waitingMinutesAtFactory: input.waitingMinutesAtFactory,
    emptyReturnKm: input.emptyReturnKm,
    shipmentDate: new Date(input.shipmentDate),
    isRoundTrip: input.isRoundTrip,
    inchconReturn: input.inchconReturn,
    cargoWeightTon: input.cargoWeightTon,
    isPTA: input.isPTA,
  });

  if (!r.ok) {
    const status = r.error === 'OUT_OF_EFFECTIVE_PERIOD' ? 410 : 400;
    return NextResponse.json(apiErr(r.error, errorMessage(r.error)), { status });
  }

  // INTER_CARRIER는 admin/carrier만 노출 (§5 RBAC).
  const session = await auth();
  const role = session?.user?.role;
  const canSeeInterCarrier = role === UserRole.ADMIN || role === UserRole.CARRIER;
  const value = canSeeInterCarrier
    ? r.value
    : {
        ...r.value,
        finalInterCarrierRate: 0,
        breakdown: { ...r.value.breakdown, baseInterCarrier: 0 },
      };

  return NextResponse.json(apiOk(value), { status: 200 });
}

function errorMessage(code: string): string {
  switch (code) {
    case 'OUT_OF_EFFECTIVE_PERIOD':
      return '시행 기간 외 일자입니다 (2026-02-01 ~ 2026-12-31).';
    case 'DISTANCE_OUT_OF_RANGE':
      return '운임표 범위 초과 (최대 550km).';
    case 'INVALID_INPUT':
      return '입력값이 올바르지 않습니다.';
    default:
      return '계산 실패';
  }
}
