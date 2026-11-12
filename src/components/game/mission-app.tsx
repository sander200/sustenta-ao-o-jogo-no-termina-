import { useEffect } from "react";
import { AvatarStage } from "@/components/game/avatar-stage";
import { Hud } from "@/components/game/hud";
import { QuestionPanel } from "@/components/game/question-panel";
import { ResultScreen } from "@/components/game/result-screen";
import { StartScreen } from "@/components/game/start-screen";
import { BEST_SCORE_KEY } from "@/lib/game/phases";
import { preloadMissionMedia } from "@/lib/game/preload";
import { useGame } from "@/lib/game/store";
import { useElapsed } from "@/lib/game/use-elapsed";

export function MissionApp() {
  const screen = useGame((s) => s.screen);
  const answered = useGame((s) => s.answered);
  const bestScore = useGame((s) => s.bestScore);
  const reset = useGame((s) => s.reset);
  const answer = useGame((s) => s.answer);
  const next = useGame((s) => s.next);
  const hint = useGame((s) => s.hint);
  const { elapsed, mood } = useElapsed();

  useEffect(() => {
    preloadMissionMedia();
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    if (Number.isFinite(n) && n > 0) {
      useGame.setState({ bestScore: n });
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (screen === "start" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        useGame.getState().start();
        return;
      }
      if (screen !== "playing") return;
      const key = event.key.toLowerCase();
      if ("abcd".includes(key) && !answered) {
        event.preventDefault();
        answer(key.charCodeAt(0) - 97);
      }
      if (key === "h" && !answered) {
        event.preventDefault();
        hint();
      }
      if (event.key === "Enter" && answered) {
        event.preventDefault();
        next();
      }
      if (key === "r" && event.shiftKey) {
        event.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, answered, answer, next, hint, reset]);

  if (screen === "start") return <StartScreen bestScore={bestScore} />;
  if (screen === "result") return <ResultScreen />;

  return (
    <div className="mx-auto flex h-dvh max-w-6xl flex-col gap-2 overflow-hidden px-3 pt-3 pb-32 sm:gap-4 sm:px-6 sm:pt-5 sm:pb-28">
      <Hud elapsed={elapsed} />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,200px)_1fr] lg:items-stretch lg:gap-6">
        <AvatarStage mood={mood} elapsed={elapsed} answered={answered} showTimer compact />
        <QuestionPanel />
      </div>
    </div>
  );
}
