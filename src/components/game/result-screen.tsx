import { ArrowRight, RotateCcw } from "lucide-react";
import { AvatarStage } from "@/components/game/avatar-stage";
import { Button } from "@/components/ui/button";
import { PHASES } from "@/lib/game/phases";
import { rankFor } from "@/lib/game/mood";
import { useGame } from "@/lib/game/store";

export function ResultScreen() {
  const score = useGame((s) => s.score);
  const lost = useGame((s) => s.lost);
  const bestScore = useGame((s) => s.bestScore);
  const phaseIndex = useGame((s) => s.phaseIndex);
  const start = useGame((s) => s.start);
  const reset = useGame((s) => s.reset);
  const rank = rankFor(score);

  return (
    <div className="mx-auto grid min-h-dvh max-w-4xl items-center gap-6 px-4 py-6 pb-32 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-8">
      <AvatarStage
        mood={lost ? "wrong" : "correct"}
        elapsed={lost ? 28 : 4}
        answered
      />
      <div className="flex flex-col gap-5">
        <p className="text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
          {lost ? "Fechamento interrompido" : "Fechamento concluído"}
        </p>
        <h2 className="font-display text-4xl leading-tight text-balance text-fg">
          {rank.title}
        </h2>
        <p className="max-w-prose text-pretty text-muted">{rank.blurb}</p>
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Pontos</p>
            <p className="font-display text-5xl tabular-nums text-fg">{score}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] text-muted uppercase">Recorde</p>
            <p className="font-display text-5xl tabular-nums text-fg">{bestScore}</p>
          </div>
        </div>
        <p className="text-sm text-muted">
          {lost
            ? `A trilha parou na fase ${phaseIndex + 1} de ${PHASES.length}.`
            : "Você percorreu Rubrica → Determinação → Conta → Centro → Benefício → Provisão → Tesouraria → Fechamento."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="lg" onClick={start}>
            Jogar de novo
            <ArrowRight className="size-4" />
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={reset}>
            <RotateCcw className="size-4" />
            Tela inicial
          </Button>
        </div>
      </div>
    </div>
  );
}
