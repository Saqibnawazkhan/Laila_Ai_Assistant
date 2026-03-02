"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mic, ListTodo, Settings, History, Plus } from "lucide-react";

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
  { id: "chat" as DockView, label: "Chat", icon: MessageSquare },
  { id: "voice" as DockView, label: "Voice", icon: Mic },
  { id: "tasks" as DockView, label: "Tasks", icon: ListTodo },
  { id: "history" as DockView, label: "History", icon: History },
  { id: "settings" as DockView, label: "Settings", icon: Settings },
];

export default function BottomDock({ activeView, onViewChange, pendingTaskCount = 0, sessions = [], activeSessionId, onSelectSession, onNewChat }: BottomDockProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleViewChange = (view: DockView) => {
    if (view === "history") { setHistoryOpen((p) => !p); return; }
    setHistoryOpen(false);
    onViewChange(view);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      {/* History drawer */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="w-full max-w-sm mb-2 rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)",
              maxHeight: "42vh",
            }}
          >
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span className="text-[12px] font-semibold" style={{ color: "#111827" }}>Chat History</span>
              <button onClick={onNewChat} className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all hover:bg-gray-100" style={{ color: "#ff8c00", border: "1px solid rgba(255,140,0,0.25)" }}>
                <Plus size={12} /> New
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(42vh - 44px)" }}>
              {sessions.length === 0 ? (
                <p className="text-center py-6 text-[12px]" style={{ color: "rgba(0,0,0,0.35)" }}>No sessions yet</p>
              ) : sessions.map((s) => (
                <button key={s.id} onClick={() => { onSelectSession?.(s.id); setHistoryOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-[12px] transition-all hover:bg-gray-50"
                  style={{
                    color: s.id === activeSessionId ? "#ff8c00" : "#374151",
                    background: s.id === activeSessionId ? "rgba(255,140,0,0.05)" : "transparent",
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    fontWeight: s.id === activeSessionId ? 500 : 400,
                  }}
                >
                  {s.title || "Untitled"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock pill */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasBadge = item.id === "tasks" && pendingTaskCount > 0;
          const isHistoryActive = item.id === "history" && historyOpen;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className="relative flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-xl transition-all"
              style={{
                color: isActive || isHistoryActive ? "#ff8c00" : "rgba(0,0,0,0.40)",
                background: isActive || isHistoryActive ? "rgba(255,140,0,0.08)" : "transparent",
              }}
              whileHover={{ scale: 1.08, color: "#ff8c00" }}
              whileTap={{ scale: 0.90 }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium tracking-wide">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: "18px", height: "2px", background: "#ff8c00" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {hasBadge && (
                <span className="absolute top-1 right-2 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{ background: "#ef4444" }}>
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
