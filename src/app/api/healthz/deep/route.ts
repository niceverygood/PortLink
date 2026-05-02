import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/healthz/deep — deep health check (DB까지 ping).
 * Lambda warm 인스턴스 단위로 5초 캐시 → 모니터링 1 RPM 트래픽엔
 * DB 영향 없음. 부하 테스트용 아님 (다중 Lambda 인스턴스가 동시에
 * cold ping을 던지면 Supabase 무료 티어 connection pool 포화).
 *
 * 응답: { ok, db, region, ts, cached }
 *   - status 200 if db up, 503 if down
 */
const CACHE_TTL_MS = 5_000;
let cache: { db: 'up' | 'down'; ts: string; expiresAt: number } | null = null;

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
    cache = { db, ts, expiresAt: now + CACHE_TTL_MS };
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
