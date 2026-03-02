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
    success: { label: "[OK]", color: "#00ff88", border: "rgba(0,255,136,0.3)", glow: "rgba(0,255,136,0.10)" },
    error: { label: "[ERR]", color: "#ff2244", border: "rgba(255,34,68,0.3)", glow: "rgba(255,34,68,0.10)" },
    info: { label: "[INFO]", color: "#00e5ff", border: "rgba(0,229,255,0.3)", glow: "rgba(0,229,255,0.10)" },
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
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded max-w-xs font-mono"
              style={{
                background: "rgba(0,0,0,0.95)",
                border: `1px solid ${c.border}`,
                boxShadow: `0 0 16px ${c.glow}`,
              }}
            >
              <span className="text-[10px] font-bold tracking-widest flex-shrink-0" style={{ color: c.color }}>{c.label}</span>
              <span className="text-[11px] flex-1 tracking-wide" style={{ color: "#7fffcc" }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="transition-opacity ml-1 opacity-50 hover:opacity-100"
                style={{ color: "#2a6644" }}
              >
                <X size={10} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
