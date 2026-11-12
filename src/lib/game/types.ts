export type Mood =
  | "welcome"
  | "idle"
  | "thinking"
  | "waiting"
  | "anxious"
  | "correct"
  | "wrong";

export type Screen = "start" | "playing" | "result";

export type Phase = {
  id: string;
  tag: string;
  title: string;
  story: string;
  question: string;
  answers: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explain: string;
  hint: string;
};

export type MoodAsset = {
  still: string;
  video?: string;
  loop: boolean;
  line: string;
  glow: "sage" | "amber" | "red" | "green" | "none";
};
