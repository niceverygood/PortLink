import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // 무료 티어 — 트랜잭션 10%만 샘플링
    tracesSampleRate: 0.1,
    // Session Replay는 비활성화 (free tier 한도 절약)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
