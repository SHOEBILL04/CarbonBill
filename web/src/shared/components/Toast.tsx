import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  onClose?: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    error: 'bg-rose-50 border-rose-300 text-rose-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900'
  }[type];

  const icons = {
    success: <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={18} />,
    error: <AlertCircle className="text-rose-600 flex-shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />,
    info: <Info className="text-blue-600 flex-shrink-0" size={18} />
  }[type];

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 border rounded-xl shadow-sm text-xs font-medium font-sans ${styles}`}>
      <div className="flex items-center gap-2">
        {icons}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-75 rounded-md">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
