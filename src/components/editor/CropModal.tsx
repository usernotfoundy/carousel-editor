import { useEffect, useState } from 'react';
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Check,
  Crop as CropIcon,
  RotateCcw,
  X,
  ZoomIn,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import type { CropPosition, CustomCrop, ImageElement } from '../../types/editor';
import { computeImageCoverCrop } from '../../utils/nodeConfig';

export function CropModal({
  element,
  onClose,
}: {
  element: ImageElement;
  onClose: () => void;
}) {
  const { assets, setElementCrop } = useEditor();
  const asset = assets[element.imageId];
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState<CropPosition>(element.cropPosition || 'center');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 180);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closing]);

  const imgW = asset?.width || 1000;
  const imgH = asset?.height || 1000;
  const targetW = element.width;
  const targetH = element.height;

  // Compute base cover crop dimensions
  const baseCrop = computeImageCoverCrop(imgW, imgH, targetW, targetH, position);

  const handleApply = () => {
    if (zoomScale === 1 && panOffset.x === 0 && panOffset.y === 0) {
      setElementCrop(element.id, position, undefined);
    } else {
      // Compute custom scaled/panned crop
      const scaledW = baseCrop.width / zoomScale;
      const scaledH = baseCrop.height / zoomScale;
      const maxPanX = (imgW - scaledW) / 2;
      const maxPanY = (imgH - scaledH) / 2;
      const customCrop: CustomCrop = {
        x: Math.round(Math.max(0, Math.min(imgW - scaledW, baseCrop.x + panOffset.x * maxPanX))),
        y: Math.round(Math.max(0, Math.min(imgH - scaledH, baseCrop.y + panOffset.y * maxPanY))),
        width: Math.round(scaledW),
        height: Math.round(scaledH),
      };
      setElementCrop(element.id, position, customCrop);
    }
    handleClose();
  };

  const handleReset = () => {
    setPosition('center');
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setElementCrop(element.id, 'center', undefined);
  };

  const frameRatio = (targetW / targetH).toFixed(2);
  const imgRatio = (imgW / imgH).toFixed(2);

  // Modal preview box sizing (fit within 440px wide × 300px high box)
  const maxBoxW = 460;
  const maxBoxH = 300;
  const boxScale = Math.min(maxBoxW / targetW, maxBoxH / targetH, 1);
  const displayW = Math.round(targetW * boxScale);
  const displayH = Math.round(targetH * boxScale);

  return (
    <div className={`scrim ${closing ? 'closing' : ''}`} onMouseDown={handleClose} role="presentation">
      <div
        className={`modal wide crop-modal ${closing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Crop & Frame Image"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div className="crop-modal-title-group">
            <div className="crop-modal-icon-badge">
              <CropIcon size={20} />
            </div>
            <div>
              <h2>Crop & Frame Image</h2>
              <p className="crop-modal-sub">
                Adjust the allowable canvas frame for <strong>{element.name}</strong> without stretching.
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="crop-modal-body">
          {/* Visual Canvas Display Area */}
          <div className="crop-stage-container">
            <div className="crop-meta-chips">
              <span className="crop-chip">
                Frame: {Math.round(targetW)} × {Math.round(targetH)} ({frameRatio}:1)
              </span>
              <span className="crop-chip">
                Original Photo: {imgW} × {imgH} ({imgRatio}:1)
              </span>
            </div>

            <div
              className="crop-viewport-frame"
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
              }}
            >
              {asset?.image && (
                <div
                  className="crop-image-preview-mask"
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={asset.url}
                    alt={element.name}
                    className="crop-preview-img"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scale(${zoomScale}) translate(${panOffset.x * 20}%, ${panOffset.y * 20}%)`,
                      width: imgW / imgH > targetW / targetH ? 'auto' : '100%',
                      height: imgW / imgH > targetW / targetH ? '100%' : 'auto',
                      minWidth: '100%',
                      minHeight: '100%',
                      objectFit: 'cover',
                      objectPosition: position === 'center' ? 'center' : position,
                    }}
                  />
                  {/* Grid lines indicating allowable canvas composition */}
                  <div className="crop-rule-of-thirds" aria-hidden="true">
                    <div className="crop-grid-line h-1" />
                    <div className="crop-grid-line h-2" />
                    <div className="crop-grid-line v-1" />
                    <div className="crop-grid-line v-2" />
                  </div>
                </div>
              )}
            </div>

            <span className="crop-hint-caption">
              Allowable canvas area shown above. Overflow is trimmed automatically without distorting aspect ratio.
            </span>
          </div>

          {/* Controls Bar */}
          <div className="crop-controls-panel">
            <div className="crop-control-group">
              <label className="crop-label">Frame Alignment</label>
              <div className="crop-align-bar">
                <button
                  type="button"
                  className={`crop-align-btn ${position === 'center' ? 'active' : ''}`}
                  onClick={() => setPosition('center')}
                  title="Center Alignment (Recommended)"
                >
                  <AlignCenter size={14} /> Center
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${position === 'top' ? 'active' : ''}`}
                  onClick={() => setPosition('top')}
                  title="Align Top"
                >
                  <AlignStartVertical size={14} /> Top
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${position === 'bottom' ? 'active' : ''}`}
                  onClick={() => setPosition('bottom')}
                  title="Align Bottom"
                >
                  <AlignEndVertical size={14} /> Bottom
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${position === 'left' ? 'active' : ''}`}
                  onClick={() => setPosition('left')}
                  title="Align Left"
                >
                  <AlignStartHorizontal size={14} /> Left
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${position === 'right' ? 'active' : ''}`}
                  onClick={() => setPosition('right')}
                  title="Align Right"
                >
                  <AlignEndHorizontal size={14} /> Right
                </button>
              </div>
            </div>

            <div className="crop-control-group">
              <div className="crop-slider-row">
                <label className="crop-label">
                  <ZoomIn size={13} /> Framing Zoom: {Math.round(zoomScale * 100)}%
                </label>
                <input
                  type="range"
                  min={1}
                  max={2}
                  step={0.05}
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  className="crop-slider"
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button type="button" className="text-btn crop-reset-btn" onClick={handleReset}>
            <RotateCcw size={13} /> Reset to Center
          </button>
          <div className="action-row" style={{ gap: 8 }}>
            <button type="button" className="text-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="button" className="primary-btn" onClick={handleApply}>
              <Check size={14} /> Apply Crop
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
