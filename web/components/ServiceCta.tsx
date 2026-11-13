'use client';
import { waLink } from '@/lib/links';
import { IArrow, IWhatsapp } from './Icons';

/** Botones de cada servicio: abre el formulario con el servicio ya elegido, o WhatsApp con el mensaje armado. */
export default function ServiceCta({ title, whatsapp, featured }: { title: string; whatsapp: string; featured?: boolean }) {
  const pick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('pick-service', { detail: title }));
    const form = document.getElementById('form-reserva') ?? document.getElementById('contacto');
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', '#contacto');
  };
  return (
    <div className="svc-cta">
      <a className={`btn ${featured ? 'btn-white' : 'btn-solid'}`} href="#contacto" onClick={pick}>
        Reservar fecha <IArrow />
      </a>
      <a
        className="btn btn-icon"
        href={waLink(whatsapp, `¡Hola Delfi! Quería consultarte por el servicio "${title}".`)}
        target="_blank"
        rel="noopener"
        aria-label={`Consultar por WhatsApp: ${title}`}
      >
        <IWhatsapp />
      </a>
    </div>
  );
}
