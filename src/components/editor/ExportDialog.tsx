import { Download, Flag } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { useExport } from '../../hooks/useExport';
import { Modal } from '../ui/Modal';

export function ExportDialog({ onClose }: { onClose: () => void }) {
  const { document: doc, assets } = useEditor();
  const exporter = useExport(doc, assets);
  const visible = doc.elements.some((element) => element.visible);
  const percent =
    exporter.state.phase === 'running'
      ? Math.round((exporter.state.current / Math.max(1, exporter.state.total)) * 100)
      : 0;
  const nextIndex =
    exporter.state.phase === 'done'
      ? exporter.state.slides.findIndex((slide) => !exporter.savedNames.includes(slide.name))
      : -1;
  const nextSlide = exporter.state.phase === 'done' && nextIndex >= 0 ? exporter.state.slides[nextIndex] : null;

  return (
    <Modal
      title="Export carousel"
      wide={exporter.state.phase === 'done'}
      onClose={() => {
        exporter.cancel();
        onClose();
      }}
    >
      <div className="export-body">
        {exporter.state.phase !== 'done' && (
          <>
            <label className="field">
              <span>Format</span>
              <select
                value={exporter.format}
                disabled={exporter.state.phase === 'running'}
                onChange={(event) => exporter.setFormat(event.target.value === 'jpeg' ? 'jpeg' : 'png')}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
              </select>
            </label>
            <p className="readout">
              {doc.canvas.slideCount} slides · {doc.canvas.slideWidth} × {doc.canvas.slideHeight}
            </p>
            {!visible && <p className="muted">These slides will contain only the background.</p>}
          </>
        )}

        {exporter.state.phase === 'running' && (
          <div className="export-progress">
            <p>Exporting…</p>
            <div className="progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} role="progressbar">
              <span style={{ width: `${percent}%` }} />
            </div>
            <p>
              Slide {Math.min(exporter.state.total, exporter.state.current + 1)} of {exporter.state.total}
            </p>
          </div>
        )}

        {exporter.state.phase === 'error' && <p className="error-text">{exporter.state.message}</p>}

        {exporter.state.phase === 'done' && (
          <div className="export-done">
            <p>
              {exporter.savedNames.length} of {exporter.state.count} saved. Tap a slide to download that image.
            </p>
            <div className="export-thumbs">
              {exporter.state.slides.map((slide, index) => {
                const saved = exporter.savedNames.includes(slide.name);
                return (
                  <button
                    key={slide.name}
                    type="button"
                    className={saved ? 'saved' : ''}
                    aria-label={saved ? `Slide ${index + 1} saved. Download again` : `Download slide ${index + 1}`}
                    onClick={() => exporter.downloadSlide(slide)}
                  >
                    <span className="export-thumb">
                      <img src={slide.url} alt="" />
                      {saved && (
                        <span className="saved-flag">
                          <Flag size={12} />
                          Saved
                        </span>
                      )}
                    </span>
                    <span>Slide {index + 1}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="primary-btn"
              disabled={!nextSlide}
              onClick={() => {
                if (nextSlide) exporter.downloadSlide(nextSlide);
              }}
            >
              <Download size={15} />
              {nextSlide ? `Save slide ${nextIndex + 1}` : 'All slides saved'}
            </button>
          </div>
        )}

        {exporter.state.phase !== 'done' && exporter.state.phase !== 'running' && (
          <button type="button" className="primary-btn" onClick={() => void exporter.start()}>
            Export all slides
          </button>
        )}
      </div>
    </Modal>
  );
}
