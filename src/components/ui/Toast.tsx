import { useEffect } from 'react';
import type { ToastMessage } from '../../context/EditorContext';

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(onDismiss, 4600);
    return () => window.clearTimeout(handle);
  }, [onDismiss, toast]);

  if (!toast) return null;
  return (
    <div className={`toast ${toast.tone}`} role="status">
      {toast.message}
    </div>
  );
}
