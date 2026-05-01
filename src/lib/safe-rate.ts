/**
 * 안전운임 마스터 조회.
 * 같은 (originRegion, port, containerType)에 대해 effectiveFrom <= at 이고
 * effectiveTo가 null이거나 at < effectiveTo 인 가장 최신 1건 반환.
 */
import type { ContainerType, PortCode, SafeRate } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function getSafeRate(opts: {
  originRegion: string;
  port: PortCode;
  containerType: ContainerType;
  at?: Date;
}): Promise<SafeRate | null> {
  const at = opts.at ?? new Date();

  return prisma.safeRate.findFirst({
    where: {
      originRegion: opts.originRegion,
      port: opts.port,
      containerType: opts.containerType,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });
}
