/**
 * GET /forwarder/manifest.webmanifest
 *
 * PortLink (포워더) PWA 매니페스트.
 * navy 테마, 데스크탑 우선이라 PWA 설치는 옵션.
 */
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    {
      name: 'PortLink',
      short_name: 'PortLink',
      description: '컨테이너 운송 배차 관리',
      lang: 'ko-KR',
      start_url: '/forwarder/dashboard',
      scope: '/forwarder/',
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#0A2540',
      icons: [
        {
          src: '/icons/forwarder/icon.svg',
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
