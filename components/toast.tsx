"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface ToastApi {
  notify(message: string): void;
}

const ToastContext = createContext<ToastApi>({ notify: () => undefined });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const notify = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3500);
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
      >
        {message && (
          <div className="pointer-events-auto max-w-sm animate-fade rounded-2xl bg-card px-4 py-3 text-sm font-medium text-card-fg shadow-lg">
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
