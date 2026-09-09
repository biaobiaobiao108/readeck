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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
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
    }, 3200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-charcoal-500 dark:text-charcoal-400 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'border-brand-300/80 dark:border-brand-800/60 bg-paper-50/95 dark:bg-charcoal-900/95',
    error: 'border-red-200 dark:border-red-800/60 bg-paper-50/95 dark:bg-charcoal-900/95',
    info: 'border-paper-300 dark:border-charcoal-700 bg-paper-50/95 dark:bg-charcoal-900/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl border shadow-xl text-xs sm:text-sm text-charcoal-800 dark:text-paper-100 backdrop-blur-md transition-all duration-200 font-sans ${bgStyles[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <span className="font-medium">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-paper-200 cursor-pointer"
        aria-label="关闭通知"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
