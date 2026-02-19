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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (cmd: CommandItem) => {
    cmd.action();
    onClose();
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
            className="fixed z-[71] top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg mx-auto px-4"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <Search size={16} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: "var(--foreground)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                    if (e.key === "Enter" && filtered.length > 0) handleSelect(filtered[0]);
                  }}
                />
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Esc</kbd>
              </div>

              {/* Results */}
              <div className="max-h-64 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm py-6" style={{ color: "var(--text-muted)" }}>No commands found</p>
                ) : (
                  filtered.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface-hover)] transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>{cmd.icon}</span>
                      <span className="flex-1 text-left">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{cmd.shortcut}</kbd>
                      )}
                    </button>
                  ))
                )}
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
