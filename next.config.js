/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',
  images: {
    unoptimized: true,
  },
  eslint: {
    dirs: ['pages', 'client', 'server', 'common'],
  },
  async rewrites() {
    return [
      {
        source: '/:project/:endpoint',
        has: [
          {
            type: 'header',
            key: 'x-api-key',
          },
        ],
        destination: '/api/public/endpoint',
      },
    ]
  },
}

module.exports = nextConfig
