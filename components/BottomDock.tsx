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
              background: "rgba(0,0,0,0.95)",
              border: "1px solid rgba(0,255,136,0.20)",
              boxShadow: "0 -4px 30px rgba(0,255,136,0.08)",
              maxHeight: "40vh",
            }}
          >
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(0,255,136,0.12)" }}>
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#00ff88" }}>[ HISTORY ]</span>
              <button onClick={onNewChat} className="font-mono text-[9px] tracking-widest px-2 py-1 rounded" style={{ color: "#00e5ff", border: "1px solid rgba(0,229,255,0.3)" }}>+ NEW</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(40vh - 40px)" }}>
              {sessions.length === 0 ? (
                <p className="text-center py-4 font-mono text-[10px]" style={{ color: "#1a3d2e" }}>NO SESSIONS YET</p>
              ) : sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSelectSession?.(s.id); setHistoryOpen(false); }}
                  className="w-full text-left px-4 py-2.5 font-mono text-[10px] transition-all"
                  style={{
                    color: s.id === activeSessionId ? "#00ff88" : "#4dbb88",
                    background: s.id === activeSessionId ? "rgba(0,255,136,0.06)" : "transparent",
                    borderBottom: "1px solid rgba(0,255,136,0.06)",
                  }}
                >
                  <span className="opacity-50 mr-2">&gt;</span>
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
          background: "rgba(0,0,0,0.92)",
          border: "1px solid rgba(0,255,136,0.20)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 -2px 30px rgba(0,255,136,0.08), 0 4px 30px rgba(0,0,0,0.8)",
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
                color: isActive ? "#00ff88" : "#2a6644",
                background: isActive ? "rgba(0,255,136,0.08)" : "transparent",
                boxShadow: isActive ? "0 0 12px rgba(0,255,136,0.15)" : "none",
              }}
              whileHover={{
                scale: 1.12,
                color: "#00ff88",
                boxShadow: "0 0 16px rgba(0,255,136,0.20)",
                background: "rgba(0,255,136,0.06)",
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
                      background: "rgba(0,0,0,0.95)",
                      border: "1px solid rgba(0,255,136,0.4)",
                      color: "#00ff88",
                      boxShadow: "0 0 8px rgba(0,255,136,0.2)",
                    }}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              <Icon size={18} />
              <span>{item.label}</span>

              {/* Active neon underline indicator */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: "24px",
                    height: "2px",
                    background: "#00ff88",
                    boxShadow: "0 0 8px #00ff88, 0 0 16px rgba(0,255,136,0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Badge */}
              {hasBadge && (
                <span
                  className="absolute top-1 right-2 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center"
                  style={{ background: "#ff2244", color: "#fff" }}
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
