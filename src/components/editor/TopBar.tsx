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
  const { undo, redo, canUndo, canRedo, saveState } = useEditor();

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src="/favicon.png" alt="" />
        <strong>Continuum</strong>
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
