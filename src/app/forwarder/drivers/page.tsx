/**
 * /forwarder/drivers — 협력 차주 풀.
 * 시스템 활성 차주 + 본인 의뢰를 수락한 적 있는 차주 표시.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Topbar } from '@/components/forwarder/Topbar';
import { DriverAvatar } from '@/components/portlink/DriverAvatar';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';

export const dynamic = 'force-dynamic';
export const metadata = { title: '협력 차주' };

export default async function DriversPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=forwarder');

  const drivers = await prisma.truckDriver.findMany({
    where: { user: { status: 'ACTIVE' } },
    include: {
      user: true,
      vehicles: { where: { isActive: true } },
      trips: {
        where: { dispatchOrder: { forwarderUserId: session.user.id } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { rating: 'desc' },
  });

  return (
    <>
      <Topbar title="차주 풀" subtitle={`시스템 활성 차주 ${drivers.length}명`} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="rounded-xl border border-slate-100 bg-white">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-caption uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 text-left">차주</th>
                <th className="px-4 py-2 text-left">차주코드</th>
                <th className="px-4 py-2 text-left">차종</th>
                <th className="px-4 py-2 text-right">평점</th>
                <th className="px-4 py-2 text-right">총 운송</th>
                <th className="px-4 py-2 text-left">최근 협력</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const lastWith = d.trips[0]?.createdAt ?? null;
                return (
                  <tr key={d.id} className="border-b">
                    <td className="px-4 py-3">
                      <DriverAvatar name={d.user.name} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono text-caption text-slate-700">
                      {d.driverCode}
                    </td>
                    <td className="px-4 py-3">
                      {d.vehicles[0] ? (
                        <ContainerTypeIcon type={d.vehicles[0].type} size="sm" withLabel />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(d.rating).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{d.totalTrips}건</td>
                    <td className="px-4 py-3 text-slate-600">
                      {lastWith
                        ? lastWith.toLocaleDateString('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
