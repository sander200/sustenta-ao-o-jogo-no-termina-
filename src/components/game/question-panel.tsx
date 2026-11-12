import { ArrowRight, Lightbulb, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HINT_COST, PHASES } from "@/lib/game/phases";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"] as const;

export function QuestionPanel() {
  const phaseIndex = useGame((s) => s.phaseIndex);
  const answered = useGame((s) => s.answered);
  const selected = useGame((s) => s.selected);
  const wasCorrect = useGame((s) => s.wasCorrect);
  const hinted = useGame((s) => s.hinted);
  const lastGain = useGame((s) => s.lastGain);
  const lost = useGame((s) => s.lost);
  const answer = useGame((s) => s.answer);
  const hint = useGame((s) => s.hint);
  const next = useGame((s) => s.next);
  const reset = useGame((s) => s.reset);
  const phase = PHASES[phaseIndex];

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="sage">{phase.tag}</Badge>
      </div>
      <h2 className="font-display text-lg leading-tight text-balance text-fg sm:text-3xl">
        {phase.title}
      </h2>
      <p className="line-clamp-2 text-pretty text-xs leading-snug text-muted sm:line-clamp-none sm:text-sm">
        {phase.story}
      </p>

      <p className="rounded-[14px] border border-border bg-elevated px-3 py-2 text-sm font-medium text-pretty text-fg sm:rounded-[20px] sm:px-4 sm:py-3 sm:text-base">
        {phase.question}
      </p>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {phase.answers.map((text, i) => {
          const isCorrect = i === phase.correct;
          const isPicked = selected === i;
          return (
            <Button
              key={text}
              type="button"
              variant="answer"
              size="answer"
              disabled={answered}
              onClick={() => answer(i)}
              className={cn(
                answered && isCorrect && "border-success bg-success/15 text-fg",
                answered && isPicked && !isCorrect && "border-danger bg-danger/15",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-[8px] bg-bg text-[11px] font-semibold text-muted sm:size-7 sm:text-xs",
                  answered && isCorrect && "bg-success text-accent-fg",
                  answered && isPicked && !isCorrect && "bg-danger text-accent-fg",
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="min-w-0">{text}</span>
            </Button>
          );
        })}
      </div>

      {hinted && !answered ? (
        <p className="rounded-[14px] border border-border bg-surface px-3 py-2 text-xs leading-snug text-muted">
          <span className="font-medium text-fg">Dica. </span>
          {phase.hint}
        </p>
      ) : null}

      {answered ? (
        <div
          className={cn(
            "rounded-[14px] border px-3 py-2 text-xs leading-snug",
            wasCorrect
              ? "border-success/30 bg-success/10 text-fg"
              : "border-danger/30 bg-danger/10 text-fg",
          )}
        >
          <p className="font-medium">
            {wasCorrect ? `Correto · +${lastGain} pontos` : "Não fecha"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-pretty text-muted sm:line-clamp-none">
            {phase.explain}
          </p>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={hint}
          disabled={answered || hinted}
        >
          <Lightbulb className="size-4" />
          Dica (−{HINT_COST})
        </Button>
        <Button type="button" onClick={next} disabled={!answered}>
          {lost || phaseIndex === PHASES.length - 1 ? "Encerrar" : "Próximo"}
          <ArrowRight className="size-4" />
        </Button>
        <Button type="button" variant="ghost" onClick={reset} className="hidden sm:inline-flex">
          <RotateCcw className="size-4" />
          Reiniciar
        </Button>
      </div>
    </section>
  );
}
