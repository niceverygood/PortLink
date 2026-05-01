/**
 * /driver/me — 내 정보 + 차량 + 로그아웃.
 */
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DriverAvatar } from '@/components/portlink/DriverAvatar';
import { ContainerTypeIcon } from '@/components/portlink/ContainerTypeIcon';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const metadata = { title: '내 정보' };

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3');
}
function maskAccount(acc: string): string {
  if (acc.length <= 4) return acc;
  return acc.slice(0, 4) + '*'.repeat(Math.max(0, acc.length - 4));
}

export default async function DriverMePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      truckDriver: { include: { vehicles: { where: { isActive: true } }, carrier: true } },
    },
  });

  if (!user) redirect('/login?kind=driver');

  const driver = user.truckDriver;

  return (
    <main className="px-4 pb-6 pt-4">
      <header className="mb-4">
        <h1 className="text-h1 font-bold text-brand-navy">내 정보</h1>
      </header>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <DriverAvatar
          name={user.name}
          rating={driver ? Number(driver.rating) : undefined}
          vehicleType={driver?.vehicles[0]?.type}
          size="lg"
        />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-body-sm">
          <div>
            <dt className="text-caption text-slate-500">차주코드</dt>
            <dd className="mt-0.5 font-mono text-slate-900">{driver?.driverCode ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-caption text-slate-500">총 운송</dt>
            <dd className="mt-0.5 tabular-nums text-slate-900">{driver?.totalTrips ?? 0}건</dd>
          </div>
          <div>
            <dt className="text-caption text-slate-500">휴대폰</dt>
            <dd className="mt-0.5 tabular-nums text-slate-900">{maskPhone(user.phone)}</dd>
          </div>
          <div>
            <dt className="text-caption text-slate-500">자격증</dt>
            <dd className="mt-0.5 font-mono text-slate-900">{driver?.licenseNo ?? '-'}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-h2 font-semibold text-slate-900">차량</h2>
        {driver && driver.vehicles.length > 0 ? (
          <ul className="space-y-2">
            {driver.vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
              >
                <span className="font-medium text-slate-900">{v.plateNo}</span>
                <ContainerTypeIcon type={v.type} size="md" withLabel />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-slate-500">등록된 차량이 없습니다</p>
        )}
      </section>

      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-h2 font-semibold text-slate-900">계좌</h2>
        <div className="text-body-sm">
          <div className="text-slate-500">{driver?.bankName ?? '-'}</div>
          <div className="mt-0.5 font-mono text-slate-900">
            {driver?.bankAccount ? maskAccount(driver.bankAccount) : '-'}
          </div>
        </div>
        {driver?.carrier && (
          <div className="mt-3 border-t pt-3 text-body-sm">
            <div className="text-slate-500">소속 운송사</div>
            <div className="mt-0.5 text-slate-900">{driver.carrier.companyName}</div>
          </div>
        )}
      </section>

      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <Button type="submit" variant="outline" className="w-full">
          로그아웃
        </Button>
      </form>
    </main>
  );
}
