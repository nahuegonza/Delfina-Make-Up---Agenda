import type { MetadataRoute } from 'next';

// Mientras la web esté en el link de prueba no se indexa en Google (ALLOW_INDEX=1 al pasar al dominio).
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://delfinamakeup.com';
  if (process.env.ALLOW_INDEX !== '1') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${site}/sitemap.xml` };
}
