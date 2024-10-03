/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['jotai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '**',
      },
    ],
  },
  experimental: {
    turbo: {
      resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      moduleIdStrategy: 'deterministic',
    },
  },
};

module.exports = nextConfig;