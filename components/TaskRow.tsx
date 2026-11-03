'use client';
import Link from 'next/link';
import { useState } from 'react';
import { afterWhatsapp } from '@/lib/actions';
import { whatsappUrl } from '@/lib/links';
import { KIND_LABEL, whatsappText } from '@/lib/messages';
import { hhmm, relativeDay, shortDate } from '@/lib/format';
import type { Task } from '@/lib/reminders';
import { IconCheck, IconWhatsapp } from './Icons';
import { useToast } from './Toast';

export default function TaskRow({ task, index, onDone }: { task: Task; index?: number; onDone: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const b = task.booking;
  const url = whatsappUrl(b.clients?.phone, whatsappText(task.kind, b));

  async function done() {
    setBusy(true);
    const r = await afterWhatsapp(b, task.kind);
    toast(r.message);
    setBusy(false);
    onDone();
  }

  const subtitle =
    task.kind === 'prueba'
      ? `Evento ${shortDate(b.date)} (${relativeDay(b.date)}) · escribile para coordinar la prueba`
      : `${b.service_name} · ${shortDate(b.date)} ${hhmm(b.start_time)} (${relativeDay(b.date)})`;

  return (
    <li className="item">
      {index ? <div className="index-num num">{String(index).padStart(2, '0')}</div> : null}
      <div className="item-main">
        <div className="row-wrap" style={{ alignItems: 'center', columnGap: 10 }}>
          <span className="item-title">{KIND_LABEL[task.kind]}</span>
          <Link href={`/reservas/${b.id}`} className="small" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
            {b.clients?.name}
          </Link>
          {task.overdue && <span className="pill st-senada">Atrasado</span>}
        </div>
        <div className="muted small ellipsis">{subtitle}</div>
      </div>
      <div className="row">
        {url ? (
          <a className="btn btn-wa btn-icon" href={url} target="_blank" rel="noreferrer" aria-label={`Enviar ${KIND_LABEL[task.kind]} por WhatsApp`} onClick={() => window.setTimeout(done, 400)} aria-disabled={busy}>
            <IconWhatsapp />
          </a>
        ) : (
          <span className="tiny muted">Sin WhatsApp</span>
        )}
        <button className="btn btn-ghost btn-icon" onClick={done} disabled={busy} title="Marcar como hecho sin enviar" aria-label="Marcar como hecho">
          <IconCheck />
        </button>
      </div>
    </li>
  );
}
