export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function computeFit(viewW: number, viewH: number, docW: number, docH: number) {
  const availW = Math.max(120, viewW - 80);
  const availH = Math.max(120, viewH - 72);
  const zoom = clamp(Math.min(availW / docW, availH / docH), MIN_ZOOM, 1);
  return {
    zoom,
    pan: {
      x: (viewW - docW * zoom) / 2,
      y: (viewH - docH * zoom) / 2,
    },
  };
}

/** CSS linear-gradient angles: 0° points up, 90° points right. */
export function gradientPoints(width: number, height: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const halfW = width / 2;
  const halfH = height / 2;
  const length = Math.abs(dx * halfW) + Math.abs(dy * halfH);
  return {
    start: { x: halfW - dx * length, y: halfH - dy * length },
    end: { x: halfW + dx * length, y: halfH + dy * length },
  };
}

export function coverRect(srcW: number, srcH: number, boxW: number, boxH: number) {
  const scale = Math.max(boxW / srcW, boxH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (boxW - width) / 2,
    y: (boxH - height) / 2,
    width,
    height,
  };
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'carousel';
}

export function formatNumber(value: number) {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}
