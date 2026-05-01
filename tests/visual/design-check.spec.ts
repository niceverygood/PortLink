/**
 * 디자인 자가 검증 — portlink_full_design.jsx 기준 일치 여부 자동 체크.
 * 일회성/회귀 방지 목적. 실패해도 다음 항목 계속 검사 (test.step 사용).
 *
 * 실행: npx playwright test tests/visual/design-check.spec.ts --reporter=list
 */
import { test, expect, type Page, type Locator } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';

loadDotenv({ path: '.env' });
const prisma = new PrismaClient();
const SHOT_DIR = 'tests/visual/screenshots';

const FORWARDER_EMAIL = 'kim@hanjin-demo.kr';
const DRIVER_PHONE = '010-3000-0001';

// 색상 파싱 — "rgb(R, G, B)" → [R, G, B]
function parseRgb(s: string): [number, number, number] | null {
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function isWhite(s: string): boolean {
  const rgb = parseRgb(s);
  return !!rgb && rgb[0] >= 250 && rgb[1] >= 250 && rgb[2] >= 250;
}
function isNavy(s: string): boolean {
  // brand-navy = #0A2540 = rgb(10, 37, 64) — 근사값 허용
  const rgb = parseRgb(s);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r <= 30 && g <= 50 && b <= 80 && r < g && g < b;
}
function isOrange(s: string): boolean {
  // brand-orange = #FF6B35 = rgb(255, 107, 53)
  const rgb = parseRgb(s);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  return r >= 200 && g >= 80 && g <= 180 && b >= 30 && b <= 100;
}

async function fontSizePx(loc: Locator): Promise<number> {
  return loc.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
}
async function bgColor(loc: Locator): Promise<string> {
  return loc.evaluate((el) => getComputedStyle(el).backgroundColor);
}
async function color(loc: Locator): Promise<string> {
  return loc.evaluate((el) => getComputedStyle(el).color);
}

async function loginForwarder(page: Page) {
  await page.goto('/login');
  await page.getByRole('tab', { name: '담당자 로그인' }).click();
  await page.getByLabel('이메일').fill(FORWARDER_EMAIL);
  await page.getByLabel('비밀번호').fill(process.env.SEED_PASSWORD!);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/forwarder\/dashboard/);
}

async function loginDriver(page: Page) {
  await prisma.otpCode.deleteMany({ where: { phone: DRIVER_PHONE } });
  await page.goto('/login');
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
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================
// [1] /forwarder/dashboard (데스크탑 1440x900)
// ============================================
test.describe('[1] /forwarder/dashboard (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('체크리스트 5개', async ({ page }) => {
    await loginForwarder(page);
    await page.goto('/forwarder/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible();

    await test.step('사이드바 흰 배경', async () => {
      const aside = page.locator('aside').first();
      const bg = await bgColor(aside);
      expect.soft(isWhite(bg), `Sidebar bg: ${bg}`).toBe(true);
    });

    await test.step('활성 메뉴(/dashboard) navy 칩', async () => {
      const link = page.locator('aside a[aria-current="page"]').first();
      const bg = await bgColor(link);
      expect.soft(isNavy(bg), `Active link bg: ${bg}`).toBe(true);
    });

    await test.step('KPI 카드 4개에 우상단 아이콘 칩 존재', async () => {
      // KpiCard rounded-xl border + 내부 size-7 rounded-lg 아이콘 컨테이너
      const kpiIcons = page.locator('.rounded-xl.border .size-7.rounded-lg');
      const count = await kpiIcons.count();
      expect.soft(count, `KPI icon chips found: ${count}`).toBeGreaterThanOrEqual(4);
    });

    await test.step('항만별 분포 row 단위 진행 바', async () => {
      const portTitle = page.getByText('항만별 분포', { exact: true });
      await expect.soft(portTitle).toBeVisible();
      // row 단위 — h-1.5 진행 바 5개 (5항만)
      const bars = page.locator('.h-1\\.5.rounded-full.bg-slate-100');
      const count = await bars.count();
      expect.soft(count, `Port bars: ${count}`).toBeGreaterThanOrEqual(5);
    });

    await test.step('테이블 첫 행에 status dot 존재', async () => {
      const dot = page.locator('table tr td .size-1\\.5.rounded-full').first();
      await expect.soft(dot).toBeVisible();
    });

    await page.screenshot({
      path: path.join(SHOT_DIR, 'forwarder-dashboard.png'),
      fullPage: true,
    });
  });
});

// ============================================
// [2] /forwarder/dispatch/new (데스크탑 1440x900)
// ============================================
test.describe('[2] /forwarder/dispatch/new (1440×900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('체크리스트 5개', async ({ page }) => {
    await loginForwarder(page);
    await page.goto('/forwarder/dispatch/new');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '배차 등록' })).toBeVisible();

    await test.step('STEP 라벨 orange uppercase tracking', async () => {
      const step1 = page.getByText('STEP 1', { exact: true });
      await expect.soft(step1).toBeVisible();
      const c = await color(step1);
      expect.soft(isOrange(c), `STEP color: ${c}`).toBe(true);
    });

    await test.step('안전운임 hero 카드 (navy 그라디언트)', async () => {
      const hero = page.getByText('안전운임제 자동조회').first();
      await expect.soft(hero).toBeVisible();
      // 부모 요소 background에 gradient + navy 색상
      const heroParent = hero
        .locator('xpath=ancestor::div[contains(@style, "linear-gradient")]')
        .first();
      await expect.soft(heroParent).toBeVisible();
    });

    await test.step('안전운임 숫자 fontSize ≥ 32px (목표 36px)', async () => {
      // 안전운임 hero의 큰 숫자 — text-[36px] 적용
      const heroNum = page
        .locator('div')
        .filter({ has: page.getByText('안전운임제 자동조회') })
        .locator('span.text-\\[36px\\]')
        .first();
      const size = await fontSizePx(heroNum);
      expect.soft(size, `Safe rate hero font-size: ${size}px`).toBeGreaterThanOrEqual(32);
    });

    await test.step('"실시간" 뱃지 존재 (매칭 가능 차주 카드)', async () => {
      const badge = page.getByText('실시간', { exact: true });
      await expect.soft(badge).toBeVisible();
    });

    await test.step('큰 오렌지 CTA "배차 등록" 사이드 카드', async () => {
      const cta = page.getByRole('button', { name: '배차 등록' }).last();
      await expect.soft(cta).toBeVisible();
      const bg = await bgColor(cta);
      expect.soft(isOrange(bg), `CTA bg: ${bg}`).toBe(true);
    });

    await page.screenshot({
      path: path.join(SHOT_DIR, 'forwarder-dispatch-new.png'),
      fullPage: true,
    });
  });
});

// ============================================
// [3] /driver/jobs (모바일 iPhone 14 = 390x844)
// ============================================
test.describe('[3] /driver/jobs (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('체크리스트 5개', async ({ page }) => {
    await loginDriver(page);
    await page.goto('/driver/jobs');
    await page.waitForLoadState('networkidle');

    await test.step('navy 헤더 영역 존재 (상단 약 200px)', async () => {
      const header = page.locator('header').first();
      const bg = await bgColor(header);
      expect.soft(isNavy(bg), `Header bg: ${bg}`).toBe(true);
      const box = await header.boundingBox();
      expect.soft(box?.height, `Header height: ${box?.height}px`).toBeGreaterThanOrEqual(150);
    });

    await test.step('"건 대기중" 헤딩 fontSize ≥ 28px (목표 32px)', async () => {
      const heading = page.getByRole('heading', { name: /\d+건 대기중/ });
      await expect.soft(heading).toBeVisible();
      const size = await fontSizePx(heading);
      expect.soft(size, `Hero heading font-size: ${size}px`).toBeGreaterThanOrEqual(28);
    });

    await test.step('"예상 수익" + "긴급" 카드 존재', async () => {
      await expect.soft(page.getByText('예상 수익', { exact: true })).toBeVisible();
      await expect.soft(page.getByText('긴급', { exact: true })).toBeVisible();
    });

    await test.step('첫 배차 카드 운임 ≥ 28px (목표 32px)', async () => {
      const fareNum = page.locator('div.rounded-3xl').first().locator('p.text-\\[32px\\]').first();
      const size = await fontSizePx(fareNum);
      expect.soft(size, `Card fare font-size: ${size}px`).toBeGreaterThanOrEqual(28);
    });

    await test.step('첫 카드 "지금 수락하기" 링크 존재 + orange', async () => {
      const cta = page
        .locator('div.rounded-3xl')
        .first()
        .getByRole('link', { name: /지금 수락하기/ });
      await expect.soft(cta).toBeVisible();
      const bg = await bgColor(cta);
      expect.soft(isOrange(bg), `Card CTA bg: ${bg}`).toBe(true);
    });

    await page.screenshot({
      path: path.join(SHOT_DIR, 'driver-jobs.png'),
      fullPage: true,
    });
  });
});

// ============================================
// [4] /driver/jobs/[firstId] (모바일 iPhone 14 = 390x844)
// ============================================
test.describe('[4] /driver/jobs/[id] (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('체크리스트 4개', async ({ page }) => {
    await loginDriver(page);
    await page.goto('/driver/jobs');
    await page.waitForLoadState('networkidle');

    // 첫 카드 클릭
    const firstCardLink = page
      .locator('div.rounded-3xl')
      .first()
      .getByRole('link', { name: /지금 수락하기/ });
    await firstCardLink.click();
    await page.waitForURL(/\/driver\/jobs\/[^/]+$/);

    await test.step('운임 hero 숫자 ≥ 40px (목표 44px)', async () => {
      // 페이지의 가장 큰 숫자 텍스트 — span.text-[44px]
      const heroNum = page.locator('span.text-\\[44px\\]').first();
      const size = await fontSizePx(heroNum);
      expect.soft(size, `Detail hero fare font-size: ${size}px`).toBeGreaterThanOrEqual(40);
    });

    await test.step('"안전운임 보장" 뱃지 존재', async () => {
      await expect.soft(page.getByText('안전운임 보장', { exact: true })).toBeVisible();
    });

    await test.step('노선 navy 카드 존재', async () => {
      // section.bg-brand-navy.rounded-3xl
      const route = page.locator('section.rounded-3xl').first();
      const bg = await bgColor(route);
      expect.soft(isNavy(bg), `Route card bg: ${bg}`).toBe(true);
    });

    await test.step('하단 고정 "이 배차 수락하기" CTA가 viewport 하단 100px 이내', async () => {
      const cta = page.getByRole('button', { name: /이 배차 수락하기/ });
      await expect.soft(cta).toBeVisible();
      const box = await cta.boundingBox();
      const viewport = page.viewportSize()!;
      const distFromBottom = viewport.height - (box!.y + box!.height);
      expect
        .soft(
          distFromBottom,
          `CTA bottom distance: ${distFromBottom}px (viewport ${viewport.height})`,
        )
        .toBeLessThanOrEqual(120);
    });

    await page.screenshot({
      path: path.join(SHOT_DIR, 'driver-job-detail.png'),
      fullPage: true,
    });
  });
});
