import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = "default") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  }, []);

  return { toasts, showToast };
}

export function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    default: "fa-info-circle",
  };
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fas ${icons[t.type] || icons.default}`}></i>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
