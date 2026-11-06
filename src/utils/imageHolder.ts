/**
 * Utility to generate high-resolution image placeholder / image holder canvas graphics.
 * Features:
 * - Sleek neutral studio dark gradient
 * - Camera viewfinder corner brackets
 * - Subtle dashed inner bounding frame
 * - Prominent center circular mini button with a bold '+' sign
 * - "ADD PHOTO" action typography
 */
export function drawImageHolder(
  width = 1080,
  height = 1350,
  label = 'Add Photo',
  sublabel = 'Click or tap to choose image',
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(100, Math.round(width));
  canvas.height = Math.max(100, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas 2D context unavailable'));

  const w = canvas.width;
  const h = canvas.height;
  const minDim = Math.min(w, h);

  // 1. Studio placeholder background - sleek neutral slate with subtle depth
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#232936');
  bgGrad.addColorStop(0.5, '#191d26');
  bgGrad.addColorStop(1, '#13161f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Corner framing brackets (camera viewfinder / photo matting motif)
  ctx.save();
  ctx.strokeStyle = 'rgba(126, 182, 255, 0.45)';
  ctx.lineWidth = Math.max(2, Math.round(minDim * 0.005));
  ctx.lineCap = 'round';
  const bracketLen = Math.max(14, Math.round(minDim * 0.05));
  const bracketPad = Math.max(12, Math.round(minDim * 0.035));

  // Top-left
  ctx.beginPath();
  ctx.moveTo(bracketPad, bracketPad + bracketLen);
  ctx.lineTo(bracketPad, bracketPad);
  ctx.lineTo(bracketPad + bracketLen, bracketPad);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(w - bracketPad - bracketLen, bracketPad);
  ctx.lineTo(w - bracketPad, bracketPad);
  ctx.lineTo(w - bracketPad, bracketPad + bracketLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(bracketPad, h - bracketPad - bracketLen);
  ctx.lineTo(bracketPad, h - bracketPad);
  ctx.lineTo(bracketPad + bracketLen, h - bracketPad);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(w - bracketPad - bracketLen, h - bracketPad);
  ctx.lineTo(w - bracketPad, h - bracketPad);
  ctx.lineTo(w - bracketPad, h - bracketPad - bracketLen);
  ctx.stroke();
  ctx.restore();

  // 3. Subtle dashed inner border
  ctx.save();
  const innerInset = Math.max(16, Math.round(minDim * 0.045));
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = Math.max(1.5, Math.round(minDim * 0.0025));
  ctx.setLineDash([Math.max(6, Math.round(minDim * 0.015)), Math.max(6, Math.round(minDim * 0.015))]);
  ctx.strokeRect(innerInset, innerInset, w - innerInset * 2, h - innerInset * 2);
  ctx.restore();

  // 4. Center Circle Mini Button with '+' sign
  const cx = w / 2;
  const cy = h / 2 - Math.round(minDim * 0.025);
  const btnRadius = Math.max(34, Math.min(68, Math.round(minDim * 0.085)));

  // Outer shadow & glow ring
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = Math.round(btnRadius * 0.5);
  ctx.shadowOffsetY = Math.round(btnRadius * 0.18);

  ctx.beginPath();
  ctx.arc(cx, cy, btnRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#10141d';
  ctx.fill();
  ctx.restore();

  // Subtle circular gradient fill
  ctx.save();
  const innerGrad = ctx.createLinearGradient(cx - btnRadius, cy - btnRadius, cx + btnRadius, cy + btnRadius);
  innerGrad.addColorStop(0, 'rgba(126, 182, 255, 0.28)');
  innerGrad.addColorStop(1, 'rgba(16, 20, 29, 0.95)');
  ctx.beginPath();
  ctx.arc(cx, cy, btnRadius - 1, 0, Math.PI * 2);
  ctx.fillStyle = innerGrad;

  // Ring border stroke
  ctx.strokeStyle = '#7eb6ff';
  ctx.lineWidth = Math.max(2.5, Math.round(btnRadius * 0.08));
  ctx.stroke();
  ctx.restore();

  // Crisp '+' sign in the circle
  ctx.save();
  const plusLen = btnRadius * 0.4;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3.5, Math.round(btnRadius * 0.13));
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Horizontal line
  ctx.moveTo(cx - plusLen, cy);
  ctx.lineTo(cx + plusLen, cy);
  // Vertical line
  ctx.moveTo(cx, cy - plusLen);
  ctx.lineTo(cx, cy + plusLen);
  ctx.stroke();
  ctx.restore();

  // 5. Typography under the button
  ctx.save();
  const labelFontSize = Math.max(13, Math.min(26, Math.round(btnRadius * 0.4)));
  ctx.font = `700 ${labelFontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '2px';
  ctx.fillText(label.toUpperCase(), cx, cy + btnRadius + Math.round(btnRadius * 0.3));

  const subFontSize = Math.max(10, Math.min(16, Math.round(labelFontSize * 0.65)));
  ctx.font = `400 ${subFontSize}px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(sublabel, cx, cy + btnRadius + Math.round(btnRadius * 0.3) + labelFontSize + 6);
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not generate image holder.'));
    }, 'image/png');
  });
}

