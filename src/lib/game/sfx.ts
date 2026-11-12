let ctx: AudioContext | null = null;

export function unlockSfx() {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gain = 0.07,
  delay = 0,
) {
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function sfxCorrect() {
  tone(523.25, 0.12, "sine", 0.07, 0);
  tone(659.25, 0.12, "sine", 0.07, 0.09);
  tone(783.99, 0.22, "sine", 0.08, 0.18);
}

export function sfxWrong() {
  tone(196, 0.22, "square", 0.045, 0);
  tone(146.8, 0.32, "square", 0.04, 0.14);
}

export function sfxWait() {
  tone(329.63, 0.1, "triangle", 0.035);
}

export function sfxAnxious() {
  tone(220, 0.16, "sawtooth", 0.025);
  tone(196, 0.2, "sawtooth", 0.02, 0.12);
}

export function sfxTick() {
  tone(880, 0.04, "sine", 0.02);
}
