/**
 * /api/dispatch-orders
 *
 * POST  포워더 배차 등록 (안전운임 한도 검증 + AuditLog CREATE)
 * GET   역할별 필터:
 *   DRIVER     → status=OPEN, 본인 차량 차종 매칭, pickup 가까운 순
 *   FORWARDER  → 본인 의뢰만, 모든 status
 *   ADMIN      → 전체
 */
import { z } from 'zod';
import {
  AuditAction,
  ContainerType,
  DispatchOrderStatus,
  PortCode,
  Prisma,
  UserRole,
} from '@prisma/client';
import { jsonErr, jsonOk, parseBody, requireRole } from '@/lib/api';
import { prisma } from '@/lib/db';
import { getSafeRate } from '@/lib/safe-rate';
import { validateFareWithinLimit } from '@/lib/settlements';
import { generateOrderNo } from '@/lib/dispatch-orders';

const CreateBody = z.object({
  originRegion: z.string().min(1, '출발 시군구 필요'),
  originAddress: z.string().min(1, '상세 주소 필요'),
  port: z.nativeEnum(PortCode),
  containerType: z.nativeEnum(ContainerType),
  containerNo: z.string().optional(),
  pickupAt: z.string().datetime({ offset: true, message: 'pickupAt은 ISO datetime' }),
  fare: z.number().int().positive('운임은 양의 정수'),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const authR = await requireRole([UserRole.FORWARDER]);
  if (!authR.ok) return authR.response;

  const bodyR = await parseBody(req, CreateBody);
  if (!bodyR.ok) return bodyR.response;
  const input = bodyR.data;
  const pickupAt = new Date(input.pickupAt);

  // 안전운임 마스터 조회 + 한도 검증
  const safeRate = await getSafeRate({
    originRegion: input.originRegion,
    port: input.port,
    containerType: input.containerType,
  });
  const validation = validateFareWithinLimit(input.fare, safeRate?.baseFare ?? null);
  if (!validation.ok) {
    if (validation.error === 'BELOW_LEGAL_MIN') {
      return jsonErr(
        'BELOW_LEGAL_MIN',
        `안전운임 한도(${safeRate?.baseFare?.toLocaleString('ko-KR')}원의 90%) 미만으로 등록할 수 없습니다`,
      );
    }
    return jsonErr('INVALID_FARE', '운임 형식이 올바르지 않습니다');
  }

  // orderNo 생성 + INSERT (race 시 P2002 한 번만 retry)
  const create = async () => {
    const orderNo = await generateOrderNo();
    return prisma.dispatchOrder.create({
      data: {
        orderNo,
        forwarderUserId: authR.session.user.id,
        originRegion: input.originRegion,
        originAddress: input.originAddress,
        port: input.port,
        containerType: input.containerType,
        containerNo: input.containerNo,
        pickupAt,
        fare: input.fare,
        notes: input.notes,
        status: DispatchOrderStatus.OPEN,
      },
    });
  };

  let order;
  try {
    order = await create();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      order = await create();
    } else {
      throw e;
    }
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: authR.session.user.id,
      entity: 'DispatchOrder',
      entityId: order.id,
      action: AuditAction.CREATE,
      after: { orderNo: order.orderNo, fare: order.fare, status: order.status },
    },
  });

  return jsonOk(order, 201);
}

const ListQuery = z.object({
  status: z.nativeEnum(DispatchOrderStatus).optional(),
  port: z.nativeEnum(PortCode).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: Request) {
  const authR = await requireRole([UserRole.DRIVER, UserRole.FORWARDER, UserRole.ADMIN]);
  if (!authR.ok) return authR.response;

  const url = new URL(req.url);
  const queryParse = ListQuery.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!queryParse.success) {
    return jsonErr('INVALID_QUERY', queryParse.error.issues[0]?.message ?? '잘못된 쿼리');
  }
  const { status, port, take } = queryParse.data;

  const role = authR.session.user.role;
  const userId = authR.session.user.id;

  const where: Prisma.DispatchOrderWhereInput = {};
  if (port) where.port = port;

  if (role === UserRole.DRIVER) {
    where.status = DispatchOrderStatus.OPEN;
    // 차주 차량의 차종으로 필터링
    const vehicles = await prisma.vehicle.findMany({
      where: { driver: { userId }, isActive: true },
      select: { type: true },
    });
    const types = Array.from(new Set(vehicles.map((v) => v.type)));
    if (types.length > 0) where.containerType = { in: types };
  } else if (role === UserRole.FORWARDER) {
    where.forwarderUserId = userId;
    if (status) where.status = status;
  } else {
    if (status) where.status = status;
  }

  const orders = await prisma.dispatchOrder.findMany({
    where,
    orderBy: { pickupAt: 'asc' },
    take,
  });

  return jsonOk(orders);
}
