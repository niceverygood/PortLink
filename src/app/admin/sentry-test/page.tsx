/**
 * /admin/sentry-test — Sentry 연동 검증용 의도적 에러 라우트.
 * ADMIN만 접근 가능 (admin layout이 가드).
 *
 * URL 파라미터:
 *   ?throw=server   서버 컴포넌트에서 throw → Sentry server.config 캡처
 *   ?throw=client   클라이언트에서 버튼 클릭 시 throw → Sentry client.config 캡처
 *   (기본)         안내 페이지
 */
import { Topbar } from '@/components/forwarder/Topbar';
import { SentryThrowButton } from './throw-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sentry 테스트' };

export default async function SentryTestPage({
  searchParams,
}: {
  searchParams: Promise<{ throw?: string }>;
}) {
  const params = await searchParams;
  if (params.throw === 'server') {
    throw new Error(`[Sentry test] Server-side intentional error at ${new Date().toISOString()}`);
  }

  return (
    <>
      <Topbar title="Sentry 테스트" subtitle="의도적 에러 → Sentry 대시보드 도달 확인" />
      <div className="flex-1 space-y-4 overflow-y-auto p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="mb-2 text-[14px] font-bold text-amber-900">⚠️ 의도적 에러 발생</h2>
          <p className="mb-4 text-[12px] text-amber-800">
            이 페이지는 Sentry 연동 확인용입니다. 발생한 에러는 모두 Sentry 대시보드에 기록됩니다.
          </p>
          <div className="flex gap-2">
            <a
              href="/admin/sentry-test?throw=server"
              className="rounded bg-brand-error px-3 py-1.5 text-[12px] font-bold text-white"
            >
              서버 에러 발생 (페이지 500)
            </a>
            <SentryThrowButton />
          </div>
          <p className="mt-3 text-[11px] text-amber-700">
            발생 후 https://sentry.io 대시보드 → Issues에서 1~30초 내 확인 가능
          </p>
        </div>
      </div>
    </>
  );
}
