import { useRef, useState } from 'react';

interface PowerSliderProps {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

export function PowerSlider({ value, disabled, onChange }: PowerSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const showTooltip = dragging || hover;

  const tooltipLeft = `${(value / 90) * 100}%`;

  return (
    <div
      className={`slider-field ${disabled ? 'slider-disabled' : ''}`}
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
      {disabled && (
        <p className="field-hint">
          Power is locked during an active session. Stop mining to adjust.
        </p>
      )}
    </div>
  );
}
