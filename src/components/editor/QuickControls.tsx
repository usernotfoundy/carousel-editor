import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crop,
  ImagePlus,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import type { EditorElement } from '../../types/editor';

interface QuickControlsProps {
  element: EditorElement;
  zoom: number;
  pan: { x: number; y: number };
  stageSize: { w: number; h: number };
  onOpenGallery?: () => void;
}

export function QuickControls({ element, zoom, pan, stageSize, onOpenGallery }: QuickControlsProps) {
  const { document: doc, patchElement, moveLayer, nudge, duplicateSelected, deleteSelected, openCrop } = useEditor();

  const toolbarRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number>(() => (element.type === 'image' ? 460 : 320));
  const [scrollState, setScrollState] = useState<{ canLeft: boolean; canRight: boolean }>({
    canLeft: false,
    canRight: false,
  });

  const checkScroll = useCallback(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 6;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 6;
    setScrollState((prev) => (prev.canLeft !== canLeft || prev.canRight !== canRight ? { canLeft, canRight } : prev));
  }, []);

  useLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;

    el.scrollLeft = 0;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setMeasuredWidth(rect.width);
      }
      checkScroll();
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [element.id, element.type, element.locked, checkScroll]);

  const elementIndex = doc.elements.findIndex((item) => item.id === element.id);
  const isTopLayer = elementIndex === doc.elements.length - 1;
  const isBottomLayer = elementIndex === 0;

  // Screen coordinates
  const elScreenX = pan.x + element.x * zoom;
  const elScreenY = pan.y + element.y * zoom;
  const elScreenW = element.width * zoom;
  const elScreenH = element.height * zoom;

  const barWidth = measuredWidth;
  const barHeight = 40;

  const rawLeft = elScreenX + elScreenW / 2 - barWidth / 2;
  const maxLeft = Math.max(8, stageSize.w - barWidth - 8);
  const left = Math.max(8, Math.min(maxLeft, rawLeft));

  const placeAbove = elScreenY - barHeight - 14 >= 10;
  const top = Math.max(
    10,
    placeAbove ? elScreenY - barHeight - 14 : Math.min(stageSize.h - barHeight - 10, elScreenY + elScreenH + 14),
  );

  return (
    <div
      ref={toolbarRef}
      className={`quick-controls ${element.locked ? 'is-locked' : ''} ${scrollState.canLeft ? 'can-scroll-left' : ''} ${scrollState.canRight ? 'can-scroll-right' : ''}`}
      style={{ left: `${left}px`, top: `${top}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onScroll={checkScroll}
      role="toolbar"
      aria-label="Focused element controls"
    >
      {/* 0. Replace Photo & Crop Components (for image elements) */}
      {element.type === 'image' && (
        <>
          {onOpenGallery && (
            <button
              type="button"
              className="quick-btn replace-photo-btn highlight"
              onClick={onOpenGallery}
              aria-label="Replace photo"
              title="Choose from photo gallery or upload a new photo"
            >
              <ImagePlus size={14} />
              <span>Replace</span>
            </button>
          )}
          <button
            type="button"
            className="quick-btn crop-photo-btn"
            onClick={() => openCrop(element)}
            aria-label="Crop image"
            title="Adjust allowable canvas frame and crop without stretching"
          >
            <Crop size={14} />
            <span>Crop</span>
          </button>
          <span className="quick-divider" aria-hidden="true" />
        </>
      )}

      {/* 1. Lock / Unlock Component */}
      <button
        type="button"
        className={`quick-btn lock-btn ${element.locked ? 'locked' : ''}`}
        onClick={() => patchElement(element.id, { locked: !element.locked })}
        aria-label={element.locked ? 'Unlock element position' : 'Lock element position'}
        title={element.locked ? 'Unlock element position' : 'Lock element position'}
      >
        {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
        <span>{element.locked ? 'Locked' : 'Lock'}</span>
      </button>

      <span className="quick-divider" aria-hidden="true" />

      {/* 2. Quick Mover: Layers (Forward / Backward) */}
      <div className="quick-section" title="Layer stacking order">
        <span className="quick-section-label">Layer</span>
        <button
          type="button"
          className="quick-icon-btn"
          disabled={isTopLayer}
          onClick={() => moveLayer(element.id, 'forward')}
          aria-label="Bring forward"
          title="Bring forward in layers"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          className="quick-icon-btn"
          disabled={isBottomLayer}
          onClick={() => moveLayer(element.id, 'backward')}
          aria-label="Send backward"
          title="Send backward in layers"
        >
          <ArrowDown size={14} />
        </button>
      </div>

      <span className="quick-divider" aria-hidden="true" />

      {/* 3. Quick Mover: Position (Move Backward / Forward Nudge) */}
      <div className="quick-section" title="Nudge position on canvas">
        <span className="quick-section-label">Move</span>
        <button
          type="button"
          className="quick-icon-btn"
          disabled={element.locked}
          onClick={() => nudge(-15, 0)}
          aria-label="Move backward (Left 15px)"
          title="Move backward (Left 15px)"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="quick-icon-btn"
          disabled={element.locked}
          onClick={() => nudge(15, 0)}
          aria-label="Move forward (Right 15px)"
          title="Move forward (Right 15px)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <span className="quick-divider" aria-hidden="true" />

      {/* 4. Common Actions: Duplicate & Delete */}
      <button
        type="button"
        className="quick-icon-btn"
        disabled={element.locked}
        onClick={duplicateSelected}
        aria-label="Duplicate element"
        title="Duplicate element"
      >
        <Copy size={14} />
      </button>
      <button
        type="button"
        className="quick-icon-btn danger"
        onClick={deleteSelected}
        aria-label="Delete element"
        title="Delete element"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

