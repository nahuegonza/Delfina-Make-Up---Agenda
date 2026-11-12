import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/lora/wght.css';
import '@fontsource-variable/lora/wght-italic.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import './globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://delfinamakeup.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Delfina Acuña · Maquilladora profesional a domicilio en CABA y GBA',
  description:
    'Maquillaje para novias, quinceañeras, egresadas y eventos sociales, a domicilio en CABA y GBA. Clases de automaquillaje y diseño de cejas. Reservá tu fecha.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE,
    siteName: 'Delfina Acuña Makeup',
    title: 'Delfina Acuña · Make Up Artist',
    description: 'Maquillaje a domicilio para novias, eventos y momentos especiales en CABA y GBA.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Delfina maquillando a una novia' }],
  },
  icons: { icon: '/favicon.png', apple: '/apple-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf1f4',
};

// Elige el tema antes de pintar (sin parpadeo): lo que eligió la visitante o el de su celular.
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.classList.add('js');if(t==='dark'){var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute('content','#12060d')}}catch(e){document.documentElement.classList.add('js')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
