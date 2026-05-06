/**
 * 시뮬레이터 캡처 원본 5장 → 캡션 오버레이 + 사이즈별 정규화.
 *
 * 사용:
 *   1. 시뮬레이터에서 5장 캡처 → marketing/app-store/screenshots/raw/{1..5}.png 저장
 *   2. tsx marketing/app-store/screenshots-compose.ts
 *   3. composed/{6.5,6.9}/{1..5}.png 생성
 *
 * 입력은 디바이스 해상도와 무관 — 자동 fit + Orange/Navy 그라디언트 배경 + 캡션 합성.
 */
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';

const RAW_DIR = path.resolve('marketing/app-store/screenshots/raw');
const OUT_DIR = path.resolve('marketing/app-store/screenshots/composed');

interface Caption {
  top: string;
  bottom: string;
}

const CAPTIONS: Record<number, Caption> = {
  1: { top: '오늘 가능한 배차 한눈에', bottom: '예상 수익까지 함께 표시' },
  2: { top: '안전운임 이상인지 한 번에 확인', bottom: '국토교통부 고시 자동 반영' },
  3: { top: '주선사가 알려주지 않던 권리', bottom: '§14 공차 운행 청구 양식 자동 제공' },
  4: { top: '정산 내역 자동 정리', bottom: '세금계산서 자동 발급' },
  5: { top: '차주 본인 정보 안전 보관', bottom: '차량·자격증·계좌 한 번에 관리' },
};

const SIZES = {
  '6.5': { width: 1242, height: 2688 },
  '6.9': { width: 1290, height: 2796 },
};

function captionSvg(width: number, top: string, bottom: string) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 480" width="${width}" height="480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B35" stop-opacity="1"/>
      <stop offset="100%" stop-color="#E55A2B" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="480" fill="url(#g)"/>
  <text x="${width / 2}" y="200" text-anchor="middle"
        font-family="-apple-system, 'Pretendard', 'Apple SD Gothic Neo', sans-serif"
        font-weight="800" font-size="76" fill="#FFFFFF">${top}</text>
  <text x="${width / 2}" y="320" text-anchor="middle"
        font-family="-apple-system, 'Pretendard', 'Apple SD Gothic Neo', sans-serif"
        font-weight="500" font-size="44" fill="#FFFFFF" opacity="0.9">${bottom}</text>
</svg>`);
}

function bottomBarSvg(width: number) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 120" width="${width}" height="120">
  <rect width="${width}" height="120" fill="#0A2540"/>
  <text x="${width / 2}" y="74" text-anchor="middle"
        font-family="-apple-system, 'Pretendard', sans-serif"
        font-weight="700" font-size="40" fill="#FFFFFF">PortLink Driver</text>
</svg>`);
}

async function composeOne(srcPath: string, size: { width: number; height: number }, caption: Caption) {
  const captionTop = captionSvg(size.width, caption.top, caption.bottom);
  const bar = bottomBarSvg(size.width);

  // 본문 영역 = 전체 - top 480 - bottom 120
  const bodyHeight = size.height - 480 - 120;
  const body = await sharp(srcPath)
    .resize({ width: size.width, height: bodyHeight, fit: 'cover', position: 'top' })
    .toBuffer();

  return sharp({
    create: { width: size.width, height: size.height, channels: 4, background: '#FFFFFF' },
  })
    .composite([
      { input: captionTop, top: 0, left: 0 },
      { input: body, top: 480, left: 0 },
      { input: bar, top: size.height - 120, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`✗ 원본 폴더 없음: ${RAW_DIR}`);
    console.error(`  먼저 시뮬레이터 캡처 5장을 ${RAW_DIR}/{1..5}.png로 저장하세요.`);
    process.exit(1);
  }

  for (const [label, size] of Object.entries(SIZES)) {
    const outDir = path.join(OUT_DIR, label);
    fs.mkdirSync(outDir, { recursive: true });

    for (let i = 1; i <= 5; i++) {
      const src = path.join(RAW_DIR, `${i}.png`);
      if (!fs.existsSync(src)) {
        console.warn(`  - skip: ${src} 없음`);
        continue;
      }
      const caption = CAPTIONS[i];
      if (!caption) continue;
      const out = path.join(outDir, `${i}.png`);
      const buf = await composeOne(src, size, caption);
      fs.writeFileSync(out, buf);
      console.log(`  ✓ ${path.relative(process.cwd(), out)} (${(buf.length / 1024) | 0} KB)`);
    }
  }
  console.log('\n완료. App Store Connect Media Manager에 업로드.');
}

void main();
