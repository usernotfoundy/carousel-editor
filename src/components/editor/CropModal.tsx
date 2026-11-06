import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Check,
  Crop as CropIcon,
  Grid,
  Move,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import type { CropPosition, CustomCrop, ImageElement } from '../../types/editor';

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
  const [showGrid, setShowGrid] = useState(true);

  const imgW = asset?.width || (asset?.image as HTMLImageElement)?.naturalWidth || 1000;
  const imgH = asset?.height || (asset?.image as HTMLImageElement)?.naturalHeight || 1000;
  const targetW = element.width || 100;
  const targetH = element.height || 100;

  const srcRatio = imgW / imgH;
  const targetRatio = targetW / targetH;

  // Base cover dimensions in source pixels at zoom 1.0 (fills target frame without black bars)
  const coverW = srcRatio > targetRatio ? imgH * targetRatio : imgW;
  const coverH = srcRatio > targetRatio ? imgH : imgW / targetRatio;

  // Initialize zoom and offsets from existing customCrop or cropPosition
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (element.crop && element.crop.width > 0) {
      const z = coverW / element.crop.width;
      return Math.max(1, Math.min(3, Math.round(z * 100) / 100));
    }
    return 1;
  });

  const [offsetX, setOffsetX] = useState<number>(() => {
    if (element.crop && element.crop.width > 0) {
      const maxCropX = imgW - element.crop.width;
      return maxCropX > 0 ? Math.max(0, Math.min(1, element.crop.x / maxCropX)) : 0.5;
    }
    if (element.cropPosition === 'left') return 0;
    if (element.cropPosition === 'right') return 1;
    return 0.5;
  });

  const [offsetY, setOffsetY] = useState<number>(() => {
    if (element.crop && element.crop.height > 0) {
      const maxCropY = imgH - element.crop.height;
      return maxCropY > 0 ? Math.max(0, Math.min(1, element.crop.y / maxCropY)) : 0.5;
    }
    if (element.cropPosition === 'top') return 0;
    if (element.cropPosition === 'bottom') return 1;
    return 0.5;
  });

  const [position, setPosition] = useState<CropPosition>(element.cropPosition || 'center');
  const [isDragging, setIsDragging] = useState(false);

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

  // Dimensions of crop rectangle in source image coordinates
  const cropW = coverW / zoomScale;
  const cropH = coverH / zoomScale;
  const maxCropX = Math.max(0, imgW - cropW);
  const maxCropY = Math.max(0, imgH - cropH);

  const cropX = Math.max(0, Math.min(maxCropX, offsetX * maxCropX));
  const cropY = Math.max(0, Math.min(maxCropY, offsetY * maxCropY));

  // Sizing of modal preview box (max 480px wide × 330px high, exact aspect ratio)
  const maxBoxW = 480;
  const maxBoxH = 330;
  const boxScale = Math.min(maxBoxW / targetW, maxBoxH / targetH, 1);
  const displayW = Math.max(140, Math.round(targetW * boxScale));
  const displayH = Math.max(140, Math.round(targetH * boxScale));

  // Sizing of the source image inside the display viewport
  const dispScale = displayW / cropW;
  const wImgDisp = imgW * dispScale;
  const hImgDisp = imgH * dispScale;

  const slackXDisp = Math.max(0, wImgDisp - displayW);
  const slackYDisp = Math.max(0, hImgDisp - displayH);

  const xImgDisp = -offsetX * slackXDisp;
  const yImgDisp = -offsetY * slackYDisp;

  // Zoom with subject center anchoring
  const applyZoom = useCallback(
    (delta: number) => {
      setZoomScale((prevZoom) => {
        const nextZoom = Math.max(1, Math.min(3, Math.round((prevZoom + delta) * 100) / 100));
        if (Math.abs(nextZoom - prevZoom) < 0.001) return prevZoom;

        // Anchor center in source pixels
        const curCropW = coverW / prevZoom;
        const curCropH = coverH / prevZoom;
        const curMaxX = Math.max(0, imgW - curCropW);
        const curMaxY = Math.max(0, imgH - curCropH);
        const curCropX = offsetX * curMaxX;
        const curCropY = offsetY * curMaxY;

        const centerX = curCropX + curCropW / 2;
        const centerY = curCropY + curCropH / 2;

        const nextCropW = coverW / nextZoom;
        const nextCropH = coverH / nextZoom;
        const nextMaxX = Math.max(0, imgW - nextCropW);
        const nextMaxY = Math.max(0, imgH - nextCropH);

        const nextCropX = centerX - nextCropW / 2;
        const nextCropY = centerY - nextCropH / 2;

        if (nextMaxX > 0) {
          setOffsetX(Math.max(0, Math.min(1, nextCropX / nextMaxX)));
        } else {
          setOffsetX(0.5);
        }

        if (nextMaxY > 0) {
          setOffsetY(Math.max(0, Math.min(1, nextCropY / nextMaxY)));
        } else {
          setOffsetY(0.5);
        }

        return nextZoom;
      });
    },
    [coverW, coverH, imgW, imgH, offsetX, offsetY],
  );

  const setZoomDirect = (targetZoom: number) => {
    const nextZoom = Math.max(1, Math.min(3, Math.round(targetZoom * 100) / 100));
    const delta = nextZoom - zoomScale;
    applyZoom(delta);
  };

  // Drag interaction
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
    pointerId: number;
  } | null>(null);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  // Wheel zoom listener (non-passive to prevent page scroll)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0018;
      applyZoom(delta);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [applyZoom]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch pinch zoom
    if (activePointersRef.current.size === 2) {
      const points = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      pinchStartZoomRef.current = zoomScale;
      return;
    }

    if (activePointersRef.current.size === 1) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback for browsers that don't support capture
      }
      pointerStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOffsetX: offsetX,
        startOffsetY: offsetY,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // Handle 2-finger pinch
    if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const points = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const factor = currentDist / pinchStartDistRef.current;
      const targetZoom = Math.max(1, Math.min(3, pinchStartZoomRef.current * factor));
      setZoomDirect(targetZoom);
      return;
    }

    // Handle 1-finger / mouse drag
    const start = pointerStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;

    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;

    if (slackXDisp > 0) {
      const nextOffX = start.startOffsetX - dx / slackXDisp;
      setOffsetX(Math.max(0, Math.min(1, nextOffX)));
    }

    if (slackYDisp > 0) {
      const nextOffY = start.startOffsetY - dy / slackYDisp;
      setOffsetY(Math.max(0, Math.min(1, nextOffY)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (pointerStartRef.current?.pointerId === e.pointerId) {
      pointerStartRef.current = null;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1.05) {
      setZoomDirect(1);
    } else {
      setZoomDirect(1.6);
    }
  };

  const handleApply = () => {
    const finalCrop: CustomCrop = {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropW),
      height: Math.round(cropH),
    };
    setElementCrop(element.id, position, finalCrop);
    handleClose();
  };

  const handleReset = () => {
    setZoomScale(1);
    setOffsetX(0.5);
    setOffsetY(0.5);
    setPosition('center');
    setElementCrop(element.id, 'center', undefined);
  };

  const frameRatio = (targetW / targetH).toFixed(2);
  const imgRatio = (imgW / imgH).toFixed(2);

  // Position alignment check
  const isCenter = Math.abs(offsetX - 0.5) < 0.04 && Math.abs(offsetY - 0.5) < 0.04;
  const isTop = Math.abs(offsetY - 0) < 0.04;
  const isBottom = Math.abs(offsetY - 1) < 0.04;
  const isLeft = Math.abs(offsetX - 0) < 0.04;
  const isRight = Math.abs(offsetX - 1) < 0.04;

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
                Drag the photo to choose which area sits inside the frame. Zoom in & out to compose your shot.
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="crop-modal-body">
          {/* Visual Interactive Canvas Stage */}
          <div className="crop-stage-container">
            <div className="crop-stage-header-row">
              <div className="crop-meta-chips">
                <span className="crop-chip">
                  Frame: {Math.round(targetW)} × {Math.round(targetH)} ({frameRatio}:1)
                </span>
                <span className="crop-chip">
                  Original: {imgW} × {imgH} ({imgRatio}:1)
                </span>
              </div>
              <button
                type="button"
                className={`crop-grid-toggle-btn ${showGrid ? 'active' : ''}`}
                onClick={() => setShowGrid((v) => !v)}
                title="Toggle Rule-of-Thirds Grid"
              >
                <Grid size={13} />
                <span>Grid</span>
              </button>
            </div>

            {/* Draggable & Zoomable Viewport */}
            <div
              ref={viewportRef}
              className={`crop-viewport-frame ${isDragging ? 'is-dragging' : ''}`}
              style={{
                width: `${displayW}px`,
                height: `${displayH}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDoubleClick={handleDoubleClick}
              title="Click & drag to reposition. Scroll wheel or pinch to zoom."
            >
              {asset?.url && (
                <img
                  src={asset.url}
                  alt={element.name}
                  draggable={false}
                  className="crop-draggable-img"
                  style={{
                    position: 'absolute',
                    left: `${xImgDisp}px`,
                    top: `${yImgDisp}px`,
                    width: `${wImgDisp}px`,
                    height: `${hImgDisp}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    display: 'block',
                  }}
                />
              )}

              {/* Composition rule of thirds grid overlay */}
              {showGrid && (
                <div className={`crop-rule-of-thirds ${isDragging ? 'active' : ''}`} aria-hidden="true">
                  <div className="crop-grid-line h-1" />
                  <div className="crop-grid-line h-2" />
                  <div className="crop-grid-line v-1" />
                  <div className="crop-grid-line v-2" />
                </div>
              )}

              {/* Floating Pan & Zoom Pill Overlay */}
              <div className="crop-floating-hint" aria-hidden="true">
                <Move size={12} />
                <span>Drag to reposition</span>
                <span className="crop-floating-sep">•</span>
                <span>{Math.round(zoomScale * 100)}%</span>
              </div>
            </div>

            <span className="crop-hint-caption">
              Drag preview to reposition. Scroll wheel or pinch to zoom. Double-click to toggle fit / zoom.
            </span>
          </div>

          {/* Interactive Controls Bar */}
          <div className="crop-controls-panel">
            {/* Zoom Slider and Quick Presets */}
            <div className="crop-control-group">
              <div className="crop-zoom-header">
                <label className="crop-label">
                  <ZoomIn size={14} /> Framing Zoom
                </label>
                <span className="crop-zoom-val-badge">{Math.round(zoomScale * 100)}%</span>
              </div>

              <div className="crop-zoom-slider-row">
                <button
                  type="button"
                  className="crop-zoom-step-btn"
                  onClick={() => applyZoom(-0.1)}
                  disabled={zoomScale <= 1}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoomScale}
                  onChange={(e) => setZoomDirect(parseFloat(e.target.value))}
                  className="crop-slider"
                  aria-label="Framing Zoom Level"
                />
                <button
                  type="button"
                  className="crop-zoom-step-btn"
                  onClick={() => applyZoom(0.1)}
                  disabled={zoomScale >= 3}
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>

                <div className="crop-zoom-presets">
                  <button
                    type="button"
                    className={`crop-zoom-pill ${zoomScale === 1 ? 'active' : ''}`}
                    onClick={() => setZoomDirect(1)}
                  >
                    1× Fit
                  </button>
                  <button
                    type="button"
                    className={`crop-zoom-pill ${Math.abs(zoomScale - 1.5) < 0.05 ? 'active' : ''}`}
                    onClick={() => setZoomDirect(1.5)}
                  >
                    1.5×
                  </button>
                  <button
                    type="button"
                    className={`crop-zoom-pill ${Math.abs(zoomScale - 2) < 0.05 ? 'active' : ''}`}
                    onClick={() => setZoomDirect(2)}
                  >
                    2×
                  </button>
                  <button
                    type="button"
                    className={`crop-zoom-pill ${Math.abs(zoomScale - 3) < 0.05 ? 'active' : ''}`}
                    onClick={() => setZoomDirect(3)}
                  >
                    3×
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Snap Alignment Presets */}
            <div className="crop-control-group">
              <label className="crop-label">Snap Alignment</label>
              <div className="crop-align-bar">
                <button
                  type="button"
                  className={`crop-align-btn ${isCenter ? 'active' : ''}`}
                  onClick={() => {
                    setOffsetX(0.5);
                    setOffsetY(0.5);
                    setPosition('center');
                  }}
                  title="Center Alignment"
                >
                  <AlignCenter size={14} /> Center
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${isTop ? 'active' : ''}`}
                  onClick={() => {
                    setOffsetY(0);
                    setPosition('top');
                  }}
                  title="Align to Top"
                >
                  <AlignStartVertical size={14} /> Top
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${isBottom ? 'active' : ''}`}
                  onClick={() => {
                    setOffsetY(1);
                    setPosition('bottom');
                  }}
                  title="Align to Bottom"
                >
                  <AlignEndVertical size={14} /> Bottom
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${isLeft ? 'active' : ''}`}
                  onClick={() => {
                    setOffsetX(0);
                    setPosition('left');
                  }}
                  title="Align to Left"
                >
                  <AlignStartHorizontal size={14} /> Left
                </button>
                <button
                  type="button"
                  className={`crop-align-btn ${isRight ? 'active' : ''}`}
                  onClick={() => {
                    setOffsetX(1);
                    setPosition('right');
                  }}
                  title="Align to Right"
                >
                  <AlignEndHorizontal size={14} /> Right
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button type="button" className="text-btn crop-reset-btn" onClick={handleReset}>
            <RotateCcw size={13} /> Reset to Original Fit
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
