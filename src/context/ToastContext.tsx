/**
 * Global Toast & Confirm Modal Notification System
 * 
 * Brutalist "Taste Skill" aesthetic — dark, sharp, monospaced.
 * - Toast: floating top-right, auto-dismiss 4s, Framer Motion slide-in
 * - Confirm Modal: centered overlay with promise-based API
 * - Standalone API (toastApi) for usage outside React tree (e.g., AppContext)
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

interface ToastDispatch {
  error: (msg: string, duration?: number) => void;
  success: (msg: string, duration?: number) => void;
  warning: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
}

interface ToastContextValue {
  toast: ToastDispatch;
  confirmModal: (message: string) => Promise<boolean>;
}

// ─── Standalone API (for usage outside component tree) ───────────

export const toastApi: { current: ToastDispatch | null } = { current: null };

// ─── Context ─────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Accent Config ───────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, { border: string; icon: React.ReactNode; label: string }> = {
  error: {
    border: 'border-l-2 border-l-red-500',
    icon: <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />,
    label: 'ERROR',
  },
  success: {
    border: 'border-l-2 border-l-emerald-500',
    icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />,
    label: 'SUCCESS',
  },
  warning: {
    border: 'border-l-2 border-l-amber-500',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />,
    label: 'WARNING',
  },
  info: {
    border: 'border-l-2 border-l-zinc-400',
    icon: <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />,
    label: 'INFO',
  },
};

// ─── Toast Item Component ────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const config = TOAST_CONFIG[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        relative bg-zinc-950 border border-zinc-800 ${config.border}
        rounded-none shadow-2xl shadow-black/50
        px-4 py-3 min-w-[300px] max-w-[420px]
        pointer-events-auto
      `}
    >
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 right-0 h-[1px] origin-left ${
          toast.type === 'error' ? 'bg-red-500/40' :
          toast.type === 'success' ? 'bg-emerald-500/40' :
          toast.type === 'warning' ? 'bg-amber-500/40' :
          'bg-zinc-500/40'
        }`}
      />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5">{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className={`font-mono text-[9px] uppercase tracking-[0.25em] block mb-1 ${
            toast.type === 'error' ? 'text-red-500/70' :
            toast.type === 'success' ? 'text-emerald-500/70' :
            toast.type === 'warning' ? 'text-amber-500/70' :
            'text-zinc-500'
          }`}>
            {config.label}
          </span>
          <p className="font-mono text-xs tracking-wider text-zinc-200 leading-relaxed uppercase break-words">
            {toast.message}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="font-mono text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0 mt-0.5 p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Confirm Modal Component ─────────────────────────────────────

function ConfirmModalUI({ state, onResolve }: { state: ConfirmState; onResolve: (v: boolean) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onResolve(false)}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="relative bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl shadow-black/60 w-full max-w-md"
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-700" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-zinc-300" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500">
              XÁC NHẬN HÀNH ĐỘNG
            </span>
          </div>

          {/* Message */}
          <p className="font-mono text-xs tracking-wider text-zinc-200 leading-relaxed uppercase">
            {state.message}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => onResolve(false)}
              className="border border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-zinc-400 hover:text-white px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-none"
            >
              [ HỦY ]
            </button>
            <button
              onClick={() => onResolve(true)}
              className="border border-zinc-600 hover:border-white bg-zinc-900 hover:bg-white text-zinc-200 hover:text-black px-5 py-2 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded-none font-bold"
            >
              [ XÁC NHẬN ]
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Toast Provider ──────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idCounter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = `toast-${++idCounter.current}-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const toast: ToastDispatch = React.useMemo(() => ({
    error: (msg, dur?) => addToast(msg, 'error', dur),
    success: (msg, dur?) => addToast(msg, 'success', dur),
    warning: (msg, dur?) => addToast(msg, 'warning', dur),
    info: (msg, dur?) => addToast(msg, 'info', dur),
  }), [addToast]);

  const confirmModal = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirmResolve = useCallback((value: boolean) => {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  }, [confirmState]);

  // Register standalone API so AppContext (and other non-hook contexts) can use toasts
  useEffect(() => {
    toastApi.current = toast;
    return () => { toastApi.current = null; };
  }, [toast]);

  const ctxValue = React.useMemo(() => ({ toast, confirmModal }), [toast, confirmModal]);

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}

      {/* Toast Container — fixed top-right */}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Modal Overlay */}
      <AnimatePresence>
        {confirmState && (
          <ConfirmModalUI state={confirmState} onResolve={handleConfirmResolve} />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
