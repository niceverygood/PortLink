// @vitest-environment node
/**
 * 이상 거래 룰 — 시드 + 임시 데이터로 검증.
 * 시드는 항상 깨끗(0 위반)이라는 가정. 임시 데이터 후 잘 정리.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ContainerType, DispatchOrderStatus, PortCode, PrismaClient } from '@prisma/client';
import {
  findDriverCancelAbuse,
  findDuplicateAddress,
  findFareViolations,
  findOtpAbuse,
} from '@/lib/anomaly';

const prisma = new PrismaClient();
const TEST_PHONE = '010-9999-0001';
const TEST_ORDER_PREFIX = 'ANOM-TEST-';

async function cleanup() {
  await prisma.otpCode.deleteMany({ where: { phone: TEST_PHONE } });
  const orders = await prisma.dispatchOrder.findMany({
    where: { orderNo: { startsWith: TEST_ORDER_PREFIX } },
  });
  if (orders.length) {
    await prisma.dispatchAssign.deleteMany({
      where: { dispatchOrderId: { in: orders.map((o) => o.id) } },
    });
    await prisma.dispatchOrder.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  }
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe('Rule 1 — 안전운임 한도 위반', () => {
  it('정상 운임은 탐지 안 됨', async () => {
    const before = await findFareViolations();
    const cnt = before.length;
    // 시드는 모두 750_000 이상 (한도 90% = 675_000 이상). 위반 없음 가정.
    expect(cnt).toBe(0);
  });

  it('한도 미만 운임 등록 시 탐지', async () => {
    const forwarder = await prisma.user.findUnique({ where: { phone: '010-1000-0001' } });
    expect(forwarder).toBeTruthy();
    // 경기 평택 → 부산항 40FT 안전운임 = 750_000. 한도 90% = 675_000.
    // 600_000(한도 미만)으로 위반 케이스 생성. CHECK 제약 위반은 fare<=0만 거부 — 위반 등록은 가능.
    const order = await prisma.dispatchOrder.create({
      data: {
        orderNo: `${TEST_ORDER_PREFIX}0001`,
        forwarderUserId: forwarder!.id,
        originRegion: '경기 평택',
        originAddress: '룰1 테스트',
        port: PortCode.BUSAN,
        containerType: ContainerType.FORTY_FT,
        pickupAt: new Date(Date.now() + 24 * 3600_000),
        fare: 600_000,
        status: DispatchOrderStatus.OPEN,
      },
    });

    const violations = await findFareViolations();
    const found = violations.find((v) => v.orderId === order.id);
    expect(found).toBeDefined();
    expect(found?.shortfall).toBeGreaterThan(0);
    expect(found?.safeRateBaseFare).toBe(750_000);
  });
});

describe('Rule 3 — OTP 1h 10회+', () => {
  it('threshold 미만은 탐지 안 됨', async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.otpCode.create({
        data: { phone: TEST_PHONE, code: '111111', expiresAt: new Date(Date.now() + 60_000) },
      });
    }
    const items = await findOtpAbuse(10);
    expect(items.find((i) => i.phone === TEST_PHONE)).toBeUndefined();
  });

  it('10회+ 요청 시 탐지', async () => {
    for (let i = 0; i < 10; i++) {
      await prisma.otpCode.create({
        data: { phone: TEST_PHONE, code: '222222', expiresAt: new Date(Date.now() + 60_000) },
      });
    }
    const items = await findOtpAbuse(10);
    const found = items.find((i) => i.phone === TEST_PHONE);
    expect(found).toBeDefined();
    expect(found?.count).toBeGreaterThanOrEqual(10);
  });
});

describe('Rule 4 — 동일 originAddress 5건+', () => {
  it('5건+ 등록 시 탐지', async () => {
    const forwarder = await prisma.user.findUnique({ where: { phone: '010-1000-0001' } });
    const ADDR = `${TEST_ORDER_PREFIX}-DUP-ADDR`;
    for (let i = 0; i < 5; i++) {
      await prisma.dispatchOrder.create({
        data: {
          orderNo: `${TEST_ORDER_PREFIX}DUP${String(i).padStart(3, '0')}`,
          forwarderUserId: forwarder!.id,
          originRegion: '경기 평택',
          originAddress: ADDR,
          port: PortCode.BUSAN,
          containerType: ContainerType.FORTY_FT,
          pickupAt: new Date(Date.now() + 24 * 3600_000),
          fare: 750_000,
          status: DispatchOrderStatus.OPEN,
        },
      });
    }

    const items = await findDuplicateAddress(5);
    const found = items.find((i) => i.originAddress === ADDR);
    expect(found).toBeDefined();
    expect(found?.count).toBe(5);
  });
});

describe('Rule 2 — 차주별 24h 취소 3건+', () => {
  it('threshold 미만은 탐지 안 됨', async () => {
    const items = await findDriverCancelAbuse(3);
    // 시드 차주들은 cancelled assign 없음
    expect(items).toEqual([]);
  });
});
