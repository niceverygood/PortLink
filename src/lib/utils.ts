import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * twMerge 확장 — custom fontSize 토큰 (display/h1/h2/body/body-sm/caption)이
 * 컬러 클래스와 충돌로 오인되어 제거되지 않도록 명시.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'body', 'body-sm', 'caption'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
