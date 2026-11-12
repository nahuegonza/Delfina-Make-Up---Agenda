'use client';
import { useState } from 'react';
import type { Faq as F } from '@/lib/content';
import { openChat } from '@/lib/links';
import { IPlus } from './Icons';

export default function Faq({ faqs }: { faqs: F[] }) {
  const [open, setOpen] = useState(0);
  return (
    <>
      <div className="faq">
        {faqs.map((f, i) => (
          <div key={f.id} className="reveal" style={{ ['--d' as string]: `${Math.min(i, 6) * 0.05}s` }}>
          <div className={`faq-item glass ${open === i ? 'open' : ''}`}>
            <button className="faq-q" type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
              {f.question}
              <IPlus />
            </button>
            <div className="faq-a" id={`faq-${i}`} role="region">
              <div><p>{f.answer}</p></div>
            </div>
          </div>
          </div>
        ))}
      </div>
      <p className="faq-more">
        ¿Te quedó otra duda?{' '}
        <button className="linkbtn" type="button" onClick={openChat}>Consultá en el chat</button>
      </p>
    </>
  );
}
