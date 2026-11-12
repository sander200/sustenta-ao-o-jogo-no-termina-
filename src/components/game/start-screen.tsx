import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Clock, Heart, Keyboard, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicUrl } from "@/lib/public-url";
import { useGame } from "@/lib/game/store";

const INTRO_LINES = [
  { until: 2.6, text: "Ei, vamos embarcar em aventuras juntos?" },
  { until: 5.6, text: "Como key user na equipe, faremos o melhor." },
  { until: 99, text: "Venha comigo, vamos fazer acontecer." },
] as const;

function IntroAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [line, setLine] = useState<string>(INTRO_LINES[0].text);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduced) return;
    video.muted = true;
    video.loop = true;
    void video.play().catch(() => {});
  }, [reduced]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    void video.play().catch(() => {});
  };

  const onTime = () => {
    const t = videoRef.current?.currentTime ?? 0;
    const next = INTRO_LINES.find((item) => t < item.until)?.text ?? INTRO_LINES[2].text;
    setLine(next);
  };

  return (
    <figure className="mx-auto w-full max-w-[280px] lg:max-w-none">
      <div className="relative overflow-hidden rounded-[28px] border border-border bg-fg shadow-[0_18px_40px_rgba(42,50,40,0.08)]">
        {reduced ? (
          <img
            src={publicUrl("/avatars/intro.jpg")}
            alt="Marcelo, Key User"
            className="mx-auto max-h-[36vh] w-full object-cover object-[50%_12%] sm:max-h-[46vh] lg:max-h-[62vh]"
          />
        ) : (
          <video
            ref={videoRef}
            className="mx-auto max-h-[36vh] w-full object-cover object-[50%_12%] sm:max-h-[46vh] lg:max-h-[62vh]"
            poster={publicUrl("/avatars/intro.jpg")}
            playsInline
            preload="auto"
            loop
            muted
            onTimeUpdate={onTime}
            onClick={toggleSound}
          >
            <source src={publicUrl("/media/intro.mp4")} type="video/mp4" />
          </video>
        )}
        {reduced ? null : (
          <button
            type="button"
            onClick={toggleSound}
            className="absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface/90 text-fg"
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        )}
      </div>
      <figcaption
        key={line}
        className="speech-enter mt-3 rounded-[20px] border border-border bg-surface px-4 py-3 text-pretty text-sm leading-relaxed text-fg"
      >
        <span className="mb-1 block text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
          Key User
        </span>
        {line}
      </figcaption>
    </figure>
  );
}

export function StartScreen({ bestScore }: { bestScore: number }) {
  const start = useGame((s) => s.start);

  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl items-center gap-4 px-4 py-4 pb-32 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
      <IntroAvatar />

      <div className="flex flex-col gap-4 sm:gap-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent uppercase">
          Treinamento Key User
        </p>
        <div>
          <h1 className="font-display text-4xl leading-[1.05] text-balance text-fg sm:text-5xl">
            Missão Fechamento
          </h1>
          <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-muted">
            Oito fases da trilha Rubrica → Determinação → Contabilidade →
            Pagamento.
          </p>
        </div>

        <ul className="grid grid-cols-3 gap-2 sm:gap-3">
          <Rule
            icon={<Heart className="size-4" />}
            title="3 vidas"
            body="Cada erro consome uma."
          />
          <Rule
            icon={<Clock className="size-4" />}
            title="Ele espera"
            body="Café aos 10s. Oh no aos 20s."
          />
          <Rule
            icon={<Keyboard className="size-4" />}
            title="A B C D"
            body="Toque ou teclado."
          />
        </ul>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" size="lg" onClick={start}>
            Iniciar missão
            <ArrowRight className="size-4" />
          </Button>
          {bestScore > 0 ? (
            <p className="text-sm text-muted">
              Melhor marca{" "}
              <span className="font-display text-lg tabular-nums text-fg">
                {bestScore}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Rule({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="rounded-[16px] border border-border bg-surface p-3 sm:rounded-[20px] sm:p-4">
      <div className="mb-1 text-accent sm:mb-2">{icon}</div>
      <p className="text-xs font-medium text-fg sm:text-sm">{title}</p>
      <p className="mt-1 text-pretty text-[11px] leading-relaxed text-muted sm:text-xs">
        {body}
      </p>
    </li>
  );
}
