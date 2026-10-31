import Link from 'next/link';
import { MESES, hhmm, relativeDay } from '@/lib/format';
import type { BookingFull } from '@/lib/types';
import StatusPill from './StatusPill';

export default function BookingRow({ b, showRelative = true }: { b: BookingFull; showRelative?: boolean }) {
  const [, m, d] = b.date.split('-').map(Number);
  return (
    <li>
      <Link href={`/reservas/${b.id}`} className="item">
        <div className="datebox">
          <div className="d">{d}</div>
          <div className="m">{MESES[m - 1].slice(0, 3)}</div>
        </div>
        <div className="item-main">
          <div className="item-title ellipsis">{b.clients?.name ?? 'Clienta'}</div>
          <div className="muted small ellipsis">
            {hhmm(b.start_time)} · {b.service_name}
            {b.zone ? ` · ${b.zone}` : ''}
            {showRelative ? ` · ${relativeDay(b.date)}` : ''}
          </div>
        </div>
        <StatusPill status={b.status} />
      </Link>
    </li>
  );
}
