/**
 * 도메인 로직 반환 타입.
 * 던지지 말고 반환 — CLAUDE.md §10.
 */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * API 응답 일관 포맷 (CLAUDE.md §3 ALWAYS).
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const apiOk = <T>(data: T): ApiResult<T> => ({ ok: true, data });
export const apiErr = (code: string, message: string): ApiResult<never> => ({
  ok: false,
  error: { code, message },
});
