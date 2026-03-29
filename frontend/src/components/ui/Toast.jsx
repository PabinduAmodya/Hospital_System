import { useState } from "react";

const ICONS   = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
const COLORS  = {
  success: "bg-emerald-50 border-emerald-300 text-emerald-800",
  error:   "bg-red-50 border-red-300 text-red-800",
  warning: "bg-amber-50 border-amber-300 text-amber-800",
  info:    "bg-blue-50 border-blue-300 text-blue-800",
};
const IC = {
  success: "bg-emerald-100 text-emerald-600",
  error:   "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info:    "bg-blue-100 text-blue-600",
};

export function Toast({ toasts, remove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-96 max-w-[calc(100vw-2.5rem)]">
      {toasts.map((t) => (
        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${COLORS[t.type]}`}>
          <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${IC[t.type]}`}>
            {ICONS[t.type]}
          </span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            <p className="text-sm">{t.message}</p>
          </div>
          <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 text-xl leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const add = (message, type = "info", title = "") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type, title }]);
    setTimeout(() => remove(id), 5000);
  };

  const toast = {
    success: (msg, title = "") => add(msg, "success", title),
    error:   (msg, title = "") => add(msg, "error",   title),
    warning: (msg, title = "") => add(msg, "warning", title),
    info:    (msg, title = "") => add(msg, "info",    title),
  };

  return { toasts, toast, remove };
}