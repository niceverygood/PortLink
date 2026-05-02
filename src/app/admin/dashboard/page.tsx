/**
 * /admin/dashboard — 시스템 KPI 6종 + 최근 24h 활동.
 * KPI는 Server Component 즉시 계산 (Stage 7에서 client polling 도입 검토).
 */
import { redirect } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CircleDollarSign,
  ClipboardCheck,
  Truck,
  Users,
} from 'lucide-react';
import { TripStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/forwarder/Topbar';
import { KpiCard } from '@/components/forwarder/KpiCard';
import { formatKRW } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: '시스템 대시보드' };

const ACTIVITY_LABELS: Record<string, string> = {
  LOGIN: '로그인',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  STATUS_CHANGE: '상태 변경',
  PERMISSION: '권한 변경',
};

const ACTIVITY_DOT: Record<string, string> = {
  LOGIN: 'bg-brand-info',
  CREATE: 'bg-brand-success',
  UPDATE: 'bg-amber-500',
  DELETE: 'bg-brand-error',
  STATUS_CHANGE: 'bg-brand-orange',
  PERMISSION: 'bg-violet-500',
};

const ACTIVE_TRIP: TripStatus[] = [
  TripStatus.PENDING,
  TripStatus.DEPARTED,
  TripStatus.LOADED,
  TripStatus.IN_TRANSIT,
  TripStatus.UNLOADED,
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=admin');

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);

  const [dauLogins, cumGmv, activeTrips, activeDriverCount, draftSettlementCount, recentActivity] =
    await Promise.all([
      prisma.auditLog.findMany({
        where: { action: 'LOGIN', createdAt: { gte: since24h }, actorUserId: { not: null } },
        distinct: ['actorUserId'],
        select: { actorUserId: true },
      }),
      prisma.settlement.aggregate({ _sum: { fare: true, platformFee: true } }),
      prisma.trip.count({ where: { status: { in: ACTIVE_TRIP } } }),
      prisma.truckDriver.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.settlement.count({ where: { status: 'DRAFT' } }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: since24h } },
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  return (
    <>
      <Topbar title="시스템 대시보드" subtitle="실시간 시스템 KPI · 최근 24시간 기준" />
      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="DAU (24h)"
            value={String(dauLogins.length)}
            unit="명"
            Icon={Activity}
            accent="info"
            hint="LOGIN 기준 unique"
          />
          <KpiCard
            label="누적 GMV"
            value={formatKRW(cumGmv._sum.fare ?? 0)}
            Icon={CircleDollarSign}
            accent="success"
          />
          <KpiCard
            label="누적 수수료"
            value={formatKRW(cumGmv._sum.platformFee ?? 0)}
            Icon={CircleDollarSign}
            accent="navy"
            hint="런칭 5%"
          />
          <KpiCard
            label="진행중 배차"
            value={String(activeTrips)}
            unit="건"
            Icon={Truck}
            accent="orange"
          />
          <KpiCard
            label="활성 차주"
            value={String(activeDriverCount)}
            unit="명"
            Icon={Users}
            accent="success"
          />
          <KpiCard
            label="발행 대기 정산"
            value={String(draftSettlementCount)}
            unit="건"
            Icon={ClipboardCheck}
            accent="info"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-slate-100 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-[14px] font-bold text-brand-navy">
                최근 24시간 활동 ({recentActivity.length})
              </h2>
              <AlertTriangle className="size-4 text-slate-400" />
            </div>
            <ul className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <li className="px-5 py-8 text-center text-[13px] text-slate-400">활동 없음</li>
              ) : (
                recentActivity.map((log) => (
                  <li
                    key={String(log.id)}
                    className="flex items-center justify-between px-5 py-3 text-[13px]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-1.5 rounded-full ${ACTIVITY_DOT[log.action] ?? 'bg-slate-400'}`}
                      />
                      <span className="rounded bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {ACTIVITY_LABELS[log.action] ?? log.action}
                      </span>
                      <span className="text-slate-700">
                        {log.actor?.name ?? '시스템'} · {log.entity}
                      </span>
                    </div>
                    <span className="text-[11.5px] tabular-nums text-slate-500">
                      {log.createdAt.toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <aside className="rounded-xl border border-slate-100 bg-white p-5">
            <h2 className="mb-3 text-[12px] font-bold text-brand-navy">관리자 안내</h2>
            <ul className="space-y-2 text-[12px] text-slate-600">
              <li>· 회원 관리: 가입 신청 승인/정지</li>
              <li>· 배차 모니터링: 전체 배차 실시간 + 강제 취소</li>
              <li>· 이상 거래: 한도 위반/취소/OTP 어뷰즈/주소 중복</li>
              <li>· 모든 변경은 AuditLog 자동 기록</li>
            </ul>
          </aside>
        </div>
      </div>
    </>
  );
}
