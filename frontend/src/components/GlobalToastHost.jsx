import { useEffect, useState } from "react";
import { toastBus } from "../utils/toastBus";

export default function GlobalToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastBus.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3000);
    });
    return unsubscribe;
  }, []);

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
          {t.message}
        </div>
      ))}
    </div>
  );
}
