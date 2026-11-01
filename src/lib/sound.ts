/**
 * Tiny synthesized UI cues (Web Audio oscillators) — no sound files to download.
 * Gentle and short so they never cover the pronunciation.
 */
export type Cue = "correct" | "wrong" | "tap" | "complete" | "water";

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const NOTES: Record<Cue, [number, number, number][]> = {
  // [frequency Hz, start s, length s]
  correct: [[659, 0, 0.12], [988, 0.09, 0.18]],
  wrong: [[330, 0, 0.16], [294, 0.12, 0.2]],
  tap: [[880, 0, 0.05]],
  complete: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.3]],
  water: [[1200, 0, 0.06], [900, 0.05, 0.08]],
};

export function cue(name: Cue, enabled = true) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  for (const [f, at, len] of NOTES[name]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = name === "wrong" ? "triangle" : "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + at);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
    o.connect(g).connect(c.destination);
    o.start(t0 + at);
    o.stop(t0 + at + len + 0.02);
  }
}

/** Create/resume the audio context inside a user gesture (iOS needs this). */
export function unlockCues() {
  audio();
}
