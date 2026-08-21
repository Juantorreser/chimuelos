import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  Celebration,
  MemoryGame,
  ScratchPhoto,
  Section,
  TimeCapsule,
} from "./FunFeatures";

/** Día que empezó todo */
const TOGETHER_SINCE = "2026-02-21";

const CALENDAR_DATES = [
  {
    year: 2026,
    month: 1, // febrero
    day: 21,
    label: "El inicio",
  },
  {
    year: 2026,
    month: 7, // agosto
    day: 21,
    label: "Felices 6 meses",
  },
];

const gallery = [
  "/pics/5775eb55-ec60-46eb-a1d6-63bdf8085347.JPG",
  "/pics/afe04158-a377-4f86-8f17-8645b5f8b8a2.JPG",
  "/pics/b0263d1e-9ebb-4a80-b78b-a48593208ff4.JPG",
  "/pics/d26edae3-ff4e-4d43-be89-1d6ccfe50d38.JPG",
  "/pics/IMG_0685.png",
  "/pics/IMG_1990.JPG",
  "/pics/IMG_2115.jpg",
  "/pics/IMG_4180.png",
  "/pics/IMG_7827.png",
  "/pics/IMG_8430.png",
].map((src, i) => ({
  id: i + 1,
  src,
  tilt: `${((i % 5) - 2) * 1.4}deg`,
}));

const reasons = [
  "Te admiro",
  "Me comprendes y te comprendo",
  "Me corrijes si es necesario",
  "Me apoyas en lo que amo",
  "Aceptas mi ayuda y consejos",
  "Siempre dedicas tiempo para mí",
  "Me divierto infinidades contigo",
  "Nos impulsamos a ser mejores",
  "Me das paz",
  "Tienes una energía maravillosa",
  "Deseo estar para ti siempre que tú así lo quieras",
];

function Heart({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.2-4.5-7.2-10A4.2 4.2 0 0 1 12 8.1 4.2 4.2 0 0 1 19.2 11c0 5.5-7.2 10-7.2 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function useTogether(since: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const start = new Date(`${since}T00:00:00`).getTime();
  const diff = Math.max(0, now - start);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function MiniCal({
  year,
  month,
  highlightDay,
}: {
  year: number;
  month: number;
  highlightDay: number;
}) {
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: Array<number | null> = Array.from({ length: startPad }, () => null);
    for (let d = 1; d <= daysInMonth; d++) items.push(d);
    while (items.length % 7 !== 0) items.push(null);
    return items;
  }, [year, month]);

  return (
    <div className="mini-cal" aria-hidden="true">
      <div className="mini-cal__week">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mini-cal__grid">
        {cells.map((day, i) => (
          <span
            key={i}
            className={day === highlightDay ? "is-heart" : undefined}
          >
            {day === highlightDay ? <Heart /> : day ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function DateStack({
  dates,
}: {
  dates: Array<{
    year: number;
    month: number;
    day: number;
    label: string;
  }>;
}) {
  const [active, setActive] = useState(1); // 0 = inicio, 1 = 6 meses (on top by default)
  const [burst, setBurst] = useState(false);

  const monthOf = (d: (typeof dates)[0]) =>
    new Date(d.year, d.month, 1).toLocaleDateString("es-MX", { month: "long" });

  const bringToFront = (index: number) => {
    if (index === active) return;
    setActive(index);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 700);
  };

  return (
    <div className="date-fancy">
      <div className="date-tabs" role="tablist" aria-label="Elegir fecha">
        {dates.map((d, i) => (
          <button
            key={d.label}
            type="button"
            role="tab"
            aria-selected={active === i}
            className={`date-tab${active === i ? " is-active" : ""}`}
            onClick={() => bringToFront(i)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="date-stack" aria-label="Nuestras dos fechas">
        {dates.map((d, i) => {
          const isTop = active === i;
          return (
            <button
              key={d.label}
              type="button"
              className={`date-card${isTop ? " is-top" : " is-back"}${burst && isTop ? " is-burst" : ""}`}
              aria-pressed={isTop}
              aria-label={`${d.label}: ${d.day} de ${monthOf(d)} de ${d.year}. ${isTop ? "Al frente" : "Toca para traer al frente"}`}
              onClick={() => bringToFront(i)}
            >
              {i === 0 ? (
                <span className="date-card__tape" aria-hidden="true" />
              ) : (
                <span className="date-card__pin" aria-hidden="true">
                  <Heart />
                </span>
              )}
              <p className="date-card__tag">{d.label}</p>
              <p className="date-card__day">{d.day}</p>
              <p className="date-card__month">
                {monthOf(d)} <span>'{String(d.year).slice(2)}</span>
              </p>
              <MiniCal year={d.year} month={d.month} highlightDay={d.day} />
              {!isTop ? (
                <span className="date-card__hint">Toca para ver</span>
              ) : null}
            </button>
          );
        })}

        {burst ? (
          <span className="date-sparks" aria-hidden="true">
            <Heart />
            <Heart />
            <Heart />
            <Heart />
          </span>
        ) : null}
      </div>

      <div className="date-bridge" aria-hidden="true">
        <svg className="date-bridge__path" viewBox="0 0 200 40" fill="none">
          <path
            d="M8 28 C 60 8, 140 8, 192 28"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
        </svg>
        <span className={`date-bridge__badge${burst ? " is-pop" : ""}`}>
          <Heart /> 6 meses
        </span>
      </div>
    </div>
  );
}

function RevealShot({
  frontSrc,
  backSrc,
  frontAlt,
  backAlt,
  tilt = "-2deg",
}: {
  frontSrc: string;
  backSrc: string;
  frontAlt: string;
  backAlt: string;
  tilt?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`reveal-shot${flipped ? " is-flipped" : ""}`}
      style={{ ["--tilt" as string]: tilt }}
    >
      <button
        type="button"
        className="reveal-shot__hit"
        aria-pressed={flipped}
        aria-label={
          flipped
            ? `${backAlt}. Toca para ver el presente`
            : `${frontAlt}. Toca para revelar de niño/a`
        }
        onClick={() => setFlipped((v) => !v)}
      >
        <span className="reveal-shot__inner">
          <span className="reveal-shot__face reveal-shot__face--front">
            <img src={frontSrc} alt={frontAlt} />
          </span>
          <span className="reveal-shot__face reveal-shot__face--back">
            <img src={backSrc} alt={backAlt} />
          </span>
        </span>
      </button>
      <span className="reveal-shot__hint" aria-hidden="true">
        {flipped ? "ahora" : "revelar"}
      </span>
    </div>
  );
}

export default function App() {
  const time = useTogether(TOGETHER_SINCE);
  const [letterOpen, setLetterOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const openLetter = () => {
    setLetterOpen((v) => {
      const next = !v;
      if (next) {
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 2600);
      }
      return next;
    });
  };

  return (
    <div className="stage">
      <Celebration active={celebrate} />
      <div className="stage__glow" aria-hidden="true" />

      <main className="sheet">
        {/* Hero */}
        <header className="block hero">
          <div className="hero__love" aria-hidden="true">
            i love you · i love you · i love you ·
          </div>

          <div className="hero__shots">
            <RevealShot
              tilt="-6deg"
              frontSrc="/pics/54516fad-8651-4ba7-ac79-4b4885663f24.JPG"
              backSrc="/pics/04c8dbd0-8712-41a1-8773-b0455553517f.JPG"
              frontAlt="Chimuela"
              backAlt="Chimuela de niña"
            />
            <RevealShot
              tilt="5deg"
              frontSrc="/pics/0699d33c-b594-48b3-bf3c-6804a1a7bb58.JPG"
              backSrc="/pics/IMG-20210527-WA0082.JPG"
              frontAlt="Chimuelo"
              backAlt="Chimuelo de niño"
            />
          </div>

          <h1 className="hero__names">
            chimuelos <Heart className="hero__heart" />
          </h1>
          <p className="hero__sub">Felices 6 meses</p>
          <p className="hero__lede">
            Por los maravillosos e increíbles 6 meses compartiendo nuestra vida
            con el otro...
          </p>
        </header>

        {/* Dates */}
        <section className="block">
          <p className="kicker">Las fechas</p>
          <h2 className="title title--sm">Esto es solo el comienzo</h2>
          <DateStack dates={CALENDAR_DATES} />
        </section>

        {/* Gallery — scratch to reveal */}
        <section className="block">
          <p className="kicker">Recuerdos</p>
          <h2 className="title">Mis fotos favoritas de nosotros</h2>
          <p className="lede">Rasca cada foto para revelarla.</p>
          <div className="favoritas">
            {gallery.map((g) => (
              <ScratchPhoto
                key={g.id}
                id={g.id}
                src={g.src}
                tilt={g.tilt}
                label={`Favorita ${g.id}`}
              />
            ))}
          </div>
        </section>

        <Section kicker="Memoria" title="Encuentra nuestras fotos">
          <MemoryGame photos={gallery.map((g) => g.src)} />
        </Section>

        <Section kicker="Futuro" title="Cápsula de los próximos 6 meses">
          <TimeCapsule />
        </Section>

        {/* Countdown / together */}
        <section className="block counter-block">
          <p className="kicker">Desde el primer día</p>
          <h2 className="title">Todo este tiempo juntos</h2>
          <div className="counter" aria-live="polite">
            <div>
              <strong>{time.days.toLocaleString("es-MX")}</strong>
              <span>días</span>
            </div>
            <div>
              <strong>{time.hours}</strong>
              <span>hrs</span>
            </div>
            <div>
              <strong>{time.minutes}</strong>
              <span>min</span>
            </div>
            <div>
              <strong>{time.seconds}</strong>
              <span>seg</span>
            </div>
          </div>
        </section>

        {/* Reasons */}
        <section className="block">
          <p className="kicker">Lista infinita</p>
          <h2 className="title">11 razones por las que te elijo</h2>
          <ul className="reasons">
            {reasons.map((r, i) => (
              <li key={r}>
                <Heart className="reasons__h" />
                <span>
                  <em>{i + 1 === 11 ? "11:11" : String(i + 1).padStart(2, "0")}</em>{" "}
                  {r}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Envelope letter */}
        <section className="block letter-block">
          <button
            type="button"
            className={`envelope${letterOpen ? " is-open" : ""}`}
            aria-expanded={letterOpen}
            onClick={openLetter}
          >
            <span className="envelope__pocket" aria-hidden="true" />
            <span className="envelope__paper" aria-hidden="true" />
            <span className="envelope__flap" aria-hidden="true" />
            <span className="envelope__seal">
              <Heart />
            </span>
            <span className="envelope__hint">
              {letterOpen ? "Cerrar carta" : "Abrir nuestra carta"}
            </span>
          </button>

          <div className={`note${letterOpen ? " is-open" : ""}`} aria-hidden={!letterOpen}>
            <p className="note__hi">Mi amor,</p>
            <p>
              Placeholder: escribe aquí tu carta real — un recuerdo, una
              promesa, o simplemente gracias por quedarte.
            </p>
            <p className="note__bye">Con todo, tu chimuelo ♥</p>
          </div>
        </section>

        {/* Finale */}
        <section className="block finale">
          <p className="finale__brand">Te amo chimuela</p>
          <p className="finale__text">
            Gracias por hacerme feliz por 6 meses, espero estés lista para todo
            lo que aún nos falta por escribir juntos.
          </p>
          <div className="finale__hearts">
            <Heart className="finale__heart finale__heart--red" />
            <Heart className="finale__heart finale__heart--purple" />
          </div>
        </section>
      </main>
    </div>
  );
}
