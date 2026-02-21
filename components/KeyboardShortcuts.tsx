"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Command } from "lucide-react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["⌘", "K"], action: "New Chat", category: "Navigation" },
  { keys: ["⌘", "P"], action: "Command Palette", category: "Navigation" },
  { keys: ["⌘", "H"], action: "Toggle Sidebar", category: "Navigation" },
  { keys: ["⌘", "F"], action: "Search Messages", category: "Navigation" },
  { keys: ["⌘", ","], action: "Settings", category: "Navigation" },
  { keys: ["⌘", "?"], action: "Shortcuts", category: "Navigation" },
  { keys: ["↵"], action: "Send Message", category: "Chat" },
  { keys: ["⇧", "↵"], action: "New Line", category: "Chat" },
  { keys: ["Esc"], action: "Close Panel", category: "Chat" },
  { keys: ["Dbl-Click"], action: "Copy Message", category: "Chat" },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const categories = [...new Set(shortcuts.map((s) => s.category))];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] backdrop-blur-sm"
            style={{ background: "var(--overlay-bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-[61] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto px-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            >
              <div className="flex items-center justify-between px-5 h-12" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                    <Command size={12} style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>Shortcuts</h3>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-[var(--surface-hover)] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider px-2 mb-1.5" style={{ color: "var(--text-dim)" }}>{cat}</p>
                    <div className="space-y-0.5">
                      {shortcuts.filter((s) => s.category === cat).map((shortcut) => (
                        <div
                          key={shortcut.action}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                        >
                          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{shortcut.action}</span>
                          <div className="flex items-center gap-0.5">
                            {shortcut.keys.map((key) => (
                              <kbd
                                key={key}
                                className="px-1.5 py-0.5 text-[10px] font-mono rounded min-w-[20px] text-center"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-2 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-[9px]" style={{ color: "var(--text-dim)" }}>Use Ctrl on Windows/Linux</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
