/**
 * 스토어 자산 자동 생성 — Puppeteer로 HTML 템플릿을 PNG로 export.
 *
 * 실행: npm run marketing:store
 *
 * 출력:
 *   marketing/store/output/google-play/   (1080×1920 base — 정확한 9:16)
 *   marketing/store/output/app-store/     (Google base를 sharp로 1290×2796 contain + navy padding)
 *
 * 사이즈 (CLAUDE.md §10):
 *   - Apple icon 1024×1024 / Google icon 512×512
 *   - Google feature graphic 1024×500
 *   - Apple iPhone 6.7" 1290×2796 / Google phone 1080×1920
 */
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import sharp from 'sharp';

const ROOT = resolve(__dirname);
const TEMPLATES = join(ROOT, 'templates');
const OUT_GOOGLE = join(ROOT, 'output', 'google-play');
const OUT_APPLE = join(ROOT, 'output', 'app-store');

interface ExportSpec {
  template: 'icon.html' | 'feature-graphic.html' | 'screenshot.html';
  width: number;
  height: number;
  outDir: string;
  filename: string;
  /** screenshot.html 만 사용. window.__setContent 호출 인자. */
  screenshotConfig?: ScreenshotContent;
  /** Apple 아이콘은 알파 채널 금지 → JPG로도 대비. */
  omitAlpha?: boolean;
  /** 캡처 후 별도 사이즈로 contain resize (Apple 폰 스크린샷용). */
  resizeTo?: { width: number; height: number; outDir: string; filename: string };
}

interface ScreenshotContent {
  pill?: string;
  headline?: string;
  subline?: string;
  screenHtml: string;
}

// 폰 안 콘텐츠 — px-fixed (1080×1920 base에 맞춰)
const SCREENSHOTS: Array<ScreenshotContent & { filename: string }> = [
  // 1. 타이틀 + 오늘 가능한 배차
  {
    filename: '01-hero',
    pill: '⚡ 컨테이너 차주 전용',
    headline: '빈 차로<br /><span>돌아가지 마세요</span>',
    subline: '오늘 배차 한 번에 확인',
    screenHtml: `
      <div class="driver-hero">
        <div class="brand-row">
          <strong>PortLink</strong>
          <span>🔔</span>
        </div>
        <div class="label">오늘 가능한 배차</div>
        <div class="big-num">6건 대기중</div>
        <div class="driver-stats">
          <div class="stat">
            <div class="k">예상 수익</div>
            <div class="v tabular">3,230,000원</div>
          </div>
          <div class="stat urgent">
            <div class="k">긴급</div>
            <div class="v">2건</div>
          </div>
        </div>
      </div>
      <div class="driver-body">
        <div class="card card-urgent">
          <span class="badge-warn" style="background:#FFE5D9; color:#FF6B35">⚡ 긴급</span>
          <div class="card-row" style="margin-top:14px">
            <div>
              <div class="card-label">운임 · D26-0003</div>
              <div class="card-value">75만원</div>
            </div>
            <span class="badge-warn" style="background:#0A2540; color:#fff; padding:6px 12px; font-size:14px">40FT</span>
          </div>
          <div class="route-box">
            <div class="place"><div class="l">출발</div><div class="n">이천</div></div>
            <div class="arrow">▶</div>
            <div class="place"><div class="l">도착</div><div class="n">부산항</div></div>
          </div>
        </div>
      </div>
    `,
  },

  // 2. 안전운임 검증 위젯
  {
    filename: '02-safe-freight-verify',
    pill: '★ 안전운임 자동 검증',
    headline: '내가 받아야 할<br /><span>최저액 자동 비교</span>',
    subline: '약정 부족하면 즉시 경고',
    screenHtml: `
      <div class="driver-hero" style="background:linear-gradient(135deg,#0A2540 0%,#061B2E 100%)">
        <div class="brand-row">
          <strong>← 배차 상세</strong>
          <span class="tabular" style="opacity:0.6; font-size:18px">D26-0024</span>
        </div>
        <div class="label">예상 수익</div>
        <div class="big-num tabular">712,500원</div>
      </div>
      <div class="driver-body">
        <div class="card card-warn">
          <div class="card-label" style="color:#BE123C; font-weight:800; font-size:16px">법정 최저 안전위탁운임</div>
          <div class="card-value tabular" style="color:#BE123C; font-size:42px; margin-top:6px; white-space:nowrap">★ 985,300원</div>
          <div style="margin-top:8px; font-size:18px; color:#475569">
            현재 약정: <strong style="color:#0A2540">750,000원</strong>
          </div>
          <div style="margin-top:10px; font-size:20px; font-weight:800; color:#BE123C; white-space:nowrap">
            ⚠️ 235,300원 부족
          </div>
          <div style="display:flex; gap:10px; margin-top:18px">
            <button style="flex:1; background:#fff; border:1px solid #cbd5e1; padding:14px; border-radius:12px; font-size:16px; font-weight:700; color:#334155">상세 내역</button>
            <button style="flex:1.4; background:#BE123C; color:#fff; padding:14px; border-radius:12px; font-size:16px; font-weight:800; white-space:nowrap">📄 신고서 만들기</button>
          </div>
        </div>
      </div>
    `,
  },

  // 3. §14 공차 보상 안내
  {
    filename: '03-empty-run-notice',
    pill: '💡 안전운임 §14',
    headline: '공차 운행 보상<br /><span>차주님께 안내</span>',
    subline: '다른 주선사가 알려주지 않던 권리',
    screenHtml: `
      <div class="driver-hero">
        <div class="brand-row">
          <strong>← 운송 진행</strong>
          <span class="tabular" style="opacity:0.6; font-size:18px">D26-0029</span>
        </div>
        <div class="label">운임</div>
        <div class="big-num tabular">832,000원</div>
      </div>
      <div class="driver-body">
        <div class="card card-success">
          <div class="card-label" style="color:#047857; font-weight:800; font-size:16px">💡 안전운임 제14조 안내</div>
          <div style="margin-top:6px; font-size:22px; font-weight:800; color:#064e3b">
            직전 운송지에서 28.4km<br>빈 차로 이동하셨네요.
          </div>
          <div style="margin-top:12px; font-size:17px; color:#065f46; line-height:1.5">
            안전운임 §14에 따라 화주 또는 운수사업자에게
            <strong style="font-size:24px; white-space:nowrap"> 215,000원</strong>의<br>
            공차 보상을 청구하실 권리가 있습니다.
          </div>
          <div style="margin-top:10px; font-size:16px; font-weight:700; color:#065f46">
            청구 여부는 차주님이 직접 판단하셔서 진행하세요.
          </div>
          <button style="width:100%; background:#047857; color:#fff; padding:18px; border-radius:14px; font-size:18px; font-weight:800; margin-top:16px; white-space:nowrap">
            📥 청구서 양식 다운로드
          </button>
          <div style="margin-top:10px; font-size:13px; color:#065f46; opacity:0.8; line-height:1.4">
            ※ PortLink는 청구를 대신 발송하지 않습니다.<br>
            양식만 제공하며, 청구 책임은 차주 본인에게 있습니다.
          </div>
        </div>
      </div>
    `,
  },

  // 4. Trip 진행
  {
    filename: '04-trip-progress',
    pill: '📦 운송 진행 중',
    headline: '한 번의 탭으로<br /><span>상태 보고</span>',
    subline: '출발·상차·하차·완료',
    screenHtml: `
      <div class="driver-hero">
        <div class="brand-row">
          <strong>← 진행중 운송</strong>
          <span class="tabular" style="opacity:0.6; font-size:18px">D26-0014</span>
        </div>
        <div class="label">현재 단계</div>
        <div class="big-num">상차 완료</div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div class="card-label" style="margin-bottom:14px">운송 진행</div>
          <div class="timeline">
            <div class="step done"></div>
            <div class="step done"></div>
            <div class="step done"></div>
            <div class="step active"></div>
            <div class="step"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:13px; color:#64748b">
            <span>수락</span><span>출발</span><span>상차</span><span>이동</span><span>완료</span>
          </div>
        </div>
        <div class="card">
          <div class="card-row">
            <div>
              <div class="card-label">운임</div>
              <div class="card-value tabular">983,000원</div>
            </div>
            <span class="badge-warn" style="background:#0A2540; color:#fff; padding:6px 12px; font-size:14px">40FT</span>
          </div>
          <div class="route-box">
            <div class="place"><div class="l">출발</div><div class="n">평택</div></div>
            <div class="arrow">▶</div>
            <div class="place"><div class="l">도착</div><div class="n">부산신항</div></div>
          </div>
        </div>
        <div class="cta-button">하차 완료 →</div>
        <div style="text-align:center; font-size:13px; color:#64748b; margin-top:6px">
          위치는 액션 시점 1회만 기록 (백그라운드 추적 X)
        </div>
      </div>
    `,
  },

  // 5. 정산
  {
    filename: '05-settlement',
    pill: '💰 정산 명세',
    headline: '한눈에 보는<br /><span>이번 달 수익</span>',
    subline: 'KRW 정수, 깨끗한 계산',
    screenHtml: `
      <div class="driver-hero" style="background:linear-gradient(135deg,#047857 0%,#065F46 100%)">
        <div class="brand-row">
          <strong>정산</strong>
          <span>📊</span>
        </div>
        <div class="label">이번 달 누적 수령</div>
        <div class="big-num tabular">12,840,000원</div>
        <div class="driver-stats">
          <div class="stat">
            <div class="k">완료 운송</div>
            <div class="v tabular">17건</div>
          </div>
          <div class="stat">
            <div class="k">대기 정산</div>
            <div class="v tabular">3건</div>
          </div>
        </div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div class="card-label" style="font-weight:700; color:#0A2540; margin-bottom:14px; font-size:17px">최근 정산</div>
          <div style="display:flex; flex-direction:column; gap:14px">
            <div style="display:flex; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid #f1f5f9">
              <div>
                <div style="font-size:16px; font-weight:700; color:#0A2540">D26-0011</div>
                <div style="font-size:14px; color:#64748b">평택 → 부산신항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:20px; font-weight:900; color:#047857; white-space:nowrap">+712,500원</div>
                <span class="badge-success">✓ 입금</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:12px; border-bottom:1px solid #f1f5f9">
              <div>
                <div style="font-size:16px; font-weight:700; color:#0A2540">D26-0017</div>
                <div style="font-size:14px; color:#64748b">청주 → 부산항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:20px; font-weight:900; color:#047857; white-space:nowrap">+938,000원</div>
                <span class="badge-success">✓ 입금</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between">
              <div>
                <div style="font-size:16px; font-weight:700; color:#0A2540">D26-0024</div>
                <div style="font-size:14px; color:#64748b">이천 → 부산항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:20px; font-weight:900; color:#0A2540; white-space:nowrap">712,500원</div>
                <span class="badge-warn" style="background:#FEF3C7; color:#92400e">대기</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  },

  // 6. 신고서 PDF
  {
    filename: '06-report-pdf',
    pill: '📄 미지급 신고',
    headline: '받지 못한 안전운임,<br /><span>신고서 1-Click</span>',
    subline: '차주가 직접 결정·작성',
    screenHtml: `
      <div class="driver-hero" style="background:linear-gradient(135deg,#BE123C 0%,#7c2d3a 100%)">
        <div class="brand-row">
          <strong>← 신고서</strong>
          <span class="tabular" style="opacity:0.6; font-size:18px">D26-0024</span>
        </div>
        <div class="label">부족액</div>
        <div class="big-num tabular" style="white-space:nowrap">235,300원</div>
      </div>
      <div class="driver-body">
        <div class="card card-warn">
          <div class="card-label" style="color:#BE123C; font-weight:800; font-size:16px">자동 채워진 항목</div>
          <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px; font-size:16px">
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">출발 → 도착</span>
              <span style="font-weight:700; color:#0A2540">이천 → 부산항</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">총 거리</span>
              <span class="tabular" style="font-weight:700">383.3 km</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">법정 최저액</span>
              <span class="tabular" style="font-weight:900; color:#BE123C; white-space:nowrap">985,300원</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0">
              <span style="color:#64748b">약정 운임</span>
              <span class="tabular" style="font-weight:700; white-space:nowrap">750,000원</span>
            </div>
          </div>
        </div>
        <button style="background:#BE123C; color:#fff; padding:22px; border-radius:16px; text-align:center; font-size:20px; font-weight:900; margin-top:6px; border:none; white-space:nowrap">
          📥 신고서 PDF 다운로드
        </button>
        <div style="background:#F1F5F9; padding:14px; border-radius:12px; font-size:13px; line-height:1.5; color:#475569">
          <strong>면책 고지</strong><br />
          신고 책임은 차주 본인에게 있으며, PortLink는 신고 결과에 대해 어떠한 법적 책임도 부담하지 않습니다.
        </div>
      </div>
    `,
  },

  // 7. 안전운임 공개 계산기
  {
    filename: '07-calculator',
    pill: '🧮 비회원도 사용',
    headline: '운임이 얼마인지<br /><span>30초 안에 확인</span>',
    subline: '거리·항만·할증 입력만',
    screenHtml: `
      <div class="driver-hero">
        <div class="brand-row">
          <strong>안전운임 계산기</strong>
          <span style="background:#FF6B35; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:700">차주 가입</span>
        </div>
        <div class="label">국토교통부고시 제2026-55호</div>
        <div style="font-size:24px; margin-top:6px; font-weight:700">법정 최저액 즉시 계산</div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div style="display:flex; flex-direction:column; gap:14px">
            <div>
              <div style="font-size:14px; font-weight:700; color:#0A2540; margin-bottom:6px">편도 거리</div>
              <div style="background:#F1F5F9; padding:12px 16px; border-radius:10px; font-size:18px; font-weight:700; color:#0A2540" class="tabular">380 km</div>
            </div>
            <div>
              <div style="font-size:14px; font-weight:700; color:#0A2540; margin-bottom:6px">컨테이너</div>
              <div style="background:#F1F5F9; padding:12px 16px; border-radius:10px; font-size:16px; color:#334155">40FT (부산신항 출발)</div>
            </div>
          </div>
        </div>
        <div class="card card-success">
          <div class="card-label" style="color:#047857; font-weight:800; font-size:16px">차주 수령액 (안전위탁운임)</div>
          <div class="card-value tabular" style="color:#047857; font-size:44px; margin-top:6px; white-space:nowrap">★ 985,300원</div>
        </div>
        <div class="card" style="background:#EFF6FF">
          <div class="card-label" style="color:#0369a1; font-weight:800; font-size:16px">화주 청구액 (안전운송운임)</div>
          <div class="card-value tabular" style="color:#0369a1; font-size:32px; white-space:nowrap">1,130,600원</div>
          <div style="font-size:14px; color:#0369a1; margin-top:4px">마진 145,300원</div>
        </div>
      </div>
    `,
  },

  // 8. 마무리 CTA
  {
    filename: '08-cta',
    pill: '🚀 지금 시작',
    headline: '차주님 수입을<br /><span>지키는 가장 빠른 방법</span>',
    subline: '가입 30초 · 수수료 5%',
    screenHtml: `
      <div class="driver-hero" style="background:linear-gradient(135deg,#FF6B35 0%,#E55A2B 100%)">
        <div class="brand-row" style="justify-content:center">
          <strong style="font-size:28px">PortLink Driver</strong>
        </div>
        <div style="text-align:center; margin-top:20px">
          <div style="font-size:17px; opacity:0.9">PortLink는</div>
          <div style="font-size:26px; font-weight:900; line-height:1.4; margin-top:6px">
            다른 주선사가 알려주지 않던<br />차주님의 권리를 알려드립니다
          </div>
        </div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div style="display:flex; flex-direction:column; gap:18px">
            <div style="display:flex; gap:14px; align-items:center">
              <div style="width:48px; height:48px; background:#FFE5D9; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px">⚡</div>
              <div>
                <div style="font-size:17px; font-weight:800; color:#0A2540">1-Click 배차 수락</div>
                <div style="font-size:14px; color:#64748b">200ms 안에 응답</div>
              </div>
            </div>
            <div style="display:flex; gap:14px; align-items:center">
              <div style="width:48px; height:48px; background:#FEE2E2; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px">★</div>
              <div>
                <div style="font-size:17px; font-weight:800; color:#0A2540">안전운임 자동 검증</div>
                <div style="font-size:14px; color:#64748b">법정 최저액 즉시 비교</div>
              </div>
            </div>
            <div style="display:flex; gap:14px; align-items:center">
              <div style="width:48px; height:48px; background:#D1FAE5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px">📄</div>
              <div>
                <div style="font-size:17px; font-weight:800; color:#0A2540">신고서 · §14 양식 PDF</div>
                <div style="font-size:14px; color:#64748b">차주가 직접 결정</div>
              </div>
            </div>
            <div style="display:flex; gap:14px; align-items:center">
              <div style="width:48px; height:48px; background:#DBEAFE; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px">🚫</div>
              <div>
                <div style="font-size:17px; font-weight:800; color:#0A2540">광고비 정렬 X</div>
                <div style="font-size:14px; color:#64748b">차주 이익 기준 추천만</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cta-button" style="font-size:24px">차주 가입하고 시작 →</div>
      </div>
    `,
  },
];

const APPLE_NAVY_BG = { r: 10, g: 37, b: 64, alpha: 1 };

function buildSpecs(): ExportSpec[] {
  const specs: ExportSpec[] = [];

  // 아이콘 — 단일 사이즈 직접 캡처
  specs.push({
    template: 'icon.html',
    width: 1024,
    height: 1024,
    outDir: OUT_APPLE,
    filename: 'app-icon-1024.png',
    omitAlpha: true,
  });
  specs.push({
    template: 'icon.html',
    width: 512,
    height: 512,
    outDir: OUT_GOOGLE,
    filename: 'app-icon-512.png',
  });

  // Feature graphic — Google만
  specs.push({
    template: 'feature-graphic.html',
    width: 1024,
    height: 500,
    outDir: OUT_GOOGLE,
    filename: 'feature-graphic-1024x500.png',
  });

  // Phone screenshots — 1080×1920로만 캡처. Apple 1290×2796은 sharp resize.
  for (const s of SCREENSHOTS) {
    specs.push({
      template: 'screenshot.html',
      width: 1080,
      height: 1920,
      outDir: OUT_GOOGLE,
      filename: `phone-${s.filename}-1080x1920.png`,
      screenshotConfig: {
        pill: s.pill,
        headline: s.headline,
        subline: s.subline,
        screenHtml: s.screenHtml,
      },
      resizeTo: {
        width: 1290,
        height: 2796,
        outDir: OUT_APPLE,
        filename: `phone-${s.filename}-1290x2796.png`,
      },
    });
  }

  return specs;
}

async function exportSpec(browser: Browser, spec: ExportSpec): Promise<void> {
  const page: Page = await browser.newPage();
  await page.setViewport({
    width: spec.width,
    height: spec.height,
    deviceScaleFactor: 1,
  });

  const templatePath = join(TEMPLATES, spec.template);
  const url = pathToFileURL(templatePath).toString();
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  if (spec.screenshotConfig) {
    await page.evaluate((cfg) => {
      const fn = (window as unknown as { __setContent?: (c: typeof cfg) => void }).__setContent;
      if (fn) fn(cfg);
    }, spec.screenshotConfig);
    await new Promise((r) => setTimeout(r, 200));
  }

  const outPath = join(spec.outDir, spec.filename);
  await page.screenshot({
    path: outPath as `${string}.png`,
    type: 'png',
    omitBackground: false,
    clip: { x: 0, y: 0, width: spec.width, height: spec.height },
  });

  if (spec.omitAlpha) {
    const jpgPath = outPath.replace(/\.png$/, '.jpg');
    await page.screenshot({
      path: jpgPath as `${string}.jpg`,
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: 0, width: spec.width, height: spec.height },
    });
  }

  // Apple용 resize — sharp contain + navy padding으로 비율 맞춤
  if (spec.resizeTo) {
    const targetPath = join(spec.resizeTo.outDir, spec.resizeTo.filename);
    await sharp(outPath)
      .resize(spec.resizeTo.width, spec.resizeTo.height, {
        fit: 'contain',
        background: APPLE_NAVY_BG,
      })
      .png({ compressionLevel: 9 })
      .toFile(targetPath);
  }

  await page.close();
  console.log(`  ✓ ${spec.filename} (${spec.width}×${spec.height})`);
  if (spec.resizeTo) {
    console.log(
      `    → ${spec.resizeTo.filename} (${spec.resizeTo.width}×${spec.resizeTo.height} via sharp)`,
    );
  }
}

async function main() {
  console.log('🎨 PortLink Driver 스토어 자산 생성 시작\n');

  await mkdir(OUT_GOOGLE, { recursive: true });
  await mkdir(OUT_APPLE, { recursive: true });
  await readFile(join(TEMPLATES, '_shared.css'));

  const specs = buildSpecs();
  const totalAssets = specs.length + specs.filter((s) => s.resizeTo).length;
  console.log(`총 ${totalAssets}개 자산 export 예정\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log(`📱 Phase 1: Puppeteer 캡처 (${specs.length}개)`);
  for (const s of specs) await exportSpec(browser, s);

  await browser.close();

  console.log('\n✅ 완료');
  console.log(`   Google Play: ${OUT_GOOGLE}`);
  console.log(`   Apple App Store: ${OUT_APPLE}`);
}

main().catch((e) => {
  console.error('❌ 실패', e);
  process.exit(1);
});
