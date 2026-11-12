/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true }, // las fotos ya llegan optimizadas (WebP en 3 tamaños)
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/seed/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
