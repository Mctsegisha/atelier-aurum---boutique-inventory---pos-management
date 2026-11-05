import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5 toasts

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  // Listen to global window events from api.ts
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener('aurum:toast', handler);
    window.addEventListener('hirbit:toast', handler);
    return () => {
      window.removeEventListener('aurum:toast', handler);
      window.removeEventListener('hirbit:toast', handler);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Notification Stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                isError
                  ? 'bg-rose-950/90 text-rose-50 border-rose-800'
                  : isSuccess
                  ? 'bg-[#1A1A1A]/95 text-[#F9F8F6] border-[#B89B65]/60'
                  : isWarning
                  ? 'bg-amber-950/90 text-amber-50 border-amber-800'
                  : 'bg-[#1A1A1A]/90 text-white border-[#E5E0D8]/40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isError && <XCircle className="w-4 h-4 text-rose-400" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#B89B65]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-[#B89B65]" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && (
                  <h4 className="font-serif font-semibold text-xs tracking-wide mb-0.5">
                    {t.title}
                  </h4>
                )}
                <p className="text-[11px] leading-relaxed opacity-90 break-words">{t.message}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
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

