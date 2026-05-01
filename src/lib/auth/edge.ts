/**
 * Edge runtime용 NextAuth 인스턴스 (middleware 전용).
 * 베이스 config만 써서 토큰 검증/세션 추출만 수행 — DB/native 코드 미실행.
 */
import NextAuth from 'next-auth';
import { authConfigBase } from './config-base';

export const { auth: authEdge } = NextAuth(authConfigBase);
