/**
 * 2026년 적용 화물자동차 안전운임 시드 데이터
 *
 * 출처: 국토교통부고시 제2026-55호 (2026.01.30 고시)
 * 시행: 2026.02.01 ~ 2026.12.31 (1년 유효기간)
 * 적용: 수출입 컨테이너 (시멘트는 별도 시드 파일)
 *
 * ⚠️ 중요:
 * - 유효기간이 1년이므로 2027년 시행 시 새 고시 확보하여 safeFreight2027.ts 생성 필요
 * - 운임은 부가가치세 미포함
 * - 운임은 십원 단위 반올림, 거리는 km 첫째자리에서 반올림
 * - 거리 측정: 네이버지도(거리우선, 차종 5종, 4축 이상, 특수화물차), 오전 06시 기준
 */

export const SAFE_FREIGHT_META = {
  effectiveFrom: new Date('2026-02-01'),
  effectiveTo: new Date('2026-12-31'),
  noticeNumber: '국토교통부고시 제2026-55호',
  noticeDate: new Date('2026-01-30'),
  vatIncluded: false,
} as const;

/**
 * 항만별 대표터미널 내 운송거리 (제35조)
 * 최종 거리 계산: 기점-종점 간 거리 + 해당 항만의 터미널 내 거리
 */
export const TERMINAL_INNER_DISTANCE_KM = {
  BUSAN_OLD_PORT: 3.3, // 부산북항(신선대)
  BUSAN_NEW_PORT: 3.3, // 부산신항(HMMPSA, HPNT)
  INCHEON_PORT: 1.0, // 인천항(ICT)
  INCHEON_NEW_PORT: 2.0, // 인천신항(한진)
  INCHEON_PASSENGER: 2.0, // 인천국제여객터미널
  GWANGYANG_PORT: 4.0, // 광양항(한국국제터미널, 허치슨)
  PYEONGTAEK_PORT: 2.0, // 평택항
  ULSAN_OLD_PORT: 1.0, // 울산구항
  ULSAN_NEW_PORT: 2.0, // 울산신항
  POHANG_PORT: 1.5, // 포항항
  GUNSAN_PORT: 2.0, // 군산항
  MASAN_PORT: 1.2, // 마산항
  DAESAN_PORT: 1.0, // 대산항
  UIWANG_ICD: 2.0, // 의왕ICD(제1터미널)
} as const;

/**
 * 거리(km)별 왕복운임표
 * 각 row: [구간거리km, 안전위탁운임40FT, 운수사업자간운임40FT, 안전운송운임40FT, 안전위탁운임20FT, 운수사업자간운임20FT, 안전운송운임20FT]
 *
 * 사용법:
 * - 단방향 거리(편도) 기준으로 입력 (왕복운임이 자동 적용됨)
 * - 거리는 km 첫째자리에서 반올림한 값으로 매칭
 * - 표에 없는 거리는 보간(interpolation) 또는 가까운 값 사용
 */
export type FreightRateRow = {
  km: number; // 구간거리(편도, km)
  consignment40ft: number; // 안전위탁운임 40FT (운송사→차주)
  interCarrier40ft: number; // 운수사업자 간 운임 40FT
  transport40ft: number; // 안전운송운임 40FT (화주→운송사)
  consignment20ft: number; // 안전위탁운임 20FT
  interCarrier20ft: number; // 운수사업자 간 운임 20FT
  transport20ft: number; // 안전운송운임 20FT
};

export const DISTANCE_RATE_TABLE: FreightRateRow[] = [
  {
    km: 1,
    consignment40ft: 125_300,
    interCarrier40ft: 135_500,
    transport40ft: 146_500,
    consignment20ft: 108_500,
    interCarrier20ft: 117_600,
    transport20ft: 127_400,
  },
  {
    km: 2,
    consignment40ft: 128_300,
    interCarrier40ft: 138_500,
    transport40ft: 149_500,
    consignment20ft: 111_000,
    interCarrier20ft: 120_100,
    transport20ft: 129_900,
  },
  {
    km: 3,
    consignment40ft: 131_700,
    interCarrier40ft: 142_000,
    transport40ft: 153_200,
    consignment20ft: 113_600,
    interCarrier20ft: 122_800,
    transport20ft: 132_800,
  },
  {
    km: 4,
    consignment40ft: 134_700,
    interCarrier40ft: 145_200,
    transport40ft: 156_500,
    consignment20ft: 116_500,
    interCarrier20ft: 125_900,
    transport20ft: 136_000,
  },
  {
    km: 5,
    consignment40ft: 137_500,
    interCarrier40ft: 148_100,
    transport40ft: 159_600,
    consignment20ft: 119_000,
    interCarrier20ft: 128_500,
    transport20ft: 138_800,
  },
  {
    km: 6,
    consignment40ft: 140_600,
    interCarrier40ft: 151_400,
    transport40ft: 163_100,
    consignment20ft: 121_800,
    interCarrier20ft: 131_400,
    transport20ft: 141_800,
  },
  {
    km: 7,
    consignment40ft: 143_700,
    interCarrier40ft: 154_700,
    transport40ft: 166_500,
    consignment20ft: 124_400,
    interCarrier20ft: 134_200,
    transport20ft: 144_700,
  },
  {
    km: 8,
    consignment40ft: 147_000,
    interCarrier40ft: 158_100,
    transport40ft: 170_100,
    consignment20ft: 127_100,
    interCarrier20ft: 137_000,
    transport20ft: 147_700,
  },
  {
    km: 9,
    consignment40ft: 149_900,
    interCarrier40ft: 161_200,
    transport40ft: 173_300,
    consignment20ft: 129_800,
    interCarrier20ft: 139_900,
    transport20ft: 150_700,
  },
  {
    km: 10,
    consignment40ft: 153_000,
    interCarrier40ft: 164_400,
    transport40ft: 176_700,
    consignment20ft: 132_500,
    interCarrier20ft: 142_700,
    transport20ft: 153_700,
  },
  {
    km: 11,
    consignment40ft: 156_100,
    interCarrier40ft: 167_700,
    transport40ft: 180_200,
    consignment20ft: 135_100,
    interCarrier20ft: 145_400,
    transport20ft: 156_500,
  },
  {
    km: 12,
    consignment40ft: 159_100,
    interCarrier40ft: 170_900,
    transport40ft: 183_500,
    consignment20ft: 137_900,
    interCarrier20ft: 148_400,
    transport20ft: 159_600,
  },
  {
    km: 13,
    consignment40ft: 162_200,
    interCarrier40ft: 174_100,
    transport40ft: 186_900,
    consignment20ft: 140_600,
    interCarrier20ft: 151_200,
    transport20ft: 162_600,
  },
  {
    km: 14,
    consignment40ft: 165_200,
    interCarrier40ft: 177_300,
    transport40ft: 190_200,
    consignment20ft: 143_100,
    interCarrier20ft: 153_900,
    transport20ft: 165_400,
  },
  {
    km: 15,
    consignment40ft: 168_400,
    interCarrier40ft: 180_600,
    transport40ft: 193_700,
    consignment20ft: 145_800,
    interCarrier20ft: 156_700,
    transport20ft: 168_400,
  },
  {
    km: 16,
    consignment40ft: 171_500,
    interCarrier40ft: 183_900,
    transport40ft: 197_200,
    consignment20ft: 149_200,
    interCarrier20ft: 160_200,
    transport20ft: 172_000,
  },
  {
    km: 17,
    consignment40ft: 174_500,
    interCarrier40ft: 187_100,
    transport40ft: 200_500,
    consignment20ft: 152_800,
    interCarrier20ft: 164_000,
    transport20ft: 175_900,
  },
  {
    km: 18,
    consignment40ft: 177_500,
    interCarrier40ft: 190_200,
    transport40ft: 203_800,
    consignment20ft: 156_400,
    interCarrier20ft: 167_700,
    transport20ft: 179_800,
  },
  {
    km: 19,
    consignment40ft: 180_500,
    interCarrier40ft: 193_400,
    transport40ft: 207_100,
    consignment20ft: 160_000,
    interCarrier20ft: 171_500,
    transport20ft: 183_700,
  },
  {
    km: 20,
    consignment40ft: 183_500,
    interCarrier40ft: 196_500,
    transport40ft: 210_400,
    consignment20ft: 163_500,
    interCarrier20ft: 175_100,
    transport20ft: 187_500,
  },
  {
    km: 21,
    consignment40ft: 186_600,
    interCarrier40ft: 199_800,
    transport40ft: 213_900,
    consignment20ft: 167_100,
    interCarrier20ft: 178_800,
    transport20ft: 191_300,
  },
  {
    km: 22,
    consignment40ft: 189_600,
    interCarrier40ft: 203_000,
    transport40ft: 217_200,
    consignment20ft: 170_700,
    interCarrier20ft: 182_600,
    transport20ft: 195_200,
  },
  {
    km: 23,
    consignment40ft: 192_700,
    interCarrier40ft: 206_200,
    transport40ft: 220_600,
    consignment20ft: 174_100,
    interCarrier20ft: 186_100,
    transport20ft: 198_900,
  },
  {
    km: 24,
    consignment40ft: 196_500,
    interCarrier40ft: 210_200,
    transport40ft: 224_700,
    consignment20ft: 177_900,
    interCarrier20ft: 190_100,
    transport20ft: 203_000,
  },
  {
    km: 25,
    consignment40ft: 200_500,
    interCarrier40ft: 214_300,
    transport40ft: 229_000,
    consignment20ft: 181_300,
    interCarrier20ft: 193_600,
    transport20ft: 206_700,
  },
  {
    km: 30,
    consignment40ft: 213_800,
    interCarrier40ft: 228_400,
    transport40ft: 243_900,
    consignment20ft: 191_600,
    interCarrier20ft: 204_600,
    transport20ft: 218_400,
  },
  {
    km: 35,
    consignment40ft: 228_700,
    interCarrier40ft: 244_100,
    transport40ft: 260_400,
    consignment20ft: 201_500,
    interCarrier20ft: 215_200,
    transport20ft: 229_700,
  },
  {
    km: 40,
    consignment40ft: 243_700,
    interCarrier40ft: 259_900,
    transport40ft: 277_000,
    consignment20ft: 211_500,
    interCarrier20ft: 225_900,
    transport20ft: 241_100,
  },
  {
    km: 45,
    consignment40ft: 266_800,
    interCarrier40ft: 283_800,
    transport40ft: 301_700,
    consignment20ft: 231_600,
    interCarrier20ft: 246_700,
    transport20ft: 262_600,
  },
  {
    km: 50,
    consignment40ft: 281_500,
    interCarrier40ft: 299_300,
    transport40ft: 318_000,
    consignment20ft: 244_600,
    interCarrier20ft: 260_400,
    transport20ft: 277_000,
  },
  {
    km: 60,
    consignment40ft: 304_400,
    interCarrier40ft: 323_700,
    transport40ft: 344_100,
    consignment20ft: 271_300,
    interCarrier20ft: 288_500,
    transport20ft: 306_500,
  },
  {
    km: 70,
    consignment40ft: 326_200,
    interCarrier40ft: 347_100,
    transport40ft: 369_100,
    consignment20ft: 290_500,
    interCarrier20ft: 309_000,
    transport20ft: 328_500,
  },
  {
    km: 80,
    consignment40ft: 348_000,
    interCarrier40ft: 370_400,
    transport40ft: 394_100,
    consignment20ft: 309_200,
    interCarrier20ft: 329_100,
    transport20ft: 350_000,
  },
  {
    km: 90,
    consignment40ft: 369_500,
    interCarrier40ft: 393_500,
    transport40ft: 418_800,
    consignment20ft: 327_800,
    interCarrier20ft: 349_000,
    transport20ft: 371_400,
  },
  {
    km: 100,
    consignment40ft: 390_900,
    interCarrier40ft: 416_400,
    transport40ft: 443_400,
    consignment20ft: 346_000,
    interCarrier20ft: 368_500,
    transport20ft: 392_400,
  },
  {
    km: 110,
    consignment40ft: 411_900,
    interCarrier40ft: 438_900,
    transport40ft: 467_600,
    consignment20ft: 364_100,
    interCarrier20ft: 388_000,
    transport20ft: 413_300,
  },
  {
    km: 120,
    consignment40ft: 441_000,
    interCarrier40ft: 469_600,
    transport40ft: 499_900,
    consignment20ft: 389_000,
    interCarrier20ft: 414_300,
    transport20ft: 441_000,
  },
  {
    km: 130,
    consignment40ft: 461_500,
    interCarrier40ft: 491_600,
    transport40ft: 523_600,
    consignment20ft: 406_600,
    interCarrier20ft: 433_200,
    transport20ft: 461_400,
  },
  {
    km: 140,
    consignment40ft: 482_300,
    interCarrier40ft: 514_000,
    transport40ft: 547_600,
    consignment20ft: 424_100,
    interCarrier20ft: 452_000,
    transport20ft: 481_700,
  },
  {
    km: 150,
    consignment40ft: 502_700,
    interCarrier40ft: 535_900,
    transport40ft: 571_200,
    consignment20ft: 441_000,
    interCarrier20ft: 470_300,
    transport20ft: 501_400,
  },
  {
    km: 160,
    consignment40ft: 523_000,
    interCarrier40ft: 557_800,
    transport40ft: 594_700,
    consignment20ft: 457_800,
    interCarrier20ft: 488_400,
    transport20ft: 521_000,
  },
  {
    km: 170,
    consignment40ft: 543_300,
    interCarrier40ft: 579_600,
    transport40ft: 618_200,
    consignment20ft: 474_300,
    interCarrier20ft: 506_300,
    transport20ft: 540_300,
  },
  {
    km: 180,
    consignment40ft: 563_400,
    interCarrier40ft: 601_200,
    transport40ft: 641_500,
    consignment20ft: 490_700,
    interCarrier20ft: 524_000,
    transport20ft: 559_500,
  },
  {
    km: 190,
    consignment40ft: 591_000,
    interCarrier40ft: 630_400,
    transport40ft: 672_300,
    consignment20ft: 514_200,
    interCarrier20ft: 548_900,
    transport20ft: 585_800,
  },
  {
    km: 200,
    consignment40ft: 610_800,
    interCarrier40ft: 651_700,
    transport40ft: 695_300,
    consignment20ft: 531_400,
    interCarrier20ft: 567_400,
    transport20ft: 605_800,
  },
  {
    km: 210,
    consignment40ft: 630_600,
    interCarrier40ft: 673_100,
    transport40ft: 718_300,
    consignment20ft: 548_500,
    interCarrier20ft: 585_800,
    transport20ft: 625_700,
  },
  {
    km: 220,
    consignment40ft: 649_800,
    interCarrier40ft: 693_800,
    transport40ft: 740_700,
    consignment20ft: 565_400,
    interCarrier20ft: 604_100,
    transport20ft: 645_400,
  },
  {
    km: 230,
    consignment40ft: 669_400,
    interCarrier40ft: 714_900,
    transport40ft: 763_500,
    consignment20ft: 582_300,
    interCarrier20ft: 622_300,
    transport20ft: 665_100,
  },
  {
    km: 240,
    consignment40ft: 688_300,
    interCarrier40ft: 735_300,
    transport40ft: 785_600,
    consignment20ft: 598_900,
    interCarrier20ft: 640_300,
    transport20ft: 684_500,
  },
  {
    km: 250,
    consignment40ft: 707_500,
    interCarrier40ft: 756_100,
    transport40ft: 808_000,
    consignment20ft: 621_700,
    interCarrier20ft: 664_400,
    transport20ft: 710_100,
  },
  {
    km: 260,
    consignment40ft: 726_500,
    interCarrier40ft: 776_600,
    transport40ft: 830_200,
    consignment20ft: 637_100,
    interCarrier20ft: 681_200,
    transport20ft: 728_300,
  },
  {
    km: 270,
    consignment40ft: 753_400,
    interCarrier40ft: 805_100,
    transport40ft: 860_300,
    consignment20ft: 659_200,
    interCarrier20ft: 704_600,
    transport20ft: 753_200,
  },
  {
    km: 280,
    consignment40ft: 772_900,
    interCarrier40ft: 826_100,
    transport40ft: 883_000,
    consignment20ft: 698_600,
    interCarrier20ft: 745_500,
    transport20ft: 795_400,
  },
  {
    km: 290,
    consignment40ft: 790_800,
    interCarrier40ft: 845_500,
    transport40ft: 904_100,
    consignment20ft: 713_500,
    interCarrier20ft: 761_700,
    transport20ft: 813_100,
  },
  {
    km: 300,
    consignment40ft: 814_800,
    interCarrier40ft: 871_100,
    transport40ft: 931_300,
    consignment20ft: 733_100,
    interCarrier20ft: 782_600,
    transport20ft: 835_500,
  },
  {
    km: 310,
    consignment40ft: 833_200,
    interCarrier40ft: 891_000,
    transport40ft: 952_900,
    consignment20ft: 747_700,
    interCarrier20ft: 798_600,
    transport20ft: 852_900,
  },
  {
    km: 320,
    consignment40ft: 851_300,
    interCarrier40ft: 910_600,
    transport40ft: 974_200,
    consignment20ft: 762_300,
    interCarrier20ft: 814_500,
    transport20ft: 870_300,
  },
  {
    km: 330,
    consignment40ft: 869_600,
    interCarrier40ft: 930_400,
    transport40ft: 995_700,
    consignment20ft: 776_400,
    interCarrier20ft: 829_900,
    transport20ft: 887_200,
  },
  {
    km: 340,
    consignment40ft: 887_900,
    interCarrier40ft: 950_300,
    transport40ft: 1_017_200,
    consignment20ft: 790_900,
    interCarrier20ft: 845_800,
    transport20ft: 904_500,
  },
  {
    km: 350,
    consignment40ft: 905_900,
    interCarrier40ft: 969_800,
    transport40ft: 1_038_400,
    consignment20ft: 804_900,
    interCarrier20ft: 861_100,
    transport20ft: 921_300,
  },
  {
    km: 360,
    consignment40ft: 931_900,
    interCarrier40ft: 997_400,
    transport40ft: 1_067_600,
    consignment20ft: 826_000,
    interCarrier20ft: 883_500,
    transport20ft: 945_200,
  },
  {
    km: 370,
    consignment40ft: 949_700,
    interCarrier40ft: 1_016_700,
    transport40ft: 1_088_600,
    consignment20ft: 840_100,
    interCarrier20ft: 899_000,
    transport20ft: 962_100,
  },
  {
    km: 380,
    consignment40ft: 967_600,
    interCarrier40ft: 1_036_100,
    transport40ft: 1_109_700,
    consignment20ft: 853_900,
    interCarrier20ft: 914_100,
    transport20ft: 978_700,
  },
  {
    km: 390,
    consignment40ft: 985_300,
    interCarrier40ft: 1_055_300,
    transport40ft: 1_130_600,
    consignment20ft: 867_600,
    interCarrier20ft: 929_100,
    transport20ft: 995_200,
  },
  {
    km: 400,
    consignment40ft: 1_002_800,
    interCarrier40ft: 1_074_300,
    transport40ft: 1_151_300,
    consignment20ft: 881_300,
    interCarrier20ft: 944_100,
    transport20ft: 1_011_700,
  },
  {
    km: 410,
    consignment40ft: 1_020_400,
    interCarrier40ft: 1_092_000,
    transport40ft: 1_168_900,
    consignment20ft: 894_900,
    interCarrier20ft: 957_800,
    transport20ft: 1_025_300,
  },
  {
    km: 420,
    consignment40ft: 1_038_000,
    interCarrier40ft: 1_109_700,
    transport40ft: 1_186_500,
    consignment20ft: 908_400,
    interCarrier20ft: 971_400,
    transport20ft: 1_038_800,
  },
  {
    km: 430,
    consignment40ft: 1_055_200,
    interCarrier40ft: 1_127_000,
    transport40ft: 1_203_700,
    consignment20ft: 921_800,
    interCarrier20ft: 984_800,
    transport20ft: 1_052_200,
  },
  {
    km: 440,
    consignment40ft: 1_080_800,
    interCarrier40ft: 1_152_700,
    transport40ft: 1_229_300,
    consignment20ft: 942_200,
    interCarrier20ft: 1_005_300,
    transport20ft: 1_072_600,
  },
  {
    km: 450,
    consignment40ft: 1_097_900,
    interCarrier40ft: 1_169_900,
    transport40ft: 1_246_400,
    consignment20ft: 956_200,
    interCarrier20ft: 1_019_400,
    transport20ft: 1_086_600,
  },
  {
    km: 460,
    consignment40ft: 1_115_300,
    interCarrier40ft: 1_187_400,
    transport40ft: 1_263_800,
    consignment20ft: 971_300,
    interCarrier20ft: 1_034_600,
    transport20ft: 1_101_700,
  },
  {
    km: 470,
    consignment40ft: 1_132_600,
    interCarrier40ft: 1_204_800,
    transport40ft: 1_281_100,
    consignment20ft: 986_200,
    interCarrier20ft: 1_049_500,
    transport20ft: 1_116_600,
  },
  {
    km: 480,
    consignment40ft: 1_149_800,
    interCarrier40ft: 1_222_000,
    transport40ft: 1_298_300,
    consignment20ft: 1_001_200,
    interCarrier20ft: 1_064_600,
    transport20ft: 1_131_600,
  },
  {
    km: 490,
    consignment40ft: 1_166_900,
    interCarrier40ft: 1_239_200,
    transport40ft: 1_315_400,
    consignment20ft: 1_016_100,
    interCarrier20ft: 1_079_600,
    transport20ft: 1_146_500,
  },
  {
    km: 500,
    consignment40ft: 1_183_900,
    interCarrier40ft: 1_256_300,
    transport40ft: 1_332_400,
    consignment20ft: 1_031_000,
    interCarrier20ft: 1_094_500,
    transport20ft: 1_161_400,
  },
  {
    km: 510,
    consignment40ft: 1_201_200,
    interCarrier40ft: 1_273_700,
    transport40ft: 1_349_700,
    consignment20ft: 1_046_000,
    interCarrier20ft: 1_109_600,
    transport20ft: 1_176_400,
  },
  {
    km: 520,
    consignment40ft: 1_218_200,
    interCarrier40ft: 1_290_800,
    transport40ft: 1_366_700,
    consignment20ft: 1_060_900,
    interCarrier20ft: 1_124_600,
    transport20ft: 1_191_300,
  },
  {
    km: 530,
    consignment40ft: 1_243_600,
    interCarrier40ft: 1_316_300,
    transport40ft: 1_392_100,
    consignment20ft: 1_083_000,
    interCarrier20ft: 1_146_800,
    transport20ft: 1_213_400,
  },
  {
    km: 540,
    consignment40ft: 1_260_900,
    interCarrier40ft: 1_333_600,
    transport40ft: 1_409_400,
    consignment20ft: 1_098_100,
    interCarrier20ft: 1_161_900,
    transport20ft: 1_228_500,
  },
  {
    km: 550,
    consignment40ft: 1_278_300,
    interCarrier40ft: 1_351_100,
    transport40ft: 1_426_800,
    consignment20ft: 1_113_100,
    interCarrier20ft: 1_177_000,
    transport20ft: 1_243_500,
  },
];

/**
 * 부산신항·광양항과 배후단지 간 편도운임 (별도 표)
 * 이 구간은 일반 거리별 운임표가 아닌 별도 편도 요율 적용
 */
export const PORT_HINTERLAND_RATES = [
  // 부산신항
  {
    route: 'BUSAN_NEW_T1_6_TO_NORTH_HINTERLAND',
    distanceKm: 7,
    consignment40ft: 38_900,
    interCarrier40ft: 41_800,
    transport40ft: 44_900,
    consignment20ft: 31_200,
    interCarrier20ft: 33_600,
    transport20ft: 36_000,
  },
  {
    route: 'BUSAN_NEW_T7_TO_NORTH_HINTERLAND',
    distanceKm: 10,
    consignment40ft: 44_500,
    interCarrier40ft: 48_000,
    transport40ft: 51_800,
    consignment20ft: 35_600,
    interCarrier20ft: 38_500,
    transport20ft: 41_500,
  },
  {
    route: 'BUSAN_NEW_T1_6_TO_UNGDONG',
    distanceKm: 10,
    consignment40ft: 44_500,
    interCarrier40ft: 48_000,
    transport40ft: 51_800,
    consignment20ft: 35_600,
    interCarrier20ft: 38_500,
    transport20ft: 41_500,
  },
  {
    route: 'BUSAN_NEW_T7_TO_UNGDONG',
    distanceKm: 7,
    consignment40ft: 38_900,
    interCarrier40ft: 41_800,
    transport40ft: 44_900,
    consignment20ft: 31_200,
    interCarrier20ft: 33_600,
    transport20ft: 36_000,
  },
  {
    route: 'BUSAN_NEW_TO_DUDONG',
    distanceKm: 13,
    consignment40ft: 57_500,
    interCarrier40ft: 61_100,
    transport40ft: 64_700,
    consignment20ft: 46_000,
    interCarrier20ft: 48_900,
    transport20ft: 51_800,
  },
  {
    route: 'BUSAN_NEW_TO_NOKSAN',
    distanceKm: 10,
    consignment40ft: 54_500,
    interCarrier40ft: 58_100,
    transport40ft: 61_800,
    consignment20ft: 43_600,
    interCarrier20ft: 46_500,
    transport20ft: 49_500,
  },
  // 광양항
  {
    route: 'GWANGYANG_TO_HINTERLAND',
    distanceKm: 7,
    consignment40ft: 44_700,
    interCarrier40ft: 48_200,
    transport40ft: 52_000,
    consignment20ft: 35_800,
    interCarrier20ft: 38_600,
    transport20ft: 41_600,
  },
] as const;

/**
 * 할증 코드 정의 (제22조, 제23조)
 *
 * ⚠️ 가산방식 (제22조):
 * - 가장 높은 할증률 1개를 우선 적용 (100%)
 * - 나머지는 50%씩만 적용
 * - 할증 항목이 3개 초과 시 할증률 높은 순서대로 3개까지만 합산
 *
 * 예시: 화약류(100%) + 중량(80%) + 공휴일(20%) + 심야(20%)
 *   → 화약류 100% + 중량 40%(80%×0.5) + 공휴일 10%(20%×0.5) = 150%
 */
export const SURCHARGE_RULES = [
  // 컨테이너 종류별 할증
  { code: 'TANK_CONTAINER', description: '탱크 컨테이너', rate: 0.3 },
  { code: 'FLEXIBAG_LIQUID', description: '플렉시백 액체', rate: 0.2 },
  { code: 'FLEXIBAG_POWDER', description: '플렉시백 분말', rate: 0.1 },
  { code: 'REEFER', description: '냉동·냉장 컨테이너', rate: 0.3 }, // 발전기 부착 샤시 제공 시 50%는 운수사가 수취
  { code: 'DUMP_CONTAINER', description: '덤프 컨테이너', rate: 0.25 },

  // 도로/지역 할증
  { code: 'RESTRICTED_AREA', description: '통행제한지역', rate: 0.3 },
  { code: 'ROUGH_ROAD', description: '험로 및 오지', rate: 0.2 },
  { code: 'INCHEON_ORIGIN', description: '인천기점 (안전위탁운임 기준)', rate: 0.2 },
  { code: 'PYEONGTAEK_ORIGIN', description: '평택기점 (안전위탁운임 기준)', rate: 0.18 },

  // 시간대 할증
  { code: 'HOLIDAY', description: '공휴일/대체공휴일 (화주 요청 시)', rate: 0.2 },
  { code: 'NIGHT', description: '심야 22:00-06:00 (화주 요청 시)', rate: 0.2 },

  // 위험물 할증 (제23조 파)
  { code: 'HAZARDOUS', description: '위험물·유독물·유해화학물질', rate: 0.3 },
  { code: 'EXPLOSIVE', description: '화약류', rate: 1.0 },
  { code: 'RADIOACTIVE', description: '방사성물질', rate: 2.0 },

  // 중량물 할증 (단계적, 별도 함수에서 처리)
  // 40FT: 23톤 초과부터 1톤당 10%, 20FT: 20톤 초과부터 1톤당 10% (PTA 21톤 초과 시 1톤당 10%)
  // 활대품 할증: 도로법 제한 기준에서 매 10cm 초과 시 10% (별도 함수)
] as const;

export type SurchargeCode = (typeof SURCHARGE_RULES)[number]['code'];

/**
 * 대기료 규정 (제24조)
 */
export const WAITING_FEE_RULES = {
  RATE_PER_30MIN_KRW: 20_000,
  PORT_FREE_MINUTES: 60, // 항만 부두: 1시간까지 무료, 40FT/20FT 공통
  FACTORY_40FT_FREE_MINUTES: 150, // 화주 문전 40FT: 2시간 30분
  FACTORY_20FT_FREE_MINUTES: 120, // 화주 문전 20FT: 2시간
  // 대기료는 운수사가 차주에게 우선 지급 후 원인제공자(화주/부두)에게 청구
} as const;

/**
 * 기타 비용
 */
export const ADDITIONAL_FEES = {
  XRAY_PASSAGE_KRW: 100_000, // 검색대 통과 (제25조)
  WASH_SHUTTLE_KRW: 20_000, // 컨테이너 세척 셔틀 (제18조 가)
  DAMAGED_CONTAINER_SHUTTLE_KRW: 20_000, // 손상컨테이너 교체 셔틀 (제18조 나)
  INCHEON_TERMINAL_RETURN_ADDITIONAL_KRW: 40_000, // 의왕ICD 편도 → 인천터미널 반납 시 추가
  CHASSIS_RENTAL_40FT_PER_DAY: 49_000, // 샤시 임차료 40FT (별도)
  CHASSIS_RENTAL_20FT_PER_DAY: 20_000, // 샤시 임차료 20FT (별도)
} as const;

/**
 * 배차 취소료 (제26조)
 */
export const CANCELLATION_RULES = {
  ARRIVED_OVER_1HOUR_BEFORE_LOADING: 0.5, // 도착 후 1시간 이상 경과 후 취소: 왕복운임의 50%
  IN_TRANSIT_AFTER_LOADING: 0.7, // 상차 후 이동 중 취소: 70%
  WAITING_AT_DESTINATION: 1.0, // 도착 후 대기 중 취소: 100%
  RETURN_FOR_REWORK_UNDER_50PCT: 1.5, // 50% 이하 운행 후 회차 재작업: 150%
  RETURN_FOR_REWORK_OVER_50PCT: 2.0, // 50% 초과 운행 후 회차 재작업: 200%
  // 천재지변으로 인한 취소는 적용 제외
} as const;

/**
 * 공차 운행 (제14조)
 * 화주/운수사업자 요구로 10km 이상 공차 운행 시,
 * 요구주체가 공차 운행거리에 해당하는 왕복운임의 50%를 지급
 */
export const EMPTY_RUN_RULE = {
  MINIMUM_KM: 10,
  RATE: 0.5,
} as const;

/**
 * 45FT 컨테이너 운임 = 40FT × 112.5%
 */
export const FT45_MULTIPLIER = 1.125;

/**
 * COMBINE 운송 (20FT 2개 동시) - 제11조
 */
export const COMBINE_RULES = {
  STANDARD_RATE: 1.0, // 각각 100% (합쳐서 200%)
  DISCOUNTED_RATE: 1.8, // 4조건 충족 시 합산 180% (인센티브)
  // 4조건: 동일 화주, 비할증 컨테이너, 합계 20톤 미만, 동일 장소 상하차
} as const;

/**
 * 거리 측정 규칙 (제6조)
 */
export const DISTANCE_MEASUREMENT_RULES = {
  PROVIDER: 'NAVER_MAP',
  ROUTE_PRIORITY: 'DISTANCE_FIRST', // 거리우선
  VEHICLE_TYPE: '5종_4축이상_특수화물차',
  MEASUREMENT_TIME: '06:00', // 오전 6시 기준 (오전 7시 아님!)
  ROUNDING: 'km 첫째자리 반올림',
} as const;
