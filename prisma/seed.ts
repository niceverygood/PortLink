/**
 * PortLink 시드.
 * 멱등(idempotent): upsert + deterministic ID 기반으로 여러 번 실행 가능.
 *
 * 구성:
 *  1. 안전운임 마스터 450건 (지역 30 × 차종 3 × 항만 5)
 *  2. 사용자 — 관리자 1, 포워더 5사, 운송사 3사, 차주 15명
 *  3. 차량 15대
 *  4. 배차 ~60건: OPEN / ASSIGNED / IN_TRANSIT(여러 단계) / COMPLETED+정산(DRAFT/CONFIRMED/PAID) / CANCELLED
 *  5. 감사로그 일부 (admin 시연용)
 *
 * 비밀번호: SEED_PASSWORD env 필수. 이메일 사용자(관리자/포워더/운송사) 모두 동일.
 * 차주는 OTP 로그인이라 passwordHash NULL 유지.
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
  AuditAction,
  NotificationType,
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

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** noUncheckedIndexedAccess 우회용. 모듈러 인덱스로 항상 유효함을 호출자가 보장. */
function pick<T>(arr: readonly T[], i: number): T {
  const v = arr[((i % arr.length) + arr.length) % arr.length];
  if (v === undefined) throw new Error(`pick: empty array`);
  return v;
}

function fareFor(baseFare40FT: number, type: ContainerType): number {
  const wire = CONTAINER_TYPE_TO_WIRE[type];
  const coef = CONTAINER_TYPE_COEFFICIENT[wire];
  const raw = Math.round(baseFare40FT * coef);
  return Math.round(raw / 10_000) * 10_000;
}

/** 안전운임 풀에서 (region, port, type) 매칭 fare 조회. */
function safeFare(regionName: string, port: PortCode, type: ContainerType): number {
  const region = REGIONS.find((r) => r.name === regionName);
  if (!region) throw new Error(`region not found: ${regionName}`);
  return fareFor(region.baseFareToPort[port], type);
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

interface ForwarderSeed {
  phone: string;
  email: string;
  name: string;
  companyName: string;
  businessRegNo: string;
  representative: string;
  contactPhone: string;
}

interface CarrierSeed {
  phone: string;
  email: string;
  name: string;
  companyName: string;
  businessRegNo: string;
  representative: string;
  isInhouse: boolean;
}

interface DriverSeed {
  phone: string;
  name: string;
  code: string;
  license: string;
  vehicleType: ContainerType;
  plate: string;
  bank: string;
  carrierKey?: string; // CarrierSeed.phone (소속 운송사)
}

const FORWARDERS: ForwarderSeed[] = [
  {
    phone: '010-1000-0001',
    email: 'kim@hanjin-demo.kr',
    name: '김담당',
    companyName: '한진로지스틱스 (시연)',
    businessRegNo: '101-86-00001',
    representative: '박대표',
    contactPhone: '02-1000-0001',
  },
  {
    phone: '010-1000-0002',
    email: 'park@cjlogis-demo.kr',
    name: '박매니저',
    companyName: 'CJ대한통운 (시연)',
    businessRegNo: '101-86-00002',
    representative: '이상무',
    contactPhone: '02-1000-0002',
  },
  {
    phone: '010-1000-0003',
    email: 'lee@hyundai-demo.kr',
    name: '이실장',
    companyName: '현대글로비스 (시연)',
    businessRegNo: '101-86-00003',
    representative: '정대표',
    contactPhone: '02-1000-0003',
  },
  {
    phone: '010-1000-0004',
    email: 'choi@lotte-demo.kr',
    name: '최주임',
    companyName: '롯데글로벌로지스 (시연)',
    businessRegNo: '101-86-00004',
    representative: '신부장',
    contactPhone: '02-1000-0004',
  },
  {
    phone: '010-1000-0005',
    email: 'jung@pantos-demo.kr',
    name: '정과장',
    companyName: '판토스 (시연)',
    businessRegNo: '101-86-00005',
    representative: '강이사',
    contactPhone: '02-1000-0005',
  },
];

const CARRIERS: CarrierSeed[] = [
  {
    phone: '010-2000-0001',
    email: 'kim@inhouse-demo.kr',
    name: '김사장',
    companyName: '김사장 자가운송 (시연)',
    businessRegNo: '102-86-00001',
    representative: '김사장',
    isInhouse: true,
  },
  {
    phone: '010-2000-0002',
    email: 'oh@dongbang-demo.kr',
    name: '오대표',
    companyName: '동방운수 (시연)',
    businessRegNo: '102-86-00002',
    representative: '오대표',
    isInhouse: false,
  },
  {
    phone: '010-2000-0003',
    email: 'yoon@halla-demo.kr',
    name: '윤사장',
    companyName: '한라통운 (시연)',
    businessRegNo: '102-86-00003',
    representative: '윤사장',
    isInhouse: false,
  },
];

const DRIVERS: DriverSeed[] = [
  {
    phone: '010-3000-0001',
    name: '이차주',
    code: 'D-0001',
    license: 'L-2024-00001',
    vehicleType: ContainerType.FORTY_FT,
    plate: '경기82가0001',
    bank: '국민은행',
    carrierKey: '010-2000-0001',
  },
  {
    phone: '010-3000-0002',
    name: '박차주',
    code: 'D-0002',
    license: 'L-2024-00002',
    vehicleType: ContainerType.FORTY_FT,
    plate: '경기82가0002',
    bank: '신한은행',
  },
  {
    phone: '010-3000-0003',
    name: '정차주',
    code: 'D-0003',
    license: 'L-2024-00003',
    vehicleType: ContainerType.TWENTY_FT,
    plate: '경기82가0003',
    bank: '우리은행',
  },
  {
    phone: '010-3000-0004',
    name: '최차주',
    code: 'D-0004',
    license: 'L-2024-00004',
    vehicleType: ContainerType.FORTY_FT_HC,
    plate: '경기82가0004',
    bank: '하나은행',
  },
  {
    phone: '010-3000-0005',
    name: '강차주',
    code: 'D-0005',
    license: 'L-2024-00005',
    vehicleType: ContainerType.FORTY_FT,
    plate: '경기82가0005',
    bank: 'NH농협은행',
  },
  {
    phone: '010-3000-0006',
    name: '조민수',
    code: 'D-0006',
    license: 'L-2024-00006',
    vehicleType: ContainerType.FORTY_FT,
    plate: '충남82가0006',
    bank: '국민은행',
    carrierKey: '010-2000-0002',
  },
  {
    phone: '010-3000-0007',
    name: '윤지훈',
    code: 'D-0007',
    license: 'L-2024-00007',
    vehicleType: ContainerType.FORTY_FT_HC,
    plate: '충남82가0007',
    bank: '신한은행',
    carrierKey: '010-2000-0002',
  },
  {
    phone: '010-3000-0008',
    name: '장성호',
    code: 'D-0008',
    license: 'L-2024-00008',
    vehicleType: ContainerType.FORTY_FT,
    plate: '인천82가0008',
    bank: '우리은행',
  },
  {
    phone: '010-3000-0009',
    name: '임동현',
    code: 'D-0009',
    license: 'L-2024-00009',
    vehicleType: ContainerType.TWENTY_FT,
    plate: '경남82가0009',
    bank: '국민은행',
    carrierKey: '010-2000-0003',
  },
  {
    phone: '010-3000-0010',
    name: '한재현',
    code: 'D-0010',
    license: 'L-2024-00010',
    vehicleType: ContainerType.FORTY_FT,
    plate: '경남82가0010',
    bank: '하나은행',
    carrierKey: '010-2000-0003',
  },
  {
    phone: '010-3000-0011',
    name: '오준영',
    code: 'D-0011',
    license: 'L-2024-00011',
    vehicleType: ContainerType.FORTY_FT_HC,
    plate: '경기82가0011',
    bank: '국민은행',
  },
  {
    phone: '010-3000-0012',
    name: '서태원',
    code: 'D-0012',
    license: 'L-2024-00012',
    vehicleType: ContainerType.FORTY_FT,
    plate: '서울82가0012',
    bank: '신한은행',
  },
  {
    phone: '010-3000-0013',
    name: '신현우',
    code: 'D-0013',
    license: 'L-2024-00013',
    vehicleType: ContainerType.TWENTY_FT,
    plate: '경기82가0013',
    bank: '우리은행',
  },
  {
    phone: '010-3000-0014',
    name: '권상민',
    code: 'D-0014',
    license: 'L-2024-00014',
    vehicleType: ContainerType.FORTY_FT,
    plate: '경북82가0014',
    bank: 'NH농협은행',
  },
  {
    phone: '010-3000-0015',
    name: '송종철',
    code: 'D-0015',
    license: 'L-2024-00015',
    vehicleType: ContainerType.FORTY_FT_HC,
    plate: '울산82가0015',
    bank: '하나은행',
  },
];

async function seedUsersAndProfiles() {
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

  // 2. 포워더 5사
  const forwarderUsers: { user: { id: string }; seed: ForwarderSeed }[] = [];
  for (const f of FORWARDERS) {
    const u = await prisma.user.upsert({
      where: { phone: f.phone },
      update: { passwordHash: seedPasswordHash },
      create: {
        phone: f.phone,
        email: f.email,
        passwordHash: seedPasswordHash,
        name: f.name,
        role: UserRole.FORWARDER,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.forwarder.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        companyName: f.companyName,
        businessRegNo: f.businessRegNo,
        representative: f.representative,
        contactPhone: f.contactPhone,
      },
    });
    forwarderUsers.push({ user: u, seed: f });
  }

  // 3. 운송사 3사
  const carrierByPhone: Record<string, { id: string }> = {};
  for (const c of CARRIERS) {
    const u = await prisma.user.upsert({
      where: { phone: c.phone },
      update: { passwordHash: seedPasswordHash },
      create: {
        phone: c.phone,
        email: c.email,
        passwordHash: seedPasswordHash,
        name: c.name,
        role: UserRole.CARRIER,
        status: UserStatus.ACTIVE,
      },
    });
    const carrier = await prisma.carrier.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        companyName: c.companyName,
        businessRegNo: c.businessRegNo,
        representative: c.representative,
        isInhouse: c.isInhouse,
      },
    });
    carrierByPhone[c.phone] = carrier;
  }

  // 4. 차주 15명
  const drivers: Array<{ user: { id: string }; driver: { id: string }; info: DriverSeed }> = [];
  for (const info of DRIVERS) {
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
    const carrierId = info.carrierKey ? carrierByPhone[info.carrierKey]?.id : null;
    const d = await prisma.truckDriver.upsert({
      where: { userId: u.id },
      update: { carrierId },
      create: {
        userId: u.id,
        driverCode: info.code,
        licenseNo: info.license,
        bankName: info.bank,
        bankAccount: `seed-${info.code}`,
        carrierId,
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

  return { admin, forwarderUsers, drivers };
}

// ─────────────────────────────────────────────
// 배차 시드 — 60건+ 다양한 상태
// ─────────────────────────────────────────────

interface OrderTemplate {
  orderNo: string;
  forwarderIdx: number; // 0~4
  origin: string;
  originAddress: string;
  port: PortCode;
  type: ContainerType;
  /** pickupAt = now + offsetDays * DAY (음수면 과거). */
  offsetDays: number;
  /** 'OPEN' | 'ASSIGNED' | 'IN_TRANSIT_DEPARTED' | 'IN_TRANSIT_LOADED' | 'IN_TRANSIT_UNLOADED' | 'COMPLETED_DRAFT' | 'COMPLETED_CONFIRMED' | 'COMPLETED_PAID' | 'CANCELLED' */
  state: string;
  /** 차주 코드 (D-0001 ~ D-0015) — OPEN이면 무시. */
  driverCode?: string;
  notes?: string;
  containerNo?: string;
}

function genContainerNo(index: number): string {
  // ISO 6346 비스무리한 4글자+7숫자
  const prefixes = ['TCKU', 'MSCU', 'HMMU', 'CMAU', 'OOLU', 'KMTU', 'EGHU'];
  const prefix = prefixes[index % prefixes.length];
  const num = (1234567 + index * 37).toString().padStart(7, '0').slice(-7);
  return `${prefix}${num}`;
}

const ORIGIN_POOL: Array<{ region: string; address: string }> = [
  { region: '경기 이천', address: '경기 이천시 부발읍 무촌리 0-1 시연창고' },
  { region: '경기 이천', address: '경기 이천시 마장면 시연공장' },
  { region: '경기 평택', address: '경기 평택시 청북면 한진물류센터' },
  { region: '경기 평택', address: '경기 평택시 포승읍 평택항물류단지 12-3' },
  { region: '경기 화성', address: '경기 화성시 향남읍 발안산단 7번지' },
  { region: '경기 화성', address: '경기 화성시 송산면 그린로 88' },
  { region: '경기 안성', address: '경기 안성시 공도읍 신두리 양화창고' },
  { region: '경기 김포', address: '경기 김포시 양촌읍 학운산단 22-4' },
  { region: '경기 광주', address: '경기 광주시 곤지암읍 곤지암IC 인접' },
  { region: '경기 용인', address: '경기 용인시 처인구 남사면 시연ICD' },
  { region: '인천 남동', address: '인천 남동구 남동공단 215블록 12로' },
  { region: '인천 서구', address: '인천 서구 청라동 청라항물류센터' },
  { region: '서울 강서', address: '서울 강서구 마곡동 마곡물류 3-1' },
  { region: '충남 천안', address: '충남 천안시 동남구 성거읍 천흥리' },
  { region: '충남 아산', address: '충남 아산시 둔포면 아산테크노 88' },
  { region: '충남 당진', address: '충남 당진시 송산면 당진평택항' },
  { region: '충북 청주', address: '충북 청주시 청원구 오창읍 오창과학단지' },
  { region: '경남 김해', address: '경남 김해시 주촌면 부산신항배후단지 12' },
  { region: '경남 양산', address: '경남 양산시 물금읍 가촌리 88' },
  { region: '경남 창원', address: '경남 창원시 마산회원구 마산자유무역' },
  { region: '울산 남구', address: '울산 남구 황성동 울산항4부두' },
  { region: '울산 울주', address: '울산 울주군 온산읍 온산공단 12' },
  { region: '경북 구미', address: '경북 구미시 산동읍 구미국가산단' },
  { region: '경북 포항', address: '경북 포항시 남구 호동 포항제철소' },
  { region: '대구 달서', address: '대구 달서구 성서공단북로 222' },
  { region: '전남 여수', address: '전남 여수시 화양면 여수산단 12-3' },
  { region: '전남 순천', address: '전남 순천시 해룡면 순천만물류 7' },
];

/** 60건+의 배차 시드 템플릿. orderNo는 고정 → upsert로 멱등. */
function buildOrderTemplates(): OrderTemplate[] {
  const result: OrderTemplate[] = [];
  let seq = 1;

  function add(t: Omit<OrderTemplate, 'orderNo'>) {
    const orderNo = `D26-${seq.toString().padStart(4, '0')}`;
    result.push({ ...t, orderNo });
    seq += 1;
  }

  const ports = PORT_CODES;
  const types = CONTAINER_TYPES;

  // OPEN — 12건 (오늘~+5일 픽업 예정, 매칭 대기)
  for (let i = 0; i < 12; i += 1) {
    const o = pick(ORIGIN_POOL, i);
    add({
      forwarderIdx: i % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i),
      type: pick(types, i),
      offsetDays: i * 0.5 + 0.5, // 0.5일 ~ 6일 후
      state: 'OPEN',
      notes: i === 0 ? '신항 작업 우선' : i === 3 ? '부산 게이트 12시 마감' : undefined,
      containerNo: i % 3 === 0 ? genContainerNo(i) : undefined,
    });
  }

  // ASSIGNED — 5건 (수락만, 출발 전. 오늘 픽업 예정)
  const assignedDrivers = ['D-0002', 'D-0006', 'D-0011', 'D-0008', 'D-0013'];
  for (let i = 0; i < assignedDrivers.length; i += 1) {
    const o = pick(ORIGIN_POOL, i + 12);
    add({
      forwarderIdx: i % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i + 1),
      type: pick(types, i + 1),
      offsetDays: i * 0.2 + 0.2, // 거의 오늘
      state: 'ASSIGNED',
      driverCode: assignedDrivers[i],
      containerNo: genContainerNo(i + 100),
    });
  }

  // IN_TRANSIT (다양한 단계) — 8건 (어제~오늘 출발)
  const inTransitConfigs = [
    { code: 'D-0001', state: 'IN_TRANSIT_DEPARTED', offset: -0.3 },
    { code: 'D-0003', state: 'IN_TRANSIT_LOADED', offset: -0.6 },
    { code: 'D-0004', state: 'IN_TRANSIT_LOADED', offset: -0.7 },
    { code: 'D-0005', state: 'IN_TRANSIT_UNLOADED', offset: -1.1 },
    { code: 'D-0007', state: 'IN_TRANSIT_DEPARTED', offset: -0.2 },
    { code: 'D-0009', state: 'IN_TRANSIT_LOADED', offset: -0.5 },
    { code: 'D-0010', state: 'IN_TRANSIT_UNLOADED', offset: -0.9 },
    { code: 'D-0012', state: 'IN_TRANSIT_DEPARTED', offset: -0.4 },
  ];
  inTransitConfigs.forEach((cfg, i) => {
    const o = pick(ORIGIN_POOL, i + 17);
    add({
      forwarderIdx: i % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i),
      type: pick(types, i),
      offsetDays: cfg.offset,
      state: cfg.state,
      driverCode: cfg.code,
      containerNo: genContainerNo(i + 200),
    });
  });

  // COMPLETED + Settlement DRAFT — 8건 (3~7일 전 완료, 정산 자동 생성)
  const completedDrafts = [
    'D-0001',
    'D-0002',
    'D-0003',
    'D-0004',
    'D-0005',
    'D-0006',
    'D-0007',
    'D-0008',
  ];
  completedDrafts.forEach((code, i) => {
    const o = pick(ORIGIN_POOL, i + 5);
    add({
      forwarderIdx: (i + 1) % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i),
      type: pick(types, i),
      offsetDays: -(3 + i * 0.5),
      state: 'COMPLETED_DRAFT',
      driverCode: code,
      containerNo: genContainerNo(i + 300),
    });
  });

  // COMPLETED + Settlement CONFIRMED — 8건 (8~14일 전, 양측 확인됨)
  const completedConfirmed = [
    'D-0009',
    'D-0010',
    'D-0011',
    'D-0012',
    'D-0013',
    'D-0014',
    'D-0015',
    'D-0001',
  ];
  completedConfirmed.forEach((code, i) => {
    const o = pick(ORIGIN_POOL, i + 9);
    add({
      forwarderIdx: (i + 2) % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i + 1),
      type: pick(types, i + 2),
      offsetDays: -(8 + i * 0.7),
      state: 'COMPLETED_CONFIRMED',
      driverCode: code,
      containerNo: genContainerNo(i + 400),
    });
  });

  // COMPLETED + Settlement PAID — 12건 (15~30일 전, 지급 완료)
  const completedPaid = [
    'D-0002',
    'D-0003',
    'D-0004',
    'D-0005',
    'D-0006',
    'D-0007',
    'D-0008',
    'D-0009',
    'D-0010',
    'D-0011',
    'D-0014',
    'D-0015',
  ];
  completedPaid.forEach((code, i) => {
    const o = pick(ORIGIN_POOL, i + 13);
    add({
      forwarderIdx: (i + 3) % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i + 2),
      type: pick(types, i),
      offsetDays: -(15 + i * 1.2),
      state: 'COMPLETED_PAID',
      driverCode: code,
      containerNo: genContainerNo(i + 500),
    });
  });

  // CANCELLED — 5건
  const cancelledConfigs = [
    { code: undefined, reason: '화주 요청으로 취소', offset: -2 },
    { code: 'D-0001', reason: '차주 사정으로 취소 (장비 고장)', offset: -4 },
    { code: undefined, reason: '안전운임 협의 결렬', offset: -5 },
    { code: 'D-0008', reason: '항만 일정 연기', offset: -10 },
    { code: undefined, reason: '컨테이너 상품 이슈로 취소', offset: -18 },
  ];
  cancelledConfigs.forEach((cfg, i) => {
    const o = pick(ORIGIN_POOL, i + 2);
    add({
      forwarderIdx: i % FORWARDERS.length,
      origin: o.region,
      originAddress: o.address,
      port: pick(ports, i),
      type: pick(types, i),
      offsetDays: cfg.offset,
      state: 'CANCELLED',
      driverCode: cfg.code,
      notes: cfg.reason,
    });
  });

  return result;
}

interface DriverVehicle {
  driverId: string;
  vehicleId: string;
  user: { id: string };
}

async function seedDispatches(opts: {
  forwarderUsers: { user: { id: string }; seed: ForwarderSeed }[];
  drivers: Array<{ user: { id: string }; driver: { id: string }; info: DriverSeed }>;
}) {
  const { forwarderUsers, drivers } = opts;

  // 차주 코드 → driverId/vehicleId/userId
  const driverByCode: Record<string, DriverVehicle> = {};
  for (const d of drivers) {
    const v = await prisma.vehicle.findFirst({ where: { driverId: d.driver.id } });
    if (!v) throw new Error(`Vehicle not seeded for ${d.info.code}`);
    driverByCode[d.info.code] = { driverId: d.driver.id, vehicleId: v.id, user: d.user };
  }

  const templates = buildOrderTemplates();
  const now = Date.now();
  const counters = {
    OPEN: 0,
    ASSIGNED: 0,
    IN_TRANSIT: 0,
    COMPLETED_DRAFT: 0,
    COMPLETED_CONFIRMED: 0,
    COMPLETED_PAID: 0,
    CANCELLED: 0,
  };

  for (const t of templates) {
    const fare = safeFare(t.origin, t.port, t.type);
    const pickupAt = new Date(now + t.offsetDays * DAY);
    const forwarderUserId = pick(forwarderUsers, t.forwarderIdx).user.id;

    let dispatchStatus: DispatchOrderStatus;
    if (t.state === 'OPEN') dispatchStatus = DispatchOrderStatus.OPEN;
    else if (t.state === 'CANCELLED') dispatchStatus = DispatchOrderStatus.CANCELLED;
    else if (t.state.startsWith('COMPLETED')) dispatchStatus = DispatchOrderStatus.COMPLETED;
    else dispatchStatus = DispatchOrderStatus.ASSIGNED;

    const order = await prisma.dispatchOrder.upsert({
      where: { orderNo: t.orderNo },
      update: { status: dispatchStatus },
      create: {
        orderNo: t.orderNo,
        forwarderUserId,
        originRegion: t.origin,
        originAddress: t.originAddress,
        port: t.port,
        containerType: t.type,
        containerNo: t.containerNo,
        pickupAt,
        fare,
        status: dispatchStatus,
        notes: t.notes,
      },
    });

    // OPEN, CANCELLED(차주 미배정)은 여기서 종료
    if (t.state === 'OPEN') {
      counters.OPEN += 1;
      continue;
    }
    if (t.state === 'CANCELLED' && !t.driverCode) {
      counters.CANCELLED += 1;
      continue;
    }
    if (!t.driverCode) continue;

    const dv = driverByCode[t.driverCode];
    if (!dv) throw new Error(`driver ${t.driverCode} not seeded`);

    // ASSIGNED 또는 그 이상 — DispatchAssign 필요
    const acceptedAt = new Date(pickupAt.getTime() - 12 * HOUR);
    await prisma.dispatchAssign.upsert({
      where: { id: `seed-assign-${order.id}` },
      update: {},
      create: {
        id: `seed-assign-${order.id}`,
        dispatchOrderId: order.id,
        driverId: dv.driverId,
        acceptedAt,
      },
    });

    if (t.state === 'CANCELLED') {
      // 차주 배정 후 취소 — Trip CANCELLED 상태로
      await prisma.trip.upsert({
        where: { dispatchOrderId: order.id },
        update: {},
        create: {
          dispatchOrderId: order.id,
          driverId: dv.driverId,
          vehicleId: dv.vehicleId,
          status: TripStatus.CANCELLED,
          cancelledAt: pickupAt,
          cancelReason: t.notes ?? '시연용 취소',
        },
      });
      counters.CANCELLED += 1;
      continue;
    }

    if (t.state === 'ASSIGNED') {
      // Trip PENDING (출발 전)
      await prisma.trip.upsert({
        where: { dispatchOrderId: order.id },
        update: {},
        create: {
          dispatchOrderId: order.id,
          driverId: dv.driverId,
          vehicleId: dv.vehicleId,
          status: TripStatus.PENDING,
        },
      });
      counters.ASSIGNED += 1;
      continue;
    }

    // IN_TRANSIT 단계별
    if (t.state.startsWith('IN_TRANSIT')) {
      const departedAt = new Date(pickupAt.getTime() + 1 * HOUR);
      const loadedAt = new Date(pickupAt.getTime() + 3 * HOUR);
      const unloadedAt = new Date(pickupAt.getTime() + 10 * HOUR);

      let status: TripStatus;
      const updates: {
        departedAt?: Date;
        loadedAt?: Date;
        unloadedAt?: Date;
      } = { departedAt };

      if (t.state === 'IN_TRANSIT_DEPARTED') {
        status = TripStatus.DEPARTED;
      } else if (t.state === 'IN_TRANSIT_LOADED') {
        status = TripStatus.LOADED;
        updates.loadedAt = loadedAt;
      } else {
        // IN_TRANSIT_UNLOADED
        status = TripStatus.UNLOADED;
        updates.loadedAt = loadedAt;
        updates.unloadedAt = unloadedAt;
      }

      await prisma.trip.upsert({
        where: { dispatchOrderId: order.id },
        update: {},
        create: {
          dispatchOrderId: order.id,
          driverId: dv.driverId,
          vehicleId: dv.vehicleId,
          status,
          ...updates,
        },
      });
      counters.IN_TRANSIT += 1;
      continue;
    }

    // COMPLETED_*
    const departedAt = new Date(pickupAt.getTime() + 1 * HOUR);
    const loadedAt = new Date(pickupAt.getTime() + 3 * HOUR);
    const unloadedAt = new Date(pickupAt.getTime() + 12 * HOUR);
    const completedAt = new Date(pickupAt.getTime() + 13 * HOUR);

    const trip = await prisma.trip.upsert({
      where: { dispatchOrderId: order.id },
      update: {},
      create: {
        dispatchOrderId: order.id,
        driverId: dv.driverId,
        vehicleId: dv.vehicleId,
        status: TripStatus.COMPLETED,
        departedAt,
        loadedAt,
        unloadedAt,
        completedAt,
      },
    });

    const platformFee = Math.round(fare * BUSINESS_RULES.PLATFORM_FEE_RATE);
    const driverPayout = fare - platformFee;
    let settlementStatus: SettlementStatus;
    let confirmedAt: Date | null = null;
    let paidAt: Date | null = null;

    if (t.state === 'COMPLETED_DRAFT') {
      settlementStatus = SettlementStatus.DRAFT;
      counters.COMPLETED_DRAFT += 1;
    } else if (t.state === 'COMPLETED_CONFIRMED') {
      settlementStatus = SettlementStatus.CONFIRMED;
      confirmedAt = new Date(completedAt.getTime() + 6 * HOUR);
      counters.COMPLETED_CONFIRMED += 1;
    } else {
      // COMPLETED_PAID
      settlementStatus = SettlementStatus.PAID;
      confirmedAt = new Date(completedAt.getTime() + 6 * HOUR);
      paidAt = new Date(completedAt.getTime() + 3 * DAY);
      counters.COMPLETED_PAID += 1;
    }

    await prisma.settlement.upsert({
      where: { tripId: trip.id },
      update: { status: settlementStatus, confirmedAt, paidAt },
      create: {
        tripId: trip.id,
        fare,
        platformFee,
        driverPayout,
        status: settlementStatus,
        confirmedAt,
        paidAt,
      },
    });
  }

  return counters;
}

async function seedAuditLogs(adminUserId: string) {
  // 이미 시드 로그 있으면 스킵 (BigInt id라 upsert 어색)
  const existing = await prisma.auditLog.count({
    where: { actorUserId: adminUserId, entity: 'DispatchOrder' },
  });
  if (existing > 0) {
    return existing;
  }

  // 최근 완료된 배차 몇 건에 대해 admin 액션 기록 (시연용)
  const recentOrders = await prisma.dispatchOrder.findMany({
    where: { status: DispatchOrderStatus.COMPLETED },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  for (let i = 0; i < recentOrders.length; i += 1) {
    const o = recentOrders[i]!;
    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        entity: 'DispatchOrder',
        entityId: o.id,
        action: AuditAction.UPDATE,
        before: { status: 'OPEN' },
        after: { status: 'COMPLETED' },
        ipAddress: '203.0.113.42',
        userAgent: 'PortLink-Admin/1.0',
        createdAt: new Date(now - (i + 1) * 4 * HOUR),
      },
    });
  }

  // 관리자 로그인 기록
  for (let i = 0; i < 3; i += 1) {
    await prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        entity: 'User',
        entityId: adminUserId,
        action: AuditAction.LOGIN,
        ipAddress: '203.0.113.42',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605',
        createdAt: new Date(now - (i + 1) * DAY),
      },
    });
  }

  return recentOrders.length + 3;
}

async function seedNotifications(opts: {
  forwarderUsers: { user: { id: string }; seed: ForwarderSeed }[];
  drivers: Array<{ user: { id: string }; driver: { id: string }; info: DriverSeed }>;
  adminUserId: string;
}) {
  // 이미 시드 알림 있으면 스킵 (멱등 — id 자동 생성이라 재시도 시 중복 방지)
  const existing = await prisma.notification.count();
  if (existing > 0) return existing;

  const now = Date.now();
  const created: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
    createdAt: Date;
  }[] = [];

  // 포워더별 — 최근 차주 수락 / Trip 단계 진행 / 정산 확정 요청 알림 시연용
  // 각 포워더의 진행중 또는 완료된 배차 가져오기
  for (const fu of opts.forwarderUsers) {
    const orders = await prisma.dispatchOrder.findMany({
      where: { forwarderUserId: fu.user.id },
      include: { trip: { include: { driver: { include: { user: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    let i = 0;
    for (const o of orders) {
      if (!o.trip) continue;
      const driverName = o.trip.driver.user.name;
      const link = `/forwarder/dispatch/${o.id}`;
      // 모든 trip마다 수락 알림 1건
      created.push({
        userId: fu.user.id,
        type: NotificationType.DISPATCH_ACCEPTED,
        title: `${driverName}님이 배차를 수락했습니다`,
        body: `${o.orderNo} · ${o.originRegion} → ${o.port}`,
        link,
        createdAt: new Date(now - (i * 3 + 5) * HOUR),
      });
      // 단계 알림 — IN_TRANSIT/COMPLETED만 추가 트리거
      if (o.trip.status === TripStatus.LOADED || o.trip.status === TripStatus.UNLOADED) {
        created.push({
          userId: fu.user.id,
          type: NotificationType.TRIP_LOADED,
          title: `${driverName} · 상차 완료`,
          body: `${o.orderNo} · ${o.originRegion} → ${o.port}`,
          link,
          createdAt: new Date(now - (i * 3 + 2) * HOUR),
        });
      }
      if (o.trip.status === TripStatus.UNLOADED) {
        created.push({
          userId: fu.user.id,
          type: NotificationType.TRIP_UNLOADED,
          title: `${driverName} · 하차 완료`,
          body: `${o.orderNo} · 정산 준비 중`,
          link,
          createdAt: new Date(now - (i * 3 + 1) * HOUR),
        });
      }
      if (o.trip.status === TripStatus.COMPLETED) {
        created.push({
          userId: fu.user.id,
          type: NotificationType.TRIP_COMPLETED,
          title: `${driverName} · 운송 완료`,
          body: `${o.orderNo} · 정산 명세서 확인 필요`,
          link,
          createdAt: new Date(now - (i + 1) * HOUR),
        });
      }
      i += 1;
    }
  }

  // 차주별 — 본인이 수락한 trip 중 SETTLEMENT_PAID 알림 + DISPATCH_NEW 시연
  for (const d of opts.drivers) {
    const settlements = await prisma.settlement.findMany({
      where: {
        trip: { driverId: d.driver.id },
        status: SettlementStatus.PAID,
      },
      include: {
        trip: { include: { dispatchOrder: true } },
      },
      take: 3,
    });
    settlements.forEach((s, i) => {
      created.push({
        userId: d.user.id,
        type: NotificationType.SETTLEMENT_PAID,
        title: '정산이 입금되었습니다',
        body: `${s.trip.dispatchOrder.orderNo} · ${s.driverPayout.toLocaleString('ko-KR')}원`,
        link: `/driver/settlement`,
        createdAt: new Date(now - (i * 36 + 20) * HOUR),
      });
    });
    // 새 배차 알림 시연 (D-0001 ~ D-0005만)
    if (['D-0001', 'D-0002', 'D-0003', 'D-0004', 'D-0005'].includes(d.info.code)) {
      const openOrder = await prisma.dispatchOrder.findFirst({
        where: { status: DispatchOrderStatus.OPEN },
        orderBy: { createdAt: 'desc' },
      });
      if (openOrder) {
        created.push({
          userId: d.user.id,
          type: NotificationType.DISPATCH_NEW,
          title: '신규 배차',
          body: `${openOrder.originRegion} → ${openOrder.port} · ${openOrder.fare.toLocaleString('ko-KR')}원`,
          link: `/driver/jobs/${openOrder.id}`,
          createdAt: new Date(now - 30 * 60 * 1000), // 30분 전
        });
      }
    }
  }

  // 관리자 — 가입 승인 / 이상 거래 시연
  created.push({
    userId: opts.adminUserId,
    type: NotificationType.ADMIN_APPROVAL,
    title: '신규 가입 승인 대기',
    body: '신청자 1명이 승인을 대기 중입니다',
    link: '/admin/users',
    createdAt: new Date(now - 2 * HOUR),
  });
  created.push({
    userId: opts.adminUserId,
    type: NotificationType.ANOMALY_DETECTED,
    title: '이상 거래 탐지',
    body: '장기 미수락 배차 2건 감지',
    link: '/admin/anomaly',
    createdAt: new Date(now - 6 * HOUR),
  });

  // 일괄 삽입
  if (created.length === 0) return 0;
  await prisma.notification.createMany({ data: created });
  return created.length;
}

async function main() {
  console.info('🌱 PortLink seed 시작');

  console.info('  안전운임 마스터 시드...');
  const safeRateCount = await seedSafeRates();
  console.info(`    ✅ ${safeRateCount}건`);

  console.info('  사용자 + 프로필 + 차량 시드...');
  const seeded = await seedUsersAndProfiles();
  console.info(
    `    ✅ 관리자 1, 포워더 ${seeded.forwarderUsers.length}, 차주 ${seeded.drivers.length}`,
  );

  console.info('  배차 + Trip + 정산 시드...');
  const counters = await seedDispatches({
    forwarderUsers: seeded.forwarderUsers,
    drivers: seeded.drivers,
  });
  const total = Object.values(counters).reduce((a, b) => a + b, 0);
  console.info(
    `    ✅ ${total}건 (OPEN ${counters.OPEN} · ASSIGNED ${counters.ASSIGNED} · IN_TRANSIT ${counters.IN_TRANSIT} · COMPLETED ${counters.COMPLETED_DRAFT + counters.COMPLETED_CONFIRMED + counters.COMPLETED_PAID} [DRAFT ${counters.COMPLETED_DRAFT}/CONF ${counters.COMPLETED_CONFIRMED}/PAID ${counters.COMPLETED_PAID}] · CANCELLED ${counters.CANCELLED})`,
  );

  console.info('  감사 로그 시드...');
  const auditCount = await seedAuditLogs(seeded.admin.id);
  console.info(`    ✅ ${auditCount}건`);

  console.info('  알림 시드...');
  const notiCount = await seedNotifications({
    forwarderUsers: seeded.forwarderUsers,
    drivers: seeded.drivers,
    adminUserId: seeded.admin.id,
  });
  console.info(`    ✅ ${notiCount}건`);

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
