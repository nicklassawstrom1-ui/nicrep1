import { useState } from 'react'

/* ----------------------------------------------------------------------------
   Century Arts — digital reklambyrå
   Neo-brutalistisk one-pager. All grafik byggs i CSS/SVG (inga externa foton),
   så inget kan bli trasigt. Layoutskelett inspirerat av en klassisk app-sajt:
   nav → hero → tjänster → process → siffror → arbeten → priser → omdömen →
   FAQ → CTA → footer.
---------------------------------------------------------------------------- */

const NAV = [
  { label: 'Tjänster', href: '#tjanster' },
  { label: 'Arbeten', href: '#arbeten' },
  { label: 'Process', href: '#process' },
  { label: 'Priser', href: '#priser' },
]

type Service = {
  no: string
  title: string
  desc: string
  tags: string[]
  color: string
  icon: React.ReactNode
}

const SERVICES: Service[] = [
  {
    no: '01',
    title: 'Filmproduktion',
    desc: 'Reklamfilm, social video och eventfilm som stoppar tummen mitt i scrollen.',
    tags: ['Reklamfilm', 'Social video', 'Drönare'],
    color: 'pink',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="4" y="14" width="30" height="20" rx="1" />
        <path d="M34 21l10-6v18l-10-6z" />
        <line x1="4" y1="20" x2="34" y2="20" />
      </svg>
    ),
  },
  {
    no: '02',
    title: 'Hemsidor',
    desc: 'Snabba, snygga sajter som jobbar dygnet runt och gör besökare till kunder.',
    tags: ['Webbdesign', 'E-handel', 'SEO'],
    color: 'blue',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="5" y="8" width="38" height="26" rx="1" />
        <line x1="5" y1="15" x2="43" y2="15" />
        <line x1="18" y1="40" x2="30" y2="40" />
        <line x1="24" y1="34" x2="24" y2="40" />
      </svg>
    ),
  },
  {
    no: '03',
    title: 'Logotyper',
    desc: 'Visuell identitet med attityd. En logga och färgvärld som folk faktiskt minns.',
    tags: ['Logotyp', 'Grafisk profil', 'Brandbook'],
    color: 'yellow',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 4l5.6 11.8L42 17.6l-9 9.2 2.2 13.2L24 33.8 12.8 40l2.2-13.2-9-9.2 12.4-1.8z" />
      </svg>
    ),
  },
  {
    no: '04',
    title: 'Posters',
    desc: 'Print och digitalt som äger gatan, flödet och skyltfönstret.',
    tags: ['Print', 'Sociala medier', 'Kampanj'],
    color: 'orange',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="5" width="30" height="38" rx="1" />
        <line x1="15" y1="14" x2="33" y2="14" />
        <line x1="15" y1="22" x2="33" y2="22" />
        <line x1="15" y1="30" x2="27" y2="30" />
      </svg>
    ),
  },
  {
    no: '05',
    title: 'Musikproduktion',
    desc: 'Jinglar, ljudlogga och soundtrack. Ditt varumärke får ett eget ljud.',
    tags: ['Jingel', 'Ljudlogga', 'Podcast'],
    color: 'purple',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="14" cy="34" r="6" />
        <circle cx="36" cy="29" r="6" />
        <line x1="20" y1="34" x2="20" y2="12" />
        <line x1="42" y1="29" x2="42" y2="8" />
        <path d="M20 12l22-4" />
      </svg>
    ),
  },
]

const PROCESS = [
  {
    no: '01',
    title: 'Brief',
    desc: 'Vi snackar i 30 minuter, gratis. Du berättar vart du vill — vi lyssnar.',
  },
  {
    no: '02',
    title: 'Skapa',
    desc: 'Teamet bygger din look. Första skisserna landar inom 48 timmar.',
  },
  {
    no: '03',
    title: 'Lansera',
    desc: 'Vi levererar allt färdigt och redo att köra. Du tar all cred.',
  },
]

const STATS = [
  { num: '250+', label: 'Projekt levererade' },
  { num: '48h', label: 'Till första skiss' },
  { num: '4.9', label: 'Snittbetyg av 5' },
  { num: '100%', label: 'Lokalt fokus' },
]

type Work = { kicker: string; title: string; meta: string; color: string }
const WORK: Work[] = [
  { kicker: 'KAFFE', title: 'Nordisk Kaffebar', meta: 'Rebrand + skyltar', color: 'yellow' },
  { kicker: 'BYGG', title: 'Bygg & Co', meta: 'Reklamfilm · 30 sek', color: 'blue' },
  { kicker: 'PULS', title: 'Studio Puls', meta: 'Hemsida + bokning', color: 'pink' },
  { kicker: 'SMASH', title: 'Smash Burgers', meta: 'Posterkampanj', color: 'orange' },
  { kicker: 'RADIO', title: 'Lokalradion', meta: 'Ljudlogga + jingel', color: 'purple' },
  { kicker: 'BLOM', title: 'Blomsterhörnan', meta: 'Logotyp + profil', color: 'dark' },
]

type Plan = {
  name: string
  price: string
  blurb: string
  features: string[]
  featured?: boolean
  color: string
}
const PLANS: Plan[] = [
  {
    name: 'Lokal',
    price: '2 495',
    blurb: 'För dig som precis kört igång.',
    features: ['Logotyp', '1 poster', 'Mallar för sociala medier', 'Klart på 5 dagar'],
    color: 'blue',
  },
  {
    name: 'Växa',
    price: '7 900',
    blurb: 'Mest valda paketet.',
    features: [
      'Allt i Lokal',
      'Hemsida (5 sidor)',
      '3 posters',
      'Ljudlogga',
      '2 revideringar',
    ],
    featured: true,
    color: 'pink',
  },
  {
    name: 'Full skärm',
    price: '14 900',
    blurb: 'Hela looken på en gång.',
    features: [
      'Allt i Växa',
      'Reklamfilm · 30 sek',
      'Musikproduktion',
      'Kampanjplan',
      'Dedikerad projektledare',
    ],
    color: 'yellow',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Vi ser ut som ett miljonföretag nu — men betalade som ett kvarterscafé.',
    name: 'Lina A.',
    role: 'Nordisk Kaffebar',
    color: 'yellow',
  },
  {
    quote: 'Reklamfilmen fick 80 000 lokala visningar på en vecka. Helt galet.',
    name: 'Marcus T.',
    role: 'Bygg & Co',
    color: 'blue',
  },
  {
    quote: 'Bästa pengarna vi någonsin lagt på marknadsföring. Punkt.',
    name: 'Sara L.',
    role: 'Studio Puls',
    color: 'pink',
  },
]

const FAQ = [
  {
    q: 'Hur snabbt kan ni leverera?',
    a: 'Första skisserna inom 48 timmar. De flesta projekt är klara på 1–3 veckor beroende på omfattning.',
  },
  {
    q: 'Funkar ni med små budgetar?',
    a: 'Absolut — hela vår grej är stor look för lågt pris. Vi har fasta paket från 2 495 kr utan dolda avgifter.',
  },
  {
    q: 'Äger jag allt material efteråt?',
    a: 'Ja. När projektet är betalt äger du alla filer, källor och rättigheter. Inga konstigheter.',
  },
  {
    q: 'Jobbar ni i hela Sverige?',
    a: 'Ja. Vi är digitala i grunden och jobbar med företag från Malmö till Kiruna. Film spelar vi in på plats.',
  },
  {
    q: 'Hur kommer vi igång?',
    a: 'Boka ett gratis 30-minuters möte så tar vi det därifrån. Inga förkunskaper krävs.',
  },
]

const MARQUEE = [
  'STOR LOOK',
  'LÅGT PRIS',
  'FILM',
  'WEBB',
  'LOGO',
  'POSTER',
  'MUSIK',
  'FÖR LOKALA HJÄLTAR',
]

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? 'logo logo--sm' : 'logo'}>
      <span className="logo__mark" aria-hidden="true">
        C
      </span>
      <span>
        CENTURY<span className="logo__thin">ARTS</span>
      </span>
    </span>
  )
}

function Marquee({ variant = '' }: { variant?: string }) {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className={`marquee ${variant}`} aria-hidden="true">
      <div className="marquee__track">
        {items.map((t, i) => (
          <span className="marquee__item" key={i}>
            {t}
            <span className="marquee__star">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <a className="brand" href="#top" onClick={() => setOpen(false)}>
        <Logo />
      </a>

      <nav className={`nav ${open ? 'nav--open' : ''}`}>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
            {n.label}
          </a>
        ))}
        <a className="btn btn--pink nav__cta" href="#kontakt" onClick={() => setOpen(false)}>
          Boka möte ↗
        </a>
      </nav>

      <button
        className="nav-toggle"
        aria-label="Meny"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__copy">
        <p className="eyebrow">DIGITAL REKLAMBYRÅ ✦ EST. 2026 ✦ SVERIGE</p>
        <h1 className="hero__title">
          STOR LOOK.
          <br />
          <mark>LÅGT PRIS.</mark>
        </h1>
        <p className="hero__lead">
          Vi ger lokala företag en look som spelar i högsta ligan. Film, hemsidor, logos,
          posters och musik — utan storstadspriser.
        </p>
        <div className="hero__cta">
          <a className="btn btn--blue btn--lg" href="#kontakt">
            Kör igång ↗
          </a>
          <a className="btn btn--ghost btn--lg" href="#arbeten">
            Se våra arbeten
          </a>
        </div>
        <ul className="hero__chips">
          <li>✦ Inga bindningstider</li>
          <li>✦ Lokalt ägt</li>
          <li>✦ Klart på dagar</li>
        </ul>
      </div>

      <div className="hero__art">
        <div className="poster poster--hero">
          <div className="poster__top">
            <span className="tag tag--invert">CA · 2026</span>
            <span className="tag tag--invert">REKLAM</span>
          </div>
          <div className="sunburst" />
          <div className="poster__boom">SÄLJ MER</div>
          <div className="poster__bottom">CENTURY ARTS®</div>
        </div>
        <div className="sticker sticker--price">
          FRÅN
          <strong>2 495:-</strong>
        </div>
        <div className="sticker sticker--rate">★★★★★ 4.9</div>
      </div>
    </section>
  )
}

function Services() {
  return (
    <section className="section" id="tjanster">
      <div className="section__head">
        <p className="eyebrow">VAD VI GÖR</p>
        <h2 className="section__title">Allt du behöver för att synas.</h2>
        <p className="section__sub">
          Fem discipliner, ett team, en sammanhållen look. Plocka en bit eller ta hela paketet.
        </p>
      </div>

      <div className="services">
        {SERVICES.map((s) => (
          <article className={`card svc svc--${s.color}`} key={s.no}>
            <div className="svc__top">
              <span className="svc__no">{s.no}</span>
              <span className="svc__icon">{s.icon}</span>
            </div>
            <h3 className="svc__title">{s.title}</h3>
            <p className="svc__desc">{s.desc}</p>
            <ul className="svc__tags">
              {s.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </article>
        ))}
        <article className="card svc svc--ctacard">
          <h3 className="svc__title">Allt på en gång?</h3>
          <p className="svc__desc">
            Vi paketerar film, webb, logo, poster och musik till en look som hänger ihop.
          </p>
          <a className="btn btn--dark" href="#priser">
            Se paket ↗
          </a>
        </article>
      </div>
    </section>
  )
}

function Process() {
  return (
    <section className="section section--dark" id="process">
      <div className="section__head">
        <p className="eyebrow eyebrow--light">SÅ FUNKAR DET</p>
        <h2 className="section__title">Tre steg. Noll krångel.</h2>
      </div>
      <div className="process">
        {PROCESS.map((p) => (
          <div className="process__step" key={p.no}>
            <span className="process__no">{p.no}</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="stats">
      {STATS.map((s) => (
        <div className="stats__item" key={s.label}>
          <div className="stats__num">{s.num}</div>
          <div className="stats__label">{s.label}</div>
        </div>
      ))}
    </section>
  )
}

function Work() {
  return (
    <section className="section" id="arbeten">
      <div className="section__head">
        <p className="eyebrow">UTVALDA ARBETEN</p>
        <h2 className="section__title">Lokala hjältar, stor look.</h2>
        <p className="section__sub">Ett urval av varumärken vi gett en ny röst och ett nytt ansikte.</p>
      </div>
      <div className="work">
        {WORK.map((w) => (
          <article className={`poster poster--work poster--${w.color}`} key={w.title}>
            <span className="poster__kicker">{w.kicker}</span>
            <h3 className="poster__title">{w.title}</h3>
            <span className="poster__meta">{w.meta} ↗</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section className="section section--paper" id="priser">
      <div className="section__head">
        <p className="eyebrow">PRISER</p>
        <h2 className="section__title">Fasta paket. Inga överraskningar.</h2>
        <p className="section__sub">Priser exkl. moms. Vill du ha något mittemellan? Vi snickrar ihop det.</p>
      </div>
      <div className="plans">
        {PLANS.map((p) => (
          <article
            className={`card plan plan--${p.color} ${p.featured ? 'plan--featured' : ''}`}
            key={p.name}
          >
            {p.featured && <span className="plan__badge">POPULÄRAST</span>}
            <h3 className="plan__name">{p.name}</h3>
            <p className="plan__blurb">{p.blurb}</p>
            <div className="plan__price">
              <span className="plan__amount">{p.price}</span>
              <span className="plan__unit">kr</span>
            </div>
            <ul className="plan__features">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <a
              className={`btn ${p.featured ? 'btn--dark' : 'btn--outline'} btn--block`}
              href="#kontakt"
            >
              Välj {p.name}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="section">
      <div className="section__head">
        <p className="eyebrow">VAD KUNDERNA SÄGER</p>
        <h2 className="section__title">Snack är billigt. Resultat är det inte.</h2>
      </div>
      <div className="quotes">
        {TESTIMONIALS.map((t) => (
          <figure className={`card quote quote--${t.color}`} key={t.name}>
            <div className="quote__mark" aria-hidden="true">
              “
            </div>
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <strong>{t.name}</strong>
              <span>{t.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="section section--paper">
      <div className="section__head">
        <p className="eyebrow">FRÅGOR & SVAR</p>
        <h2 className="section__title">Det folk brukar undra.</h2>
      </div>
      <div className="faq">
        {FAQ.map((f, i) => (
          <details className="faq__item" key={f.q} open={i === 0}>
            <summary>
              <span>{f.q}</span>
              <span className="faq__sign" aria-hidden="true" />
            </summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="cta-band" id="kontakt">
      <div className="cta-band__inner">
        <p className="eyebrow eyebrow--light">REDO?</p>
        <h2 className="cta-band__title">REDO ATT SE STOR UT?</h2>
        <p className="cta-band__sub">Boka ett gratis möte. Vi svarar inom en arbetsdag.</p>
        <div className="cta-band__actions">
          <a className="btn btn--yellow btn--lg" href="mailto:hej@centuryarts.se">
            Boka gratis möte ↗
          </a>
          <a className="btn btn--ghost-light btn--lg" href="mailto:hej@centuryarts.se">
            hej@centuryarts.se
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>Stor look. Lågt pris. För lokala hjältar.</p>
          <div className="footer__social">
            <a href="#top">Instagram</a>
            <a href="#top">TikTok</a>
            <a href="#top">YouTube</a>
            <a href="#top">LinkedIn</a>
          </div>
        </div>
        <div className="footer__col">
          <h4>Tjänster</h4>
          <a href="#tjanster">Filmproduktion</a>
          <a href="#tjanster">Hemsidor</a>
          <a href="#tjanster">Logotyper</a>
          <a href="#tjanster">Posters</a>
          <a href="#tjanster">Musikproduktion</a>
        </div>
        <div className="footer__col">
          <h4>Företag</h4>
          <a href="#arbeten">Arbeten</a>
          <a href="#priser">Priser</a>
          <a href="#process">Process</a>
          <a href="#kontakt">Kontakt</a>
        </div>
        <div className="footer__col">
          <h4>Kontakt</h4>
          <a href="mailto:hej@centuryarts.se">hej@centuryarts.se</a>
          <a href="tel:+4681234567">08–123 45 67</a>
          <span>Sverige</span>
        </div>
      </div>

      <div className="footer__wordmark" aria-hidden="true">
        CENTURY ARTS
      </div>

      <div className="footer__legal">
        <span>© 2026 Century Arts. Alla rättigheter reserverade.</span>
        <span>Byggd med attityd.</span>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Marquee variant="marquee--top" />
      <Header />
      <main>
        <Hero />
        <Marquee variant="marquee--band" />
        <Services />
        <Process />
        <Stats />
        <Work />
        <Pricing />
        <Testimonials />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  )
}
