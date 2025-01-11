/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["ui"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: "/r/:path*",
        destination: "/api/r/:path*",
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/og-image.png",
        headers: [
          {
            key: "Content-Type",
            value: "image/png",
          },
        ],
      },
    ]
  },
}

export default nextConfig
