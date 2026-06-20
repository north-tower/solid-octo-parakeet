import { useRef, useState, type CSSProperties, type MouseEvent } from 'react';

interface PowerSliderProps {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  /** Gradient track, tick marks, glowing thumb when mining */
  enhanced?: boolean;
  miningActive?: boolean;
}

const TICKS = [25, 50, 75, 100] as const;

export function PowerSlider({
  value,
  disabled,
  onChange,
  enhanced = false,
  miningActive = false,
}: PowerSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const showTooltip = dragging || hover;
  const fillPercent = (value / 90) * 100;
  const tooltipLeft = `${fillPercent}%`;

  const trackStyle = enhanced
    ? ({ '--slider-fill': `${fillPercent}%` } as CSSProperties)
    : undefined;

  return (
    <div
      className={`slider-field${enhanced ? ' slider-enhanced' : ''}${
        disabled ? ' slider-disabled' : ''
      }${miningActive ? ' slider-mining-active' : ''}`}
      style={trackStyle}
      title={
        disabled
          ? 'CPU power is locked while a mining session is active'
          : undefined
      }
    >
      <div className="slider-header">
        <span>CPU power</span>
        <span className="slider-value">{value}%</span>
      </div>
      <div
        ref={trackRef}
        className="slider-track-wrap"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {showTooltip && !disabled && (
          <span className="slider-tooltip" style={{ left: tooltipLeft }}>
            {value}%
          </span>
        )}
        {enhanced && <div className="slider-track-fill" aria-hidden="true" />}
        <input
          type="range"
          min={0}
          max={90}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onBlur={() => setDragging(false)}
        />
      </div>
      {enhanced && (
        <div className="slider-ticks" aria-hidden="true">
          {TICKS.map((tick) => (
            <span
              key={tick}
              className="slider-tick"
              style={{ left: `${(Math.min(tick, 90) / 90) * 100}%` }}
            >
              <i />
              <em>{tick}%</em>
            </span>
          ))}
        </div>
      )}
      {disabled && (
        <p className="field-hint">
          Power is locked during an active session. Stop mining to adjust.
        </p>
      )}
    </div>
  );
}

export function useButtonRipple() {
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(
    null,
  );

  const triggerRipple = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      key: Date.now(),
    });
    window.setTimeout(() => setRipple(null), 650);
  };

  return { ripple, triggerRipple };
}
