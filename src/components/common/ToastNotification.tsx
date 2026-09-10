import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description?: string;
}

// Global listener store for micro-toasts without external dependencies
type Listener = (toast: ToastItem) => void;
const listeners: Listener[] = [];

export const showToast = {
  success: (title: string, description?: string) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: 'success', title, description };
    listeners.forEach(fn => fn(item));
  },
  warning: (title: string, description?: string) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: 'warning', title, description };
    listeners.forEach(fn => fn(item));
  },
  info: (title: string, description?: string) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: 'info', title, description };
    listeners.forEach(fn => fn(item));
  },
  error: (title: string, description?: string) => {
    const item: ToastItem = { id: Math.random().toString(36).substring(2, 9), type: 'error', title, description };
    listeners.forEach(fn => fn(item));
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: ToastItem) => {
      setToasts(prev => [toast, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4200);
    };

    listeners.push(handleNewToast);
    return () => {
      const idx = listeners.indexOf(handleNewToast);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-[var(--color-border-subtle)] shadow-lg rounded-xl p-3.5 flex items-start gap-3 animate-slide-up"
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {isError && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-4 h-4 text-sky-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--color-text-title)]">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-normal">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-text-title)] transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
