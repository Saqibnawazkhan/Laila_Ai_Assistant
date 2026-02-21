"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const config = {
    success: { icon: <CheckCircle size={14} className="text-emerald-400" />, bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
    error: { icon: <AlertCircle size={14} className="text-red-400" />, bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
    info: { icon: <Info size={14} style={{ color: "var(--accent)" }} />, bg: "var(--accent-soft)", border: "rgba(139,92,246,0.2)" },
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const c = config[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl backdrop-blur-md max-w-xs"
              style={{
                background: "var(--background)",
                border: `1px solid ${c.border}`,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <span className="text-[12px] flex-1" style={{ color: "var(--foreground)" }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="hover:opacity-100 transition-opacity ml-1 opacity-50"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
