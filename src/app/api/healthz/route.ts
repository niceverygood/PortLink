import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * /api/healthz — shallow health check.
 * Edge runtime → cold start ≈ 0, DB 의존성 X → 어떤 RPS에서도 통과.
 * Vercel Uptime / 외부 모니터링 / k6 baseline 용.
 *
 * 응답: { ok: true, region, ts }
 *
 * DB까지 검증하려면 /api/healthz/deep 사용.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    region: process.env.VERCEL_REGION ?? 'local',
    ts: new Date().toISOString(),
  });
}
