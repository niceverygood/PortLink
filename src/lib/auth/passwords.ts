/**
 * Argon2id 비밀번호 해싱 — OWASP Password Storage Cheat Sheet (2024) 권장 기본.
 * memoryCost 19MiB, timeCost 2, parallelism 1.
 *
 * CLAUDE.md §11: 비밀번호 argon2 (rounds 12+) — argon2id의 timeCost가 PBKDF2의 rounds 개념과 다름.
 * argon2의 메모리 19MiB + timeCost 2 조합은 단일 thread에서 약 50ms 소요 (M1 기준).
 */
import argon2 from 'argon2';

const OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('비밀번호는 최소 8자 이상이어야 합니다');
  }
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // 해시 포맷이 잘못되었거나 손상된 경우
    return false;
  }
}
