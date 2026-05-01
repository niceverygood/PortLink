/**
 * Stage 2 DoD — 인증 E2E 3건.
 *
 * 사전조건: 시드 실행 (npm run seed), .env의 SEED_PASSWORD 일치.
 * dev server는 playwright config의 webServer가 자동 기동.
 *
 * OTP 캡처는 console 출력이 아닌 DB 직접 조회 (Mock provider라 가능).
 */
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
const prisma = new PrismaClient();

const FORWARDER_EMAIL = 'kim@hanjin-demo.kr';
const DRIVER_PHONE = '010-3000-0001';

test.beforeEach(async () => {
  // 테스트 격리: 직전 테스트가 발급한 OTP cooldown(1분)을 우회.
  await prisma.otpCode.deleteMany({ where: { phone: DRIVER_PHONE } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('포워더 — 이메일+비밀번호 로그인 → /forwarder/dashboard', async ({ page }) => {
  const password = process.env.SEED_PASSWORD;
  expect(password, 'SEED_PASSWORD가 .env에 있어야 함').toBeTruthy();

  await page.goto('/login');
  await page.getByRole('tab', { name: '담당자 로그인' }).click();
  await page.getByLabel('이메일').fill(FORWARDER_EMAIL);
  await page.getByLabel('비밀번호').fill(password!);
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL(/\/forwarder\/dashboard/, { timeout: 10_000 });
  // dashboard 헤딩 (Sidebar는 lg+에서만 보이므로 viewport 무관 검증)
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();
});

test('차주 — 휴대폰 OTP 로그인 → /driver/jobs', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('tab', { name: '차주 로그인' }).click();
  await page.getByLabel('휴대폰 번호').fill(DRIVER_PHONE);
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(page.getByText('인증번호가 발송되었습니다')).toBeVisible({ timeout: 5000 });

  // DB에서 가장 최근 활성 OTP 조회 (Mock provider 한정)
  const otp = await prisma.otpCode.findFirst({
    where: { phone: DRIVER_PHONE, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  expect(otp, 'DB에 OTP가 생성되어야 함').toBeTruthy();

  await page.getByLabel('인증번호 (6자리)').fill(otp!.code);
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL(/\/driver\/jobs/, { timeout: 10_000 });
  // 디자인 패스 후 헤딩이 "{N}건 대기중" 형식
  await expect(page.getByRole('heading', { name: /\d+건 대기중/ })).toBeVisible();
});

test('미인증 사용자가 /forwarder/dashboard 접근 → /login?kind=forwarder', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/forwarder/dashboard');
  await page.waitForURL(/\/login\?.*kind=forwarder/, { timeout: 5000 });
  await expect(page.getByText('담당자 로그인 후 이용 가능한 페이지입니다.')).toBeVisible();
});

test('미인증 사용자가 /driver/jobs 접근 → /login?kind=driver', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/driver/jobs');
  await page.waitForURL(/\/login\?.*kind=driver/, { timeout: 5000 });
  await expect(page.getByText('차주 로그인 후 이용 가능한 페이지입니다.')).toBeVisible();
});
