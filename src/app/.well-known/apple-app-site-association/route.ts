/**
 * GET /.well-known/apple-app-site-association
 *
 * Apple Universal Links용 AASA. application/json + 200 OK + 리디렉션 0회 필수.
 * Apple CDN가 fetch 시 https + 유효 인증서 + 1MB 이하 + JSON 파싱 성공이어야 함.
 *
 * Team ID는 Apple Developer 계정의 "Membership" 페이지에서 확인.
 * 환경변수 APPLE_TEAM_ID 미설정 시 placeholder가 들어가 Universal Link는 동작하지 않음.
 *
 * paths:
 *   /driver/*       — 차주 PWA 본 화면 (jobs / trip / settlement / report 등)
 *   /trip/*         — 향후 단축 링크 (포워더가 차주에게 SMS로 보내는 케이스)
 *   /jobs/*         — 동일
 *
 * NOT:
 *   /admin/*  — 차주 앱이 열어선 안 됨
 *   /forwarder/*  — 데스크탑 전용
 */
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 3600;

const TEAM_ID = process.env.APPLE_TEAM_ID ?? 'TEAMID_PLACEHOLDER';
const BUNDLE_ID = 'kr.portlink.driver';

export function GET() {
  const body = {
    applinks: {
      details: [
        {
          appIDs: [`${TEAM_ID}.${BUNDLE_ID}`],
          components: [
            { '/': '/driver/*', comment: 'driver app screens' },
            { '/': '/trip/*', comment: 'shortened trip links' },
            { '/': '/jobs/*', comment: 'shortened job links' },
            {
              '/': '/admin/*',
              exclude: true,
              comment: 'admin must open in browser only',
            },
            {
              '/': '/forwarder/*',
              exclude: true,
              comment: 'forwarder is desktop-only',
            },
          ],
        },
      ],
    },
    webcredentials: {
      apps: [`${TEAM_ID}.${BUNDLE_ID}`],
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
