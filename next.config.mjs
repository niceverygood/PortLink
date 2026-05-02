/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * Server Components/Actions에서 사용하는 native 모듈을 webpack 번들에서 제외.
     * 빌드 시 .node binary 파싱 실패 방지 + 런타임에 require()로 로드.
     *
     * @node-rs/argon2  : 비밀번호 해싱 (Rust native + .node binary)
     * @prisma/client   : Prisma 클라이언트 (engine binary)
     */
    serverComponentsExternalPackages: ['@node-rs/argon2', '@prisma/client'],
  },
};

export default nextConfig;
