import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const Toast = ({
  type,
  message,
  duration = 5000,
  onClose,
}: ToastProps) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-accent-success',
    error: 'bg-accent-danger',
    warning: 'bg-accent-warning',
    info: 'bg-accent-primary',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideInRight">
      <div className={`flex items-center gap-3 p-4 rounded-btn shadow-lg ${colors[type]} text-white min-w-[300px] max-w-md`}>
        <span className="flex-shrink-0">{icons[type]}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white hover:opacity-75 transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Toast Container for managing multiple toasts
interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string }>;
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ animationDelay: `${index * 100}ms` }}>
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
