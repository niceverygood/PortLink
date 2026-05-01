# 003 — OrbStack arm64 직접 설치 (Intel Homebrew 우회)

- **Context**: 사용자 시스템의 Homebrew는 `/usr/local`에 설치된 Intel용. `brew install --cask orbstack`이 x86_64 빌드만 받아와 OrbStack `vmgr`이 "must not be running under Rosetta"로 즉시 종료.
- **Decision**: OrbStack 공식 CDN(`cdn-updates.orbstack.dev/arm64/...`)에서 arm64 dmg 직접 다운로드 → `/Applications/OrbStack.app` 교체. Homebrew 환경은 그대로 유지(다른 Intel 패키지 영향 없음).
- **Consequences**: OrbStack 자동 업데이트 시 arm64 채널을 계속 받을 것(앱 자체가 arm64). 향후 Apple Silicon Homebrew(`/opt/homebrew`) 마이그레이션 시 `brew install --cask orbstack`로 통합 가능.
