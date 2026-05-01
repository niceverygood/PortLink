# 006 — DispatchAssign 동시성 락은 partial unique index

- **Context**: 두 차주가 같은 OPEN 배차를 동시에 수락 시 한 명만 성공해야 함. SELECT FOR UPDATE / SERIALIZABLE 격리 / Redis 락 등 후보가 있었으나 운영 부담·복잡도 큼. 한편 동일 배차의 활성 배정은 도메인상 1건이므로 DB 제약으로 모델링 가능.
- **Decision**: PostgreSQL partial unique index `WHERE cancelled_at IS NULL`. INSERT 경쟁 시 P2002 예외로 1건만 승리, 라우트 핸들러는 캐치해 409 `ALREADY_ACCEPTED` 반환. 취소 후 재배정 가능 (cancelled_at 세팅된 레코드는 unique 영향 없음).
- **Consequences**: 락 인프라 0추가, 트랜잭션 격리 격상 불필요. SaaS Postgres(Supabase)에서도 그대로 동작. 대신 partial unique는 Prisma 스키마 미지원 → raw SQL 마이그레이션으로만 표현 (`prisma/migrations/.../migration.sql`).
