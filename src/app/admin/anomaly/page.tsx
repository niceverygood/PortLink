/**
 * /admin/anomaly — 이상 거래 탐지 4룰 결과.
 * 각 룰 결과를 섹션 카드로 표시. 5분 캐시는 추후 unstable_cache 도입 검토.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPin, Shield, Smartphone, UserMinus, type LucideIcon } from 'lucide-react';
import { auth } from '@/lib/auth';
import { Topbar } from '@/components/forwarder/Topbar';
import { runAllAnomalyRules } from '@/lib/anomaly';
import { formatKRW } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: '이상 거래' };

export default async function AdminAnomalyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=admin');

  const { fareViolations, driverCancels, otpAbuse, duplicateAddress } = await runAllAnomalyRules();
  const totalCount =
    fareViolations.length + driverCancels.length + otpAbuse.length + duplicateAddress.length;

  return (
    <>
      <Topbar title="이상 거래" subtitle={`4개 룰 적용 결과 — 총 ${totalCount}건 탐지`} />
      <div className="flex-1 space-y-4 overflow-y-auto p-8">
        <Section
          Icon={Shield}
          title="안전운임 한도 위반"
          subtitle="fare < 안전운임 × 90%"
          count={fareViolations.length}
          accent="error"
        >
          {fareViolations.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {fareViolations.map((v) => (
                <li
                  key={v.orderId}
                  className="flex items-center justify-between px-4 py-2 text-[12px]"
                >
                  <Link
                    href={`/admin/dispatches`}
                    className="font-mono text-slate-700 hover:underline"
                  >
                    #{v.orderNo}
                  </Link>
                  <span className="text-slate-700">
                    {v.originRegion} · {v.containerType}
                  </span>
                  <span className="tabular-nums text-brand-error">
                    {formatKRW(v.fare)} / 한도 {formatKRW(v.safeRateBaseFare)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          Icon={UserMinus}
          title="차주별 24h 취소 3건+"
          subtitle="DispatchAssign.cancelledAt 기준"
          count={driverCancels.length}
          accent="warning"
        >
          {driverCancels.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {driverCancels.map((d) => (
                <li
                  key={d.driverId}
                  className="flex items-center justify-between px-4 py-2 text-[12px]"
                >
                  <span className="font-mono text-slate-700">{d.driverCode}</span>
                  <span>{d.driverName}</span>
                  <span className="tabular-nums text-brand-warning">{d.cancelCount}건 취소</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          Icon={Smartphone}
          title="OTP 1h 10회+ 요청"
          subtitle="동일 phone 잠재 침해"
          count={otpAbuse.length}
          accent="error"
        >
          {otpAbuse.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {otpAbuse.map((a) => (
                <li
                  key={a.phone}
                  className="flex items-center justify-between px-4 py-2 text-[12px]"
                >
                  <span className="font-mono tabular-nums text-slate-700">{a.phone}</span>
                  <span className="tabular-nums text-brand-error">{a.count}회 요청</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          Icon={MapPin}
          title="동일 originAddress 5건+ 등록"
          subtitle="잠재 자동화/스팸"
          count={duplicateAddress.length}
          accent="warning"
        >
          {duplicateAddress.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {duplicateAddress.map((d) => (
                <li
                  key={d.originAddress}
                  className="flex items-center justify-between px-4 py-2 text-[12px]"
                >
                  <span className="text-slate-700">{d.originAddress}</span>
                  <span className="tabular-nums text-brand-warning">
                    {d.count}건 · 포워더 {d.forwarderUserIds.length}명
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}

const ACCENT_BG = {
  error: 'bg-rose-50 text-brand-error',
  warning: 'bg-amber-50 text-brand-warning',
  info: 'bg-sky-50 text-brand-info',
} as const;

function Section({
  Icon,
  title,
  subtitle,
  count,
  accent,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  count: number;
  accent: keyof typeof ACCENT_BG;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${ACCENT_BG[accent]}`}
          >
            <Icon className="size-[15px]" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-brand-navy">{title}</h2>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${count > 0 ? ACCENT_BG[accent] : 'bg-slate-100 text-slate-500'}`}
        >
          {count}건
        </span>
      </div>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="px-5 py-6 text-center text-[12px] text-slate-400">탐지 항목 없음</p>;
}
