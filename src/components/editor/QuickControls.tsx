import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
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
}

export function QuickControls({ element, zoom, pan, stageSize }: QuickControlsProps) {
  const { document: doc, patchElement, moveLayer, nudge, duplicateSelected, deleteSelected } = useEditor();

  const elementIndex = doc.elements.findIndex((item) => item.id === element.id);
  const isTopLayer = elementIndex === doc.elements.length - 1;
  const isBottomLayer = elementIndex === 0;

  // Screen coordinates
  const elScreenX = pan.x + element.x * zoom;
  const elScreenY = pan.y + element.y * zoom;
  const elScreenW = element.width * zoom;
  const elScreenH = element.height * zoom;

  const barWidth = 310;
  const barHeight = 40;

  const rawLeft = elScreenX + elScreenW / 2 - barWidth / 2;
  const left = Math.max(10, Math.min(stageSize.w - barWidth - 10, rawLeft));

  const placeAbove = elScreenY - barHeight - 14 >= 10;
  const top = placeAbove
    ? elScreenY - barHeight - 14
    : Math.min(stageSize.h - barHeight - 10, elScreenY + elScreenH + 14);

  return (
    <div
      className={`quick-controls ${element.locked ? 'is-locked' : ''}`}
      style={{ left: `${left}px`, top: `${top}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Focused element controls"
    >
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

