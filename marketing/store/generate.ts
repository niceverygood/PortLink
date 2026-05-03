/**
 * 스토어 자산 자동 생성 — Puppeteer로 HTML 템플릿을 PNG로 export.
 *
 * 실행: npm run marketing:store
 *
 * 출력:
 *   marketing/store/output/google-play/
 *   marketing/store/output/app-store/
 *
 * 사이즈 (CLAUDE.md §10):
 *   - Apple icon 1024x1024 / Google icon 512x512
 *   - Google feature graphic 1024x500
 *   - Apple iPhone 6.7" 1290x2796 / Google phone 1080x1920
 */
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer, { type Browser, type Page } from 'puppeteer';

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
  screenshotConfig?: {
    pill?: string;
    headline?: string;
    subline?: string;
    screenHtml: string;
  };
  /** Apple 아이콘은 알파 채널 금지 → JPG로도 대비. */
  omitAlpha?: boolean;
}

// ─────────────────────────────────────────────
// Phone screenshot 8장의 콘텐츠 — 차주 PWA 화면 미니 재현
// ─────────────────────────────────────────────

const SCREENSHOTS: Array<{
  filename: string;
  pill: string;
  headline: string;
  subline: string;
  screenHtml: string;
}> = [
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
          <div style="display:flex; align-items:flex-start; gap:1.5vw;">
            <span class="badge-warn" style="background:#FFE5D9; color:#FF6B35">⚡ 긴급</span>
          </div>
          <div class="card-row" style="margin-top:1vh">
            <div>
              <div class="card-label">운임 · D26-0003</div>
              <div class="card-value">75만원</div>
            </div>
            <span class="badge-warn" style="background:#0A2540; color:#fff">40FT</span>
          </div>
          <div class="route-box">
            <div class="place">
              <div class="l">출발</div>
              <div class="n">이천</div>
            </div>
            <div class="arrow">▶</div>
            <div class="place">
              <div class="l">도착</div>
              <div class="n">부산항</div>
            </div>
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
          <span class="tabular" style="opacity:0.6">D26-0024</span>
        </div>
        <div class="label">예상 수익</div>
        <div class="big-num tabular">712,500원</div>
      </div>
      <div class="driver-body">
        <div class="card card-warn">
          <div style="display:flex; gap:1.5vw; align-items:flex-start">
            <div style="width:5vw; height:5vw; background:#FEE2E2; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#BE123C; font-size:2.4vh">⚠</div>
            <div style="flex:1">
              <div class="card-label" style="color:#BE123C; font-weight:700">법정 최저 안전위탁운임</div>
              <div class="card-value tabular" style="color:#BE123C; font-size:3.4vh">★ 985,300원</div>
              <div style="margin-top:0.6vh; font-size:1.5vh; color:#7c3aed">
                현재 약정: <strong>750,000원</strong>
              </div>
              <div style="margin-top:1vh; font-size:1.7vh; font-weight:800; color:#BE123C">
                ⚠️ 법정 최소액보다 235,300원 부족
              </div>
            </div>
          </div>
          <div style="display:flex; gap:1.5vw; margin-top:1.5vh">
            <button style="flex:1; background:#fff; border:1px solid #cbd5e1; padding:1.2vh; border-radius:10px; font-size:1.4vh; font-weight:600; color:#334155">상세 내역</button>
            <button style="flex:1; background:#BE123C; color:#fff; padding:1.2vh; border-radius:10px; font-size:1.4vh; font-weight:800">📄 신고서 만들기</button>
          </div>
        </div>
        <div class="card">
          <div class="card-label">출발 → 도착</div>
          <div style="font-weight:700; color:#0A2540; margin-top:0.4vh">경기 이천 → 부산항</div>
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
          <span class="tabular" style="opacity:0.6">D26-0029</span>
        </div>
        <div class="label">운임</div>
        <div class="big-num tabular">832,000원</div>
      </div>
      <div class="driver-body">
        <div class="card card-success">
          <div style="display:flex; gap:1.5vw; align-items:flex-start">
            <div style="width:5vw; height:5vw; background:#D1FAE5; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#047857; font-size:2.4vh">📄</div>
            <div style="flex:1">
              <div class="card-label" style="color:#047857; font-weight:700">안전운임 제14조 안내</div>
              <div style="margin-top:0.4vh; font-size:1.7vh; font-weight:800; color:#064e3b">
                직전 운송지에서 28.4km 빈 차로 이동하셨네요.
              </div>
              <div style="margin-top:0.8vh; font-size:1.5vh; color:#065f46">
                안전운임 §14에 따라 화주 또는 운수사업자에게
                <strong style="font-size:2.2vh"> 215,000원</strong>의 공차 보상을 청구하실 권리가 있습니다.
              </div>
              <div style="margin-top:0.8vh; font-size:1.5vh; color:#065f46; font-weight:700">
                청구 여부는 차주님이 직접 판단하셔서 진행하세요.
              </div>
            </div>
          </div>
          <button style="width:100%; background:#047857; color:#fff; padding:1.4vh; border-radius:12px; font-size:1.5vh; font-weight:800; margin-top:1.5vh">
            📥 청구서 양식 다운로드
          </button>
          <div style="margin-top:0.8vh; font-size:1.1vh; color:#065f46; opacity:0.8; line-height:1.4">
            ※ PortLink는 청구를 대신 발송하지 않습니다.<br>양식만 제공하며, 청구 책임은 차주 본인에게 있습니다.
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
          <span class="tabular" style="opacity:0.6">D26-0014</span>
        </div>
        <div class="label">현재 단계</div>
        <div class="big-num">상차 완료</div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div class="card-label" style="margin-bottom:1.4vh">운송 진행</div>
          <div class="timeline">
            <div class="step done"></div>
            <div class="step done"></div>
            <div class="step done"></div>
            <div class="step active"></div>
            <div class="step"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:1vh; font-size:1.1vh; color:#64748b">
            <span>수락</span><span>출발</span><span>상차</span><span>이동</span><span>완료</span>
          </div>
        </div>
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start">
            <div>
              <div class="card-label">운임</div>
              <div class="card-value tabular">983,000원</div>
            </div>
            <span class="badge-warn" style="background:#0A2540; color:#fff">40FT</span>
          </div>
          <div class="route-box">
            <div class="place">
              <div class="l">출발</div>
              <div class="n">평택</div>
            </div>
            <div class="arrow">▶</div>
            <div class="place">
              <div class="l">도착</div>
              <div class="n">부산신항</div>
            </div>
          </div>
        </div>
        <div class="cta-button">하차 완료 →</div>
        <div style="text-align:center; font-size:1.1vh; color:#64748b; margin-top:0.6vh">
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
          <div class="card-label" style="font-weight:700; color:#0A2540; margin-bottom:1vh">최근 정산</div>
          <div style="display:flex; flex-direction:column; gap:1.4vh">
            <div style="display:flex; justify-content:space-between; padding-bottom:1vh; border-bottom:1px solid #f1f5f9">
              <div>
                <div style="font-size:1.4vh; font-weight:700; color:#0A2540">D26-0011</div>
                <div style="font-size:1.2vh; color:#64748b">평택 → 부산신항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:1.8vh; font-weight:900; color:#047857">+712,500원</div>
                <span class="badge-success">✓ 입금</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; padding-bottom:1vh; border-bottom:1px solid #f1f5f9">
              <div>
                <div style="font-size:1.4vh; font-weight:700; color:#0A2540">D26-0017</div>
                <div style="font-size:1.2vh; color:#64748b">청주 → 부산항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:1.8vh; font-weight:900; color:#047857">+938,000원</div>
                <span class="badge-success">✓ 입금</span>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between">
              <div>
                <div style="font-size:1.4vh; font-weight:700; color:#0A2540">D26-0024</div>
                <div style="font-size:1.2vh; color:#64748b">이천 → 부산항</div>
              </div>
              <div style="text-align:right">
                <div class="tabular" style="font-size:1.8vh; font-weight:900; color:#0A2540">712,500원</div>
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
          <span class="tabular" style="opacity:0.6">D26-0024</span>
        </div>
        <div class="label">부족액</div>
        <div class="big-num tabular">235,300원</div>
      </div>
      <div class="driver-body">
        <div class="card card-warn">
          <div class="card-label" style="color:#BE123C; font-weight:700">자동 채워진 항목</div>
          <div style="margin-top:1vh; display:flex; flex-direction:column; gap:0.8vh; font-size:1.4vh">
            <div style="display:flex; justify-content:space-between; padding:0.6vh 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">출발 → 도착</span>
              <span style="font-weight:700; color:#0A2540">경기 이천 → 부산항</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:0.6vh 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">총 거리</span>
              <span class="tabular" style="font-weight:700">383.3 km</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:0.6vh 0; border-bottom:1px solid rgba(190,18,60,0.15)">
              <span style="color:#64748b">법정 최저액</span>
              <span class="tabular" style="font-weight:900; color:#BE123C">985,300원</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:0.6vh 0">
              <span style="color:#64748b">약정 운임</span>
              <span class="tabular" style="font-weight:700">750,000원</span>
            </div>
          </div>
        </div>
        <button style="background:#BE123C; color:#fff; padding:2.2vh; border-radius:14px; text-align:center; font-size:1.8vh; font-weight:900; margin-top:1vh">
          📥 신고서 PDF 다운로드
        </button>
        <div style="background:#F1F5F9; padding:1.4vh; border-radius:10px; font-size:1.1vh; line-height:1.5; color:#475569">
          <strong>면책 고지</strong><br />
          신고 여부와 신고 내용에 대한 책임은 차주 본인에게 있으며, PortLink는 신고 결과에 대해 어떠한 법적 책임도 부담하지 않습니다.
        </div>
      </div>
    `,
  },

  // 7. 안전운임 공개 계산기 — "비회원도 가능" 마케팅
  {
    filename: '07-calculator',
    pill: '🧮 비회원도 사용',
    headline: '운임이 얼마인지<br /><span>30초 안에 확인</span>',
    subline: '거리·항만·할증 입력만',
    screenHtml: `
      <div class="driver-hero">
        <div class="brand-row">
          <strong>안전운임 계산기</strong>
          <span style="background:#FF6B35; padding:0.6vh 1.2vw; border-radius:8px; font-size:1.2vh; font-weight:700">차주 가입</span>
        </div>
        <div class="label">국토교통부고시 제2026-55호</div>
        <div style="font-size:2vh; margin-top:0.4vh; font-weight:600">법정 최저액 즉시 계산</div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div style="display:flex; flex-direction:column; gap:1.2vh">
            <div>
              <div style="font-size:1.2vh; font-weight:700; color:#0A2540; margin-bottom:0.4vh">편도 거리</div>
              <div style="background:#F1F5F9; padding:1vh 2vw; border-radius:8px; font-size:1.6vh; font-weight:700; color:#0A2540" class="tabular">380 km</div>
            </div>
            <div>
              <div style="font-size:1.2vh; font-weight:700; color:#0A2540; margin-bottom:0.4vh">컨테이너</div>
              <div style="background:#F1F5F9; padding:1vh 2vw; border-radius:8px; font-size:1.4vh; color:#334155">40FT (부산신항 출발)</div>
            </div>
          </div>
        </div>
        <div class="card card-success">
          <div class="card-label" style="color:#047857; font-weight:700">차주 수령액 (안전위탁운임)</div>
          <div class="card-value tabular" style="color:#047857; font-size:3.6vh; margin-top:0.4vh">★ 985,300원</div>
        </div>
        <div class="card" style="background:#EFF6FF">
          <div class="card-label" style="color:#0369a1; font-weight:700">화주 청구액 (안전운송운임)</div>
          <div class="card-value tabular" style="color:#0369a1; font-size:2.6vh">1,130,600원</div>
          <div style="font-size:1.2vh; color:#0369a1; margin-top:0.4vh">마진 145,300원</div>
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
          <strong style="font-size:2.4vh">PortLink Driver</strong>
        </div>
        <div style="text-align:center; margin-top:1.5vh">
          <div style="font-size:1.5vh; opacity:0.9">PortLink는</div>
          <div style="font-size:2.4vh; font-weight:900; line-height:1.3; margin-top:0.6vh">
            다른 주선사가 알려주지 않던<br />차주님의 권리를 알려드립니다
          </div>
        </div>
      </div>
      <div class="driver-body">
        <div class="card">
          <div style="display:flex; flex-direction:column; gap:1.6vh">
            <div style="display:flex; gap:2vw; align-items:center">
              <div style="width:5vw; height:5vw; background:#FFE5D9; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.2vh">⚡</div>
              <div>
                <div style="font-size:1.5vh; font-weight:700; color:#0A2540">1-Click 배차 수락</div>
                <div style="font-size:1.2vh; color:#64748b">200ms 안에 응답</div>
              </div>
            </div>
            <div style="display:flex; gap:2vw; align-items:center">
              <div style="width:5vw; height:5vw; background:#FEE2E2; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.2vh">★</div>
              <div>
                <div style="font-size:1.5vh; font-weight:700; color:#0A2540">안전운임 자동 검증</div>
                <div style="font-size:1.2vh; color:#64748b">법정 최저액 즉시 비교</div>
              </div>
            </div>
            <div style="display:flex; gap:2vw; align-items:center">
              <div style="width:5vw; height:5vw; background:#D1FAE5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.2vh">📄</div>
              <div>
                <div style="font-size:1.5vh; font-weight:700; color:#0A2540">신고서 · §14 양식 PDF</div>
                <div style="font-size:1.2vh; color:#64748b">차주가 직접 결정</div>
              </div>
            </div>
            <div style="display:flex; gap:2vw; align-items:center">
              <div style="width:5vw; height:5vw; background:#DBEAFE; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.2vh">🚫</div>
              <div>
                <div style="font-size:1.5vh; font-weight:700; color:#0A2540">광고비 정렬 X</div>
                <div style="font-size:1.2vh; color:#64748b">차주 이익 기준 추천만</div>
              </div>
            </div>
          </div>
        </div>
        <div class="cta-button" style="font-size:2.2vh">차주 가입하고 시작 →</div>
      </div>
    `,
  },
];

// 모든 export 스펙 빌드
function buildSpecs(): ExportSpec[] {
  const specs: ExportSpec[] = [];

  // 아이콘 — Apple 1024 + Google 512
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

  // Phone screenshots 8장 × 2 사이즈 (Google 1080×1920, Apple 1290×2796)
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
    });
    specs.push({
      template: 'screenshot.html',
      width: 1290,
      height: 2796,
      outDir: OUT_APPLE,
      filename: `phone-${s.filename}-1290x2796.png`,
      screenshotConfig: {
        pill: s.pill,
        headline: s.headline,
        subline: s.subline,
        screenHtml: s.screenHtml,
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

  // Pretendard 웹폰트 로드 대기 (CSS @import)
  await page.evaluateHandle('document.fonts.ready');

  if (spec.screenshotConfig) {
    await page.evaluate((cfg) => {
      const fn = (window as unknown as { __setContent?: (c: typeof cfg) => void }).__setContent;
      if (fn) fn(cfg);
    }, spec.screenshotConfig);
    // re-render 대기
    await new Promise((r) => setTimeout(r, 200));
  }

  const outPath = join(spec.outDir, spec.filename);
  await page.screenshot({
    path: outPath as `${string}.png`,
    type: 'png',
    omitBackground: false,
    clip: { x: 0, y: 0, width: spec.width, height: spec.height },
  });

  // Apple 아이콘은 알파 채널 금지 → JPG로 추가 export (최종 업로드용)
  if (spec.omitAlpha) {
    const jpgPath = outPath.replace(/\.png$/, '.jpg');
    await page.screenshot({
      path: jpgPath as `${string}.jpg`,
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: 0, width: spec.width, height: spec.height },
    });
  }

  await page.close();
  console.log(`  ✓ ${spec.filename} (${spec.width}×${spec.height})`);
}

async function main() {
  console.log('🎨 PortLink Driver 스토어 자산 생성 시작\n');

  await mkdir(OUT_GOOGLE, { recursive: true });
  await mkdir(OUT_APPLE, { recursive: true });

  // _shared.css 존재 확인
  await readFile(join(TEMPLATES, '_shared.css'));

  const specs = buildSpecs();
  console.log(`총 ${specs.length}개 자산 export 예정\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const googleSpecs = specs.filter((s) => s.outDir === OUT_GOOGLE);
  const appleSpecs = specs.filter((s) => s.outDir === OUT_APPLE);

  console.log(`📱 Google Play (${googleSpecs.length}):`);
  for (const s of googleSpecs) await exportSpec(browser, s);

  console.log(`\n🍎 Apple App Store (${appleSpecs.length}):`);
  for (const s of appleSpecs) await exportSpec(browser, s);

  await browser.close();

  console.log('\n✅ 완료');
  console.log(`   ${OUT_GOOGLE}`);
  console.log(`   ${OUT_APPLE}`);
}

main().catch((e) => {
  console.error('❌ 실패', e);
  process.exit(1);
});
