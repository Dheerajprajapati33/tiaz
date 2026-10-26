import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((messageOrObj, type = 'success', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    
    let title = '';
    let message = '';
    let toastType = type;
    let toastDuration = duration;

    if (messageOrObj && typeof messageOrObj === 'object') {
      title = typeof messageOrObj.title === 'string' ? messageOrObj.title : '';
      message = typeof messageOrObj.message === 'string' ? messageOrObj.message : (title || '');
      toastType = messageOrObj.type || type;
      toastDuration = messageOrObj.duration || duration;
    } else {
      message = String(messageOrObj || '');
    }

    if (toastType === 'danger') toastType = 'error';
    if (!['success', 'error', 'info', 'warning'].includes(toastType)) toastType = 'info';

    setToasts((prev) => [...prev, { id, title, message, type: toastType }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toastDuration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl bg-white transition-all duration-200 animate-in slide-in-from-bottom-3 ${
              toast.type === 'success'
                ? 'border-emerald-200 text-slate-900'
                : toast.type === 'error'
                ? 'border-rose-200 text-slate-900'
                : 'border-amber-200 text-slate-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              {toast.title && <p className="text-xs font-bold text-slate-900">{toast.title}</p>}
              <p className="text-xs text-slate-700 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer rounded shrink-0"
            >
              <X className="w-3.5 h-3.5" />
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
    return { addToast: () => {} };
  }
  return context;
}
