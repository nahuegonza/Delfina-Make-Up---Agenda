'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/web', label: 'Consultas' },
  { href: '/web/fotos', label: 'Fotos' },
  { href: '/web/servicios', label: 'Servicios' },
  { href: '/web/maletin', label: 'Maletín' },
  { href: '/web/resenas', label: 'Reseñas' },
  { href: '/web/preguntas', label: 'Preguntas' },
];

export default function WebLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const site = process.env.NEXT_PUBLIC_WEB_URL || 'https://delfina-makeup.netlify.app';
  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">— delfinamakeup.com</p>
          <h1>Mi <em>web</em></h1>
        </div>
        <a className="btn btn-ghost" href={site} target="_blank" rel="noopener">Ver la web ↗</a>
      </div>
      <nav className="web-tabs" aria-label="Secciones de la web">
        {TABS.map((t) => {
          const on = t.href === '/web' ? path === '/web' : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>{t.label}</Link>
          );
        })}
      </nav>
      <p className="muted small" style={{ margin: 0 }}>Los cambios aparecen en la web en menos de un minuto.</p>
      {children}
    </div>
  );
}
