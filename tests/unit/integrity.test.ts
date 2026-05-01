// @vitest-environment node
/**
 * 무결성 제약 (FK / unique / check) 검증.
 *
 * 주의: 이 테스트는 실제 dev DB에 접속해 위반 INSERT가 거부되는지 본다.
 * 시드 실행이 선행되어 있다고 가정 (npm run seed).
 *
 * 테스트가 만든 임시 데이터는 finally에서 정리.
 */
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient, ContainerType, PortCode, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_TAG = 'integrity-test';

beforeAll(async () => {
  // 이전 잔존 데이터 정리
  await prisma.vehicle.deleteMany({ where: { plateNo: { startsWith: TEST_TAG } } });
  await prisma.safeRate.deleteMany({ where: { originRegion: TEST_TAG } });
});

afterAll(async () => {
  await prisma.vehicle.deleteMany({ where: { plateNo: { startsWith: TEST_TAG } } });
  await prisma.safeRate.deleteMany({ where: { originRegion: TEST_TAG } });
  await prisma.$disconnect();
});

describe('CHECK 제약', () => {
  it('safe_rate base_fare가 0 이하면 거부', async () => {
    await expect(
      prisma.safeRate.create({
        data: {
          originRegion: TEST_TAG,
          port: PortCode.BUSAN,
          containerType: ContainerType.FORTY_FT,
          baseFare: 0,
        },
      }),
    ).rejects.toThrow(/chk_safe_rate_positive_fare/);
  });

  it('vehicle은 driver 또는 carrier 중 하나는 반드시 owner', async () => {
    await expect(
      prisma.vehicle.create({
        data: {
          plateNo: `${TEST_TAG}-orphan`,
          type: ContainerType.FORTY_FT,
          driverId: null,
          carrierId: null,
        },
      }),
    ).rejects.toThrow(/chk_vehicle_owner_present/);
  });
});

describe('UNIQUE 제약', () => {
  it('safe_rate (origin, port, type, effectiveFrom) 중복 거부', async () => {
    const dt = new Date('2026-02-01T00:00:00Z');
    await prisma.safeRate.create({
      data: {
        originRegion: TEST_TAG,
        port: PortCode.BUSAN,
        containerType: ContainerType.FORTY_FT,
        baseFare: 100_000,
        effectiveFrom: dt,
      },
    });
    await expect(
      prisma.safeRate.create({
        data: {
          originRegion: TEST_TAG,
          port: PortCode.BUSAN,
          containerType: ContainerType.FORTY_FT,
          baseFare: 999_000,
          effectiveFrom: dt,
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });
});

describe('FK 제약', () => {
  it('존재하지 않는 driverId로 vehicle 생성 거부', async () => {
    await expect(
      prisma.vehicle.create({
        data: {
          plateNo: `${TEST_TAG}-fk`,
          type: ContainerType.FORTY_FT,
          driverId: 'cuid-does-not-exist',
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });
});
