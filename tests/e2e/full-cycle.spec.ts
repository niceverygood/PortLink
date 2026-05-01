/**
 * Stage 3 풀 사이클 E2E.
 *
 * 시나리오:
 *   1. 포워더 로그인 → POST /api/dispatch-orders 등록
 *   2. 차주(D-0001) 로그인 → GET /api/dispatch-orders (가용 배차에 포함 확인)
 *   3. 차주 → POST /api/dispatch-orders/:id/accept
 *   4. 차주 → PATCH /api/trips/:id/status DEPARTED → LOADED → IN_TRANSIT → UNLOADED → COMPLETED
 *   5. 포워더 → GET /api/settlements/preview?month=YYYY-MM (생성된 정산 1건 확인)
 *
 * 이 시나리오는 시드 데이터를 추가로 생성한다 (orderNo D26-NNNN 자동 증가).
 */
import { test, expect, type APIRequestContext, type BrowserContext } from '@playwright/test';
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

async function loginForwarder(context: BrowserContext, baseURL: string) {
  // Auth.js v5 credentials login via UI 우회 — 직접 콜백 호출
  // 가장 간단: 로그인 페이지 거쳐 실제 signIn 트리거
  const password = process.env.SEED_PASSWORD!;
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole('tab', { name: '담당자 로그인' }).click();
  await page.getByLabel('이메일').fill(FORWARDER_EMAIL);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/forwarder\/dashboard/);
  await page.close();
}

async function loginDriver(context: BrowserContext, baseURL: string, phone: string) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/login`);
  await page.getByRole('tab', { name: '차주 로그인' }).click();
  await page.getByLabel('휴대폰 번호').fill(phone);
  await page.getByRole('button', { name: '인증번호 받기' }).click();
  await expect(page.getByText('인증번호가 발송되었습니다')).toBeVisible();

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  expect(otp).toBeTruthy();
  await page.getByLabel('인증번호 (6자리)').fill(otp!.code);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL(/\/driver\/jobs/);
  await page.close();
}

async function jsonReq(
  req: APIRequestContext,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  body?: unknown,
) {
  const res = await req.fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    data: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status(), json };
}

test('풀 사이클 — 포워더 등록 → 차주 수락 → 운송 진행 → 완료 → 정산', async ({
  browser,
  baseURL,
}) => {
  expect(baseURL).toBeTruthy();

  // ── 1. 포워더로 로그인 + 배차 등록
  const fCtx = await browser.newContext();
  await loginForwarder(fCtx, baseURL!);
  const fApi = fCtx.request;

  const tomorrow = new Date(Date.now() + 24 * 3600_000).toISOString();
  const created = await jsonReq(fApi, 'POST', '/api/dispatch-orders', {
    originRegion: '경기 평택',
    originAddress: '풀사이클 E2E용 임시',
    port: 'BUSAN',
    containerType: 'FORTY_FT',
    pickupAt: tomorrow,
    fare: 750_000,
  });
  expect(created.status).toBe(201);
  const orderId = (created.json as { ok: true; data: { id: string; orderNo: string } }).data.id;
  const orderNo = (created.json as { ok: true; data: { id: string; orderNo: string } }).data
    .orderNo;
  expect(orderNo).toMatch(/^D26-\d{4}$/);

  // ── 2. 차주(D-0001)로 로그인 → 가용 배차에 포함 확인
  const dCtx = await browser.newContext();
  await loginDriver(dCtx, baseURL!, DRIVER_PHONE);
  const dApi = dCtx.request;

  const list = await jsonReq(dApi, 'GET', '/api/dispatch-orders');
  expect(list.status).toBe(200);
  const items = (list.json as { ok: true; data: Array<{ id: string }> }).data;
  expect(items.find((o) => o.id === orderId)).toBeDefined();

  // ── 3. 차주 수락 (응답 형식: { orderId, tripId })
  const accept = await jsonReq(dApi, 'POST', `/api/dispatch-orders/${orderId}/accept`);
  expect(accept.status).toBe(201);
  const tripId = (accept.json as { ok: true; data: { tripId: string } }).data.tripId;

  // ── 4. 상태 전환 PENDING → DEPARTED → LOADED → IN_TRANSIT → UNLOADED → COMPLETED
  for (const next of ['DEPARTED', 'LOADED', 'IN_TRANSIT', 'UNLOADED', 'COMPLETED']) {
    const r = await jsonReq(dApi, 'PATCH', `/api/trips/${tripId}/status`, { status: next });
    expect(r.status, `transition to ${next}`).toBe(200);
  }

  // ── 5. 정산 미리보기 (포워더 시야)
  const month = new Date().toISOString().slice(0, 7);
  const preview = await jsonReq(fApi, 'GET', `/api/settlements/preview?month=${month}`);
  expect(preview.status).toBe(200);
  const data = (
    preview.json as {
      ok: true;
      data: {
        count: number;
        totalFare: number;
        totalPlatformFee: number;
        totalDriverPayout: number;
        items: Array<{ trip: { dispatchOrder: { orderNo: string } } }>;
      };
    }
  ).data;
  // 새로 만든 주문이 정산에 잡혀야 함
  const found = data.items.find((s) => s.trip.dispatchOrder.orderNo === orderNo);
  expect(found, '풀사이클로 만든 정산이 미리보기에 포함').toBeDefined();
  // 합계 = fare = 750,000, platformFee = 37,500, driverPayout = 712,500 — 적어도 1건 이상
  expect(data.count).toBeGreaterThanOrEqual(1);

  await fCtx.close();
  await dCtx.close();
});
