/**
 * 안전운임 v2 — PDF 템플릿 (서버 렌더).
 * @react-pdf/renderer는 Node 런타임에서만 동작. Edge runtime 사용 금지.
 *
 * 한글 폰트: Pretendard regular subset을 jsdelivr CDN에서 등록.
 * cold start 1회 fetch 비용 ~200ms. 이후 Lambda 인스턴스 내 캐시됨.
 */
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { InvoiceData } from './invoice-data';

// Pretendard Regular OTF 등록 (한글 + 한자 + 기호 풀 지원).
// 빌드 타임에 한 번만 호출되도록 모듈 스코프에 둠.
let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  Font.register({
    family: 'Pretendard',
    src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
    fontWeight: 'normal',
  });
  Font.register({
    family: 'Pretendard',
    src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
    fontWeight: 'bold',
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Pretendard',
    fontSize: 10,
    padding: 36,
    color: '#1f2937',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brand: { fontSize: 14, fontWeight: 'bold', color: '#0A2540' },
  badge: {
    fontSize: 9,
    color: '#0A2540',
    backgroundColor: '#FFF7ED',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  h1: { fontSize: 18, fontWeight: 'bold', color: '#0A2540', marginBottom: 6 },
  disclaimerHeader: {
    fontSize: 9,
    backgroundColor: '#FFF7ED',
    color: '#92400E',
    padding: 8,
    borderRadius: 4,
    marginBottom: 14,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0A2540',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', paddingVertical: 3 },
  label: { width: '32%', color: '#64748b' },
  value: { flex: 1, fontWeight: 'bold' },
  highlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  highlightLabel: { fontSize: 11, fontWeight: 'bold', color: '#9F1239' },
  highlightValue: { fontSize: 16, fontWeight: 'bold', color: '#9F1239' },
  smallNote: { fontSize: 9, color: '#64748b', marginTop: 4 },
  disclaimerFooter: {
    marginTop: 18,
    padding: 10,
    fontSize: 9,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#9F1239',
  },
});

function fmtKrw(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface ReportProps {
  data: InvoiceData;
  disclaimer: { header: string; middle: string; footer: string };
}

export function NonpaymentReportPdf({ data, disclaimer }: ReportProps) {
  ensureFont();
  const { dispatchOrder, forwarder, driver, safeFreight, shortfallKrw } = data;
  return (
    <Document title={`안전운임 미지급 신고서 ${dispatchOrder.orderNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>PortLink</Text>
          <Text style={styles.badge}>안전운임 미지급 신고서 (참고용)</Text>
        </View>

        <Text style={styles.h1}>안전운임 미지급 신고서</Text>
        <Text style={styles.disclaimerHeader}>{disclaimer.header}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 운송 건 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>배차 번호</Text>
            <Text style={styles.value}>{dispatchOrder.orderNo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>출발지</Text>
            <Text style={styles.value}>
              {dispatchOrder.originRegion} · {dispatchOrder.originAddress}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>도착 항만</Text>
            <Text style={styles.value}>{dispatchOrder.port}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>컨테이너</Text>
            <Text style={styles.value}>
              {dispatchOrder.containerType}{' '}
              {dispatchOrder.containerNo ? `· ${dispatchOrder.containerNo}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>상차 일시</Text>
            <Text style={styles.value}>{fmtDate(dispatchOrder.pickupAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>총 거리</Text>
            <Text style={styles.value}>{safeFreight.distanceKm.toFixed(1)} km</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 화주 / 의뢰자</Text>
          <View style={styles.row}>
            <Text style={styles.label}>의뢰 회사</Text>
            <Text style={styles.value}>{forwarder.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>대표자</Text>
            <Text style={styles.value}>{forwarder.representative || '—'}</Text>
          </View>
        </View>

        {driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. 차주 (신고자)</Text>
            <View style={styles.row}>
              <Text style={styles.label}>차주명</Text>
              <Text style={styles.value}>{driver.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>차주 코드</Text>
              <Text style={styles.value}>{driver.code}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>차량 번호</Text>
              <Text style={styles.value}>{driver.plateNo || '—'}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 운임 비교</Text>
          <View style={styles.row}>
            <Text style={styles.label}>법정 최저 (안전위탁운임)</Text>
            <Text style={styles.value}>{fmtKrw(safeFreight.finalConsignmentRateKrw)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>약정 운임</Text>
            <Text style={styles.value}>{fmtKrw(dispatchOrder.fare)}</Text>
          </View>
          <View style={styles.highlight}>
            <Text style={styles.highlightLabel}>부족액</Text>
            <Text style={styles.highlightValue}>{fmtKrw(shortfallKrw)}</Text>
          </View>
          <Text style={styles.smallNote}>
            ※ 안전위탁운임은 화물자동차 운수사업법 제5조의2에 따른 법정 최저액입니다.
          </Text>
        </View>

        {safeFreight.appliedSurcharges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. 적용 할증 (가산방식)</Text>
            {safeFreight.appliedSurcharges.map((s) => (
              <View key={s.code} style={styles.row}>
                <Text style={styles.label}>{s.code}</Text>
                <Text style={styles.value}>
                  {(s.rate * 100).toFixed(0)}% {s.description ?? ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.smallNote}>{disclaimer.middle}</Text>
        <Text style={styles.disclaimerFooter}>{disclaimer.footer}</Text>
      </Page>
    </Document>
  );
}

interface InvoiceProps {
  data: InvoiceData;
}

export function FreightInvoicePdf({ data }: InvoiceProps) {
  ensureFont();
  const { dispatchOrder, forwarder, safeFreight } = data;
  return (
    <Document title={`안전운송운임 청구서 ${dispatchOrder.orderNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>PortLink</Text>
          <Text style={styles.badge}>안전운송운임 청구서</Text>
        </View>

        <Text style={styles.h1}>안전운송운임 청구서</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>청구 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>배차 번호</Text>
            <Text style={styles.value}>{dispatchOrder.orderNo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>의뢰 회사</Text>
            <Text style={styles.value}>{forwarder.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>출발 → 도착</Text>
            <Text style={styles.value}>
              {dispatchOrder.originRegion} → {dispatchOrder.port}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>컨테이너</Text>
            <Text style={styles.value}>{dispatchOrder.containerType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>상차 일시</Text>
            <Text style={styles.value}>{fmtDate(dispatchOrder.pickupAt)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>청구 금액 (안전운송운임 기준)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>기준 거리</Text>
            <Text style={styles.value}>{safeFreight.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>할증액</Text>
            <Text style={styles.value}>{fmtKrw(safeFreight.surchargeAmountKrw)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>대기료</Text>
            <Text style={styles.value}>{fmtKrw(safeFreight.waitingFeeKrw)}</Text>
          </View>
          <View style={styles.highlight}>
            <Text style={styles.highlightLabel}>최종 청구액</Text>
            <Text style={styles.highlightValue}>{fmtKrw(safeFreight.finalTransportRateKrw)}</Text>
          </View>
          <Text style={styles.smallNote}>
            ※ 부가가치세 별도. 화물 운송용역은 면세 (부가가치세법 제26조).
          </Text>
        </View>

        <Text style={styles.smallNote}>
          데이터 출처: {safeFreight.snapshotMeta.noticeNumber} (적용 기간{' '}
          {fmtDate(safeFreight.snapshotMeta.effectiveFrom)} ~{' '}
          {fmtDate(safeFreight.snapshotMeta.effectiveTo)})
        </Text>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────
// 공차 운행 §14 보상 청구 양식 (Stage 9-prep)
// PortLink는 자동 청구 X. 양식만 제공. 차주가 직접 화주/운수사에 제출.
// ─────────────────────────────────────────────

export interface EmptyRunClaimData {
  /** 보상 받는 새 trip (수락한 trip). */
  newTrip: {
    orderNo: string;
    originRegion: string;
    originAddress: string;
    pickupAt: Date;
  };
  forwarder: {
    companyName: string;
    representative: string;
  };
  driver: {
    name: string;
    code: string;
    plateNo: string;
  };
  emptyRun: {
    distanceKm: number;
    chargeKrw: number;
    containerType: string;
    /** 직전 trip 마지막 좌표 (UNLOADED 또는 COMPLETED). */
    fromLat: number;
    fromLng: number;
    fromCapturedAt: Date;
    /** 다음 trip 출발지 추정 좌표 (REGION_COORDS 사전). */
    toLat: number;
    toLng: number;
  };
  generatedAt: Date;
  noticeNumber: string;
}

const claimStyles = StyleSheet.create({
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginRight: 4,
  },
  checkboxLabel: { fontSize: 10 },
  signLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  signLabel: { width: '32%', fontSize: 10, color: '#64748b' },
  signValue: { flex: 1, fontSize: 10 },
});

export function EmptyRunClaimPdf({ data }: { data: EmptyRunClaimData }) {
  ensureFont();
  const { newTrip, forwarder, driver, emptyRun, generatedAt, noticeNumber } = data;

  return (
    <Document title={`공차 운행 보상 청구 양식 ${newTrip.orderNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>PortLink</Text>
          <Text style={styles.badge}>공차 운행 보상 청구 양식 (참고용)</Text>
        </View>

        <Text style={styles.h1}>공차 운행 보상 청구서</Text>
        <Text style={styles.disclaimerHeader}>
          본 자료는 PortLink가 위치 데이터를 기반으로 자동 생성한 참고 자료입니다. PortLink는 본
          청구를 대신 발송하지 않으며, 청구 여부와 청구 내용에 대한 책임은 차주 본인에게 있습니다.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 청구 근거</Text>
          <View style={styles.row}>
            <Text style={styles.label}>법령</Text>
            <Text style={styles.value}>화물자동차 안전운임 고시 제14조 (공차 운행)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>적용 기준</Text>
            <Text style={styles.value}>
              화주 또는 운수사업자의 요구로 10km 이상 공차 운행 시, 공차 운행거리에 해당하는
              왕복운임의 50% 지급 (요구 주체가 부담)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>고시 출처</Text>
            <Text style={styles.value}>{noticeNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 신청자 (차주)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>차주명</Text>
            <Text style={styles.value}>{driver.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>차주 코드</Text>
            <Text style={styles.value}>{driver.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>차량 번호</Text>
            <Text style={styles.value}>{driver.plateNo || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 공차 운행 사실</Text>
          <View style={styles.row}>
            <Text style={styles.label}>직전 운송 종료 좌표</Text>
            <Text style={styles.value}>
              {emptyRun.fromLat.toFixed(5)}, {emptyRun.fromLng.toFixed(5)} (
              {fmtDate(emptyRun.fromCapturedAt)})
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>다음 운송 출발지</Text>
            <Text style={styles.value}>
              {newTrip.originRegion} · {newTrip.originAddress}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>출발지 추정 좌표</Text>
            <Text style={styles.value}>
              {emptyRun.toLat.toFixed(5)}, {emptyRun.toLng.toFixed(5)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>공차 운행 거리</Text>
            <Text style={styles.value}>{emptyRun.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>다음 운송 컨테이너</Text>
            <Text style={styles.value}>{emptyRun.containerType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>다음 운송 배차 번호</Text>
            <Text style={styles.value}>{newTrip.orderNo}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 청구 금액</Text>
          <View style={styles.highlight}>
            <Text style={styles.highlightLabel}>공차 보상액 (안전위탁운임 50%)</Text>
            <Text style={styles.highlightValue}>{fmtKrw(emptyRun.chargeKrw)}</Text>
          </View>
          <Text style={styles.smallNote}>
            ※ 산정 방식: 공차 거리 {emptyRun.distanceKm.toFixed(1)} km에 해당하는 안전위탁운임 × 50%
            (제14조). 십원 단위 반올림.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 공차 운행 요구 주체 (차주가 직접 표기)</Text>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <View style={claimStyles.checkbox}>
              <View style={claimStyles.checkboxBox} />
              <Text style={claimStyles.checkboxLabel}>화주</Text>
            </View>
            <View style={claimStyles.checkbox}>
              <View style={claimStyles.checkboxBox} />
              <Text style={claimStyles.checkboxLabel}>운수사업자</Text>
            </View>
            <View style={claimStyles.checkbox}>
              <View style={claimStyles.checkboxBox} />
              <Text style={claimStyles.checkboxLabel}>모름</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>요구 주체 상호 (선택)</Text>
            <Text style={styles.value}>__________________________________________</Text>
          </View>
          <Text style={styles.smallNote}>
            ※ 청구 책임은 차주 본인에게 있습니다. PortLink는 요구 주체 판단을 대리하지 않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 참조 정보</Text>
          <View style={styles.row}>
            <Text style={styles.label}>의뢰 회사</Text>
            <Text style={styles.value}>{forwarder.companyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>대표자</Text>
            <Text style={styles.value}>{forwarder.representative || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>상차 일시</Text>
            <Text style={styles.value}>{fmtDate(newTrip.pickupAt)}</Text>
          </View>
        </View>

        <Text style={styles.smallNote}>
          데이터 자동 생성 시점: {fmtDate(generatedAt)} · 데이터 출처: {noticeNumber}
        </Text>

        <View style={claimStyles.signLine}>
          <Text style={claimStyles.signLabel}>청구일</Text>
          <Text style={claimStyles.signValue}>__________________________________________</Text>
        </View>
        <View style={claimStyles.signLine}>
          <Text style={claimStyles.signLabel}>청구인 (차주) 서명</Text>
          <Text style={claimStyles.signValue}>__________________________________________</Text>
        </View>

        <Text style={styles.disclaimerFooter}>
          본 양식은 PortLink가 차주님의 권리 행사를 돕기 위해 제공하는 참고 자료입니다. 청구 여부와
          청구 내용, 청구 결과에 대한 모든 책임은 차주 본인에게 있으며, PortLink는 어떠한 법적
          책임도 부담하지 않습니다.
        </Text>
      </Page>
    </Document>
  );
}
