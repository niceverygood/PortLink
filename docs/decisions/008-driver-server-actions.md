# 008 — 차주 액션은 Server Actions, TanStack Query 미도입

- **Context**: 차주 화면의 수락/상태전환 트리거 후보 — Server Actions, REST fetch+revalidate, TanStack Query mutation. UI 측 데이터 fetch는 SSR vs TanStack 후보.
- **Decision**: 액션은 Server Actions (`'use server'`) → 도메인 lib 직접 호출 + `revalidatePath` + `redirect`. UI 데이터는 Server Component fetch (Prisma 직접). Stage 4에 TanStack Query 미도입.
- **Consequences**: 클라이언트 번들 가벼움(차주 페이지 단일 ~860B). 폴링·낙관적 업데이트가 필요할 Stage 5 forwarder dashboard에서 TanStack Query 도입 검토. `lib/dispatch-accept.ts` `lib/trip-update.ts` 도메인 로직 분리로 API/Server Action 양쪽에서 재사용.
