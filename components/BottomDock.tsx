"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mic, ListTodo, Settings, History } from "lucide-react";

export type DockView = "chat" | "voice" | "tasks" | "settings" | "history";

interface BottomDockProps {
  activeView: DockView;
  onViewChange: (view: DockView) => void;
  pendingTaskCount?: number;
}

const dockItems = [
  { id: "chat" as DockView, label: "CHAT", icon: MessageSquare },
  { id: "voice" as DockView, label: "VOICE", icon: Mic },
  { id: "tasks" as DockView, label: "TASKS", icon: ListTodo },
  { id: "history" as DockView, label: "HISTORY", icon: History },
  { id: "settings" as DockView, label: "CONFIG", icon: Settings },
];

export default function BottomDock({ activeView, onViewChange, pendingTaskCount = 0 }: BottomDockProps) {
  const [hoveredItem, setHoveredItem] = useState<DockView | null>(null);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
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
              onClick={() => onViewChange(item.id)}
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
