"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mic, ListTodo, Settings, History } from "lucide-react";

export type DockView = "chat" | "voice" | "tasks" | "settings" | "history";

import { ChatSession } from "@/lib/chat-history";

interface BottomDockProps {
  activeView: DockView;
  onViewChange: (view: DockView) => void;
  pendingTaskCount?: number;
  sessions?: ChatSession[];
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
}

const dockItems = [
  { id: "chat" as DockView, label: "CHAT", icon: MessageSquare },
  { id: "voice" as DockView, label: "VOICE", icon: Mic },
  { id: "tasks" as DockView, label: "TASKS", icon: ListTodo },
  { id: "history" as DockView, label: "HISTORY", icon: History },
  { id: "settings" as DockView, label: "CONFIG", icon: Settings },
];

export default function BottomDock({ activeView, onViewChange, pendingTaskCount = 0, sessions = [], activeSessionId, onSelectSession, onNewChat }: BottomDockProps) {
  const [hoveredItem, setHoveredItem] = useState<DockView | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleViewChange = (view: DockView) => {
    if (view === "history") {
      setHistoryOpen((p) => !p);
      return;
    }
    setHistoryOpen(false);
    onViewChange(view);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      {/* History slide-up drawer */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(18, 14, 10, 0.92)",
              backdropFilter: "blur(32px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 -4px 30px rgba(0,0,0,0.50)",
              maxHeight: "40vh",
            }}
          >
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#ff8c00" }}>[ HISTORY ]</span>
              <button onClick={onNewChat} className="font-mono text-[9px] tracking-widest px-2 py-1 rounded" style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>+ NEW</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(40vh - 40px)" }}>
              {sessions.length === 0 ? (
                <p className="text-center py-4 font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>NO SESSIONS YET</p>
              ) : sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSelectSession?.(s.id); setHistoryOpen(false); }}
                  className="w-full text-left px-4 py-2.5 font-mono text-[10px] transition-all"
                  style={{
                    color: s.id === activeSessionId ? "#ff8c00" : "rgba(255,255,255,0.55)",
                    background: s.id === activeSessionId ? "rgba(255,140,0,0.06)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span className="opacity-40 mr-2">&gt;</span>
                  {s.title || "Untitled"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{
          background: "rgba(18, 14, 10, 0.88)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 -2px 30px rgba(0,0,0,0.50), 0 4px 30px rgba(0,0,0,0.60)",
        }}
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasBadge = item.id === "tasks" && pendingTaskCount > 0;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl font-mono text-[9px] tracking-widest transition-all"
              style={{
                color: isActive ? "#ff8c00" : "rgba(255,255,255,0.35)",
                background: isActive ? "rgba(255,140,0,0.10)" : "transparent",
                boxShadow: isActive ? "0 0 12px rgba(255,140,0,0.15)" : "none",
              }}
              whileHover={{
                scale: 1.12,
                color: "#ff8c00",
                boxShadow: "0 0 16px rgba(255,140,0,0.20)",
                background: "rgba(255,140,0,0.07)",
              }}
              whileTap={{ scale: 0.9 }}
            >
              {/* Tooltip */}
              <AnimatePresence>
                {hoveredItem === item.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded font-mono text-[9px] tracking-widest whitespace-nowrap pointer-events-none"
                    style={{
                      background: "rgba(18,14,10,0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,140,0,0.35)",
                      color: "#ff8c00",
                      boxShadow: "0 0 8px rgba(255,140,0,0.15)",
                    }}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              <Icon size={18} />
              <span>{item.label}</span>

              {/* Active underline indicator */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: "24px",
                    height: "2px",
                    background: "#ff8c00",
                    boxShadow: "0 0 8px rgba(255,140,0,0.8), 0 0 16px rgba(255,140,0,0.4)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Badge */}
              {hasBadge && (
                <span
                  className="absolute top-1 right-2 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center"
                  style={{ background: "#ff4455", color: "#fff" }}
                >
                  {pendingTaskCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
