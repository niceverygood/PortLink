/**
 * POST /api/notifications/register-device
 *
 * 차주 네이티브 앱이 APNs/FCM 토큰을 받은 직후 호출.
 * - upsert (token unique): 같은 토큰을 다른 사용자가 가져오면 새 user로 reassign
 *   → 기기에서 계정 전환 시 안전
 * - revokedAt 초기화 + lastError 초기화 (재등록 시 비활성 토큰 살아남)
 *
 * DELETE /api/notifications/register-device
 *
 * 명시적 로그아웃 시 토큰 폐기. 클라이언트가 token을 보내면 revoke.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { DevicePlatform } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  token: z.string().min(16).max(512),
  platform: z.enum(['IOS', 'ANDROID', 'WEB']),
  appBuild: z.string().max(64).nullish(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 },
    );
  }

  let payload: z.infer<typeof registerSchema>;
  try {
    const body = await req.json();
    payload = registerSchema.parse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청' } },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  const row = await prisma.deviceToken.upsert({
    where: { token: payload.token },
    update: {
      userId,
      platform: payload.platform as DevicePlatform,
      appBuild: payload.appBuild ?? null,
      lastSeenAt: new Date(),
      lastError: null,
      revokedAt: null,
    },
    create: {
      userId,
      token: payload.token,
      platform: payload.platform as DevicePlatform,
      appBuild: payload.appBuild ?? null,
    },
    select: { id: true, platform: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, data: row });
}

const deleteSchema = z.object({
  token: z.string().min(16).max(512),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 },
    );
  }

  let payload: z.infer<typeof deleteSchema>;
  try {
    payload = deleteSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청' } },
      { status: 400 },
    );
  }

  await prisma.deviceToken.updateMany({
    where: { token: payload.token, userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true, data: null });
}
