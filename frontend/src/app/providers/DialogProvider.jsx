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

  const promptMultiple = useCallback((opts = {}) => {
    return new Promise((resolve) => setDialog({ type: "promptMultiple", resolve, ...opts }));
  }, []);

  return (
    <DialogCtx.Provider value={{ confirm, prompt, promptMultiple }}>
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
    fields = [], // For promptMultiple: array of { label, placeholder, defaultValue }
    maxFields = 10, // Maximum number of fields allowed
  } = dialog;

  const [value, setValue] = useState(defaultValue);
  const [multiValues, setMultiValues] = useState(
    fields.length > 0 ? fields.map(f => f.defaultValue || "") : []
  );
  const [fieldCount, setFieldCount] = useState(fields.length);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose(type === "confirm" ? false : null);
    if (e.key === "Enter" && type === "prompt") onClose(value);
    // Don't close on Enter for promptMultiple - user might be typing
  };

  const handleMultiChange = (index, newValue) => {
    const updated = [...multiValues];
    updated[index] = newValue;
    setMultiValues(updated);
  };

  const handleAddField = () => {
    if (fieldCount < maxFields) {
      setFieldCount(fieldCount + 1);
      setMultiValues([...multiValues, ""]);
    }
  };

  const handleRemoveField = (index) => {
    if (fieldCount > 1) { // Keep at least 1 field
      const updated = [...multiValues];
      updated.splice(index, 1);
      setMultiValues(updated);
      setFieldCount(fieldCount - 1);
    }
  };

  const handleSubmit = () => {
    // Filter out empty values
    const filteredValues = multiValues.filter(v => v && v.trim() !== "");
    onClose(filteredValues);
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

        {type === "promptMultiple" && (
          <>
            {Array.from({ length: fieldCount }).map((_, idx) => (
              <div key={idx} style={{ marginTop: idx === 0 ? 8 : 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  {idx < fields.length && fields[idx]?.label && (
                    <label style={{ display: "block", marginBottom: 4, fontSize: "0.9rem", fontWeight: 500 }}>
                      {fields[idx].label}
                    </label>
                  )}
                  {idx >= fields.length && (
                    <label style={{ display: "block", marginBottom: 4, fontSize: "0.9rem", fontWeight: 500 }}>
                      Sub-Item {idx + 1}
                    </label>
                  )}
                  <input
                    autoFocus={idx === 0}
                    type="text"
                    placeholder={idx < fields.length ? fields[idx]?.placeholder || "" : `Item ${idx + 1}`}
                    value={multiValues[idx] || ""}
                    onChange={(e) => handleMultiChange(idx, e.target.value)}
                    style={inputStyle}
                  />
                </div>
                {fieldCount > 1 && (
                  <button
                    onClick={() => handleRemoveField(idx)}
                    style={{
                      ...btnStyle,
                      padding: "8px 10px",
                      color: "#dc2626",
                      border: "1px solid #fca5a5",
                      background: "#fef2f2",
                    }}
                    title="Remove this field"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            {fieldCount < maxFields && (
              <button
                onClick={handleAddField}
                style={{
                  ...btnStyle,
                  marginTop: 12,
                  width: "100%",
                  background: "#f0f9ff",
                  color: "#0369a1",
                  border: "1px solid #7dd3fc",
                }}
              >
                + Add Another Sub-Item ({fieldCount}/{maxFields})
              </button>
            )}
          </>
        )}

        <div style={btnRowStyle}>
          <button onClick={() => onClose(type === "confirm" ? false : null)} style={btnStyle}>
            Cancel
          </button>
          {type === "confirm" ? (
            <button onClick={() => onClose(true)} style={primaryBtnStyle}>
              Confirm
            </button>
          ) : type === "promptMultiple" ? (
            <button onClick={handleSubmit} style={primaryBtnStyle}>
              OK
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
