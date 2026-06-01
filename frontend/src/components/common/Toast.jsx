import React, { useEffect } from "react";

const Toast = ({ id, message, type = "info", duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const typeConfig = {
    success: { icon: "✓", bg: "var(--accent-dim)", color: "var(--accent)", border: "var(--accent-border)" },
    error: { icon: "⚠", bg: "var(--danger-dim)", color: "var(--danger)", border: "var(--danger-border)" },
    warning: { icon: "!", bg: "var(--warning-dim)", color: "var(--warning)", border: "var(--warning-border)" },
    info: { icon: "ℹ", bg: "var(--info-dim)", color: "var(--info)", border: "var(--info-border)" },
  };

  const config = typeConfig[type];

  return (
    <div
      style={{
        ...s.toast,
        background: config.bg,
        borderColor: config.border,
        animation: "slideInRight var(--dur-base) var(--ease-out)",
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
    zIndex: "var(--z-toast)",
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
    borderRadius: "var(--r-md)",
    border: "1px solid",
    fontSize: "13px",
    fontWeight: "500",
    animation: "slideInRight var(--dur-base) var(--ease-out)",
    pointerEvents: "auto",
    boxShadow: "var(--shadow-md)",
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
    transition: "opacity var(--dur-fast)",
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
