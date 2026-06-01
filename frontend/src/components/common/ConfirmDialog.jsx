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
          <div style={s.errorBox} className="animate-shake">
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
    background: "var(--danger-dim)",
    border: "1px solid var(--danger-border)",
    borderRadius: "var(--r-md)",
    color: "var(--danger)",
    fontSize: "13px",
    animation: "shake 400ms var(--ease-in-out)",
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
    borderRadius: "var(--r-md)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all var(--dur-base)",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },

  btnPrimary: {
    background: "var(--accent)",
    color: "#050D1C",
  },

  btnDanger: {
    background: "var(--danger-dim)",
    color: "var(--danger)",
    border: "1px solid var(--danger-border)",
  },

  btnSecondary: {
    background: "var(--surface-2)",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },

  spinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(5, 13, 28, 0.2)",
    borderTop: "2px solid #050D1C",
    borderRadius: "50%",
    animation: "spin 0.65s linear infinite",
  },
};
