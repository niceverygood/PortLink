/**
 * /driver/report — 미지급 신고서 페이지.
 *
 * 진입: /driver/report?orderId=... (위젯의 "신고서 만들기" 버튼)
 * 약정 < 법정 차액이 있을 때만 PDF 다운로드 활성. 면책 문구 3곳 포함.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, FileWarning } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { buildInvoiceData } from '@/lib/safe-freight/invoice-data';
import { ReportDownloadButton } from './ReportDownloadButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: '미지급 신고서' };

export default async function DriverReportPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');
  const sp = await searchParams;
  if (!sp.orderId) {
    return (
      <main className="mx-auto max-w-md px-5 py-8">
        <p className="text-[13px] text-slate-500">orderId 파라미터가 필요합니다.</p>
        <Link href="/driver/jobs" className="mt-4 inline-block text-brand-orange underline">
          배차 목록으로
        </Link>
      </main>
    );
  }

  // 차주 본인 trip만 허용
  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!driver) notFound();
  const own = await prisma.trip.findFirst({
    where: { dispatchOrderId: sp.orderId, driverId: driver.id },
    select: { id: true },
  });
  if (!own) {
    return (
      <main className="mx-auto max-w-md px-5 py-8">
        <p className="text-[13px] text-rose-700">본인이 수락한 배차만 신고할 수 있습니다.</p>
      </main>
    );
  }

  const built = await buildInvoiceData({ dispatchOrderId: sp.orderId });
  if (!built.ok) notFound();
  const { data } = built;
  const isShort = data.shortfallKrw > 0;

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="flex items-center justify-between bg-white px-5 pb-3 pt-3">
        <Link href={`/driver/jobs/${sp.orderId}`} aria-label="뒤로">
          <ArrowLeft className="size-[22px] text-brand-navy" />
        </Link>
        <p className="font-mono text-[13px] text-slate-500">신고서</p>
        <span className="w-[22px]" />
      </header>

      <section className="mx-5 mt-2 rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-4">
        <div className="flex items-center gap-2">
          <FileWarning className="size-5 text-rose-700" />
          <h1 className="text-[18px] font-bold text-rose-800">안전운임 미지급 신고서</h1>
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-rose-700">
          본 자료는 PortLink가 입력 데이터를 기반으로 자동 생성한 <strong>참고 자료</strong>입니다.
          실제 신고는 국토교통부 화물자동차 안전운임 신고센터에 차주님께서 직접 제출하셔야 합니다.
        </p>
      </section>

      <section className="mx-5 mt-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-[13px] font-bold text-brand-navy">자동 채워진 항목</h2>
        <Item label="배차 번호" value={data.dispatchOrder.orderNo} />
        <Item
          label="출발 → 도착"
          value={`${data.dispatchOrder.originRegion} → ${data.dispatchOrder.port}`}
        />
        <Item label="컨테이너" value={data.dispatchOrder.containerType} />
        <Item label="총 거리" value={`${data.safeFreight.distanceKm.toFixed(1)} km`} />
        <Item
          label="법정 최저액"
          value={`${data.safeFreight.finalConsignmentRateKrw.toLocaleString('ko-KR')}원`}
          bold
        />
        <Item label="약정 운임" value={`${data.dispatchOrder.fare.toLocaleString('ko-KR')}원`} />
        <Item
          label="부족액"
          value={`${data.shortfallKrw.toLocaleString('ko-KR')}원`}
          bold
          accent={isShort ? 'rose' : undefined}
        />
        {data.safeFreight.appliedSurcharges.length > 0 && (
          <Item
            label="적용 할증"
            value={data.safeFreight.appliedSurcharges.map((s) => s.code).join(', ')}
          />
        )}
        <Item label="데이터 출처" value={data.safeFreight.snapshotMeta.noticeNumber} small />
      </section>

      <section className="mx-5 mt-4 space-y-3">
        {isShort ? (
          <ReportDownloadButton orderId={sp.orderId} />
        ) : (
          <div className="rounded-xl bg-emerald-50 p-4 text-[13px] text-emerald-800">
            ✓ 약정 운임이 법정 최저액 이상입니다. 신고 대상이 아닙니다.
          </div>
        )}

        <p className="rounded-lg bg-slate-100 p-3 text-[10.5px] leading-relaxed text-slate-600">
          <strong>면책 고지</strong>
          <br />
          신고 여부와 신고 내용에 대한 책임은 차주 본인에게 있으며, PortLink는 신고 결과에 대해
          어떠한 법적 책임도 부담하지 않습니다.
        </p>
      </section>
    </main>
  );
}

function Item({
  label,
  value,
  bold,
  small,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  small?: boolean;
  accent?: 'rose';
}) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 text-[12.5px] last:border-0">
      <span className="text-slate-500">{label}</span>
      <span
        className={[
          'tabular-nums',
          bold ? 'font-bold' : '',
          small ? 'text-[10.5px] text-slate-500' : 'text-slate-800',
          accent === 'rose' ? 'text-rose-700' : '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
