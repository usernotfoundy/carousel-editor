import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatNumber } from '../../utils/geometry';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function NumberField({
  label,
  value,
  onLive,
  onDone,
  min,
  max,
}: {
  label: string;
  value: number;
  onLive: (value: number) => void;
  onDone: () => void;
  min?: number;
  max?: number;
}) {
  const [text, setText] = useState(() => formatNumber(value));
  const focused = useRef(false);
  const labelRef = useRef(label);

  useEffect(() => {
    if (labelRef.current !== label) {
      labelRef.current = label;
      focused.current = false;
      setText(formatNumber(value));
      return;
    }
    if (!focused.current) setText(formatNumber(value));
  }, [label, value]);

  return (
    <Field label={label}>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = Number(next);
          if (!Number.isFinite(parsed)) return;
          const clamped =
            min != null || max != null ? Math.min(max ?? parsed, Math.max(min ?? parsed, parsed)) : parsed;
          onLive(clamped);
        }}
        onBlur={() => {
          focused.current = false;
          setText(formatNumber(value));
          onDone();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onLive,
  onDone,
}: {
  label: string;
  value: string;
  onLive: (value: string) => void;
  onDone: () => void;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
  return (
    <Field label={label}>
      <span className="color-line">
        <input
          type="color"
          value={safe}
          aria-label={label}
          onChange={(event) => onLive(event.target.value)}
          onBlur={onDone}
        />
        <input
          type="text"
          value={value}
          spellCheck={false}
          onChange={(event) => onLive(event.target.value)}
          onBlur={() => {
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) onLive(safe);
            onDone();
          }}
        />
      </span>
    </Field>
  );
}
