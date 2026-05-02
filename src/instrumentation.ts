/**
 * Next.js Instrumentation Hook — 서버 시작 시 1회 실행.
 * @sentry/nextjs v8+ 부터 sentry.server.config.ts를 직접 import하지 않고
 * 이 파일에서 runtime별로 register() 함.
 *
 * docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
