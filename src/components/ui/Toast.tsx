import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  const getToastConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          iconColor: 'text-green-500',
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          iconColor: 'text-red-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          iconColor: 'text-yellow-500',
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          iconColor: 'text-blue-500',
        };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => {
        const config = getToastConfig(toast.type);
        return (
          <div
            key={toast.id}
            className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-lg flex items-start gap-3 animate-slide-in`}
          >
            <span className={config.iconColor}>{config.icon}</span>
            <p className={`${config.text} text-sm flex-1`}>{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className={`${config.text} hover:opacity-70 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
