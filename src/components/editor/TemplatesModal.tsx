import { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles, X, ArrowRight, Layers, LayoutTemplate, Eye } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { CAROUSEL_TEMPLATES, type TemplateCategory, type CarouselTemplate } from '../../utils/template';

export function TemplatesModal({ onClose }: { onClose: () => void }) {
  const { applyTemplate, document: doc } = useEditor();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('All');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<CarouselTemplate | null>(null);
  const [closing, setClosing] = useState(false);
  const [inspectClosing, setInspectClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const handleCloseInspect = () => {
    if (inspectClosing) return;
    setInspectClosing(true);
    setTimeout(() => {
      setPreviewTemplate(null);
      setInspectClosing(false);
    }, 180);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewTemplate) {
          handleCloseInspect();
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewTemplate, closing, inspectClosing]);

  const categories: TemplateCategory[] = [
    'All',
    'Wedding & Romance',
    'Fashion & Editorial',
    'Classic & Luxury',
    'Moody & Story',
  ];

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'All') return CAROUSEL_TEMPLATES;
    return CAROUSEL_TEMPLATES.filter((t) => t.meta.category === selectedCategory);
  }, [selectedCategory]);

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    try {
      await applyTemplate(templateId);
      handleClose();
    } finally {
      setApplyingId(null);
    }
  };

  const hasContent = doc.elements.length > 0;

  return (
    <div className={`scrim ${closing ? 'closing' : ''}`} onMouseDown={handleClose} role="presentation">
      <div
        className={`modal wide templates-modal ${closing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carousel Templates"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="templates-modal-head">
          <div className="templates-modal-title-group">
            <div className="templates-modal-icon-badge">
              <LayoutTemplate size={20} />
            </div>
            <div>
              <div className="templates-modal-title-row">
                <h2>Carousel Templates</h2>
                <span className="templates-count-badge">{filteredTemplates.length} layouts</span>
              </div>
              <p className="templates-modal-sub">
                Pre-designed seamless continuous carousels with panoramas, layered collages, and editorial framing.
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {/* Filter categories */}
        <div className="templates-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`templates-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {hasContent && (
          <div className="templates-replace-notice">
            <Sparkles size={14} />
            <span>Selecting a template will replace the current canvas layers.</span>
          </div>
        )}

        {/* Templates list */}
        <div className="templates-grid">
          {filteredTemplates.map((template) => {
            const isApplying = applyingId === template.meta.id;
            return (
              <div key={template.meta.id} className="template-card">
                {/* Panorama strip preview */}
                <div className="template-preview-container">
                  <div className="template-preview-top-bar">
                    <span className="template-preview-badge">10 Slides • 4:5 Portrait</span>
                    <div className="template-preview-quick-actions">
                      <button
                        type="button"
                        className="template-inspect-chip"
                        onClick={() => setPreviewTemplate(template)}
                        title="Inspect full layout"
                      >
                        <Eye size={12} />
                        Inspect layout
                      </button>
                      <button
                        type="button"
                        className="template-use-chip"
                        disabled={isApplying}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleApply(template.meta.id);
                        }}
                        title="Use this template"
                      >
                        <ArrowRight size={12} />
                        Use template
                      </button>
                    </div>
                  </div>
                  <div
                    className="template-preview-wrap"
                    onClick={() => setPreviewTemplate(template)}
                    title="Click or swipe to inspect all 10 slides"
                  >
                    <div className="template-preview-track">
                      <img
                        src={template.meta.bannerUrl}
                        alt={template.meta.name}
                        className="template-strip-img"
                        loading="lazy"
                      />
                      {/* Visual slide guide lines (10 segments) */}
                      <div className="template-slide-guides" aria-hidden="true">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} className="template-guide-seg">
                            <span className="template-guide-num">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="template-swipe-notice" aria-hidden="true">
                    <span>Swipe horizontally to view all 10 slides →</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="template-card-body">
                  <div className="template-meta-row">
                    <div className="template-title-block">
                      <h3 className="template-name">{template.meta.name}</h3>
                      <p className="template-sub">{template.meta.subtitle}</p>
                    </div>
                    <span className="template-category-pill">{template.meta.category}</span>
                  </div>

                  <p className="template-desc">{template.meta.description}</p>

                  <div className="template-features-row">
                    {template.meta.features.slice(0, 2).map((feat, idx) => (
                      <span key={idx} className="template-feature-tag">
                        <Layers size={11} />
                        {feat}
                      </span>
                    ))}
                  </div>

                  <div className="template-card-actions">
                    <button
                      type="button"
                      className="text-btn template-inspect-btn"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye size={14} />
                      Inspect layout
                    </button>
                    <button
                      type="button"
                      className="primary-btn template-apply-btn"
                      disabled={isApplying}
                      onClick={() => handleApply(template.meta.id)}
                    >
                      {isApplying ? (
                        <>Loading assets...</>
                      ) : (
                        <>
                          <ArrowRight size={14} />
                          Use template
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal footer */}
        <footer className="templates-modal-foot">
          <span className="templates-foot-hint">
            Tip: All images, typography, and frame shapes can be customized after loading.
          </span>
          <button type="button" className="text-btn" onClick={handleClose}>
            Close
          </button>
        </footer>

        {/* Detailed Layout Inspection Dialog */}
        {previewTemplate && (
          <div className={`template-inspect-overlay ${inspectClosing ? 'closing' : ''}`} onClick={handleCloseInspect}>
            <div className={`template-inspect-card ${inspectClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="template-inspect-head">
                <div>
                  <h3>{previewTemplate.meta.name} Panorama Preview</h3>
                  <p>{previewTemplate.meta.subtitle}</p>
                </div>
                <div className="template-inspect-head-actions">
                  <button
                    type="button"
                    className="primary-btn template-apply-btn"
                    onClick={() => {
                      const id = previewTemplate.meta.id;
                      setPreviewTemplate(null);
                      void handleApply(id);
                    }}
                  >
                    <ArrowRight size={14} />
                    Use template
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleCloseInspect}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="template-inspect-scroll">
                <div className="template-inspect-banner-box">
                  <img
                    src={previewTemplate.meta.bannerUrl}
                    alt={previewTemplate.meta.name}
                    className="template-inspect-banner-img"
                  />
                  <div className="template-slide-guides" aria-hidden="true">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="template-guide-seg">
                        <span className="template-guide-num">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="template-inspect-details">
                <div className="template-inspect-features">
                  <strong>Key Design Details:</strong>
                  <ul>
                    {previewTemplate.meta.features.map((f, i) => (
                      <li key={i}>
                        <Check size={13} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="template-inspect-actions">
                  <button
                    type="button"
                    className="text-btn template-inspect-btn"
                    onClick={handleCloseInspect}
                  >
                    Back to templates
                  </button>
                  <button
                    type="button"
                    className="primary-btn template-apply-btn"
                    onClick={() => {
                      const id = previewTemplate.meta.id;
                      setPreviewTemplate(null);
                      void handleApply(id);
                    }}
                  >
                    <ArrowRight size={14} />
                    Use template (10 Slides)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

