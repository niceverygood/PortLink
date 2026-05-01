/**
 * GET /driver/manifest.webmanifest
 *
 * PortLink Driver PWA 매니페스트.
 * orange 테마, standalone 모드, 차주 화면 전용.
 *
 * NOTE: Stage 0 — 사용자 ZIP의 PNG 아이콘 도착 시 icons 배열에 192/512 PNG 추가.
 * 현재는 SVG 1개로 대체 (Chrome/Android는 정상 동작, iOS는 generic 아이콘).
 */
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    {
      name: 'PortLink Driver',
      short_name: 'PortLink',
      description: '차주 모바일 배차 앱',
      lang: 'ko-KR',
      start_url: '/driver/jobs',
      scope: '/driver/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#FFFFFF',
      theme_color: '#FF6B35',
      icons: [
        {
          src: '/icons/driver/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
      categories: ['business', 'productivity'],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}
