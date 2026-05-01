/**
 * 역할 기반 라우트 가드 (Auth.js v5 + Next.js 14).
 *
 * /forwarder/* → FORWARDER, CARRIER, ADMIN
 * /driver/*    → DRIVER, ADMIN
 * /admin/*     → ADMIN
 *
 * 차단 시 /login?next=...&kind=... 으로 리다이렉트.
 *
 * NOTE: middleware는 Edge runtime이라 Prisma/argon2 등 Node API를 직접 못 쓴다.
 * 그래서 auth() 호출만 하고(JWT 검증, DB 안 침), 결과로 분기.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authEdge } from '@/lib/auth/edge';
import { UserRole } from '@prisma/client';

const FORWARDER_ROLES: ReadonlyArray<UserRole> = [
  UserRole.FORWARDER,
  UserRole.CARRIER,
  UserRole.ADMIN,
];
const DRIVER_ROLES: ReadonlyArray<UserRole> = [UserRole.DRIVER, UserRole.ADMIN];
const ADMIN_ROLES: ReadonlyArray<UserRole> = [UserRole.ADMIN];

function loginRedirect(req: NextRequest, kind: 'forwarder' | 'driver' | 'admin') {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}&kind=${kind}`;
  return NextResponse.redirect(url);
}

export default authEdge((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith('/forwarder')) {
    if (!role || !FORWARDER_ROLES.includes(role)) return loginRedirect(req, 'forwarder');
  } else if (pathname.startsWith('/driver')) {
    if (!role || !DRIVER_ROLES.includes(role)) return loginRedirect(req, 'driver');
  } else if (pathname.startsWith('/admin')) {
    if (!role || !ADMIN_ROLES.includes(role)) return loginRedirect(req, 'admin');
  }

  return NextResponse.next();
});

export const config = {
  // 보호할 경로만 매처에 등록 (/api, /_next, 정적 자산은 제외)
  matcher: ['/forwarder/:path*', '/driver/:path*', '/admin/:path*'],
};
