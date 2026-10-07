import { Expand, Minus, Plus } from 'lucide-react';
import type { useViewport } from '../../hooks/useViewport';
import { useEditor } from '../../context/EditorContext';
import { totalWidth } from '../../utils/formats';

type Viewport = ReturnType<typeof useViewport>;

export function StatusBar({ viewport }: { viewport: Viewport }) {
  const { document: doc } = useEditor();
  const width = totalWidth(doc.canvas);
  return (
    <footer className="statusbar">
      <div className="zoom-controls">
        <button type="button" className="icon-btn" aria-label="Zoom out" onClick={() => viewport.zoomAroundCenter(viewport.zoom / 1.15)}>
          <Minus size={14} />
        </button>
        <button type="button" className="zoom-readout" onClick={() => viewport.zoomAroundCenter(1)} title="Actual size">
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button type="button" className="icon-btn" aria-label="Zoom in" onClick={() => viewport.zoomAroundCenter(viewport.zoom * 1.15)}>
          <Plus size={14} />
        </button>
        <button type="button" className="icon-btn" aria-label="Fit canvas" title="Fit canvas" onClick={viewport.fit}>
          <Expand size={14} />
        </button>
      </div>
      <p className="status-size">
        {width} × {doc.canvas.slideHeight}
        <span> · {doc.canvas.slideCount} slides</span>
      </p>
      <p className="status-slide">
        Slide {viewport.activeSlide + 1} / {doc.canvas.slideCount}
      </p>
    </footer>
  );
}
