import { getContent } from '@/lib/content';
import { waLink, WA_HELLO } from '@/lib/links';
import Nav from '@/components/Nav';
import Photo from '@/components/Photo';
import Portfolio from '@/components/Portfolio';
import Kit from '@/components/Kit';
import Faq from '@/components/Faq';
import Chat from '@/components/Chat';
import ContactForm from '@/components/ContactForm';
import FloatingActions from '@/components/FloatingActions';
import Reveal from '@/components/Reveal';
import { IInstagram, IMail, ITiktok, IWhatsapp } from '@/components/Icons';

// La página se rearma sola con lo que cargues en el admin (como mucho cada 60 segundos).
export const revalidate = 60;

const d = (s: number) => ({ ['--d' as string]: `${s}s` }) as React.CSSProperties;

export default async function Home() {
  const c = await getContent();
  const { contact, google } = c.settings;
  const wa = waLink(contact.whatsapp, WA_HELLO);
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://delfinamakeup.com';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: 'Delfina Acuña Makeup',
    description: 'Maquilladora profesional a domicilio en CABA y GBA.',
    url: SITE,
    image: `${SITE}/og.jpg`,
    telephone: `+${contact.whatsapp}`,
    email: contact.email,
    areaServed: ['Ciudad Autónoma de Buenos Aires', 'Gran Buenos Aires'],
    sameAs: [`https://instagram.com/${contact.instagram}`, `https://tiktok.com/@${contact.tiktok}`],
    ...(google.rating && google.count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: google.rating, reviewCount: google.count } } : {}),
  };

  return (
    <div className="page">
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <div className="splash" aria-hidden="true"><img src="/brand/logo-stack-plum.png" alt="" width={600} height={358} /></div>
      <div className="orb" style={{ width: 620, height: 620, left: -200, top: 1500, background: 'var(--orb1)' }} />
      <div className="orb" style={{ width: 520, height: 520, right: -160, top: 2500, background: 'var(--orb2)' }} />
      <div className="orb" style={{ width: 560, height: 560, left: '30%', top: 3900, background: 'var(--orb3)' }} />
      <div className="orb" style={{ width: 600, height: 600, right: -200, top: 5700, background: 'var(--orb2)' }} />

      <Nav />

      <main id="contenido">
        <div className="hero" id="inicio">
          {c.hero && <Photo photo={c.hero} priority sizes="100vw" />}
          <div className="shade" />
          <div className="hero-in">
            <div className="hero-card glass-dark rise">
              <p className="eyebrow" style={{ color: '#ffd9e8' }}>— Make Up Artist · CABA y GBA</p>
              <h1>Delfina <em>Acuña</em></h1>
              <p>Combino técnica, creatividad y atención personalizada para resaltar tu belleza única. Novias, eventos sociales y momentos especiales, siempre a domicilio.</p>
              <div className="hero-ctas">
                <a className="btn btn-solid" href="#contacto">Reservar fecha</a>
                <a className="btn btn-glass glass-dark" href="#portfolio">Ver portfolio</a>
              </div>
            </div>
            <div className="stats">
              <div className="stat glass-dark rise" style={d(0.12)}><b>+5</b><span>años de experiencia</span></div>
              <div className="stat glass-dark rise" style={d(0.22)}><b>+200</b><span>clientas felices</span></div>
              <div className="stat glass-dark rise" style={d(0.32)}><b>100%</b><span>a domicilio</span></div>
            </div>
          </div>
        </div>

        {c.portfolio.length > 0 && (
          <section className="block" id="portfolio">
            <div className="wrap"><Portfolio photos={c.portfolio} /></div>
          </section>
        )}

        <section className="block" id="servicios">
          <div className="wrap">
            <div className="head-row">
              <div className="reveal">
                <p className="eyebrow">— Servicios</p>
                <h2>Pensado <em>para cada momento.</em></h2>
              </div>
              <p className="lead reveal" style={{ ...d(0.1), maxWidth: 420 }}>Precios orientativos. El presupuesto final suma los viáticos según tu zona.</p>
            </div>
            <div className="rail wide">
              {c.services.map((s, i) => (
                <div key={s.id} className="reveal" style={d(Math.min(i, 5) * 0.07)}>
                  <article className={`svc-card glass ${s.featured ? 'featured' : ''}`} style={{ height: '100%' }}>
                    {s.eyebrow && <p className="eyebrow">{s.eyebrow}</p>}
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                    <div className="meta">
                      <span>{s.duration_label}</span>
                      {/^(USD|\$|ARS)/i.test(s.price_label) ? (
                        <span className="price">{s.price_prefix && <small>{s.price_prefix}</small>}{s.price_label}</span>
                      ) : (
                        <span className="price text">{s.price_label}</span>
                      )}
                    </div>
                  </article>
                </div>
              ))}
            </div>
            <p className="note">A domicilio en CABA y GBA. La fecha se reserva con una seña del 10 al 15%.</p>
          </div>
        </section>

        {c.kit.length > 0 && (
          <section className="block" id="maletin">
            <div className="wrap">
              <div className="head-row">
                <div className="reveal">
                  <p className="eyebrow">— Mi maletín</p>
                  <h2>Lo que llevo <em>a tu casa.</em></h2>
                </div>
                <p className="lead reveal" style={{ ...d(0.1), maxWidth: 440 }}>Tocá cada punto para ver qué es, la marca y para qué lo uso.</p>
              </div>
              <Kit scenes={c.kit} />
            </div>
          </section>
        )}

        <section className="block" id="reservar">
          <div className="wrap">
            <div className="reveal">
              <p className="eyebrow">— Cómo reservar</p>
              <h2 style={{ marginBottom: 36 }}>Cuatro pasos <em>y listo.</em></h2>
            </div>
            <div className="rail">
              {[
                ['Escribime', 'Contame la fecha, tu zona y el servicio, por WhatsApp o con el formulario.'],
                ['Te paso el presupuesto', 'Te confirmo disponibilidad y el valor final con los viáticos de tu zona.'],
                ['Reservás con seña', 'La fecha queda tuya con una seña del 10 al 15% por transferencia.'],
                ['Voy a tu casa', 'El día del evento llego con todo el maletín. Vos solo disfrutás.'],
              ].map(([t, p], i) => (
                <div key={t} className="step glass reveal" style={d(i * 0.08)}><b>{i + 1}</b><h3>{t}</h3><p>{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="sobre-mi">
          <div className="wrap about">
            {c.about && (
              <div className="about-img reveal">
                <Photo photo={c.about} sizes="(max-width: 900px) 100vw, 45vw" />
                <div className="tag glass-dark"><b>Delfina Acuña</b><br />Maquilladora profesional · Buenos Aires</div>
              </div>
            )}
            <div className="about-txt reveal" style={d(0.12)}>
              <p className="eyebrow">— Sobre mí</p>
              <h2>Cada rostro es una historia, <em>y merece su propio lenguaje.</em></h2>
              <p className="lead" style={{ marginTop: 22 }}>Soy Delfina Acuña, maquilladora profesional. Combino técnica, creatividad y atención personalizada: desde un evento social hasta el día más importante de tu vida, busco un maquillaje cómodo, natural y verdaderamente tuyo.</p>
              <div className="figs"><div><b>+5</b><span>años</span></div><div><b>+200</b><span>clientas</span></div><div><b>100%</b><span>a domicilio</span></div></div>
              <a className="btn btn-solid" href="#contacto">Quiero mi turno</a>
            </div>
          </div>
        </section>

        <section className="block" id="resenas">
          <div className="wrap">
            <div className="reveal">
              <p className="eyebrow">— Reseñas de Google</p>
              <h2 style={{ marginBottom: 32 }}>Lo que dicen <em>mis clientas.</em></h2>
            </div>
            {c.reviews.length > 0 ? (
              <>
                <div className="g-sum glass reveal">
                  <div className="g-score">
                    {google.rating != null && <b>{String(google.rating).replace('.', ',')}</b>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span className="stars" aria-label={`Calificación en Google: ${google.rating ?? 5} de 5`}>★★★★★</span>
                      <span className="g-src">{google.count ? `${google.count} reseñas en Google` : 'Reseñas en Google'}</span>
                    </div>
                  </div>
                  <div className="g-actions">
                    {google.url && <a className="btn btn-line" href={google.url} target="_blank" rel="noopener">Ver todas en Google</a>}
                    {google.review_url && <a className="btn btn-solid" href={google.review_url} target="_blank" rel="noopener">Dejar mi reseña</a>}
                  </div>
                </div>
                <div className="rail wide">
                  {c.reviews.map((r, i) => (
                    <article key={r.id} className="g-card glass reveal" style={d(Math.min(i, 5) * 0.07)}>
                      <div className="g-head">
                        <span className="av" aria-hidden="true" style={{ background: ['#7b024d', '#b0336f', '#5a3a4b'][i % 3] }}>{r.author.trim()[0]?.toUpperCase()}</span>
                        <div>{r.author}<small>{r.when_label}</small></div>
                      </div>
                      <span className="stars" aria-label={`${r.rating} de 5 estrellas`}>{'★'.repeat(r.rating)}</span>
                      <p>{r.body}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="g-empty glass reveal">
                <p>¿Ya te maquillé? Tu opinión ayuda a otras novias y clientas a elegirme.</p>
                {google.review_url ? (
                  <a className="btn btn-solid" href={google.review_url} target="_blank" rel="noopener">Dejar mi reseña en Google</a>
                ) : (
                  <a className="btn btn-solid" href={wa} target="_blank" rel="noopener">Contame cómo te fue</a>
                )}
              </div>
            )}
          </div>
        </section>

        {c.faqs.length > 0 && (
          <section className="block" id="faq">
            <div className="wrap">
              <div className="reveal">
                <p className="eyebrow">— Preguntas frecuentes</p>
                <h2 style={{ marginBottom: 36 }}>Todo lo que <em>querés saber.</em></h2>
              </div>
              <Faq faqs={c.faqs} />
            </div>
          </section>
        )}

        <section className="block" id="contacto">
          <div className="wrap">
            <div className="contact reveal">
              {c.contactBg && <Photo photo={c.contactBg} alt="" sizes="100vw" />}
              <div className="shade" />
              <div className="contact-l">
                <p className="eyebrow">— Contacto</p>
                <h2>Hablemos de tu <em>próximo look.</em></h2>
                <p style={{ fontSize: 16, lineHeight: 1.65, opacity: 0.93, maxWidth: 440 }}>Contame por dónde anda tu evento y armamos juntas la mejor propuesta. Te respondo dentro de las 24 horas.</p>
                <div className="channels">
                  <a className="glass-dark" href={wa} target="_blank" rel="noopener"><IWhatsapp /> WhatsApp · {contact.whatsapp_label}</a>
                  <a className="glass-dark" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener"><IInstagram /> Instagram · @{contact.instagram}</a>
                  <a className="glass-dark" href={`https://tiktok.com/@${contact.tiktok}`} target="_blank" rel="noopener"><ITiktok /> TikTok · @{contact.tiktok}</a>
                  <a className="glass-dark" href={`mailto:${contact.email}`}><IMail /> {contact.email}</a>
                </div>
              </div>
              <ContactForm services={c.services} whatsapp={contact.whatsapp} />
            </div>
            <footer className="foot">
              <img className="logo-l" src="/brand/logo-h-plum.png" alt="Delfina Acuña Make Up Artist" width={900} height={122} />
              <img className="logo-d" src="/brand/logo-h-white.png" alt="Delfina Acuña Make Up Artist" width={900} height={122} />
              <span>Maquilladora profesional · Buenos Aires</span>
              <span>© {new Date().getFullYear()} Delfina Acuña</span>
            </footer>
          </div>
        </section>
      </main>

      <FloatingActions whatsapp={contact.whatsapp} />
      <Chat services={c.services} faqs={c.faqs} whatsapp={contact.whatsapp} />
      <Reveal />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </div>
  );
}
