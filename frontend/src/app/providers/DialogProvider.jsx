import React, { createContext, useContext, useState, useCallback } from "react";
import ReactDOM from "react-dom";

const DialogCtx = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { type, title, message, placeholder, defaultValue, resolve }

  const close = useCallback((result) => {
    setDialog((d) => {
      if (d?.resolve) d.resolve(result);
      return null;
    });
  }, []);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => setDialog({ type: "confirm", resolve, ...opts }));
  }, []);

  const prompt = useCallback((opts = {}) => {
    return new Promise((resolve) => setDialog({ type: "prompt", resolve, ...opts }));
  }, []);

  return (
    <DialogCtx.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && <DialogModal dialog={dialog} onClose={close} />}
    </DialogCtx.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

function DialogModal({ dialog, onClose }) {
  const {
    type,
    title = type === "confirm" ? "Please confirm" : "Enter a value",
    message = "",
    placeholder = "",
    defaultValue = "",
  } = dialog;

  const [value, setValue] = useState(defaultValue);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose(type === "confirm" ? false : null);
    if (e.key === "Enter" && type === "prompt") onClose(value);
  };

  const body = (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      style={backdropStyle}
    >
      <div style={modalStyle}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {message && <p style={{ marginTop: 8 }}>{message}</p>}
        {type === "prompt" && (
          <input
            autoFocus
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={inputStyle}
          />
        )}
        <div style={btnRowStyle}>
          <button onClick={() => onClose(type === "confirm" ? false : null)} style={btnStyle}>
            Cancel
          </button>
          {type === "confirm" ? (
            <button onClick={() => onClose(true)} style={primaryBtnStyle}>
              Confirm
            </button>
          ) : (
            <button onClick={() => onClose(value)} style={primaryBtnStyle}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(body, document.body);
}

// Minimal inline styles (since you're not using Tailwind)
const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};
const modalStyle = {
  width: "min(520px, 92vw)",
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: "16px 16px 12px",
};
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  marginTop: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
  outline: "none",
};
const btnRowStyle = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 };
const btnStyle = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#f7f7f7", cursor: "pointer" };
const primaryBtnStyle = { ...btnStyle, background: "#2563eb", color: "white", border: "1px solid #1d4ed8" };
