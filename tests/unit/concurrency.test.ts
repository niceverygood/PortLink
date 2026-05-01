// @vitest-environment node
/**
 * 동시성 테스트 — DispatchAssign partial unique index 검증.
 *
 * 두 차주가 동일 OPEN 배차에 동시에 INSERT를 시도할 때
 * 한 명만 성공하고 나머지는 P2002로 실패해야 한다.
 *
 * 시드 데이터를 더럽히지 않도록 테스트용 임시 배차 1건을 별도 생성/정리.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ContainerType, DispatchOrderStatus, PortCode, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORDER_NO = 'TEST-CONCUR-0001';

async function ensureOrder() {
  const forwarder = await prisma.user.findUnique({ where: { phone: '010-1000-0001' } });
  if (!forwarder) throw new Error('seed forwarder missing — run npm run seed');

  return prisma.dispatchOrder.upsert({
    where: { orderNo: ORDER_NO },
    update: { status: DispatchOrderStatus.OPEN },
    create: {
      orderNo: ORDER_NO,
      forwarderUserId: forwarder.id,
      originRegion: '경기 평택',
      originAddress: '동시성 테스트용 임시',
      port: PortCode.BUSAN,
      containerType: ContainerType.FORTY_FT,
      pickupAt: new Date(Date.now() + 24 * 3600_000),
      fare: 750_000,
      status: DispatchOrderStatus.OPEN,
    },
  });
}

beforeEach(async () => {
  // 이전 시도 정리
  const order = await prisma.dispatchOrder.findUnique({ where: { orderNo: ORDER_NO } });
  if (order) {
    await prisma.dispatchAssign.deleteMany({ where: { dispatchOrderId: order.id } });
  }
});

afterAll(async () => {
  const order = await prisma.dispatchOrder.findUnique({ where: { orderNo: ORDER_NO } });
  if (order) {
    await prisma.dispatchAssign.deleteMany({ where: { dispatchOrderId: order.id } });
    await prisma.dispatchOrder.delete({ where: { id: order.id } });
  }
  await prisma.$disconnect();
});

describe('DispatchAssign 동시성', () => {
  it('두 차주가 동시 INSERT → 1명만 성공, 1명 P2002', async () => {
    const order = await ensureOrder();
    const [d1, d2] = await Promise.all([
      prisma.truckDriver.findUnique({ where: { driverCode: 'D-0001' } }),
      prisma.truckDriver.findUnique({ where: { driverCode: 'D-0002' } }),
    ]);
    expect(d1 && d2).toBeTruthy();

    const results = await Promise.allSettled([
      prisma.dispatchAssign.create({ data: { dispatchOrderId: order.id, driverId: d1!.id } }),
      prisma.dispatchAssign.create({ data: { dispatchOrderId: order.id, driverId: d2!.id } }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const reason = (rejected[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((reason as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
  });

  it('취소된 배정 후 재배정 가능 (partial unique이라)', async () => {
    const order = await ensureOrder();
    const d1 = await prisma.truckDriver.findUnique({ where: { driverCode: 'D-0001' } });
    const d2 = await prisma.truckDriver.findUnique({ where: { driverCode: 'D-0002' } });

    const first = await prisma.dispatchAssign.create({
      data: { dispatchOrderId: order.id, driverId: d1!.id },
    });

    // d2가 곧바로 시도하면 충돌
    await expect(
      prisma.dispatchAssign.create({ data: { dispatchOrderId: order.id, driverId: d2!.id } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    // d1이 취소(cancelledAt 세팅) 후엔 d2가 새로 배정 가능
    await prisma.dispatchAssign.update({
      where: { id: first.id },
      data: { cancelledAt: new Date() },
    });

    const second = await prisma.dispatchAssign.create({
      data: { dispatchOrderId: order.id, driverId: d2!.id },
    });
    expect(second).toBeDefined();
  });
});
