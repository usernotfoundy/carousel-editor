import { useRef, useState } from 'react';
import { Circle, Expand, Eye, ImagePlus, Layers, Minus, Plus, SlidersHorizontal, Square, Type } from 'lucide-react';
import type { useViewport } from '../../hooks/useViewport';
import { useEditor } from '../../context/EditorContext';

type Viewport = ReturnType<typeof useViewport>;

export function MobileDock({
  viewport,
  panel,
  onToggleLayers,
  onToggleProperties,
  onPreview,
}: {
  viewport: Viewport;
  panel: 'layers' | 'properties' | null;
  onToggleLayers: () => void;
  onToggleProperties: () => void;
  onPreview: () => void;
}) {
  const { document: doc, addImageFiles, addText, addShape } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [shapesOpen, setShapesOpen] = useState(false);

  return (
    <div className="mobile-dock">
      <div className="dock-zoom">
        <button type="button" aria-label="Zoom out" onClick={() => viewport.zoomAroundCenter(viewport.zoom / 1.15)}>
          <Minus size={16} />
        </button>
        <button type="button" className="dock-percent" onClick={() => viewport.zoomAroundCenter(1)}>
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => viewport.zoomAroundCenter(viewport.zoom * 1.15)}>
          <Plus size={16} />
        </button>
        <button type="button" aria-label="Fit canvas" onClick={viewport.fit}>
          <Expand size={15} />
        </button>
        <span className="dock-slide">
          {viewport.activeSlide + 1}/{doc.canvas.slideCount}
        </span>
      </div>
      <nav className="dock-nav" aria-label="Editor tools">
        <button type="button" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={18} />
          Image
        </button>
        <button
          type="button"
          onClick={() => {
            setShapesOpen(false);
            addText();
          }}
        >
          <Type size={18} />
          Text
        </button>
        <div className="dock-shape">
          <button
            type="button"
            className={shapesOpen ? 'active' : ''}
            aria-expanded={shapesOpen}
            onClick={() => setShapesOpen((open) => !open)}
          >
            <Square size={18} />
            Shape
          </button>
          {shapesOpen && (
            <div className="dock-shape-menu" role="menu">
              <button
                type="button"
                onClick={() => {
                  addShape('rect');
                  setShapesOpen(false);
                }}
              >
                <Square size={15} />
                Rectangle
              </button>
              <button
                type="button"
                onClick={() => {
                  addShape('ellipse');
                  setShapesOpen(false);
                }}
              >
                <Circle size={15} />
                Ellipse
              </button>
            </div>
          )}
        </div>
        <button type="button" className={panel === 'layers' ? 'active' : ''} onClick={onToggleLayers}>
          <Layers size={18} />
          Layers
        </button>
        <button type="button" className={panel === 'properties' ? 'active' : ''} onClick={onToggleProperties}>
          <SlidersHorizontal size={18} />
          Style
        </button>
        <button type="button" onClick={onPreview}>
          <Eye size={18} />
          Preview
        </button>
      </nav>
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        multiple
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = '';
          void addImageFiles(files);
        }}
      />
    </div>
  );
}
