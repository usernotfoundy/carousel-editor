import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Images, Upload, X } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import type { ImageElement } from '../../types/editor';

export function PhotoGalleryModal({
  element,
  onClose,
}: {
  element: ImageElement;
  onClose: () => void;
}) {
  const { assets, replaceImageElement, replaceImageWithAsset, openCrop } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const handleProceedWithCrop = (updated: ImageElement | null) => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      if (updated) {
        openCrop(updated);
      }
    }, 180);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closing]);

  const assetList = Object.values(assets).filter((a) => !!a.image);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setLoading(true);
    try {
      const updated = await replaceImageElement(element.id, file);
      handleProceedWithCrop(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    const updated = replaceImageWithAsset(element.id, assetId);
    handleProceedWithCrop(updated);
  };

  return (
    <div className={`scrim ${closing ? 'closing' : ''}`} onMouseDown={handleClose} role="presentation">
      <div
        className={`modal wide photo-gallery-modal ${closing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Choose Photo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div className="photo-gallery-title-group">
            <div className="photo-gallery-icon-badge">
              <Images size={20} />
            </div>
            <div>
              <h2>Choose Photo</h2>
              <p className="photo-gallery-sub">
                Replace <strong>{element.name}</strong> from your gallery or choose a photo below.
              </p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="photo-gallery-body">
          {/* Direct Upload / Photo Picker Card */}
          <div
            className={`photo-upload-dropzone ${dragOver ? 'drag-over' : ''} ${loading ? 'is-loading' : ''}`}
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="photo-upload-icon-circle">
              {loading ? <Upload className="spin" size={24} /> : <ImagePlus size={24} />}
            </div>
            <div className="photo-upload-text">
              <strong>{loading ? 'Processing image...' : 'Upload from your Photo Gallery / Device'}</strong>
              <span>Tap to open your phone gallery, camera roll, or drag & drop a photo here</span>
            </div>
            <button type="button" className="primary-btn photo-browse-btn" disabled={loading}>
              <Upload size={14} />
              Browse Photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp"
              className="hidden-input"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>

          {/* Gallery Grid */}
          <div className="photo-gallery-section">
            <div className="photo-gallery-section-head">
              <strong>Recent & Template Photos ({assetList.length})</strong>
              <span>Click any photo to instantly use it in this frame</span>
            </div>

            <div className="photo-gallery-grid">
              {assetList.map((asset) => {
                const isCurrent = asset.id === element.imageId;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    className={`photo-gallery-thumb-btn ${isCurrent ? 'is-current' : ''}`}
                    onClick={() => handleSelectAsset(asset.id)}
                    title={isCurrent ? 'Current image in this frame' : 'Click to use this photo'}
                  >
                    <img src={asset.url} alt="" className="photo-gallery-thumb-img" loading="lazy" />
                    {isCurrent && (
                      <span className="photo-gallery-current-badge">
                        <Check size={12} />
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <span className="modal-foot-hint">Supports JPG, PNG, and WebP up to 25 MB</span>
          <button type="button" className="text-btn" onClick={handleClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}

