'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastMessage = {
  id: number;
  text: string;
  exiting: boolean;
};

interface ToastContextType {
  toast: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((msg: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, text: msg, exiting: false }]);
    // Auto-dismiss after 2.5s
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      // Remove after exit animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="toast"
              style={{
                opacity: t.exiting ? 0 : 1,
                transition: 'opacity 0.3s',
              }}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
