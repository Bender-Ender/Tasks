import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Toast = { id: number; message: string; undo?: () => void };

const ToastContext = createContext<{ show: (message: string, undo?: () => void) => void } | null>(null);

const LIFETIME_MS = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message: string, undo?: () => void) => {
      const id = nextId.current++;
      // Completing several tasks quickly should not stack six identical toasts.
      setToasts((ts) => [...ts.filter((t) => t.message !== message), { id, message, undo }]);
      setTimeout(() => dismiss(id), LIFETIME_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="border-line bg-surface pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border py-2.5 pr-2.5 pl-4 shadow-lg"
          >
            <span className="flex-1 truncate text-sm">{t.message}</span>
            {t.undo && (
              <button
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
                className="text-accent min-h-9 rounded-lg px-3 text-sm font-semibold"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
