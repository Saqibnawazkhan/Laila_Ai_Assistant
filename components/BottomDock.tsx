"use client";

import { motion } from "framer-motion";
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
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const hasBadge = item.id === "tasks" && pendingTaskCount > 0;

          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl font-mono text-[9px] tracking-widest transition-all"
              style={{
                color: isActive ? "#00ff88" : "#2a6644",
                background: isActive ? "rgba(0,255,136,0.08)" : "transparent",
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon size={18} />
              <span>{item.label}</span>

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
