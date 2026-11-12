import { useEffect, useRef, useState } from "react";
import { deriveMood } from "./mood";
import { sfxAnxious, sfxWait } from "./sfx";
import { useGame } from "./store";
import type { Mood } from "./types";

export function useElapsed() {
  const screen = useGame((s) => s.screen);
  const answered = useGame((s) => s.answered);
  const wasCorrect = useGame((s) => s.wasCorrect);
  const startedAt = useGame((s) => s.questionStartedAt);
  const lost = useGame((s) => s.lost);
  const [now, setNow] = useState(() =>
    typeof performance === "undefined" ? 0 : performance.now(),
  );

  useEffect(() => {
    if (screen !== "playing" || answered) return;
    const id = window.setInterval(() => setNow(performance.now()), 200);
    return () => window.clearInterval(id);
  }, [screen, answered, startedAt]);

  const elapsed =
    screen === "playing" && startedAt > 0
      ? Math.max(0, (now - startedAt) / 1000)
      : 0;

  const mood: Mood = deriveMood(screen, answered, wasCorrect, elapsed, lost);
  const prevMood = useRef<Mood>(mood);

  useEffect(() => {
    if (prevMood.current === mood) return;
    if (mood === "waiting") sfxWait();
    if (mood === "anxious") sfxAnxious();
    prevMood.current = mood;
  }, [mood]);

  return { elapsed, mood };
}
