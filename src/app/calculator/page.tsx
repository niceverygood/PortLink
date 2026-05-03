/**
 * /calculator — 공개 운임 계산기.
 * 비회원도 사용 가능. 결과 하단 회원가입 CTA.
 *
 * 데이터: /api/freight/calculate 호출. INTER_CARRIER는 RBAC 차단되어 0으로 표시 (비회원).
 */
import Link from 'next/link';
import { CalculatorClient } from './CalculatorClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: '안전운임 계산기' };

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-[18px] font-bold text-brand-navy">
            PortLink
          </Link>
          <Link
            href="/login?kind=driver"
            className="rounded-lg bg-brand-orange px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-orange-dark"
          >
            차주 로그인
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-[28px] font-black tracking-[-0.03em] text-brand-navy">
          안전운임 계산기
        </h1>
        <p className="mt-2 text-[14px] text-slate-600">
          국토교통부고시 제2026-55호 기준. 차주가 받아야 할 법정 최저액과 화주가 청구할 수 있는
          최저액을 즉시 계산합니다.
        </p>

        <div className="mt-6">
          <CalculatorClient />
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13px] font-bold text-amber-900">PortLink로 더 받아가세요</p>
          <p className="mt-1 text-[12px] text-amber-800">
            차주 회원이면 매 배차마다 자동으로 안전운임이 검증됩니다. 미지급 시 신고서까지 1-Click.
          </p>
          <Link
            href="/login?kind=driver"
            className="mt-3 inline-block rounded-lg bg-brand-orange px-4 py-2 text-[12px] font-bold text-white hover:bg-brand-orange-dark"
          >
            차주 가입하고 시작 →
          </Link>
        </div>
      </section>
    </main>
  );
}
