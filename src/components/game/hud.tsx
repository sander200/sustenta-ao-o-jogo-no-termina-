import { Heart, Timer } from "lucide-react";
import { MAX_LIVES, PHASES } from "@/lib/game/phases";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function Hud({ elapsed }: { elapsed: number }) {
  const score = useGame((s) => s.score);
  const lives = useGame((s) => s.lives);
  const streak = useGame((s) => s.streak);
  const phaseIndex = useGame((s) => s.phaseIndex);
  const answered = useGame((s) => s.answered);
  const urgent = !answered && elapsed >= 20;

  return (
    <header className="flex items-center gap-2 rounded-[16px] border border-border bg-surface px-3 py-2 sm:gap-3">
      <p className="min-w-0 flex-1 truncate text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
        Fase {phaseIndex + 1}/{PHASES.length}
      </p>
      <span className="font-display text-sm tabular-nums text-fg">{score}</span>
      <span className="text-[11px] tabular-nums text-muted">×{streak}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-sm tabular-nums text-fg",
          urgent && "text-danger",
        )}
      >
        <Timer className="size-3.5" />
        {Math.floor(elapsed).toString().padStart(2, "0")}s
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "size-4",
              i < lives ? "fill-danger text-danger" : "text-border",
            )}
            strokeWidth={1.8}
          />
        ))}
      </div>
    </header>
  );
}
