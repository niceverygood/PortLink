/**
 * Node 환경 풀 Auth.js config.
 * - 베이스에 두 Credentials Provider 추가:
 *   * email-password: 포워더/운송사/관리자 (DRIVER 차단)
 *   * phone-otp: 차주 (DRIVER만)
 * - argon2/Prisma 등 Node 전용 모듈 사용
 *
 * Edge runtime(middleware)에서는 사용 금지 — config-base.ts 사용.
 */
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { UserRole, UserStatus, AuditAction } from '@prisma/client';
import { prisma } from '@/lib/db';
import { verifyPassword } from './passwords';
import { verifyOtp } from './otp';
import { authConfigBase } from './config-base';

export const authConfig: NextAuthConfig = {
  ...authConfigBase,
  providers: [
    Credentials({
      id: 'email-password',
      name: 'Email + Password',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(raw) {
        const email = typeof raw?.email === 'string' ? raw.email.trim().toLowerCase() : '';
        const password = typeof raw?.password === 'string' ? raw.password : '';
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.role === UserRole.DRIVER) return null;
        if (user.status !== UserStatus.ACTIVE) return null;

        const okPw = await verifyPassword(user.passwordHash, password);
        if (!okPw) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            entity: 'User',
            entityId: user.id,
            action: AuditAction.LOGIN,
            after: { provider: 'email-password' },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),

    Credentials({
      id: 'phone-otp',
      name: 'Phone + OTP',
      credentials: {
        phone: { label: '휴대폰', type: 'tel' },
        code: { label: '인증번호', type: 'text' },
      },
      async authorize(raw) {
        const phone = typeof raw?.phone === 'string' ? raw.phone.trim() : '';
        const code = typeof raw?.code === 'string' ? raw.code.trim() : '';
        if (!phone || !code) return null;

        const verifyResult = await verifyOtp({ phone, code });
        if (!verifyResult.ok) return null;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) return null;
        if (user.role !== UserRole.DRIVER) return null;
        if (user.status !== UserStatus.ACTIVE) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            entity: 'User',
            entityId: user.id,
            action: AuditAction.LOGIN,
            after: { provider: 'phone-otp' },
          },
        });

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
};
