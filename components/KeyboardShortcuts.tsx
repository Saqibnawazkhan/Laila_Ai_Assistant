"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "K"], action: "New Chat" },
  { keys: ["Ctrl", "H"], action: "Toggle History" },
  { keys: ["Ctrl", "F"], action: "Search Messages" },
  { keys: ["Ctrl", ","], action: "Open Settings" },
  { keys: ["Ctrl", "?"], action: "Keyboard Shortcuts" },
  { keys: ["Enter"], action: "Send Message" },
  { keys: ["Shift", "Enter"], action: "New Line" },
  { keys: ["Escape"], action: "Close Panel" },
];

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
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
            <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Keyboard size={18} className="text-purple-400" />
                  <h3 className="text-white font-semibold">Keyboard Shortcuts</h3>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-gray-300">{shortcut.action}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 text-xs font-mono bg-white/10 border border-white/20 rounded text-gray-300 min-w-[24px] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-600">On Mac, use Cmd instead of Ctrl</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
