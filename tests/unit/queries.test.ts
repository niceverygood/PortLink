// @vitest-environment node
/**
 * Stage 1 DoD: 시드 데이터로 기본 쿼리 동작.
 *
 * - 가용 배차 조회 (차주 화면 메인 쿼리)
 * - 진행중 운송 조회 (차주 화면 진행중 탭 쿼리)
 * - 안전운임 조회 (포워더 배차 등록 시 자동 표시)
 *
 * 주의: 시드 실행이 선행되어 있다고 가정.
 */
import { describe, expect, it, afterAll } from 'vitest';
import {
  PrismaClient,
  ContainerType,
  PortCode,
  DispatchOrderStatus,
  TripStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('가용 배차 조회', () => {
  it('OPEN 상태 배차만 차주에게 노출 (시드 #1)', async () => {
    const open = await prisma.dispatchOrder.findMany({
      where: { status: DispatchOrderStatus.OPEN },
    });
    expect(open.length).toBeGreaterThanOrEqual(1);
    const seeded = open.find((o) => o.orderNo === 'D26-0001');
    expect(seeded).toBeDefined();
    expect(seeded?.fare).toBe(750_000);
  });
});

describe('진행중 운송 조회', () => {
  it('차주 D-0002의 IN_TRANSIT trip 1건 (시드 #2)', async () => {
    const driver = await prisma.truckDriver.findUnique({ where: { driverCode: 'D-0002' } });
    expect(driver).toBeDefined();
    const trips = await prisma.trip.findMany({
      where: {
        driverId: driver!.id,
        status: {
          in: [TripStatus.DEPARTED, TripStatus.LOADED, TripStatus.IN_TRANSIT, TripStatus.UNLOADED],
        },
      },
      include: { dispatchOrder: true },
    });
    expect(trips).toHaveLength(1);
    expect(trips[0]?.status).toBe(TripStatus.IN_TRANSIT);
    expect(trips[0]?.dispatchOrder.orderNo).toBe('D26-0002');
  });
});

describe('안전운임 조회', () => {
  it('경기 평택 → 부산항 40FT 운임 마스터 존재', async () => {
    const rate = await prisma.safeRate.findFirst({
      where: {
        originRegion: '경기 평택',
        port: PortCode.BUSAN,
        containerType: ContainerType.FORTY_FT,
      },
    });
    expect(rate).toBeDefined();
    expect(rate!.baseFare).toBeGreaterThan(0);
    expect(rate!.baseFare % 10_000).toBe(0); // 만원 단위
  });

  it('총 450건 (지역 30 × 항만 5 × 차종 3)', async () => {
    const count = await prisma.safeRate.count();
    expect(count).toBe(450);
  });
});

describe('정산 무결성', () => {
  it('완료 배차 #3의 정산: fare = driverPayout + platformFee', async () => {
    const order = await prisma.dispatchOrder.findUnique({
      where: { orderNo: 'D26-0003' },
      include: { trip: { include: { settlement: true } } },
    });
    expect(order?.trip?.settlement).toBeDefined();
    const s = order!.trip!.settlement!;
    expect(s.driverPayout + s.platformFee).toBe(s.fare);
    // 시드는 5% 수수료
    expect(s.platformFee).toBe(Math.round(s.fare * 0.05));
  });
});
