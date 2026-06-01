import React, { useState } from "react";
import Modal from "./Modal";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerous = false,
  isLoading = false,
}) => {
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeButton={!isLoading}>
      <div style={s.content}>
        <p style={s.message}>{message}</p>

        {error && (
          <div style={s.errorBox} className="shake">
            <span style={s.errorIcon}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div style={s.actions}>
          <button
            style={{ ...s.btn, ...s.btnSecondary }}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            style={{
              ...s.btn,
              ...(isDangerous ? s.btnDanger : s.btnPrimary),
            }}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={s.spinner} /> Confirming...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

const s = {
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  message: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    margin: 0,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    background: "var(--red-bg)",
    border: "1px solid var(--red-fg)",
    borderRadius: "var(--r-sm)",
    color: "var(--red-fg)",
    fontSize: "13px",
    animation: "shake 400ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  errorIcon: {
    fontSize: "16px",
    fontWeight: "600",
  },

  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },

  btn: {
    padding: "9px 18px",
    border: "1px solid transparent",
    borderRadius: "var(--r-sm)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 200ms",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontFamily: "var(--font-body)",
  },

  btnPrimary: {
    background: "var(--accent)",
    color: "var(--text-on-accent)",
  },

  btnDanger: {
    background: "var(--red-bg)",
    color: "var(--red-fg)",
    border: "1px solid var(--red-fg)",
  },

  btnSecondary: {
    background: "var(--bg-card)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },

  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255, 255, 255, 0.15)",
    borderTop: "2px solid var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.65s linear infinite",
  },
};
