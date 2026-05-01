/**
 * Stage 4 DoD — 차주 모바일 UI 풀 사이클 (브라우저 클릭).
 *
 * 시나리오:
 *   1. 차주(D-0001) OTP 로그인 → /driver/jobs 진입 (시드 #1 OPEN 노출)
 *   2. 시드 #1 카드 클릭 → 상세 페이지
 *   3. "지금 수락" → /driver/trip/[id] 리다이렉트
 *   4. 5단계 CTA 순차 클릭 → COMPLETED → 정산 화면
 *   5. /driver/me 내 정보 정상 노출
 *
 * 시드 #1은 `D26-0001` orderNo. 매 실행마다 시드 reset 필요.
 */
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
const prisma = new PrismaClient();

const DRIVER_PHONE = '010-3000-0001';

test.beforeEach(async () => {
  await prisma.otpCode.deleteMany({ where: { phone: DRIVER_PHONE } });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('차주 모바일 UI — 시드 #1 수락 → 5단계 진행 → 완료', async ({ page }) => {
  // 시드 #1을 OPEN으로 리셋 (이전 테스트가 ASSIGNED로 만들었을 수 있음)
  const seedOrder = await prisma.dispatchOrder.findUnique({ where: { orderNo: 'D26-0001' } });
  if (seedOrder) {
    await prisma.settlement.deleteMany({ where: { trip: { dispatchOrderId: seedOrder.id } } });
    await prisma.trip.deleteMany({ where: { dispatchOrderId: seedOrder.id } });
    await prisma.dispatchAssign.deleteMany({ where: { dispatchOrderId: seedOrder.id } });
    await prisma.dispatchOrder.update({
      where: { id: seedOrder.id },
      data: { status: 'OPEN' },
    });
  }

  // ── 1. 로그인
  await page.goto('/login');
  await page.getByRole('tab', { name: '차주 로그인' }).click();
  await page.getByLabel('휴대폰 번호').fill(DRIVER_PHONE);
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(page.getByText('인증번호가 발송되었습니다')).toBeVisible({ timeout: 5000 });
  const otp = await prisma.otpCode.findFirst({
    where: { phone: DRIVER_PHONE, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  expect(otp).toBeTruthy();
  await page.getByLabel('인증번호 (6자리)').fill(otp!.code);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/driver\/jobs/);

  // ── 2. /driver/jobs에서 시드 #1 카드 보임
  await expect(page.getByRole('heading', { name: '가용 배차' })).toBeVisible();
  const card = page.getByText('D26-0001').first();
  await expect(card).toBeVisible();
  await card.click();

  // ── 3. 상세 페이지에서 "지금 수락"
  await expect(page.getByRole('heading', { name: '경기 이천' })).toBeVisible();
  await page.getByRole('button', { name: '지금 수락' }).click();
  await page.waitForURL(/\/driver\/trip\/[^/]+/);

  // ── 4. 5단계 CTA 순차 클릭
  for (const label of ['출발했어요', '상차 완료', '이동 시작', '하차 완료', '운송 완료']) {
    await page.getByRole('button', { name: label }).click();
    // refresh 기반이라 잠깐 기다림
    await page.waitForTimeout(300);
  }

  // 완료 후 "정산 확인" 링크 노출
  await expect(page.getByRole('link', { name: '정산 확인' })).toBeVisible({ timeout: 5000 });
  await page.getByRole('link', { name: '정산 확인' }).click();
  await page.waitForURL(/\/driver\/settlement/);

  // ── 5. 정산 화면 — D26-0001 항목이 보여야 함
  await expect(page.getByText('D26-0001').first()).toBeVisible();
  await expect(page.getByText('차주 수령').first()).toBeVisible();

  // ── 6. /driver/me 진입
  await page.getByRole('link', { name: '내 정보' }).click();
  await page.waitForURL(/\/driver\/me/);
  await expect(page.getByText('이차주').first()).toBeVisible();
  await expect(page.getByText('D-0001')).toBeVisible();
});

test('PWA manifest는 인증 없이 200 응답', async ({ request }) => {
  const res = await request.get('/driver/manifest.webmanifest');
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.name).toBe('PortLink Driver');
  expect(json.theme_color).toBe('#FF6B35');
  expect(json.start_url).toBe('/driver/jobs');
  expect(Array.isArray(json.icons)).toBe(true);
  expect(json.icons.length).toBeGreaterThan(0);
});
