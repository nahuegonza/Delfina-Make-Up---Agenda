import { STATUSES, type Status } from '@/lib/types';

export function statusLabel(s: Status) {
  return STATUSES.find((x) => x.value === s)?.label ?? s;
}

export default function StatusPill({ status }: { status: Status }) {
  return <span className={`pill st-${status}`}>{statusLabel(status)}</span>;
}
