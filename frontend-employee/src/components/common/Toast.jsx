import React, { useEffect } from "react";

const Toast = ({ id, message, type = "info", duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: { icon: "✓", bg: "var(--green-bg)", color: "var(--green-fg)", border: "var(--green-fg)" },
    error: { icon: "⚠", bg: "var(--red-bg)", color: "var(--red-fg)", border: "var(--red-fg)" },
    warning: { icon: "!", bg: "var(--amber-bg)", color: "var(--amber-fg)", border: "var(--amber-fg)" },
    info: { icon: "ℹ", bg: "var(--blue-bg)", color: "var(--blue-fg)", border: "var(--blue-fg)" },
  };

  const config = typeConfig[type];

  return (
    <div
      style={{
        ...s.toast,
        background: config.bg,
        borderColor: config.border,
        animation: "slide-right 120ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="alert"
    >
      <span style={{ ...s.icon, color: config.color }}>{config.icon}</span>
      <span style={s.message}>{message}</span>
      <button style={{ ...s.closeBtn, color: config.color }} onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={s.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };

const s = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 300,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    pointerEvents: "none",
  },

  toast: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "var(--r-sm)",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: "500",
    animation: "slide-right 120ms cubic-bezier(0.16, 1, 0.3, 1)",
    pointerEvents: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
  },

  icon: {
    fontSize: "16px",
    fontWeight: "600",
    flexShrink: 0,
  },

  message: {
    flex: 1,
    color: "var(--text-primary)",
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "0 4px",
    lineHeight: 1,
    opacity: 0.7,
    transition: "opacity 120ms",
  },
};

// Hook for using toast notifications
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};
