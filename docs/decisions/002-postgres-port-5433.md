# 002 — Docker Postgres를 5433으로 매핑

- **Context**: 개발 환경 호스트에 brew로 설치된 `postgresql@16`이 5432를 점유 중. docker-compose의 5432 매핑이 호스트 postgres와 충돌해 Prisma가 P1010 인증 실패.
- **Decision**: docker-compose port mapping을 `5433:5432`로. `.env.example` / `.env`의 `DATABASE_URL`도 5433. 컨테이너 내부는 5432 유지.
- **Consequences**: 호스트 postgres와 공존 가능. 운영(Vercel + Supabase)은 영향 없음(connection string에서 5432 그대로). 다른 개발자 환경에서 호스트 postgres가 없으면 5433도 그냥 쓰면 됨.
