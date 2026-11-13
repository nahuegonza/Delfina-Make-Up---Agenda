import type { Metadata } from 'next';
import SimplePage from '@/components/SimplePage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de privacidad · Delfina Acuña Makeup',
  description: 'Cómo se usan los datos que dejás en el formulario de delfinamakeup.com y cómo ejercer tus derechos.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacyPage() {
  return (
    <SimplePage eyebrow="— Legales" title={<>Política de <em>privacidad</em></>}>
      <p className="muted">Última actualización: {LEGAL.actualizado}.</p>

      <h2>Quién es responsable de tus datos</h2>
      <p>
        {LEGAL.titular} (CUIT {LEGAL.cuit}), con domicilio en {LEGAL.domicilio}, es la responsable de los datos personales
        que dejás en este sitio. Para cualquier consulta sobre tus datos escribí a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
      </p>

      <h2>Qué datos se recopilan</h2>
      <ul>
        <li><b>Formulario de reserva:</b> nombre, mail y/o teléfono, fecha del evento, servicio, zona y el mensaje que escribas.</li>
        <li><b>Chat de consultas:</b> las preguntas se responden en tu propio navegador y no se guardan.</li>
        <li><b>Preferencia de tema:</b> si elegís modo claro u oscuro, se guarda solo en tu dispositivo.</li>
      </ul>
      <p>Este sitio no pide datos sensibles ni datos de pago.</p>

      <h2>Para qué se usan</h2>
      <p>
        Únicamente para responder tu consulta, armar el presupuesto, coordinar y recordarte el servicio que reserves.
        No se usan para publicidad ni se venden o ceden a terceros.
      </p>

      <h2>Dónde se guardan y quién los procesa</h2>
      <p>
        Las consultas se guardan en una base de datos privada a la que solo accede {LEGAL.titular}. Para que el sitio funcione
        se usan proveedores que procesan los datos por cuenta de la titular y con medidas de seguridad: Supabase (base de datos),
        Resend (envío del aviso por mail) y Netlify (alojamiento del sitio). Algunos de estos servidores están fuera de la
        Argentina, en países como Estados Unidos.
      </p>

      <h2>Cuánto tiempo se conservan</h2>
      <p>
        Mientras sean necesarios para responder tu consulta y prestar el servicio. Podés pedir que se borren en cualquier momento.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés acceder a tus datos, pedir que se corrijan, se actualicen o se eliminen, escribiendo a{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Te respondemos dentro de los plazos de la Ley 25.326 de Protección de
        los Datos Personales.
      </p>
      <p className="legal-box">
        El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a
        intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el
        artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de
        Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
        afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
      </p>

      <h2>Cookies</h2>
      <p>
        Hoy este sitio no usa cookies de seguimiento. Si en el futuro se suma una herramienta de estadísticas que las use, se
        va a pedir tu permiso antes de activarla y se va a detallar acá.
      </p>

      <h2>Cambios</h2>
      <p>Si esta política cambia, la nueva versión se publica en esta misma página con su fecha de actualización.</p>
    </SimplePage>
  );
}
