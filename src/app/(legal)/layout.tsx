import Link from 'next/link';
import type { ReactNode } from 'react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded-md bg-[#0A2540]" aria-hidden />
            <span className="text-h2 font-bold tracking-tight">PortLink</span>
          </Link>
          <nav className="flex gap-4 text-body-sm text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900">
              개인정보
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              약관
            </Link>
            <Link href="/support" className="hover:text-slate-900">
              지원
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article className="rounded-2xl bg-white p-6 sm:p-10 shadow-sm">{children}</article>
      </main>

      <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-[11px] text-slate-400">
        <p>© 2026 PortLink — 컨테이너 운송 디지털 배차 콜센터</p>
        <p className="mt-1">
          <Link href="/privacy" className="underline hover:text-slate-600">
            개인정보 처리방침
          </Link>
          {' · '}
          <Link href="/terms" className="underline hover:text-slate-600">
            이용약관
          </Link>
          {' · '}
          <Link href="/support" className="underline hover:text-slate-600">
            지원·문의
          </Link>
        </p>
      </footer>
    </div>
  );
}
