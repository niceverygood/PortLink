/**
 * 화폐: 정수 KRW만, 천단위 콤마 + " 원".
 * Float 절대 금지 — CLAUDE.md §3 NEVER.
 */
export function formatKRW(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`KRW amount must be integer, got ${amount}`);
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}
