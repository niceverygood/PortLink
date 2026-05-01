import { describe, expect, it } from 'vitest';
import { formatKRW } from '@/lib/format';

describe('formatKRW', () => {
  it('천단위 콤마 + 원 단위', () => {
    expect(formatKRW(800000)).toBe('800,000원');
    expect(formatKRW(0)).toBe('0원');
    expect(formatKRW(1234567890)).toBe('1,234,567,890원');
  });

  it('float은 거부', () => {
    expect(() => formatKRW(100.5)).toThrow();
  });
});
