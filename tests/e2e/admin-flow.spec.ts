/**
 * Stage 6 DoD — 관리자 백오피스 풀 사이클 E2E.
 *
 * 시나리오:
 *   1. 관리자 로그인 → /admin/dashboard KPI 노출
 *   2. /admin/users 진입 → 시드 차주 1명 정지(ACTIVE → SUSPENDED) 검증
 *   3. /admin/dispatches → 진행중 trip이 없을 수 있어 KPI 표시만 검증
 *   4. /admin/anomaly → 4 섹션 카드 노출
 *   5. 정지된 차주는 OTP 통과해도 로그인 후 진입 불가 검증
 */
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@portlink.kr';
const TARGET_DRIVER_PHONE = '010-3000-0005'; // 강차주 (시드 #5)

test.beforeEach(async () => {
  // 차주 #5 상태를 ACTIVE로 복원, OTP 클리어
  const u = await prisma.user.findUnique({ where: { phone: TARGET_DRIVER_PHONE } });
  if (u) await prisma.user.update({ where: { id: u.id }, data: { status: 'ACTIVE' } });
  await prisma.otpCode.deleteMany({ where: { phone: TARGET_DRIVER_PHONE } });
});

test.afterAll(async () => {
  // 정리: 정지 시켰던 차주 다시 ACTIVE로
  const u = await prisma.user.findUnique({ where: { phone: TARGET_DRIVER_PHONE } });
  if (u) await prisma.user.update({ where: { id: u.id }, data: { status: 'ACTIVE' } });
  await prisma.$disconnect();
});

test('관리자 풀 사이클 — 로그인 → 회원 정지 → 차주 차단 검증', async ({ browser }) => {
  const adminCtx = await browser.newContext();
  const page = await adminCtx.newPage();

  // ── 1. 관리자 로그인
  await page.goto('/login');
  await page.getByRole('tab', { name: '담당자 로그인' }).click();
  await page.getByLabel('이메일').fill(ADMIN_EMAIL);
  await page.getByLabel('비밀번호').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: '로그인' }).click();
  // 관리자도 forwarder 라우팅되는데 layout에서 ADMIN 차단 안 함 — admin은 /admin/dashboard로 직접 이동
  await page.waitForURL(/\/forwarder\/dashboard/);

  // ── 2. /admin/dashboard 진입 + KPI 노출
  await page.goto('/admin/dashboard');
  await expect(page.getByRole('heading', { name: '시스템 대시보드' })).toBeVisible();
  // KPI 6종 중 하나라도 보이면 OK
  await expect(page.getByText('DAU (24h)')).toBeVisible();
  await expect(page.getByText('누적 GMV')).toBeVisible();

  // ── 3. /admin/users → 차주 #5 정지
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: '회원 관리' })).toBeVisible();

  // 휴대폰으로 검색 → 강차주 1행으로 좁힘
  await page.getByPlaceholder('이름 / 이메일 / 휴대폰 / 회사 검색').fill('010-3000-0005');
  await page.waitForTimeout(300);
  await expect(page.getByText('강차주').first()).toBeVisible();

  // 정지 버튼 클릭
  await page.getByRole('button', { name: '정지' }).first().click();
  await page.waitForTimeout(800); // server action + revalidate

  // DB 검증
  const after = await prisma.user.findUnique({ where: { phone: TARGET_DRIVER_PHONE } });
  expect(after?.status).toBe('SUSPENDED');

  // ── 4. /admin/dispatches → 헤딩 + KPI 노출
  await page.goto('/admin/dispatches');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '배차 모니터링' })).toBeVisible();
  // "매칭 대기"는 KpiCard label + 테이블 cell 양쪽에 노출 가능 → first()
  await expect(page.getByText('매칭 대기').first()).toBeVisible();

  // ── 5. /admin/anomaly → 4 섹션 노출
  await page.goto('/admin/anomaly');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: '이상 거래' })).toBeVisible();
  await expect(page.getByText('안전운임 한도 위반')).toBeVisible();
  await expect(page.getByText('차주별 24h 취소 3건+')).toBeVisible();
  await expect(page.getByText('OTP 1h 10회+ 요청')).toBeVisible();
  await expect(page.getByText('동일 originAddress 5건+ 등록')).toBeVisible();

  await adminCtx.close();

  // ── 6. 정지된 차주가 OTP 시도 → 로그인 후 진입 불가
  const driverCtx = await browser.newContext();
  const dPage = await driverCtx.newPage();
  await dPage.goto('/login');
  await dPage.getByRole('tab', { name: '차주 로그인' }).click();
  await dPage.getByLabel('휴대폰 번호').fill(TARGET_DRIVER_PHONE);
  await dPage.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(dPage.getByText('인증번호가 발송되었습니다')).toBeVisible({ timeout: 5000 });
  const otp = await prisma.otpCode.findFirst({
    where: { phone: TARGET_DRIVER_PHONE, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  await dPage.getByLabel('인증번호 (6자리)').fill(otp!.code);
  await dPage.getByRole('button', { name: '로그인' }).click();
  // SUSPENDED는 phone-otp authorize 단계에서 차단 → "인증번호가 올바르지 않거나 만료" 에러 표시
  await expect(dPage.getByText(/인증번호가 올바르지 않거나|로그인에 실패/)).toBeVisible({
    timeout: 5000,
  });

  await driverCtx.close();
});
