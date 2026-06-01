import React, { useEffect } from "react";

const Modal = ({ isOpen, onClose, title, children, size = "md", closeButton = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div style={s.backdrop} onClick={onClose} className="fade-in">
      <div
        style={{ ...s.modal, ...s[sizeClasses[size]] }}
        onClick={(e) => e.stopPropagation()}
        className="slide-right"
      >
        {/* Header */}
        {title && (
          <div style={s.header}>
            <h2 style={s.title}>{title}</h2>
            {closeButton && (
              <button style={s.closeBtn} onClick={onClose} title="Close">
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div style={s.content}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;

const s = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "20px",
    animation: "fade-in 200ms ease-in-out",
  },

  modal: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
    maxHeight: "90vh",
    overflow: "auto",
    animation: "slide-right 380ms cubic-bezier(0.16, 1, 0.3, 1)",
  },

  "max-w-sm": { width: "100%", maxWidth: "384px" },
  "max-w-md": { width: "100%", maxWidth: "448px" },
  "max-w-lg": { width: "100%", maxWidth: "512px" },
  "max-w-xl": { width: "100%", maxWidth: "576px" },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px",
    borderBottom: "1px solid var(--border)",
  },

  title: {
    fontFamily: "var(--font-display)",
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
  },

  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "all 120ms",
  },

  content: {
    padding: "24px",
  },
};
