import { create } from "zustand";
import { BEST_SCORE_KEY, HINT_COST, MAX_LIVES, PHASES } from "./phases";
import { sfxCorrect, sfxWrong, unlockSfx } from "./sfx";
import type { Screen } from "./types";

function readBest() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(BEST_SCORE_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function persistBest(score: number) {
  if (typeof window === "undefined") return score;
  const best = Math.max(readBest(), score);
  window.localStorage.setItem(BEST_SCORE_KEY, String(best));
  return best;
}

export type GameState = {
  screen: Screen;
  phaseIndex: number;
  score: number;
  lives: number;
  streak: number;
  answered: boolean;
  selected: number | null;
  wasCorrect: boolean | null;
  hinted: boolean;
  questionStartedAt: number;
  lost: boolean;
  lastGain: number;
  bestScore: number;
  start: () => void;
  answer: (index: number) => void;
  hint: () => void;
  next: () => void;
  reset: () => void;
};

function computeGain(elapsedSec: number, streak: number, hinted: boolean) {
  const timeBonus = elapsedSec < 10 ? 25 : elapsedSec < 20 ? 10 : elapsedSec > 30 ? -15 : 0;
  const streakBonus = streak * 15;
  return Math.max(20, 100 + streakBonus + timeBonus - (hinted ? HINT_COST : 0));
}

export const useGame = create<GameState>((set, get) => ({
  screen: "start",
  phaseIndex: 0,
  score: 0,
  lives: MAX_LIVES,
  streak: 0,
  answered: false,
  selected: null,
  wasCorrect: null,
  hinted: false,
  questionStartedAt: 0,
  lost: false,
  lastGain: 0,
  bestScore: 0,
  start: () => {
    unlockSfx();
    set({
      screen: "playing",
      phaseIndex: 0,
      score: 0,
      lives: MAX_LIVES,
      streak: 0,
      answered: false,
      selected: null,
      wasCorrect: null,
      hinted: false,
      questionStartedAt: performance.now(),
      lost: false,
      lastGain: 0,
      bestScore: readBest(),
    });
  },
  answer: (index) => {
    const s = get();
    if (s.screen !== "playing" || s.answered) return;
    const phase = PHASES[s.phaseIndex];
    const correct = index === phase.correct;
    const elapsed = (performance.now() - s.questionStartedAt) / 1000;
    if (correct) {
      const gain = computeGain(elapsed, s.streak, s.hinted);
      sfxCorrect();
      set({
        answered: true,
        selected: index,
        wasCorrect: true,
        score: s.score + gain,
        streak: s.streak + 1,
        lastGain: gain,
      });
      return;
    }
    sfxWrong();
    const lives = s.lives - 1;
    const lost = lives <= 0;
    set({
      answered: true,
      selected: index,
      wasCorrect: false,
      lives,
      streak: 0,
      lastGain: 0,
      lost,
    });
  },
  hint: () => {
    const s = get();
    if (s.screen !== "playing" || s.answered || s.hinted) return;
    set({ hinted: true, score: Math.max(0, s.score - HINT_COST) });
  },
  next: () => {
    const s = get();
    if (s.screen !== "playing" || !s.answered) return;
    if (s.lost || s.phaseIndex >= PHASES.length - 1) {
      set({
        screen: "result",
        lost: s.lost,
        bestScore: persistBest(s.score),
      });
      return;
    }
    set({
      phaseIndex: s.phaseIndex + 1,
      answered: false,
      selected: null,
      wasCorrect: null,
      hinted: false,
      questionStartedAt: performance.now(),
      lastGain: 0,
    });
  },
  reset: () => {
    set({
      screen: "start",
      phaseIndex: 0,
      score: 0,
      lives: MAX_LIVES,
      streak: 0,
      answered: false,
      selected: null,
      wasCorrect: null,
      hinted: false,
      questionStartedAt: 0,
      lost: false,
      lastGain: 0,
      bestScore: readBest(),
    });
  },
}));
