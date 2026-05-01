/**
 * PortLink 시드 — Stage 1.
 * 멱등(idempotent): upsert 기반으로 여러 번 실행 가능.
 *
 * 구성:
 *  1. 안전운임 마스터 450건 (지역 30 × 차종 3 × 항만 5)
 *  2. 사용자 8명 (차주 5, 포워더 1, 운송사 1, 관리자 1)
 *  3. 차량 5대
 *  4. 샘플 배차 3건 (OPEN / ASSIGNED+IN_TRANSIT / COMPLETED+Settlement)
 *
 * 비밀번호는 Stage 2(NextAuth)에서 설정. 시드 사용자는 passwordHash NULL.
 */
import {
  PrismaClient,
  UserRole,
  UserStatus,
  ContainerType,
  PortCode,
  DispatchOrderStatus,
  TripStatus,
  SettlementStatus,
} from '@prisma/client';
import { CONTAINER_TYPE_COEFFICIENT, REGIONS } from '../src/config/regions';
import { BUSINESS_RULES } from '../src/config/business-rules';
import { CONTAINER_TYPE_TO_WIRE } from '../src/lib/prisma-enums';
import { hashPassword } from '../src/lib/auth/passwords';

const prisma = new PrismaClient();

const PORT_CODES = [
  PortCode.BUSAN,
  PortCode.BUSAN_NEW,
  PortCode.INCHEON,
  PortCode.GWANGYANG,
  PortCode.PYEONGTAEK,
] as const;

const CONTAINER_TYPES = [
  ContainerType.TWENTY_FT,
  ContainerType.FORTY_FT,
  ContainerType.FORTY_FT_HC,
] as const;

/** 운임을 차종 계수로 환산 후 만원 단위 라운딩. */
function fareFor(baseFare40FT: number, type: ContainerType): number {
  const wire = CONTAINER_TYPE_TO_WIRE[type];
  const coef = CONTAINER_TYPE_COEFFICIENT[wire];
  const raw = Math.round(baseFare40FT * coef);
  // 1만원 단위 라운딩
  return Math.round(raw / 10_000) * 10_000;
}

async function seedSafeRates() {
  let count = 0;
  for (const region of REGIONS) {
    for (const port of PORT_CODES) {
      const baseFare40FT = region.baseFareToPort[port];
      for (const type of CONTAINER_TYPES) {
        const fare = fareFor(baseFare40FT, type);
        await prisma.safeRate.upsert({
          where: {
            uniq_safe_rate: {
              originRegion: region.name,
              port,
              containerType: type,
              effectiveFrom: new Date('2026-01-01T00:00:00Z'),
            },
          },
          update: { baseFare: fare },
          create: {
            originRegion: region.name,
            port,
            containerType: type,
            baseFare: fare,
            effectiveFrom: new Date('2026-01-01T00:00:00Z'),
          },
        });
        count += 1;
      }
    }
  }
  return count;
}

async function seedUsersAndProfiles() {
  // 이메일 사용자(관리자/포워더/운송사)에게는 시드 비밀번호를 해싱해 박는다.
  // 차주는 OTP 로그인이라 passwordHash NULL 유지.
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) {
    throw new Error('SEED_PASSWORD 환경변수가 비어 있음. .env.example 참조.');
  }
  const seedPasswordHash = await hashPassword(seedPassword);

  // 1. 관리자
  const admin = await prisma.user.upsert({
    where: { phone: '010-0000-0001' },
    update: { passwordHash: seedPasswordHash },
    create: {
      phone: '010-0000-0001',
      email: 'admin@portlink.kr',
      passwordHash: seedPasswordHash,
      name: 'PortLink 관리자',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. 포워더 (시연용 한진로지스틱스 담당자)
  const forwarderUser = await prisma.user.upsert({
    where: { phone: '010-1000-0001' },
    update: { passwordHash: seedPasswordHash },
    create: {
      phone: '010-1000-0001',
      email: 'kim@hanjin-demo.kr',
      passwordHash: seedPasswordHash,
      name: '김담당',
      role: UserRole.FORWARDER,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.forwarder.upsert({
    where: { userId: forwarderUser.id },
    update: {},
    create: {
      userId: forwarderUser.id,
      companyName: '한진로지스틱스 (시연)',
      businessRegNo: '101-86-00001',
      representative: '박대표',
      contactPhone: '02-1000-0001',
    },
  });

  // 3. 운송사 (자가운송사)
  const carrierUser = await prisma.user.upsert({
    where: { phone: '010-2000-0001' },
    update: { passwordHash: seedPasswordHash },
    create: {
      phone: '010-2000-0001',
      email: 'kim@inhouse-demo.kr',
      passwordHash: seedPasswordHash,
      name: '김사장',
      role: UserRole.CARRIER,
      status: UserStatus.ACTIVE,
    },
  });
  const carrier = await prisma.carrier.upsert({
    where: { userId: carrierUser.id },
    update: {},
    create: {
      userId: carrierUser.id,
      companyName: '김사장 자가운송 (시연)',
      businessRegNo: '102-86-00001',
      representative: '김사장',
      isInhouse: true,
    },
  });

  // 4. 차주 5명 (1명은 자가운송사 소속, 4명은 독립)
  const driversInfo = [
    {
      phone: '010-3000-0001',
      name: '이차주',
      code: 'D-0001',
      license: 'L-2024-00001',
      vehicleType: ContainerType.FORTY_FT,
      plate: '경기82가0001',
      carrierId: carrier.id as string | null,
    },
    {
      phone: '010-3000-0002',
      name: '박차주',
      code: 'D-0002',
      license: 'L-2024-00002',
      vehicleType: ContainerType.FORTY_FT,
      plate: '경기82가0002',
      carrierId: null,
    },
    {
      phone: '010-3000-0003',
      name: '정차주',
      code: 'D-0003',
      license: 'L-2024-00003',
      vehicleType: ContainerType.TWENTY_FT,
      plate: '경기82가0003',
      carrierId: null,
    },
    {
      phone: '010-3000-0004',
      name: '최차주',
      code: 'D-0004',
      license: 'L-2024-00004',
      vehicleType: ContainerType.FORTY_FT_HC,
      plate: '경기82가0004',
      carrierId: null,
    },
    {
      phone: '010-3000-0005',
      name: '강차주',
      code: 'D-0005',
      license: 'L-2024-00005',
      vehicleType: ContainerType.FORTY_FT,
      plate: '경기82가0005',
      carrierId: null,
    },
  ];

  const drivers = [];
  for (const info of driversInfo) {
    const u = await prisma.user.upsert({
      where: { phone: info.phone },
      update: {},
      create: {
        phone: info.phone,
        name: info.name,
        role: UserRole.DRIVER,
        status: UserStatus.ACTIVE,
      },
    });
    const d = await prisma.truckDriver.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        driverCode: info.code,
        licenseNo: info.license,
        bankName: '국민은행',
        bankAccount: `seed-${info.code}`,
        carrierId: info.carrierId,
      },
    });
    await prisma.vehicle.upsert({
      where: { plateNo: info.plate },
      update: {},
      create: {
        plateNo: info.plate,
        type: info.vehicleType,
        driverId: d.id,
      },
    });
    drivers.push({ user: u, driver: d, info });
  }

  return { admin, forwarderUser, carrierUser, drivers };
}

async function seedDispatches(opts: {
  forwarderUserId: string;
  drivers: Array<{
    user: { id: string };
    driver: { id: string };
    info: { code: string; plate: string };
  }>;
}) {
  const { forwarderUserId, drivers } = opts;

  // 차주별 차량 조회
  const driverVehicleByCode: Record<string, { driverId: string; vehicleId: string }> = {};
  for (const d of drivers) {
    const v = await prisma.vehicle.findFirst({ where: { driverId: d.driver.id } });
    if (!v) throw new Error(`Vehicle not seeded for ${d.info.code}`);
    driverVehicleByCode[d.info.code] = { driverId: d.driver.id, vehicleId: v.id };
  }

  // ── 배차 #1: OPEN — 매칭 대기 (이천 → 부산항, 40FT, 모레 14:00)
  const order1 = await prisma.dispatchOrder.upsert({
    where: { orderNo: 'D26-0001' },
    update: {},
    create: {
      orderNo: 'D26-0001',
      forwarderUserId,
      originRegion: '경기 이천',
      originAddress: '경기 이천 부발읍 무촌리 0-1 시연창고',
      port: PortCode.BUSAN,
      containerType: ContainerType.FORTY_FT,
      pickupAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      fare: 750_000,
      status: DispatchOrderStatus.OPEN,
      notes: '시연용 OPEN 배차',
    },
  });

  // ── 배차 #2: ASSIGNED + Trip IN_TRANSIT (평택 → 부산신항, 40FT, 어제 출발)
  const order2 = await prisma.dispatchOrder.upsert({
    where: { orderNo: 'D26-0002' },
    update: {},
    create: {
      orderNo: 'D26-0002',
      forwarderUserId,
      originRegion: '경기 평택',
      originAddress: '경기 평택 청북면 한진물류센터',
      port: PortCode.BUSAN_NEW,
      containerType: ContainerType.FORTY_FT,
      pickupAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      fare: 750_000,
      status: DispatchOrderStatus.ASSIGNED,
      notes: '시연용 진행중 배차',
    },
  });
  const driver2 = driverVehicleByCode['D-0002']!;
  await prisma.dispatchAssign.upsert({
    where: { id: `seed-assign-${order2.id}` },
    update: {},
    create: {
      id: `seed-assign-${order2.id}`,
      dispatchOrderId: order2.id,
      driverId: driver2.driverId,
      acceptedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
  });
  await prisma.trip.upsert({
    where: { dispatchOrderId: order2.id },
    update: {},
    create: {
      dispatchOrderId: order2.id,
      driverId: driver2.driverId,
      vehicleId: driver2.vehicleId,
      status: TripStatus.IN_TRANSIT,
      departedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      loadedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    },
  });

  // ── 배차 #3: COMPLETED + Trip COMPLETED + Settlement DRAFT (이천 → 부산항, 40FT, 1주 전)
  const order3 = await prisma.dispatchOrder.upsert({
    where: { orderNo: 'D26-0003' },
    update: {},
    create: {
      orderNo: 'D26-0003',
      forwarderUserId,
      originRegion: '경기 이천',
      originAddress: '경기 이천 마장면 시연공장',
      port: PortCode.BUSAN,
      containerType: ContainerType.FORTY_FT,
      pickupAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fare: 750_000,
      status: DispatchOrderStatus.COMPLETED,
      notes: '시연용 완료 배차',
    },
  });
  const driver1 = driverVehicleByCode['D-0001']!;
  await prisma.dispatchAssign.upsert({
    where: { id: `seed-assign-${order3.id}` },
    update: {},
    create: {
      id: `seed-assign-${order3.id}`,
      dispatchOrderId: order3.id,
      driverId: driver1.driverId,
      acceptedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });
  const trip3 = await prisma.trip.upsert({
    where: { dispatchOrderId: order3.id },
    update: {},
    create: {
      dispatchOrderId: order3.id,
      driverId: driver1.driverId,
      vehicleId: driver1.vehicleId,
      status: TripStatus.COMPLETED,
      departedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      loadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      unloadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000),
    },
  });
  // 정산 자동 생성 (수수료 5%)
  const platformFee = Math.round(order3.fare * BUSINESS_RULES.PLATFORM_FEE_RATE);
  const driverPayout = order3.fare - platformFee;
  await prisma.settlement.upsert({
    where: { tripId: trip3.id },
    update: {},
    create: {
      tripId: trip3.id,
      fare: order3.fare,
      platformFee,
      driverPayout,
      status: SettlementStatus.DRAFT,
    },
  });

  return [order1, order2, order3];
}

async function main() {
  console.info('🌱 PortLink seed 시작');

  console.info('  안전운임 마스터 시드...');
  const safeRateCount = await seedSafeRates();
  console.info(`    ✅ ${safeRateCount}건`);

  console.info('  사용자 + 프로필 + 차량 시드...');
  const seeded = await seedUsersAndProfiles();
  console.info(`    ✅ 관리자 1, 포워더 1, 운송사 1, 차주 ${seeded.drivers.length}`);

  console.info('  샘플 배차 시드...');
  const orders = await seedDispatches({
    forwarderUserId: seeded.forwarderUser.id,
    drivers: seeded.drivers,
  });
  console.info(`    ✅ ${orders.length}건 (OPEN / IN_TRANSIT / COMPLETED)`);

  console.info('🌱 seed 완료');
}

main()
  .catch((e) => {
    console.error('❌ seed 실패', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
