import { publicUrl } from "@/lib/public-url";
import type { Mood, MoodAsset } from "./types";

export const MOOD_ASSETS: Record<Mood, MoodAsset> = {
  welcome: {
    still: publicUrl("/avatars/key-user.jpg"),
    loop: false,
    line: "Ei, vamos embarcar em aventuras juntos?",
    glow: "sage",
  },
  idle: {
    still: publicUrl("/avatars/key-user.jpg"),
    loop: false,
    line: "Analise a trilha antes de responder.",
    glow: "sage",
  },
  thinking: {
    still: publicUrl("/avatars/thinking.jpg"),
    video: publicUrl("/media/thinking.mp4"),
    loop: true,
    line: "Hmm… de onde nasceu essa diferença?",
    glow: "sage",
  },
  waiting: {
    still: publicUrl("/avatars/waiting.jpg"),
    video: publicUrl("/media/waiting.mp4"),
    loop: true,
    line: "Tô esperando… o café esfria.",
    glow: "amber",
  },
  anxious: {
    still: publicUrl("/avatars/anxious.jpg"),
    loop: true,
    line: "Oh no! O fechamento não espera.",
    glow: "red",
  },
  correct: {
    still: publicUrl("/avatars/correct.jpg"),
    video: publicUrl("/media/correct.mp4"),
    loop: true,
    line: "Boa! Você encontrou a trilha.",
    glow: "green",
  },
  wrong: {
    still: publicUrl("/avatars/wrong.jpg"),
    video: publicUrl("/media/wrong.mp4"),
    loop: false,
    line: "Error! Não fecha. Volte à origem.",
    glow: "red",
  },
};


export function deriveMood(
  screen: "start" | "playing" | "result",
  answered: boolean,
  wasCorrect: boolean | null,
  elapsed: number,
  lost: boolean,
): Mood {
  if (screen === "start") return "welcome";
  if (screen === "result") return lost ? "wrong" : "correct";
  if (answered) return wasCorrect ? "correct" : "wrong";
  if (elapsed >= 20) return "anxious";
  if (elapsed >= 10) return "waiting";
  if (elapsed >= 3) return "thinking";
  return "idle";
}

export function rankFor(score: number) {
  if (score >= 850) return { title: "Key User", blurb: "A trilha inteira fecha com você." };
  if (score >= 620) return { title: "Sênior de Fechamento", blurb: "Você lê a conciliação em camadas." };
  if (score >= 380) return { title: "Analista Pleno", blurb: "A origem já não te assusta." };
  return { title: "Estagiário do Razão", blurb: "Revise a trilha e tente de novo." };
}

export const PRELOAD_STILLS = [
  publicUrl("/avatars/key-user.jpg"),
  publicUrl("/avatars/idle.jpg"),
  publicUrl("/avatars/thinking.jpg"),
  publicUrl("/avatars/waiting.jpg"),
  publicUrl("/avatars/anxious.jpg"),
  publicUrl("/avatars/correct.jpg"),
  publicUrl("/avatars/wrong.jpg"),
];

export const PRELOAD_VIDEOS = [
  publicUrl("/media/thinking.mp4"),
  publicUrl("/media/waiting.mp4"),
  publicUrl("/media/correct.mp4"),
  publicUrl("/media/wrong.mp4"),
];
