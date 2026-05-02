import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * /api/healthz — 헬스체크. DB까지 ping해서 "전체 stack alive" 보장.
 * Vercel Uptime / k6 부하 테스트의 baseline 엔드포인트.
 *
 * 응답: { ok, db, region, ts }
 *   - db: 'up' | 'down'
 *   - region: AWS_REGION 또는 VERCEL_REGION
 *
 * 의도적으로 인증 없음 — public.
 */
export async function GET() {
  let db: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = 'up';
  } catch {
    db = 'down';
  }

  return NextResponse.json(
    {
      ok: db === 'up',
      db,
      region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? 'local',
      ts: new Date().toISOString(),
    },
    { status: db === 'up' ? 200 : 503 },
  );
}
