/**
 * /driver/onboarding — 자격증 + 은행정보 입력.
 * 가입 직후 자동 이동, 또는 화물 수락 시 INCOMPLETE_PROFILE 가드에서 리다이렉트.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OnboardingForm } from './onboarding-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: '차주 정보 등록' };

export default async function DriverOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?kind=driver');
  if (session.user.role !== UserRole.DRIVER) redirect('/');

  const params = await searchParams;
  const forced = params.reason === 'accept-blocked';

  const driver = await prisma.truckDriver.findUnique({
    where: { userId: session.user.id },
    select: { licenseNo: true, bankName: true, bankAccount: true, driverCode: true },
  });
  if (!driver) redirect('/driver/jobs');

  const allFilled = Boolean(driver.licenseNo && driver.bankName && driver.bankAccount);
  if (allFilled && !forced) redirect('/driver/jobs');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
      <Link href="/" className="mb-6 text-center text-h1 font-bold text-brand-orange">
        PortLink Driver
      </Link>
      <h1 className="mb-2 text-h2 font-semibold">차주 정보 등록</h1>
      <p className="mb-6 text-body text-slate-600">
        {forced
          ? '화물 수락에는 화물자동차 운수사업법에 따라 자격증 + 정산용 계좌가 필요합니다. 한 번만 입력하시면 됩니다.'
          : `${driver.driverCode} 회원님, 환영합니다. 화물 수락 전 1회 입력이 필요한 항목입니다 (법정 절차).`}
      </p>
      <OnboardingForm skippable={!forced} />
    </main>
  );
}
