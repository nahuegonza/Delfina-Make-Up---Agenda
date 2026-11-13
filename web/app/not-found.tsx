import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';

export const metadata: Metadata = {
  title: 'Página no encontrada · Delfina Acuña Makeup',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <SimplePage eyebrow="— Error 404" title={<>Esta página <em>no existe.</em></>}>
      <p className="lead" style={{ marginTop: 8 }}>
        Puede que el link esté mal escrito o que la página se haya movido. Desde el inicio encontrás todo: portfolio,
        servicios, mi maletín y cómo reservar.
      </p>
      <div className="hero-ctas" style={{ marginTop: 28 }}>
        <a className="btn btn-solid" href="/">Volver al inicio</a>
        <a className="btn btn-line" href="/#contacto">Reservar fecha</a>
      </div>
    </SimplePage>
  );
}
