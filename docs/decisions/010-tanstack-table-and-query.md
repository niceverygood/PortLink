# 010 — TanStack Table v8 + Query (포워더 한정)

- **Context**: 포워더 화면은 정렬·필터·페이지네이션이 필요한 테이블 중심. 후보 — TanStack Table(가벼움, headless), AG Grid(무거움), 자체 구현. 데이터 fetch도 SSR vs TanStack Query 후보.
- **Decision**: 테이블은 TanStack Table v8 + shadcn Table primitive 래퍼(`src/components/forwarder/DataTable.tsx`). 데이터 fetch는 Server Component가 기본, **TanStack Query Provider는 포워더 layout에 마운트**해 향후 대시보드 KPI 폴링·낙관적 mutation 자리만 마련. 차주 화면은 도입 안 함(Stage 4 ADR 008).
- **Consequences**: 정렬·필터·페이지네이션 UI 일관됨. 새 테이블 추가 시 columns + data만 정의. Bundle 영향 — `/forwarder/dispatch` 첫 화면 168KB (TanStack Table 포함). Phase 2에서 가상 스크롤이 필요하면 `@tanstack/react-virtual` 추가만 하면 됨.
