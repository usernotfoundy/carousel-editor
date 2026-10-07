import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FilePlus2, Redo2, Undo2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

export function TopBar({
  onPreview,
  onExport,
  onNew,
}: {
  onPreview: () => void;
  onExport: () => void;
  onNew: () => void;
}) {
  const { document: doc, undo, redo, canUndo, canRedo, setProjectName, saveState } = useEditor();
  const [name, setName] = useState(doc.name);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setName(doc.name);
  }, [doc.name]);

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="1" y="3" width="5" height="16" rx="1.2" fill="currentColor" opacity="0.4" />
            <rect x="8.5" y="3" width="5" height="16" rx="1.2" fill="currentColor" opacity="0.7" />
            <rect x="16" y="3" width="5" height="16" rx="1.2" fill="currentColor" />
          </svg>
        </span>
        <div className="brand-copy">
          <strong>Continuum</strong>
          <input
            className="name-input"
            aria-label="Project name"
            value={name}
            onFocus={() => {
              focused.current = true;
            }}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => {
              focused.current = false;
              if (name.trim() && name.trim() !== doc.name) setProjectName(name);
              else setName(doc.name);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </div>
      </div>
      <div className="top-center">
        <button type="button" className="icon-btn" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={undo}>
          <Undo2 size={16} />
        </button>
        <button type="button" className="icon-btn" aria-label="Redo" title="Redo" disabled={!canRedo} onClick={redo}>
          <Redo2 size={16} />
        </button>
        <span className="save-state">
          {saveState === 'saved' ? 'Saved locally' : saveState === 'error' ? 'Not saved' : ''}
        </span>
      </div>
      <div className="top-actions">
        <button type="button" className="text-btn" onClick={onNew}>
          <FilePlus2 size={15} />
          <span className="btn-label">New</span>
        </button>
        <button type="button" className="text-btn hide-on-mobile" onClick={onPreview}>
          <Eye size={15} />
          <span className="btn-label">Preview</span>
        </button>
        <button type="button" className="primary-btn" onClick={onExport}>
          <Download size={15} />
          <span className="btn-label">Export</span>
        </button>
      </div>
    </header>
  );
}
