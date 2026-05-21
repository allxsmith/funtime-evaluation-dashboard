import { useEvaluationStore } from "../store/evaluationStore";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function enabled(): boolean {
  return useEvaluationStore.getState().config.soundEnabled ?? true;
}

function tone(
  freq: number,
  durMs: number,
  type: OscillatorType = "sine",
  gainVal = 0.15,
  attackMs = 5,
  delayMs = 0,
) {
  if (!enabled()) return;
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const t0 = audio.currentTime + delayMs / 1000;
  const t1 = t0 + durMs / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainVal, t0 + attackMs / 1000);
  gain.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

function sweep(
  freqStart: number,
  freqEnd: number,
  durMs: number,
  type: OscillatorType = "sawtooth",
  gainVal = 0.12,
) {
  if (!enabled()) return;
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const t0 = audio.currentTime;
  const t1 = t0 + durMs / 1000;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t1);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(gainVal, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t1);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);
  osc.stop(t1 + 0.02);
}

export const sfx = {
  click: () => tone(440, 40, "square", 0.05),
  tick: () => tone(900 + Math.random() * 200, 30, "square", 0.07),
  ding: () => {
    tone(1320, 350, "sine", 0.25);
    tone(660, 350, "sine", 0.18, 5, 0);
  },
  swoosh: () => sweep(200, 1200, 240, "sawtooth", 0.08),
  reveal: () => {
    tone(523, 90, "triangle", 0.12);
    tone(659, 90, "triangle", 0.12, 5, 80);
    tone(784, 140, "triangle", 0.14, 5, 160);
  },
  fanfare: () => {
    // Simple major-chord arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) =>
      tone(f, 220, "triangle", 0.16, 5, i * 90),
    );
    notes
      .slice()
      .reverse()
      .forEach((f, i) =>
        tone(f, 180, "triangle", 0.12, 5, 400 + i * 70),
      );
  },
  spinSequence: () => {
    // Accelerating then decelerating ticks across ~4.5s spin
    const total = 4500;
    let t = 0;
    let interval = 60;
    while (t < total) {
      const delay = t;
      setTimeout(() => sfx.tick(), delay);
      // accelerate first half, decelerate second half
      if (t < total / 2) interval = Math.max(40, interval * 0.95);
      else interval = Math.min(200, interval * 1.1);
      t += interval;
    }
  },
};

export function primeAudio() {
  const audio = getCtx();
  if (audio && audio.state === "suspended") void audio.resume();
}
