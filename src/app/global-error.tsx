'use client';

/**
 * App Router 최상위 에러 바운더리. layout.tsx에서 throw된 에러나
 * SSR root 단계의 React render 에러를 잡아 Sentry로 보고.
 *
 * Sentry 권장: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            background: '#f8fafc',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0A2540', marginBottom: 8 }}>
            예상치 못한 오류가 발생했습니다
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            잠시 후 다시 시도해주세요. 문제가 지속되면 운영팀에 문의 바랍니다.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
              ref: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
