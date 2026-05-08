/**
 * Toast Notification System
 *
 * Provides app-wide success/error/info toast messages with smooth
 * slide-in animations. Uses a simple context provider so any
 * component can trigger a toast via the useToast() hook.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ═══════════════════════════════════════
   Toast Context
   ═══════════════════════════════════════ */

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ═══════════════════════════════════════
   Single Toast Component
   ═══════════════════════════════════════ */

const ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: {
    bg: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    shadow: 'rgba(34, 197, 94, 0.35)',
  },
  error: {
    bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    shadow: 'rgba(239, 68, 68, 0.35)',
  },
  info: {
    bg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    shadow: 'rgba(37, 99, 235, 0.35)',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  const Icon = ICONS[toast.type] || Info;
  const colors = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 350);
    }, toast.duration || 4000);

    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  return (
    <div
      role="alert"
      style={{
        background: colors.bg,
        boxShadow: `0 8px 32px ${colors.shadow}, 0 2px 8px rgba(0,0,0,0.08)`,
        transform: exiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease',
        fontFamily: "'Inter', sans-serif",
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '420px',
        color: '#fff',
        pointerEvents: 'auto',
        animation: exiting ? 'none' : 'wv-toast-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ fontWeight: 700, fontSize: '13px', margin: 0, lineHeight: 1.3 }}>
            {toast.title}
          </p>
        )}
        <p style={{ fontSize: '12px', margin: toast.title ? '2px 0 0' : 0, opacity: 0.9, lineHeight: 1.4 }}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '8px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   Toast Container & Provider
   ═══════════════════════════════════════ */

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, title) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message, title) => addToast({ type: 'error', message, title }), [addToast]);
  const info = useCallback((message, title) => addToast({ type: 'info', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}

      {/* Toast keyframes injected once */}
      <style>{`
        @keyframes wv-toast-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Toast container — fixed top-right */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
