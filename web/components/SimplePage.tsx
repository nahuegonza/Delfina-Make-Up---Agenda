import Nav from './Nav';

/** Página simple (legales, 404) con el mismo menú y pie que la web. */
export default function SimplePage({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="page">
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <div className="orb" style={{ width: 560, height: 560, left: -220, top: 120, background: 'var(--orb1)' }} />
      <div className="orb" style={{ width: 480, height: 480, right: -180, top: 700, background: 'var(--orb2)' }} />
      <Nav base="/" />
      <main id="contenido" className="wrap simple">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="legal">{children}</div>
      </main>
      <footer className="wrap foot">
        <a href="/" aria-label="Volver al inicio">
          <img className="logo-l" src="/brand/logo-h-plum.png" alt="Delfina Acuña Make Up Artist" width={900} height={122} />
          <img className="logo-d" src="/brand/logo-h-white.png" alt="Delfina Acuña Make Up Artist" width={900} height={122} />
        </a>
        <nav className="foot-links" aria-label="Información legal">
          <a href="/aviso-legal">Aviso legal</a>
          <a href="/privacidad">Privacidad</a>
        </nav>
        <span>© {new Date().getFullYear()} Delfina Acuña</span>
      </footer>
    </div>
  );
}
