import Link from 'next/link';
import { Truck, Building2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-navy text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-display font-bold tracking-tight text-white">PortLink</h1>
          <p className="mt-3 text-body text-slate-300">컨테이너 운송 배차 플랫폼</p>
          <p className="mt-1 text-body-sm text-slate-400">포트링크</p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/forwarder/dashboard"
            className="group flex flex-col items-start gap-3 rounded-lg bg-white/5 p-6 ring-1 ring-white/10 transition-colors hover:bg-white/10"
          >
            <Building2 className="size-8 text-white" />
            <div>
              <div className="text-h2 font-semibold text-white">포워더로 시작</div>
              <div className="mt-1 text-body-sm text-slate-300">
                배차 등록·운송사 매칭·정산 발행
              </div>
            </div>
            <span className="mt-auto pt-3 text-body-sm text-slate-400 group-hover:text-white">
              담당자 로그인 →
            </span>
          </Link>

          <Link
            href="/driver/jobs"
            className="group flex flex-col items-start gap-3 rounded-lg bg-brand-orange p-6 ring-1 ring-brand-orange-dark transition-colors hover:bg-brand-orange-dark"
          >
            <Truck className="size-8 text-white" />
            <div>
              <div className="text-h2 font-semibold text-white">차주로 시작</div>
              <div className="mt-1 text-body-sm text-white/80">
                내 주변 가용 배차·운송 진행·월 정산
              </div>
            </div>
            <span className="mt-auto pt-3 text-body-sm text-white/80 group-hover:text-white">
              차주 로그인 →
            </span>
          </Link>
        </div>

        <p className="mt-12 text-caption text-slate-500">© PortLink · 안전운임 보장</p>
      </div>
    </main>
  );
}
