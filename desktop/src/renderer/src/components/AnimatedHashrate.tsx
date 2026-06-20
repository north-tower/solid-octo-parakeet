import { useEffect, useState } from 'react';

interface AnimatedHashrateProps {
  value: number;
  active: boolean;
}

export function AnimatedHashrate({ value, active }: AnimatedHashrateProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = window.setInterval(() => {
      setDisplay((current) => {
        const jitter = (Math.random() - 0.5) * value * 0.04;
        return Math.max(0, current + jitter);
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, value]);

  return (
    <strong className={active ? 'hashrate-live' : ''}>
      {display.toFixed(2)} H/s
    </strong>
  );
}
