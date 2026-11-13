/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true }, // las fotos ya llegan optimizadas (WebP en 3 tamaños)
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Seguridad: siempre HTTPS, sin incrustar la web en otros sitios y sin acceso a cámara/micrófono/ubicación.
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
      {
        source: '/seed/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
