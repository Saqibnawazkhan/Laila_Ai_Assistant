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

// Global function to show toast from anywhere
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

  // Register global toast function
  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const icons = {
    success: <CheckCircle size={16} className="text-green-400" />,
    error: <AlertCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-indigo-400" />,
  };

  const borders = {
    success: "rgba(34, 197, 94, 0.2)",
    error: "rgba(239, 68, 68, 0.2)",
    info: "rgba(124, 92, 252, 0.2)",
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl backdrop-blur-sm shadow-lg max-w-sm"
            style={{
              background: "var(--background)",
              border: `1px solid ${borders[toast.type]}`,
            }}
          >
            {icons[toast.type]}
            <span className="text-sm flex-1" style={{ color: "var(--foreground)" }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:text-white transition-colors ml-2"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
