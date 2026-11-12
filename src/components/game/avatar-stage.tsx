import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { MOOD_ASSETS } from "@/lib/game/mood";
import type { Mood } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function TimerRing({ elapsed, answered }: { elapsed: number; answered: boolean }) {
  const cap = 28;
  const t = Math.min(1, elapsed / cap);
  const r = 46;
  const c = 2 * Math.PI * r;
  const color =
    answered ? "stroke-accent" : t > 0.7 ? "stroke-danger" : t > 0.35 ? "stroke-warn" : "stroke-accent";
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 size-full -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        className="stroke-border"
        strokeWidth="2.2"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        className={cn(color, "transition-[stroke-dashoffset,stroke] duration-200")}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - t)}
      />
    </svg>
  );
}

export function AvatarStage({
  mood,
  elapsed,
  answered,
  compact = false,
  showTimer = false,
}: {
  mood: Mood;
  elapsed: number;
  answered: boolean;
  compact?: boolean;
  showTimer?: boolean;
}) {
  const asset = MOOD_ASSETS[mood];
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const playVideo = Boolean(asset.video) && !reduced;

  useEffect(() => {
    setVideoReady(false);
    const video = videoRef.current;
    if (!video || !playVideo || !asset.video) return;
    video.src = asset.video;
    video.loop = asset.loop;
    video.currentTime = 0;
    const play = () => {
      video
        .play()
        .then(() => setVideoReady(true))
        .catch(() => setVideoReady(false));
    };
    if (video.readyState >= 2) play();
    else video.addEventListener("canplay", play, { once: true });
    return () => video.removeEventListener("canplay", play);
  }, [mood, asset.video, asset.loop, playVideo]);

  const glow =
    asset.glow === "green"
      ? "shadow-[0_10px_28px_rgba(47,122,79,0.18)]"
      : asset.glow === "red"
        ? "shadow-[0_10px_28px_rgba(181,74,60,0.18)]"
        : asset.glow === "amber"
          ? "shadow-[0_10px_28px_rgba(176,122,31,0.16)]"
          : "shadow-[0_10px_28px_rgba(95,122,78,0.12)]";

  return (
    <figure
      className={cn(
        "flex w-full",
        compact ? "flex-row items-center gap-3 lg:flex-col lg:items-stretch" : "flex-col gap-3",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-border bg-surface",
          compact
            ? "h-[112px] w-[86px] rounded-[16px] lg:mx-auto lg:h-[240px] lg:w-[168px] lg:rounded-[24px]"
            : "mx-auto h-[210px] w-[148px] rounded-[22px] sm:h-auto sm:w-full sm:max-w-[320px] sm:aspect-[2/3] sm:rounded-[28px]",
          glow,
        )}
      >
        <img
          src={asset.still}
          alt="Key User Marcelo"
          className={cn(
            "absolute inset-0 size-full object-cover object-[50%_12%] transition-opacity duration-300",
            videoReady ? "opacity-0" : "opacity-100",
          )}
        />
        {playVideo ? (
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 size-full object-cover object-[50%_12%] transition-opacity duration-300",
              videoReady ? "opacity-100" : "opacity-0",
            )}
            poster={asset.still}
            muted
            playsInline
            preload="auto"
          />
        ) : null}

        {mood === "correct" ? (
          <span className="absolute top-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-xl bg-success text-accent-fg shadow-sm lg:top-3 lg:right-3 lg:size-11 lg:rounded-2xl">
            <Check className="size-4 lg:size-6" strokeWidth={2.6} />
          </span>
        ) : null}
        {mood === "wrong" ? (
          <span className="absolute top-1.5 right-1.5 inline-flex h-7 items-center gap-1 rounded-xl bg-danger px-1.5 text-[10px] font-semibold tracking-wide text-accent-fg shadow-sm lg:top-3 lg:right-3 lg:h-11 lg:rounded-2xl lg:px-3 lg:text-sm">
            <X className="size-3 lg:size-4" strokeWidth={2.6} />
            ERROR
          </span>
        ) : null}

        {showTimer ? <TimerRing elapsed={elapsed} answered={answered} /> : null}
      </div>

      <figcaption
        key={asset.line}
        className="speech-enter min-w-0 flex-1 rounded-[16px] border border-border bg-surface px-3 py-2 text-pretty text-xs leading-relaxed text-fg sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-sm"
      >
        <span className="mb-0.5 block text-[10px] font-semibold tracking-[0.16em] text-muted uppercase">
          Key User
        </span>
        {asset.line}
      </figcaption>
    </figure>
  );
}
