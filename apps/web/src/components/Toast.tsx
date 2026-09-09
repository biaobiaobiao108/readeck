import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'border-teal-200 dark:border-teal-800/60 bg-white dark:bg-neutral-900',
    error: 'border-red-200 dark:border-red-800/60 bg-white dark:bg-neutral-900',
    info: 'border-sky-200 dark:border-sky-800/60 bg-white dark:bg-neutral-900',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm text-neutral-800 dark:text-neutral-200 transition-all duration-200 ${bgStyles[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
