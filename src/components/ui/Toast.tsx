import { useEffect, useState } from 'react';
import type { ToastMessage } from '../../context/EditorContext';

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(toast);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (toast) {
      setActiveToast(toast);
      setClosing(false);
      const timer = window.setTimeout(() => {
        setClosing(true);
        window.setTimeout(onDismiss, 200);
      }, 4200);
      return () => window.clearTimeout(timer);
    } else {
      if (activeToast && !closing) {
        setClosing(true);
        const timer = window.setTimeout(() => {
          setActiveToast(null);
          setClosing(false);
        }, 200);
        return () => window.clearTimeout(timer);
      }
    }
  }, [toast, onDismiss, activeToast, closing]);

  if (!activeToast) return null;
  return (
    <div className={`toast ${activeToast.tone} ${closing ? 'closing' : ''}`} role="status">
      {activeToast.message}
    </div>
  );
}
