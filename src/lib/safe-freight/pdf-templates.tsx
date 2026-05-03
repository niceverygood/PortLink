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
