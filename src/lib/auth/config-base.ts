/**
 * Edge-safe Auth.js 베이스 config.
 * - providers 비어 있음 (DB/argon2 등 Node 전용 코드 미포함)
 * - JWT 콜백, 페이지 매핑, 세션 옵션만 정의
 *
 * middleware는 이 config로 NextAuth를 만들어 토큰 검증만 수행.
 * 실제 로그인 로직은 src/lib/auth/config.ts(=Node 환경)에서 처리.
 */
import type { NextAuthConfig } from 'next-auth';
import type { UserRole, UserStatus } from '@prisma/client';

export const authConfigBase: NextAuthConfig = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
  },
  providers: [], // 실제 provider는 ./config.ts에서 추가
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: UserRole }).role;
        token.status = (user as { status?: UserStatus }).status;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role as UserRole | undefined;
        session.user.status = token.status as UserStatus | undefined;
      }
      return session;
    },
  },
  trustHost: true,
};
