/**
 * Auth.js v5 메인 인스턴스.
 * `auth()` — 서버 컴포넌트/라우트 핸들러/middleware에서 세션 조회
 * `signIn` / `signOut` — 서버 액션
 * `handlers` — `app/api/auth/[...nextauth]/route.ts`에서 export
 */
import NextAuth from 'next-auth';
import { authConfig } from './config';

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
