/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.instagram.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${process.env.PORT_API || 3001}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
