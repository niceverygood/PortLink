import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/healthz — 헬스체크. DB까지 ping해서 "전체 stack alive" 보장.
 * Vercel Uptime / k6 부하 테스트의 baseline 엔드포인트.
 *
 * 응답: { ok, db, region, ts, cached }
 *   - db: 'up' | 'down'
 *   - region: VERCEL_REGION 또는 AWS_REGION
 *   - cached: true면 직전 5초 내 결과 재사용
 *
 * Lambda warm instance 단위로 DB ping 결과를 5초 캐시 →
 * 동시 요청 spike에도 DB 풀 saturation 방지. 실제 운영 모니터링은
 * 1 RPM 이하라 캐시 영향 없음. 부하 테스트(100+ RPS)는 캐시 hit으로 통과.
 *
 * 의도적으로 인증 없음 — public.
 */
const CACHE_TTL_MS = 5_000;
let cache: { ok: true; db: 'up' | 'down'; ts: string; expiresAt: number } | null = null;

async function pingDb(): Promise<'up' | 'down'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'up';
  } catch {
    return 'down';
  }
}

export async function GET() {
  const now = Date.now();
  let cached = false;
  let db: 'up' | 'down';
  let ts: string;

  if (cache && cache.expiresAt > now) {
    db = cache.db;
    ts = cache.ts;
    cached = true;
  } else {
    db = await pingDb();
    ts = new Date(now).toISOString();
    cache = { ok: true, db, ts, expiresAt: now + CACHE_TTL_MS };
  }

  return NextResponse.json(
    {
      ok: db === 'up',
      db,
      region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? 'local',
      ts,
      cached,
    },
    { status: db === 'up' ? 200 : 503 },
  );
}
