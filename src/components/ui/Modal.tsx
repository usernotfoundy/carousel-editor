import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 180);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closing]);

  return (
    <div className={`scrim ${closing ? 'closing' : ''}`} onMouseDown={handleClose} role="presentation">
      <div
        className={`modal ${wide ? 'wide' : ''} ${closing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
