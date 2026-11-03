'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCalendar, IconHome, IconPlus, IconSparkle, IconUsers } from './Icons';

const LINKS = [
  { href: '/', label: 'Inicio', Icon: IconHome },
  { href: '/calendario', label: 'Calendario', Icon: IconCalendar },
  { href: '/reservas/nueva', label: 'Nuevo', Icon: IconPlus, isNew: true },
  { href: '/clientas', label: 'Clientas', Icon: IconUsers },
  { href: '/servicios', label: 'Servicios', Icon: IconSparkle },
];

/** Menú flotante de vidrio, igual en celular y computadora. */
export default function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <nav className="dock" aria-label="Menú principal">
      {LINKS.map(({ href, label, Icon, isNew }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          aria-current={active(href) ? 'page' : undefined}
          className={isNew ? 'dock-new' : active(href) ? 'active' : ''}
        >
          <Icon />
          <span className="label">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
