'use client';
import { useEffect, useState } from 'react';
import { IClose, IMenu, IMoon, ISun } from './Icons';

const LINKS = [
  { href: '#portfolio', label: 'Portfolio', long: 'Portfolio' },
  { href: '#servicios', label: 'Servicios', long: 'Servicios y precios' },
  { href: '#maletin', label: 'Mi maletín', long: 'Mi maletín' },
  { href: '#reservar', label: 'Reservar', long: 'Cómo reservar', mobileOnly: true },
  { href: '#resenas', label: 'Reseñas', long: 'Reseñas de Google' },
  { href: '#faq', label: 'Preguntas', long: 'Preguntas frecuentes' },
];

/** base: '/' en páginas que no son el inicio. hide: secciones vacías que no deben aparecer en el menú. */
export default function Nav({ base = '', hide = [] }: { base?: string; hide?: string[] }) {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const links = LINKS.filter((l) => !hide.includes(l.href)).map((l) => ({ ...l, href: base + l.href }));

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#12060d' : '#fbf1f4');
  }

  return (
    <header className="nav">
      <nav className="nav-in glass" aria-label="Principal">
        <a href={base ? '/' : '#inicio'} className="nav-logo" aria-label="Delfina Acuña, inicio" onClick={() => setOpen(false)}>
          <img className="logo-l" src="/brand/logo-h-plum.png" alt="Delfina Acuña Make Up Artist" width={900} height={122} />
          <img className="logo-d" src="/brand/logo-h-white.png" alt="" width={900} height={122} />
        </a>
        <div className="nav-links">
          {links.filter((l) => !l.mobileOnly).map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </div>
        <div className="nav-r">
          <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
            {dark ? <ISun /> : <IMoon />}
          </button>
          <a className="btn btn-solid nav-cta" href={`${base}#contacto`}>Reservar fecha</a>
          <button className="icon-btn burger" type="button" aria-expanded={open} aria-controls="menu-movil" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>
            {open ? <IClose /> : <IMenu />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="menu-movil" className="sheet glass">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.long} <span aria-hidden="true">→</span>
            </a>
          ))}
          <a className="btn btn-solid" href={`${base}#contacto`} onClick={() => setOpen(false)}>Reservar fecha</a>
        </div>
      )}
    </header>
  );
}
