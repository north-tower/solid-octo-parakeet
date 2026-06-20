import confetti from 'canvas-confetti';

export function celebrateSessionComplete() {
  confetti({
    particleCount: 60,
    spread: 62,
    origin: { y: 0.72 },
    colors: ['#6366f1', '#a855f7', '#c4b5fd', '#34d399'],
    disableForReducedMotion: true,
  });
}

export function celebrateLevelUp() {
  const duration = 900;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#6366f1', '#a855f7', '#fcd34d'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#6366f1', '#a855f7', '#fcd34d'],
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
