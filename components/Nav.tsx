'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { IconCalendar, IconHome, IconLogout, IconPlus, IconSparkle, IconUsers } from './Icons';

const LINKS = [
  { href: '/', label: 'Inicio', Icon: IconHome },
  { href: '/calendario', label: 'Calendario', Icon: IconCalendar },
  { href: '/reservas/nueva', label: 'Nuevo turno', Icon: IconPlus, isNew: true },
  { href: '/clientas', label: 'Clientas', Icon: IconUsers },
  { href: '/servicios', label: 'Servicios', Icon: IconSparkle },
];

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  async function logout() {
    await supabase().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <nav className="nav" aria-label="Menú principal">
      <div className="nav-brand">
        <p className="eyebrow">— Agenda</p>
        <div className="serif">
          Delfina <em style={{ color: 'var(--rose)' }}>Acuña</em>
        </div>
      </div>
      {LINKS.map(({ href, label, Icon, isNew }) => (
        <Link key={href} href={href} className={`${active(href) ? 'active' : ''} ${isNew ? 'nav-new' : ''}`}>
          {isNew ? (
            <span className="bubble"><Icon /></span>
          ) : (
            <Icon />
          )}
          <span>{isNew ? 'Nuevo' : label}</span>
        </Link>
      ))}
      <a href="#" className="nav-logout desktop-only" onClick={(e) => { e.preventDefault(); logout(); }}>
        <IconLogout />
        <span>Salir</span>
      </a>
    </nav>
  );
}
