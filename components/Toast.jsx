'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, type = 'info', duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message, duration) => addToast({ message, type: 'success', duration }),
    [addToast]
  );
  const error = useCallback(
    (message, duration) => addToast({ message, type: 'error', duration: duration || 5000 }),
    [addToast]
  );
  const info = useCallback(
    (message, duration) => addToast({ message, type: 'info', duration }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ showToast: addToast, success, error, info }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-dropdown border transition-all duration-300 transform translate-y-0',
              toast.type === 'success' &&
                'bg-white border-[#DEDAD2] text-[#292825]',
              toast.type === 'error' &&
                'bg-[#FDF6F5] border-[#F1C4B8] text-[#9B3A22]',
              toast.type === 'info' &&
                'bg-white border-[#DEDAD2] text-[#292825]'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-[#C96442]" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-[#C96442]" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-[#77746D]" />
              )}
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-[#77746D] hover:text-[#292825] p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
