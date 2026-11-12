'use client';
import { useEffect, useRef, useState } from 'react';
import type { Faq, ServiceRow } from '@/lib/content';
import { botReply } from '@/lib/bot';
import { waLink, WA_HELLO } from '@/lib/links';
import { IChat, IClose, ISend, IWhatsapp } from './Icons';

interface Msg { from: 'bot' | 'me'; text: string; wa?: boolean }

const QUICK: [string, string][] = [
  ['Precios', '¿Cuánto salen los servicios?'],
  ['Zonas', '¿A qué zonas vas?'],
  ['Cómo reservar', '¿Cómo reservo?'],
  ['Duración', '¿Cuánto tiempo lleva?'],
  ['Productos', '¿Qué productos usás?'],
  ['¿Tenés mi fecha?', '¿Tenés disponibilidad para mi fecha?'],
];

export default function Chat({ services, faqs, whatsapp }: { services: ServiceRow[]; faqs: Faq[]; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: '¡Hola! Soy Delfi. Acá tenés respuestas automáticas a las dudas más comunes: preguntame por precios, zonas, tiempos o cómo reservar, o tocá una opción de abajo.' },
  ]);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    const toggle = () => setOpen((o) => !o);
    window.addEventListener('open-chat', show);
    window.addEventListener('toggle-chat', toggle);
    return () => {
      window.removeEventListener('open-chat', show);
      window.removeEventListener('toggle-chat', toggle);
    };
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || typing) return;
    setDraft('');
    setMsgs((m) => [...m, { from: 'me', text: q }]);
    setTyping(true);
    const r = botReply(q, services, faqs);
    window.setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'bot', text: r.text, wa: r.wa }]);
    }, 550);
  }

  if (!open) return null;
  return (
    <div className="chat" role="dialog" aria-label="Consultas, respuestas automáticas">
      <div className="chat-h">
        <span className="av" aria-hidden="true">DA</span>
        <div>Consultas con Delfi<small>Respuestas automáticas · para reservar, WhatsApp</small></div>
        <button className="icon-btn" type="button" aria-label="Cerrar el chat" onClick={() => setOpen(false)}><IClose /></button>
      </div>
      <div className="chat-log" ref={log} aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>
            {m.text}
            {m.wa && (
              <>
                <br />
                <a className="btn btn-wa" href={waLink(whatsapp, WA_HELLO)} target="_blank" rel="noopener"><IWhatsapp /> Seguir por WhatsApp</a>
              </>
            )}
          </div>
        ))}
        {typing && <div className="msg bot typing" aria-label="Escribiendo"><span /><span /><span /></div>}
      </div>
      <div className="quick" aria-label="Preguntas rápidas">
        {QUICK.map(([label, q]) => (
          <button key={label} type="button" onClick={() => ask(q)}>{label}</button>
        ))}
      </div>
      <form className="chat-f" onSubmit={(e) => { e.preventDefault(); ask(draft); input.current?.focus(); }}>
        <label htmlFor="chat-input" className="sr-only">Escribí tu consulta</label>
        <input id="chat-input" ref={input} type="text" autoComplete="off" placeholder="Escribí tu consulta…" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} />
        <button type="submit" aria-label="Enviar"><ISend /></button>
      </form>
    </div>
  );
}

export function ChatIcon() {
  return <IChat />;
}
