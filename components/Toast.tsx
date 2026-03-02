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
    success: { label: "[OK]", color: "#ff8c00", border: "rgba(255,140,0,0.35)", glow: "rgba(255,140,0,0.08)" },
    error: { label: "[ERR]", color: "#ff4455", border: "rgba(255,68,85,0.35)", glow: "rgba(255,68,85,0.08)" },
    info: { label: "[INFO]", color: "rgba(255,255,255,0.80)", border: "rgba(255,255,255,0.20)", glow: "rgba(255,255,255,0.04)" },
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
              className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-xl max-w-xs font-mono"
              style={{
                background: "rgba(18,14,10,0.90)",
                backdropFilter: "blur(24px)",
                border: `1px solid ${c.border}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.50), 0 0 16px ${c.glow}`,
              }}
            >
              <span className="text-[10px] font-bold tracking-widest flex-shrink-0" style={{ color: c.color }}>{c.label}</span>
              <span className="text-[11px] flex-1 tracking-wide" style={{ color: "rgba(255,255,255,0.80)" }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="transition-opacity ml-1 opacity-50 hover:opacity-100"
                style={{ color: "rgba(255,255,255,0.40)" }}
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
