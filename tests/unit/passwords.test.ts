// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/passwords';

describe('argon2 passwords', () => {
  it('해시 round-trip', async () => {
    const hash = await hashPassword('portlink2026!');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'portlink2026!')).toBe(true);
    expect(await verifyPassword(hash, 'wrong-password')).toBe(false);
  });

  it('짧은 비밀번호 거부', async () => {
    await expect(hashPassword('1234567')).rejects.toThrow(/최소 8자/);
  });

  it('손상된 해시는 false 반환 (예외 던지지 않음)', async () => {
    expect(await verifyPassword('not-a-hash', 'anything')).toBe(false);
  });
});
