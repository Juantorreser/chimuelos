import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const STORAGE = {
  scratch: "chimuelos-scratch-v1",
  memory: "chimuelos-memory-best-v1",
} as const;

/** Se abre en el próximo hito de 6 meses (feb 21, 2027). */
export const CAPSULE_UNLOCK = "2027-02-21T00:00:00";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.2-4.5-7.2-10A4.2 4.2 0 0 1 12 8.1 4.2 4.2 0 0 1 19.2 11c0 5.5-7.2 10-7.2 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Confetti + hearts burst (carta / celebración). */
export function Celebration({ active }: { active: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.05}s`,
        duration: `${1.6 + (i % 5) * 0.18}s`,
        kind: i % 3 === 0 ? "heart" : "confetti",
        color:
          i % 4 === 0
            ? "#9e1b2e"
            : i % 4 === 1
              ? "#7b4bb8"
              : i % 4 === 2
                ? "#f0d9b5"
                : "#e8a598",
        rot: `${(i * 47) % 360}deg`,
      })),
    [],
  );

  if (!active) return null;

  return (
    <div className="celeb" aria-hidden="true">
      {bits.map((b) =>
        b.kind === "heart" ? (
          <span
            key={b.id}
            className="celeb__heart"
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
              color: b.color,
            }}
          >
            <HeartIcon />
          </span>
        ) : (
          <span
            key={b.id}
            className="celeb__piece"
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
              background: b.color,
              ["--rot" as string]: b.rot,
            }}
          />
        ),
      )}
    </div>
  );
}

type ScratchMap = Record<string, boolean>;

export function ScratchPhoto({
  id,
  src,
  tilt,
  label,
}: {
  id: number;
  src: string;
  tilt: string;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const [revealed, setRevealed] = useState(() => {
    const map = readJson<ScratchMap>(STORAGE.scratch, {});
    return Boolean(map[String(id)]);
  });

  const persist = useCallback((done: boolean) => {
    const map = readJson<ScratchMap>(STORAGE.scratch, {});
    map[String(id)] = done;
    writeJson(STORAGE.scratch, map);
    setRevealed(done);
  }, [id]);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || revealed) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#9e1b2e");
    g.addColorStop(0.5, "#c43a4a");
    g.addColorStop(1, "#7b4bb8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(247,241,232,0.22)";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * rect.width,
        Math.random() * rect.height,
        2 + Math.random() * 6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = "rgba(247,241,232,0.9)";
    ctx.font = "700 11px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("RASCA AQUÍ", rect.width / 2, rect.height / 2);
  }, [revealed]);

  useEffect(() => {
    paintCover();
    const onResize = () => paintCover();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paintCover]);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let clear = 0;
    for (let i = 3; i < sample.length; i += 16) {
      if (sample[i] < 40) clear++;
    }
    const total = sample.length / 16;
    if (clear / total > 0.52) persist(true);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    scratchAt(e.clientX, e.clientY);
  };

  const onPointerUp = () => {
    drawing.current = false;
  };

  return (
    <figure
      className={`shot shot--favorita scratch-shot${revealed ? " is-revealed" : ""}`}
      style={{ ["--tilt" as string]: tilt }}
    >
      <div className="shot__img scratch-shot__frame" ref={wrapRef}>
        <img src={src} alt={label} loading="lazy" draggable={false} />
        {!revealed ? (
          <canvas
            ref={canvasRef}
            className="scratch-shot__canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        ) : null}
      </div>
    </figure>
  );
}

type MemCard = { id: number; pair: number; src: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MemoryGame({ photos }: { photos: string[] }) {
  const pairs = useMemo(() => photos.slice(0, 6), [photos]);
  const build = useCallback(
    () =>
      shuffle(
        pairs.flatMap((src, pair) => [
          { id: pair * 2, pair, src },
          { id: pair * 2 + 1, pair, src },
        ]),
      ) as MemCard[],
    [pairs],
  );

  const [cards, setCards] = useState<MemCard[]>(build);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(() =>
    readJson<number | null>(STORAGE.memory, null),
  );
  const lock = useRef(false);

  const won = matched.length === pairs.length && pairs.length > 0;

  useEffect(() => {
    if (!won) return;
    if (best === null || moves < best) {
      setBest(moves);
      writeJson(STORAGE.memory, moves);
    }
  }, [won, moves, best]);

  const flip = (id: number, pair: number) => {
    if (lock.current || open.includes(id) || matched.includes(pair)) return;
    if (open.length === 0) {
      setOpen([id]);
      return;
    }
    if (open.length === 1) {
      const first = cards.find((c) => c.id === open[0]);
      if (!first) return;
      const nextOpen = [open[0], id];
      setOpen(nextOpen);
      setMoves((m) => m + 1);
      if (first.pair === pair) {
        setMatched((m) => [...m, pair]);
        setOpen([]);
      } else {
        lock.current = true;
        window.setTimeout(() => {
          setOpen([]);
          lock.current = false;
        }, 700);
      }
    }
  };

  const reset = () => {
    setCards(build());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    lock.current = false;
  };

  return (
    <div className="memory">
      <div className="memory__bar">
        <span>Movimientos: {moves}</span>
        <span>Mejor: {best ?? "—"}</span>
      </div>
      <div className="memory__grid">
        {cards.map((c) => {
          const isOpen = open.includes(c.id) || matched.includes(c.pair);
          return (
            <button
              key={c.id}
              type="button"
              className={`memory__card${isOpen ? " is-open" : ""}`}
              onClick={() => flip(c.id, c.pair)}
              aria-label={isOpen ? "Foto revelada" : "Carta oculta"}
            >
              <span className="memory__back">
                <HeartIcon />
              </span>
              <span className="memory__front">
                <img src={c.src} alt="" />
              </span>
            </button>
          );
        })}
      </div>
      {won ? (
        <div className="memory__win">
          <p>¡Las encontraste todas!</p>
          <button type="button" className="fun-btn" onClick={reset}>
            Jugar otra vez
          </button>
        </div>
      ) : (
        <button type="button" className="fun-btn fun-btn--ghost" onClick={reset}>
          Reiniciar
        </button>
      )}
    </div>
  );
}

export function TimeCapsule() {
  const [now, setNow] = useState(() => Date.now());
  const unlockAt = useMemo(() => new Date(CAPSULE_UNLOCK).getTime(), []);
  const unlocked = now >= unlockAt;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, unlockAt - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  return (
    <div className={`capsule${unlocked ? " is-open" : ""}`}>
      <div className="capsule__lock" aria-hidden="true">
        <HeartIcon />
      </div>
      {!unlocked ? (
        <>
          <p className="capsule__seal">Sellada hasta el 21 de febrero 2027</p>
          <p className="capsule__hint">
            Una sorpresa para nuestros próximos 6 meses. Aún no se puede abrir.
          </p>
          <div className="capsule__count">
            <div>
              <strong>{days}</strong>
              <span>días</span>
            </div>
            <div>
              <strong>{hours}</strong>
              <span>hrs</span>
            </div>
            <div>
              <strong>{mins}</strong>
              <span>min</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="capsule__seal">Cápsula lista</p>
          <p className="capsule__opened">
            Llegó el día. Pronto habrá algo nuevo aquí para nosotros.
          </p>
        </>
      )}
    </div>
  );
}

export function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="block">
      <p className="kicker">{kicker}</p>
      <h2 className="title title--sm">{title}</h2>
      {children}
    </section>
  );
}
