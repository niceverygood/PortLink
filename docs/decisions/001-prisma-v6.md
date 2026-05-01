# 001 — Prisma v6 사용 (v7 미사용)

- **Context**: `npm install prisma@latest`가 7.8.0 설치 → schema의 `datasource.url` 미지원, `prisma.config.ts` + adapter 패턴 강제.
- **Decision**: MVP 안정성 우선, Prisma 6.19.3 사용. `schema.prisma`의 `env("DATABASE_URL")` 표준 패턴 유지.
- **Consequences**: Phase 2에 v7 마이그레이션 검토. 현재는 6.x의 모든 표준 docs/예제가 그대로 적용 가능.
