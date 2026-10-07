import { useEffect, useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useViewport } from '../../hooks/useViewport';
import { isTypingTarget } from '../../utils/geometry';
import { verifyExportSeam } from '../../utils/verifySeam';
import { Modal } from '../ui/Modal';
import { Toast } from '../ui/Toast';
import { CanvasStage } from './CanvasStage';
import { ExportDialog } from './ExportDialog';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';
import { TopBar } from './TopBar';
import { MobileDock } from './MobileDock';
import { SplashScreen } from './SplashScreen';
import { CarouselPreview } from '../preview/CarouselPreview';

const SPLASH_HOLD_MS = 2300;
const SPLASH_FADE_MS = 480;

export function Editor() {
  const editor = useEditor();
  const viewport = useViewport(editor.document.canvas);
  const [preview, setPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [panel, setPanel] = useState<'layers' | 'properties' | null>(null);
  const [splash, setSplash] = useState<'hold' | 'leave' | 'done'>('hold');
  const openedAt = useRef(performance.now());

  const registerPlacement = editor.registerPlacement;
  const ready = editor.ready;

  useEffect(() => {
    registerPlacement(viewport.getPlacement);
  }, [registerPlacement, viewport.getPlacement]);

  useEffect(() => {
    if (!ready || splash !== 'hold') return;
    const elapsed = performance.now() - openedAt.current;
    const wait = Math.max(0, SPLASH_HOLD_MS - elapsed);
    const handle = window.setTimeout(() => setSplash('leave'), wait);
    return () => window.clearTimeout(handle);
  }, [ready, splash]);

  useEffect(() => {
    if (splash !== 'leave') return;
    const handle = window.setTimeout(() => setSplash('done'), SPLASH_FADE_MS);
    return () => window.clearTimeout(handle);
  }, [splash]);

  useEffect(() => {
    if (!import.meta.env.DEV || !ready) return;
    const handle = window.setTimeout(() => {
      void verifyExportSeam();
    }, 1200);
    return () => window.clearTimeout(handle);
  }, [ready]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (preview || exporting || confirmNew || isTypingTarget(event.target)) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.code === 'KeyZ' && !event.shiftKey) {
        event.preventDefault();
        editor.undo();
        return;
      }
      if (meta && ((event.code === 'KeyZ' && event.shiftKey) || event.code === 'KeyY')) {
        event.preventDefault();
        editor.redo();
        return;
      }
      if (meta && event.code === 'KeyD') {
        event.preventDefault();
        editor.duplicateSelected();
        return;
      }
      if (meta && event.code === 'Digit0') {
        event.preventDefault();
        viewport.fit();
        return;
      }
      if (meta && event.code === 'Digit1') {
        event.preventDefault();
        viewport.zoomAroundCenter(1);
        return;
      }
      if (meta && event.code === 'BracketRight' && editor.selectedId) {
        event.preventDefault();
        editor.moveLayer(editor.selectedId, event.shiftKey ? 'front' : 'forward');
        return;
      }
      if (meta && event.code === 'BracketLeft' && editor.selectedId) {
        event.preventDefault();
        editor.moveLayer(editor.selectedId, event.shiftKey ? 'back' : 'backward');
        return;
      }
      if (!editor.selectedId) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        editor.deleteSelected();
        return;
      }
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        editor.nudge(-step, 0);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        editor.nudge(step, 0);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        editor.nudge(0, -step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        editor.nudge(0, step);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmNew, editor, exporting, preview, viewport]);

  if (!editor.ready) {
    return <SplashScreen leaving={false} />;
  }

  return (
    <>
    <div className="app">
      <TopBar
        onPreview={() => setPreview(true)}
        onExport={() => setExporting(true)}
        onNew={() => setConfirmNew(true)}
      />
      <aside className={`sidebar ${panel === 'layers' ? 'open' : ''}`}>
        <Toolbar />
        <LayersPanel />
      </aside>
      <CanvasStage viewport={viewport} />
      <div className={panel === 'properties' ? 'inspector-slot open' : 'inspector-slot'}>
        <PropertiesPanel />
      </div>
      <StatusBar viewport={viewport} />
      <MobileDock
        viewport={viewport}
        panel={panel}
        onToggleLayers={() => setPanel((current) => (current === 'layers' ? null : 'layers'))}
        onToggleProperties={() => setPanel((current) => (current === 'properties' ? null : 'properties'))}
        onPreview={() => {
          setPanel(null);
          setPreview(true);
        }}
      />
      {panel && <button type="button" className="scrim mobile-only" aria-label="Close panel" onClick={() => setPanel(null)} />}
      <Toast toast={editor.toast} onDismiss={editor.dismissToast} />
      {preview && <CarouselPreview initialIndex={viewport.activeSlide} onClose={() => setPreview(false)} />}
      {exporting && <ExportDialog onClose={() => setExporting(false)} />}
      {confirmNew && (
        <Modal title="Start a new project?" onClose={() => setConfirmNew(false)}>
          <div className="export-body">
            <p>This replaces the canvas saved in this browser.</p>
            <div className="action-row">
              <button type="button" className="text-btn" onClick={() => setConfirmNew(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  editor.newProject();
                  setConfirmNew(false);
                }}
              >
                New project
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    {splash !== 'done' && <SplashScreen leaving={splash === 'leave'} />}
    </>
  );
}
