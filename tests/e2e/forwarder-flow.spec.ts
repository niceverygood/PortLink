/**
 * Stage 5 DoD — 포워더 풀 사이클 E2E.
 *
 * 시나리오:
 *   1. 포워더 로그인 → 대시보드 KPI 노출
 *   2. /forwarder/dispatch/new → 3-step 등록 → 신규 D26-NNNN 생성
 *   3. 차주(D-0001) 별도 context로 로그인 → 신규 배차 수락 → 5단계 진행 → 완료
 *   4. 포워더 → /forwarder/settlement에서 신규 정산 DRAFT 노출 → "확정 발행"
 *   5. 정산 상태 = CONFIRMED + 세금계산서 번호 노출 검증
 */
import { test, expect, type BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
const prisma = new PrismaClient();

const FORWARDER_EMAIL = 'kim@hanjin-demo.kr';
const DRIVER_PHONE = '010-3000-0001';

test.beforeEach(async () => {
  await prisma.otpCode.deleteMany({ where: { phone: DRIVER_PHONE } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

async function loginForwarder(ctx: BrowserContext, baseURL: string) {
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole('tab', { name: '담당자 로그인' }).click();
  await page.getByLabel('이메일').fill(FORWARDER_EMAIL);
  await page.getByLabel('비밀번호').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/forwarder\/dashboard/);
  return page;
}

async function loginDriverAndCompleteOrder(ctx: BrowserContext, baseURL: string, orderId: string) {
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole('tab', { name: '차주 로그인' }).click();
  await page.getByLabel('휴대폰 번호').fill(DRIVER_PHONE);
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(page.getByText('인증번호가 발송되었습니다')).toBeVisible({ timeout: 5000 });
  const otp = await prisma.otpCode.findFirst({
    where: { phone: DRIVER_PHONE, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  await page.getByLabel('인증번호 (6자리)').fill(otp!.code);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/driver\/jobs/);

  // 신규 주문 상세로 직접 이동
  await page.goto(`${baseURL}/driver/jobs/${orderId}`);
  await page.getByRole('button', { name: '지금 수락' }).click();
  await page.waitForURL(/\/driver\/trip\/[^/]+/);

  for (const label of ['출발했어요', '상차 완료', '이동 시작', '하차 완료', '운송 완료']) {
    await page.getByRole('button', { name: label }).click();
    await page.waitForTimeout(300);
  }
  await page.close();
}

test('포워더 풀 사이클 — 3-step 등록 → 차주 완료 → 정산 발행', async ({ browser, baseURL }) => {
  expect(baseURL).toBeTruthy();

  // ── 1. 포워더 로그인 + 대시보드 진입
  const fCtx = await browser.newContext();
  const fPage = await loginForwarder(fCtx, baseURL!);
  await expect(fPage.getByRole('heading', { name: '대시보드' })).toBeVisible();

  // ── 2. 새 배차 등록 3-Step
  await fPage.goto(`${baseURL}/forwarder/dispatch/new`);
  await expect(fPage.getByRole('heading', { name: '새 배차 등록' })).toBeVisible();

  // Step 1: 출발지
  await fPage.getByRole('combobox').first().click();
  await fPage.getByRole('option', { name: '경기 평택' }).click();
  await fPage.getByLabel('상세 주소').fill('E2E 시연용 한진센터');
  await fPage.getByRole('button', { name: '다음' }).click();

  // Step 2: 항만/차종/시각 — combobox 순서: 항만, 차종
  const combos = fPage.getByRole('combobox');
  await combos.first().click();
  await fPage.getByRole('option', { name: '부산항' }).click();
  await combos.last().click();
  await fPage.getByRole('option', { name: '40FT', exact: true }).click();
  // datetime-local: 내일 14:00
  const tomorrow = new Date(Date.now() + 24 * 3600_000);
  const dt = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T14:00`;
  await fPage.getByLabel('상차 희망 시각').fill(dt);
  await fPage.getByRole('button', { name: '다음' }).click();

  // Step 3: 운임
  await fPage.getByLabel('운임 (원)').fill('750000');
  await fPage.getByRole('button', { name: '배차 등록' }).click();
  // /forwarder/dispatch/<cuid> — 'new' 제외 (cuid는 영숫자 20자 이상)
  await fPage.waitForURL(/\/forwarder\/dispatch\/[a-z0-9]{20,}/);

  // 신규 주문 ID URL에서 추출
  const orderId = new URL(fPage.url()).pathname.split('/').pop()!;
  expect(orderId).toMatch(/^[a-z0-9]{20,}$/);

  // ── 3. 차주가 수락 + 완료까지 (별도 context)
  const dCtx = await browser.newContext();
  await loginDriverAndCompleteOrder(dCtx, baseURL!, orderId);
  await dCtx.close();

  // ── 4. 포워더 → 정산 페이지에서 발행
  await fPage.goto(`${baseURL}/forwarder/settlement`);
  await expect(fPage.getByRole('heading', { name: '정산' })).toBeVisible();

  // 가장 최근 DRAFT 정산을 발행 — page에서 "확정 발행" 버튼 첫 번째 클릭
  await fPage.getByRole('button', { name: '확정 발행' }).first().click();
  // 새로고침 후 발행 완료 뱃지가 1건 이상 보여야 함
  await fPage.waitForTimeout(500);
  await expect(fPage.getByText('발행 완료').first()).toBeVisible({ timeout: 5000 });

  // DB 검증: 가장 최근 정산이 CONFIRMED + TaxInvoice 존재
  const latest = await prisma.settlement.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { taxInvoice: true },
  });
  expect(latest?.status).toBe('CONFIRMED');
  expect(latest?.taxInvoice).toBeTruthy();

  await fCtx.close();
});

test('PWA forwarder manifest 200 응답', async ({ request }) => {
  const res = await request.get('/forwarder/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.name).toBe('PortLink');
  expect(json.theme_color).toBe('#0A2540');
  expect(json.start_url).toBe('/forwarder/dashboard');
});
