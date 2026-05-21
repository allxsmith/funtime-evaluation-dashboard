import confetti from "canvas-confetti";

export function celebrate(opts?: { particleCount?: number }) {
  const particleCount = opts?.particleCount ?? 100;
  confetti({
    particleCount,
    spread: 70,
    origin: { y: 0.4 },
  });
  setTimeout(() => {
    confetti({
      particleCount: Math.round(particleCount * 0.6),
      spread: 100,
      origin: { y: 0.45 },
      startVelocity: 30,
    });
  }, 200);
}

export function bigCelebrate() {
  const end = Date.now() + 1500;
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
