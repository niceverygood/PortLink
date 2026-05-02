'use client';

export function SentryThrowButton() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error(
          `[Sentry test] Client-side intentional error at ${new Date().toISOString()}`,
        );
      }}
      className="rounded border border-brand-error/40 bg-white px-3 py-1.5 text-[12px] font-bold text-brand-error hover:bg-brand-error/10"
    >
      클라이언트 에러 발생 (콘솔 + Sentry)
    </button>
  );
}
