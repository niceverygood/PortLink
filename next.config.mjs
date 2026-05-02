import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * Server Components/Actions에서 사용하는 native 모듈을 webpack 번들에서 제외.
     * 빌드 시 .node binary 파싱 실패 방지 + 런타임에 require()로 로드.
     *
     * @node-rs/argon2  : 비밀번호 해싱 (Rust native + .node binary)
     * @prisma/client   : Prisma 클라이언트 (engine binary)
     */
    serverComponentsExternalPackages: ['@node-rs/argon2', '@prisma/client'],
    // src/instrumentation.ts 자동 로드 (Next 14.2 default off, 15+ default on).
    instrumentationHook: true,
  },
  async headers() {
    // 전역 보안 헤더. HSTS는 Vercel이 자동 추가하므로 생략.
    // CSP는 Tailwind/Next inline style 때문에 strict 모드 진입이 복잡 →
    // Stage 7 범위에선 X-Frame, content-type, referrer, permissions만 적용.
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // SENTRY_AUTH_TOKEN 미설정 시 sourcemap 업로드 자동 skip → 빌드 실패 X.
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // /monitoring 경로로 client → Sentry 요청 프록시 (광고 차단 우회).
  tunnelRoute: '/monitoring',
  widenClientFileUpload: true,
});
