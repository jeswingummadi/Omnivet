/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const defaultBackend = process.env.NODE_ENV === 'production'
      ? 'https://omnivet-api.vercel.app'
      : 'http://127.0.0.1:8000';
    const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || defaultBackend).replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
