/**
 * API 라우트 핸들러 공통 헬퍼.
 * - 일관 응답 포맷 (CLAUDE.md §3 ALWAYS)
 * - 인증 + 역할 체크
 * - Zod 바디/쿼리 파싱
 */
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import type { Session } from 'next-auth';
import type { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { apiErr, apiOk, type ApiResult } from '@/lib/result';

export type AuthedSession = Session & {
  user: NonNullable<Session['user']> & { id: string; role: UserRole };
};

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(apiOk(data), { status });
}

export function jsonErr(code: string, message: string, status = 400) {
  return NextResponse.json<ApiResult<never>>(apiErr(code, message), { status });
}

/** 세션을 가져오고 역할 체크. 실패 시 NextResponse 반환. */
export async function requireRole(
  allowed: ReadonlyArray<UserRole>,
): Promise<{ ok: true; session: AuthedSession } | { ok: false; response: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return { ok: false, response: jsonErr('UNAUTHORIZED', '로그인이 필요합니다', 401) };
  }
  if (!allowed.includes(session.user.role)) {
    return { ok: false, response: jsonErr('FORBIDDEN', '권한이 없습니다', 403) };
  }
  return { ok: true, session: session as AuthedSession };
}

/** 요청 바디를 Zod로 파싱. 실패 시 NextResponse 반환. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: jsonErr('INVALID_JSON', '요청 본문이 JSON 형식이 아닙니다') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '잘못된 요청';
    return { ok: false, response: jsonErr('INVALID_INPUT', message) };
  }
  return { ok: true, data: parsed.data };
}

/** URL 검색 파라미터를 Zod로 파싱. */
export function parseQuery<S extends z.ZodTypeAny>(
  url: URL,
  schema: S,
): { ok: true; data: z.infer<S> } | { ok: false; response: NextResponse } {
  const obj = Object.fromEntries(url.searchParams.entries());
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? '잘못된 쿼리';
    return { ok: false, response: jsonErr('INVALID_QUERY', message) };
  }
  return { ok: true, data: parsed.data };
}
