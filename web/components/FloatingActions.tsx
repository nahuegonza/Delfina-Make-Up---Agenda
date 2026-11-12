'use client';
import { waLink, WA_HELLO } from '@/lib/links';
import { IChat, IWhatsapp } from './Icons';

const toggleChat = () => window.dispatchEvent(new Event('toggle-chat'));

/** WhatsApp y chat siempre a mano: botones flotantes en computadora, barra fija abajo en el celular. */
export default function FloatingActions({ whatsapp }: { whatsapp: string }) {
  const wa = waLink(whatsapp, WA_HELLO);
  return (
    <>
      <div className="fabs">
        <button className="fab fab-chat" type="button" onClick={toggleChat} aria-label="Abrir el chat de consultas"><IChat /> Consultas</button>
        <a className="fab fab-wa" href={wa} target="_blank" rel="noopener" aria-label="Escribirme por WhatsApp"><IWhatsapp /> WhatsApp</a>
      </div>
      <div className="mbar glass">
        <a className="wa" href={wa} target="_blank" rel="noopener"><IWhatsapp /> WhatsApp</a>
        <button type="button" onClick={toggleChat}><IChat /> Dudas</button>
        <a className="res" href="#contacto">Reservar</a>
      </div>
    </>
  );
}
