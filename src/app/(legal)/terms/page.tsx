import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | PortLink',
  description: 'PortLink 서비스 이용약관 — 차주, 포워더, 운송사 공통 적용.',
  robots: { index: true, follow: true },
};

export const dynamic = 'force-static';

const EFFECTIVE_DATE = '2026-05-04';

export default function TermsPage() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-h1 font-bold text-slate-900">이용약관</h1>
        <p className="mt-2 text-body-sm text-slate-500">
          시행일: {EFFECTIVE_DATE} · 한국어 (ko-KR)
        </p>
      </header>

      <section>
        <p>
          본 약관은 PortLink(이하 “회사”)가 제공하는 컨테이너 운송 디지털 배차 서비스(이하
          “서비스”)의 이용 조건과 절차를 규정합니다. 회원은 회원가입 시 본 약관에 동의한
          것으로 간주됩니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제1조 (목적)</h2>
        <p>
          본 약관은 회사가 운영하는 서비스의 이용과 관련하여 회사와 이용자(차주, 포워더,
          운송사, 관리자) 간의 권리, 의무 및 책임 사항을 정함을 목적으로 합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제2조 (용어 정의)</h2>
        <ul className="list-disc pl-5">
          <li>
            <b>차주</b>: 컨테이너 트럭을 직접 운전하여 운송 업무를 수행하는 화물자동차 운송
            사업자 또는 위·수탁 차주.
          </li>
          <li>
            <b>포워더(화주)</b>: 컨테이너 운송을 의뢰하는 무역·물류 사업자.
          </li>
          <li>
            <b>운송사</b>: 차주를 보유하거나 차주에게 재위탁하는 화물자동차 운송주선
            사업자.
          </li>
          <li>
            <b>안전운임</b>: 「화물자동차 운수사업법」에 따라 국토교통부가 매년 고시하는
            컨테이너 운송 최저 운임 기준.
          </li>
          <li>
            <b>배차</b>: 포워더가 등록한 운송 건에 차주가 매칭되어 운송을 수행하기로
            확정되는 거래.
          </li>
          <li>
            <b>정산</b>: 운송 완료 후 운임을 차주에게 지급하기 위한 일련의 절차.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제3조 (서비스의 제공)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>회사는 회원에게 다음과 같은 서비스를 제공합니다.</li>
          <ul className="list-disc pl-5">
            <li>배차 등록·수락·취소 및 진행 상태 관리</li>
            <li>안전운임 자동 계산 및 검증 위젯</li>
            <li>안전운임 §14에 따른 공차 운행 청구 양식 자동 제공</li>
            <li>운임 미지급 신고서 양식 자동 제공</li>
            <li>정산 내역 관리, 세금계산서 자동 발행</li>
            <li>알림(앱 내 + 푸시), 운영 통계</li>
          </ul>
          <li>
            회사는 24시간 365일 무중단 운영을 목표로 하나, 시스템 점검·장애·천재지변 등의
            사유로 일시 중단될 수 있으며, 사전 또는 사후에 회원에게 안내합니다.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제4조 (회사의 역할 한계)</h2>
        <p>
          <b>
            회사는 운송 거래의 직접 당사자가 아니며, 차주와 포워더(또는 운송사) 사이의
            중개·정보 제공·서식 자동 생성을 담당합니다.
          </b>
          따라서 회사는 다음 사항에 대해 어떠한 법적 책임도 부담하지 않습니다.
        </p>
        <ul className="list-disc pl-5">
          <li>
            회원이 다운로드한 안전운임 §14 공차 운행 청구 양식, 미지급 신고서 등 PDF
            서식의 실제 청구·신고 행위 및 그에 따른 결과
          </li>
          <li>
            거래 상대방의 운송 능력, 결제 능력, 신용 상태, 적재 화물의 합법성
          </li>
          <li>
            거래 상대방 간의 분쟁(운임 미지급, 화물 손상, 지연 등)
          </li>
          <li>
            회원이 입력한 정보의 진위(차주의 자격증, 포워더의 사업자 등록 정보 등)
          </li>
        </ul>
        <p className="mt-2">
          <b>회사가 제공하는 모든 PDF 서식은 참고 자료입니다.</b> 청구·신고 여부와 그 내용,
          제출 방법, 그리고 그에 따른 모든 책임은 청구인 본인에게 있습니다. 회사는
          청구·신고를 대행하지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제5조 (회원 가입 및 탈퇴)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            회원 가입은 본 약관과 개인정보 처리방침에 동의한 후 회사가 정한 절차에 따라
            신청하고, 회사가 승인함으로써 성립됩니다.
          </li>
          <li>회사는 다음의 경우 가입 신청을 거부하거나 사후에 회원 자격을 정지할 수 있습니다.</li>
          <ul className="list-disc pl-5">
            <li>실명이 아니거나 타인의 정보를 사용한 경우</li>
            <li>화물운송종사자 자격증 등 필수 증빙이 위·변조된 경우</li>
            <li>이전에 회사에서 자격이 정지된 사실이 있는 경우</li>
            <li>본 약관 또는 관련 법령을 위반할 우려가 명백한 경우</li>
          </ul>
          <li>
            회원은 언제든지 앱 내 “내 정보 → 회원 탈퇴”에서 탈퇴할 수 있으며, 탈퇴 시
            개인정보 처리방침에 따라 정보가 즉시 파기됩니다(법령상 보관 의무 항목 제외).
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제6조 (수수료)</h2>
        <p>
          회사는 운송 매칭 및 정산 자동화 등의 대가로 운임의 일정 비율을 플랫폼 수수료로
          공제합니다. 현재 적용 비율은 회사 정책에 따라 회원에게 사전 고지된 비율을
          적용하며, 어떠한 경우에도 「화물자동차 운수사업법」이 정한 운송주선 수수료
          상한(10%)을 초과하지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제7조 (안전운임 검증)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            회사는 국토교통부 고시(이하 “고시”)에 따른 안전운임을 거리·컨테이너 규격·할증
            요인을 자동 반영하여 차주·포워더 양측에 표시합니다.
          </li>
          <li>
            안전운임 미만으로 입력된 운임은 시스템에서 차단되거나 인지 동의 절차를 거쳐
            제한적으로만 등록될 수 있습니다.
          </li>
          <li>
            회사가 표시하는 안전운임은 입력 데이터(거리·컨테이너 규격·할증 등)에 근거한
            계산 결과이며, 회원의 입력 오류로 발생한 결과에 대해 회사는 책임을 부담하지
            않습니다.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제8조 (위치 정보)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            회사는 차주 회원이 “출발/상차/하차/완료” 등 운송 단계 액션 버튼을 직접 탭하는
            시점에만 한 번씩 위치를 기록합니다.
          </li>
          <li>회사는 백그라운드에서 위치를 추적하지 않습니다.</li>
          <li>
            차주가 위치 권한을 거부한 경우에도 운송은 정상적으로 진행되며, 위치 좌표만
            기록되지 않습니다.
          </li>
          <li>
            기록된 좌표는 안전운임 §14에 따른 공차 운행 보상 권리 안내, 분쟁 시 운송
            증빙, 이상거래 감지 목적으로만 사용됩니다.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제9조 (이용자의 의무)</h2>
        <ul className="list-disc pl-5">
          <li>본인 정보를 정확하게 등록·갱신할 의무</li>
          <li>본인의 계정·비밀번호를 제3자와 공유하지 않을 의무</li>
          <li>관계 법령(화물자동차 운수사업법, 도로교통법 등)을 준수할 의무</li>
          <li>안전운임 미달 운임을 강요하거나 회피할 목적의 부정 등록을 하지 않을 의무</li>
          <li>
            거래 상대방을 기만하거나, 시스템의 자동 매칭·정산 로직을 우회·왜곡할 목적의
            행위를 하지 않을 의무
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제10조 (지식재산권)</h2>
        <p>
          서비스 내 모든 콘텐츠(소스 코드, 디자인, 상표, 로고, 안전운임 검증 알고리즘 등)에
          대한 지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다. 회원은 회사의 사전
          서면 동의 없이 이를 복제·배포·역분석·상업적 이용할 수 없습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제11조 (책임 제한)</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            회사는 천재지변, 전쟁, 통신사 장애, 해킹, 디도스 등 불가항력으로 인한 서비스
            중단에 대해 책임을 지지 않습니다.
          </li>
          <li>
            회사는 회원이 서비스를 이용하여 기대하는 수익(운송 건수, 매출 등)을 보장하지
            않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.
          </li>
          <li>
            거래 당사자 간 분쟁이 발생한 경우, 회사는 보유한 운송 기록(안전운임 검증
            이력, 위치 스탬프, 정산 내역 등)을 분쟁 해결의 증빙으로 제공할 수 있습니다.
          </li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제12조 (약관 변경)</h2>
        <p>
          회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 시행
          7일 전(회원에게 불리한 변경은 30일 전)에 서비스 내 공지 또는 이메일을 통해
          고지합니다. 회원이 변경된 약관에 동의하지 않을 경우 회원 탈퇴를 통해 거부할 수
          있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">제13조 (분쟁 해결)</h2>
        <p>
          본 약관과 관련된 분쟁은 대한민국 법령에 따르며, 회사 본점 소재지를 관할하는 법원을
          제1심 전속관할 법원으로 합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-h2 font-bold text-slate-900">부칙</h2>
        <ul className="list-disc pl-5">
          <li>{EFFECTIVE_DATE} — 최초 시행</li>
        </ul>
      </section>
    </div>
  );
}
