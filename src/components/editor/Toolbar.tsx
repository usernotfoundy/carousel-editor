import { useRef, useState } from 'react';
import { Circle, ImagePlus, LayoutTemplate, Square, Type } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export function Toolbar({ onTemplates }: { onTemplates?: () => void }) {
  const { addImageFiles, addText, addShape, select } = useEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [shapesOpen, setShapesOpen] = useState(false);

  return (
    <div className="tools">
      <p className="panel-label">Add</p>
      {onTemplates && (
        <button type="button" className="tool-btn highlight" onClick={onTemplates}>
          <LayoutTemplate size={16} />
          Templates
        </button>
      )}
      <button type="button" className="tool-btn" onClick={() => inputRef.current?.click()}>
        <ImagePlus size={16} />
        Image
      </button>
      <button type="button" className="tool-btn" onClick={addText}>
        <Type size={16} />
        Text
      </button>
      <div className="shape-wrap">
        <button type="button" className="tool-btn" onClick={() => setShapesOpen((open) => !open)} aria-expanded={shapesOpen}>
          <Square size={16} />
          Shape
        </button>
        {shapesOpen && (
          <div className="shape-menu" role="menu">
            <button
              type="button"
              onClick={() => {
                addShape('rect');
                setShapesOpen(false);
              }}
            >
              <Square size={14} />
              Rectangle
            </button>
            <button
              type="button"
              onClick={() => {
                addShape('ellipse');
                setShapesOpen(false);
              }}
            >
              <Circle size={14} />
              Ellipse
            </button>
          </div>
        )}
      </div>
      <button type="button" className="tool-btn ghost" onClick={() => select(null)}>
        Canvas settings
      </button>
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        multiple
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : [];
          event.target.value = '';
          if (files.length) void addImageFiles(files);
        }}
      />
    </div>
  );
}
