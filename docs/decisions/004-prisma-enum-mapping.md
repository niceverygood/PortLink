# 004 — Prisma enum identifier vs wire value 매핑 한 곳

- **Context**: Prisma 6은 `@map`된 enum의 client identifier(`FORTY_FT_HC`)와 DB wire value(`40FT_HC`)를 분리. business-rules.ts와 UI는 wire value("40FT_HC", "40HC")를 쓰고 시드/쿼리는 identifier를 써서 변환이 여러 곳에 흩어지면 깨짐.
- **Decision**: `src/lib/prisma-enums.ts`에 `CONTAINER_TYPE_TO_WIRE` / `WIRE_TO_CONTAINER_TYPE` / `CONTAINER_TYPE_LABEL` 3종 매핑을 단일 정의. 시드·테스트·UI 라벨 모두 이 모듈만 import.
- **Consequences**: enum 한 종 추가 시 매핑 3개 갱신 필요 → enum-consistency 테스트가 누락 즉시 적발. PortCode/TripStatus는 식별자=wire라 매핑 불필요(현재).
