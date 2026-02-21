"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Clock, Settings, ListTodo, Keyboard, Volume2, VolumeX, Trash2, Download } from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export default function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered.length > 0) { handleSelect(filtered[selectedIndex]); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] backdrop-blur-sm"
            style={{ background: "var(--overlay-bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-[71] top-[18%] left-1/2 -translate-x-1/2 w-full max-w-lg mx-auto px-4"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            >
              {/* Search */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <Search size={15} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-[13px] focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                  onKeyDown={handleKeyDown}
                />
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>Esc</kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto py-1.5">
                {filtered.length === 0 ? (
                  <p className="text-center text-[13px] py-8" style={{ color: "var(--text-muted)" }}>No commands found</p>
                ) : (
                  filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                        i === selectedIndex ? "bg-[var(--surface-hover)]" : ""
                      }`}
                      style={{ color: i === selectedIndex ? "var(--foreground)" : "var(--text-secondary)" }}
                    >
                      <span style={{ color: i === selectedIndex ? "var(--accent)" : "var(--text-muted)" }}>{cmd.icon}</span>
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>{cmd.shortcut}</kbd>
                      )}
                      {i === selectedIndex && (
                        <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Enter</span>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-dim)" }}>
                  <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-dim)" }}>
                  <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>↵</kbd>
                  Select
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { type CommandItem };
export { Plus, Clock, Settings, ListTodo, Keyboard, Volume2, VolumeX, Trash2, Download };
