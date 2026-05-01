/**
 * PortLink commit message rule.
 * 두 형식 허용:
 *   1. Stage 형식: [Stage 0] <한국어 요약>     (Stage 단위 마무리 커밋용)
 *   2. Conventional: feat(scope): ...           (일반 커밋)
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => /^\[Stage \d+\]/.test(message)],
  rules: {
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
  },
};
