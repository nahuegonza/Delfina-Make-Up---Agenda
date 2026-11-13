import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Aviso legal · Delfina Acuña Makeup',
  description: 'Datos de la titular y condiciones de uso de delfinamakeup.com.',
  alternates: { canonical: '/aviso-legal' },
};

export default function LegalNoticePage() {
  return (
    <SimplePage eyebrow="— Legales" title={<>Aviso <em>legal</em></>}>
      <p className="muted">Última actualización: {LEGAL.actualizado}.</p>

      <h2>Titular del sitio</h2>
      <ul>
        <li><b>Titular:</b> {LEGAL.titular}</li>
        <li><b>CUIT:</b> {LEGAL.cuit}</li>
        <li><b>Domicilio:</b> {LEGAL.domicilio}</li>
        <li><b>Contacto:</b> <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></li>
        <li><b>Actividad:</b> servicios de maquillaje profesional a domicilio en la Ciudad Autónoma de Buenos Aires y el Gran Buenos Aires.</li>
      </ul>

      <h2>Precios y reservas</h2>
      <p>
        Los precios publicados son orientativos y pueden cambiar sin previo aviso. El valor final de cada servicio se informa
        en el presupuesto personalizado, que suma los viáticos según la zona. Una fecha queda reservada recién cuando se acredita
        la seña acordada.
      </p>

      <h2>Contenido del sitio</h2>
      <p>
        Las fotos, textos, logotipos y el diseño de este sitio pertenecen a {LEGAL.titular} o se usan con autorización de sus
        autores y de las personas retratadas. No se pueden copiar ni usar con fines comerciales sin permiso por escrito.
      </p>
      <p>
        Las marcas de productos que aparecen en la sección del maletín pertenecen a sus respectivos dueños y se mencionan solo
        para contar qué productos se usan. No hay acuerdos comerciales con esas marcas.
      </p>

      <h2>Chat de consultas</h2>
      <p>
        El chat da respuestas automáticas a preguntas frecuentes y tiene carácter orientativo. Para confirmar fechas, precios
        o cualquier detalle de tu servicio, la respuesta válida es la que te da {LEGAL.titular} por WhatsApp o por mail.
      </p>

      <h2>Enlaces a otros sitios</h2>
      <p>Este sitio tiene enlaces a WhatsApp, Instagram, TikTok y Google, que tienen sus propias condiciones y políticas.</p>

      <h2>Datos personales</h2>
      <p>
        El tratamiento de los datos que dejás en el formulario se explica en la <a href="/privacidad">política de privacidad</a>.
      </p>
    </SimplePage>
  );
}
