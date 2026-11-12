// Íconos de línea (sin dependencias).
type P = { className?: string };
const b = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', 'aria-hidden': true };

export const IWhatsapp = (p: P) => (<svg {...b} {...p}><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" /><path d="M9 8.5c0 3.3 3.2 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1-.4-2.3-1.7-2.7-2.7l.8-1-1-2z" /></svg>);
export const IChat = (p: P) => (<svg {...b} {...p}><path d="M4 5h16v11H9l-5 4z" /><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" /></svg>);
export const ISun = (p: P) => (<svg {...b} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const IMoon = (p: P) => (<svg {...b} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>);
export const IMenu = (p: P) => (<svg {...b} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IClose = (p: P) => (<svg {...b} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IPlus = (p: P) => (<svg {...b} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const ISend = (p: P) => (<svg {...b} {...p}><path d="M4 12h15M13 6l6 6-6 6" /></svg>);
export const ICheck = (p: P) => (<svg {...b} strokeWidth={2.2} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IInstagram = (p: P) => (<svg {...b} {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg>);
export const ITiktok = (p: P) => (<svg {...b} {...p}><path d="M14 3v11a4 4 0 1 1-4-4M14 3c.5 3 2.5 5 5 5" /></svg>);
export const IMail = (p: P) => (<svg {...b} {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>);
export const IArrow = (p: P) => (<svg {...b} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
