/**
 * Argon2id 비밀번호 해싱 — OWASP Password Storage Cheat Sheet (2024) 권장.
 * memoryCost 19MiB, timeCost 2, parallelism 1.
 *
 * 라이브러리: @node-rs/argon2 (Rust + prebuilt cross-platform binary).
 *   - 로컬 macOS arm64 + Vercel Lambda x64 모두 동작
 *   - PHC string 표준 출력 ($argon2id$v=19$...) — 기존 argon2 npm hash와 호환
 *
 * CLAUDE.md §11: argon2 (rounds 12+) — argon2id의 timeCost=2 + memory=19MiB는
 * 단일 thread M1 기준 약 50ms 소요.
 */
import { hash, verify, Algorithm } from '@node-rs/argon2';

const OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19 * 1024, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('비밀번호는 최소 8자 이상이어야 합니다');
  }
  return hash(plain, OPTIONS);
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashStr, plain);
  } catch {
    // 해시 포맷이 잘못되었거나 손상된 경우
    return false;
  }
}
