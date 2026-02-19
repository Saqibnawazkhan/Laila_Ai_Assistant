"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "K"], action: "New Chat" },
  { keys: ["Ctrl", "P"], action: "Command Palette" },
  { keys: ["Ctrl", "H"], action: "Toggle History" },
  { keys: ["Ctrl", "F"], action: "Search Messages" },
  { keys: ["Ctrl", ","], action: "Open Settings" },
  { keys: ["Ctrl", "?"], action: "Keyboard Shortcuts" },
  { keys: ["Enter"], action: "Send Message" },
  { keys: ["Shift", "Enter"], action: "New Line" },
  { keys: ["Escape"], action: "Close Panel" },
  { keys: ["Dbl-Click"], action: "Copy Message" },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-[61] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="rounded-2xl shadow-2xl mx-4 overflow-hidden"
              style={{ background: "#1a1f2e", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Keyboard size={18} className="text-indigo-400" />
                  <h3 className="text-white font-semibold">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-white/[0.06] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "#6b7194" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm" style={{ color: "#9499b3" }}>{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 text-xs font-mono rounded min-w-[24px] text-center"
                          style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#9499b3" }}
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-white/[0.06] text-center">
                <p className="text-[10px]" style={{ color: "#4a4f66" }}>On Mac, use Cmd instead of Ctrl</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
