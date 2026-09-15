import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, title = 'Berhasil') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Terjadi Kesalahan') => addToast({ title, message, type: 'error' }),
    warning: (message, title = 'Peringatan') => addToast({ title, message, type: 'warning' }),
    info: (message, title = 'Informasi') => addToast({ title, message, type: 'info' }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : t.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-700'
                : t.type === 'warning'
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-300" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-300" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-300" />}
            </div>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-bold leading-tight">{t.title}</p>}
              <p className="text-xs text-slate-200 mt-0.5 leading-snug break-words">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-300 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Tutup notifikasi"
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
