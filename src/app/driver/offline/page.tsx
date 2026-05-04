import type { Metadata } from 'next';
import { OfflineClient } from './OfflineClient';

export const metadata: Metadata = {
  title: '오프라인',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-orange/10 text-4xl">
        📶
      </div>
      <h1 className="mb-2 text-h1 font-bold text-slate-900">연결이 끊어졌습니다</h1>
      <p className="mb-6 text-body-md text-slate-600">
        네트워크가 복구되면 이전 화면으로 돌아갑니다.
        <br />
        차주님, 잠시만 기다려 주세요.
      </p>

      <OfflineClient />

      <div className="mt-10 w-full rounded-2xl bg-slate-100 p-4 text-left text-body-sm text-slate-600">
        <p className="mb-1 font-semibold text-slate-700">오프라인에서도 가능한 작업</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>최근 본 배차 정보 확인 (캐시)</li>
          <li>위치 기록 (연결 복구 시 자동 동기화)</li>
          <li>다운로드한 청구서/신고서 PDF 열람</li>
        </ul>
      </div>

      <p className="mt-8 text-[10.5px] text-slate-400">
        PortLink Driver — 백그라운드 위치 추적 X
      </p>
    </main>
  );
}
