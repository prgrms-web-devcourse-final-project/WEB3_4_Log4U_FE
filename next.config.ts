import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 무시하고 빌드를 진행합니다.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
