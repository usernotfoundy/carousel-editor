import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { renderFullCanvas } from '../../utils/render';

export function CarouselPreview({ initialIndex, onClose }: { initialIndex: number; onClose: () => void }) {
  const { document: doc, assets } = useEditor();
  const [index, setIndex] = useState(() => Math.min(initialIndex, doc.canvas.slideCount - 1));
  const [strip, setStrip] = useState<{ url: string; frameW: number; frameH: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancel = false;
    const maxW = Math.min(440, window.innerWidth - 120);
    const maxH = Math.min(window.innerHeight * 0.7, 760);
    let frameW = maxW;
    let frameH = frameW * (doc.canvas.slideHeight / doc.canvas.slideWidth);
    if (frameH > maxH) {
      frameH = maxH;
      frameW = frameH * (doc.canvas.slideWidth / doc.canvas.slideHeight);
    }
    renderFullCanvas(doc, assets, Math.round(frameW))
      .then((result) => {
        if (cancel) return;
        setError(null);
        setStrip({
          url: result.canvas.toDataURL('image/png'),
          frameW: result.frameWidth,
          frameH: result.frameHeight,
        });
      })
      .catch(() => {
        if (!cancel) setError('The preview could not be rendered.');
      });
    return () => {
      cancel = true;
    };
  }, [assets, doc]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(doc.canvas.slideCount - 1, current + 1));
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc.canvas.slideCount, onClose]);

  const go = (next: number) => setIndex(Math.min(doc.canvas.slideCount - 1, Math.max(0, next)));

  return (
    <div className="preview" role="dialog" aria-modal="true" aria-label="Carousel preview">
      <header>
        <div>
          <strong>Preview</strong>
          <p>Each frame is one exported slide. Swipe to see the design continue.</p>
        </div>
        <button type="button" className="icon-btn" aria-label="Close preview" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div className="preview-stage">
        {error && <p className="error-text">{error}</p>}
        {!strip && !error && <p>Rendering slides…</p>}
        {strip && (
          <div
            className="preview-frame"
            style={{ width: strip.frameW, height: strip.frameH }}
            onPointerDown={(event) => {
              drag.current = { x: event.clientX, dx: 0 };
              setDragging(true);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!drag.current) return;
              const dx = event.clientX - drag.current.x;
              drag.current.dx = dx;
              setOffset(dx);
            }}
            onPointerUp={() => {
              const dx = drag.current?.dx ?? 0;
              drag.current = null;
              setDragging(false);
              setOffset(0);
              if (dx < -48) go(index + 1);
              else if (dx > 48) go(index - 1);
            }}
          >
            <img
              src={strip.url}
              alt=""
              draggable={false}
              style={{
                width: strip.frameW * doc.canvas.slideCount,
                height: strip.frameH,
                transform: `translateX(${-index * strip.frameW + offset}px)`,
                transition: dragging ? 'none' : 'transform 320ms cubic-bezier(.2,.7,.2,1)',
              }}
            />
          </div>
        )}
        <div className="preview-nav">
          <button type="button" aria-label="Previous slide" disabled={index === 0} onClick={() => go(index - 1)}>
            <ChevronLeft size={18} />
          </button>
          <span>
            {index + 1} / {doc.canvas.slideCount}
          </span>
          <button
            type="button"
            aria-label="Next slide"
            disabled={index === doc.canvas.slideCount - 1}
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="dots">
          {Array.from({ length: doc.canvas.slideCount }, (_, dot) => (
            <button
              key={dot}
              type="button"
              className={dot === index ? 'active' : ''}
              aria-label={`Go to slide ${dot + 1}`}
              onClick={() => go(dot)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
