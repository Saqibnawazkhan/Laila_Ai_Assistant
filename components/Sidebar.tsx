"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mic,
  ListTodo,
  Settings,
  Search,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  Sparkles,
  Command,
} from "lucide-react";
import { ChatSession } from "@/lib/chat-history";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenTasks: () => void;
  onOpenCommandPalette: () => void;
  activeView: string;
  pendingTaskCount: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupSessionsByDate(sessions: ChatSession[]) {
  const groups: { label: string; sessions: ChatSession[] }[] = [];
  const buckets: Record<string, ChatSession[]> = {};

  sessions.forEach((s) => {
    const label = formatDate(s.updatedAt);
    if (!buckets[label]) buckets[label] = [];
    buckets[label].push(s);
  });

  const order = ["Today", "Yesterday"];
  order.forEach((label) => {
    if (buckets[label]) {
      groups.push({ label, sessions: buckets[label] });
      delete buckets[label];
    }
  });

  Object.entries(buckets).forEach(([label, sess]) => {
    groups.push({ label, sessions: sess });
  });

  return groups;
}

export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewChat,
  onOpenSettings,
  onOpenTasks,
  onOpenCommandPalette,
  activeView,
  pendingTaskCount,
}: SidebarProps) {
  const [historySearch, setHistorySearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameSession(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle("");
  };

  const filteredSessions = sessions.filter(
    (s) => !historySearch || s.title.toLowerCase().includes(historySearch.toLowerCase())
  );
  const grouped = groupSessionsByDate(filteredSessions);

  const navItems = [
    { id: "chat", label: "Chat with AI", icon: MessageSquare, onClick: onNewChat },
    { id: "voice", label: "Voice Control", icon: Mic, onClick: () => {} },
    { id: "tasks", label: "Tasks", icon: ListTodo, onClick: onOpenTasks, badge: pendingTaskCount > 0 ? pendingTaskCount : undefined },
    { id: "settings", label: "Settings", icon: Settings, onClick: onOpenSettings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full
          flex flex-col border-r border-white/[0.06]
          transition-[width] duration-200 ease-in-out
          ${isOpen ? "w-[280px]" : "w-0 lg:w-0"}
          overflow-hidden
        `}
        style={{ background: "#161b28" }}
      >
        <div className="w-[280px] h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10">
                <Sparkles size={16} className="text-[#1a1f2e]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Laila AI</h1>
                <p className="text-[10px] leading-tight" style={{ color: "#6b7194" }}>Personal Assistant</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-all flex-shrink-0"
              style={{ color: "#6b7194" }}
              title="Close sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-white text-sm font-medium rounded-xl transition-colors hover:opacity-90"
              style={{ background: "#7c5cfc" }}
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-2 pb-1 flex-shrink-0">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] hover:border-white/[0.10] transition-all"
              style={{ color: "#6b7194" }}
            >
              <Search size={14} />
              <span className="flex-1 text-left text-xs">Search...</span>
              <kbd className="flex items-center gap-0.5 text-[10px] bg-white/[0.05] border border-white/[0.06] px-1.5 py-0.5 rounded" style={{ color: "#4a4f66" }}>
                <Command size={9} />K
              </kbd>
            </button>
          </div>

          {/* Navigation */}
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-1.5" style={{ color: "#4a4f66" }}>Menu</p>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-300"
                        : "hover:bg-white/[0.04]"
                    }`}
                    style={{ color: isActive ? undefined : "#8b8fa3" }}
                  >
                    <Icon size={16} style={{ color: isActive ? "#818cf8" : "#6b7194" }} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium" style={{ background: "#7c5cfc" }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Chat History */}
          <div className="flex-1 flex flex-col min-h-0 mt-2">
            <div className="flex items-center justify-between px-4 pb-1.5 flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#4a4f66" }}>History</p>
            </div>

            {/* History search */}
            {sessions.length > 3 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#4a4f66" }} />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 placeholder-[#4a4f66] focus:outline-none focus:border-indigo-500/30"
                  />
                </div>
              </div>
            )}

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {sessions.length === 0 ? (
                <div className="text-center pt-6 px-4">
                  <MessageSquare size={24} className="mx-auto mb-2" style={{ color: "#3a3f54" }} />
                  <p className="text-xs" style={{ color: "#6b7194" }}>No conversations yet</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#4a4f66" }}>Start chatting with Laila!</p>
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center pt-4 px-4">
                  <p className="text-xs" style={{ color: "#6b7194" }}>No results found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-medium px-2 mb-1" style={{ color: "#4a4f66" }}>{group.label}</p>
                      <div className="space-y-px">
                        {group.sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                              session.id === activeSessionId
                                ? "bg-indigo-500/10 text-indigo-300"
                                : "hover:bg-white/[0.04]"
                            }`}
                            style={{ color: session.id === activeSessionId ? undefined : "#8b8fa3" }}
                            onClick={() => {
                              if (editingId !== session.id) onSelectSession(session);
                            }}
                          >
                            <MessageSquare size={14} className="flex-shrink-0 opacity-40" />
                            <div className="flex-1 min-w-0">
                              {editingId === session.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    ref={editInputRef}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") confirmRename();
                                      if (e.key === "Escape") { setEditingId(null); setEditTitle(""); }
                                    }}
                                    onBlur={confirmRename}
                                    className="w-full text-xs bg-black/40 border border-indigo-500/40 rounded px-1.5 py-0.5 text-gray-200 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); confirmRename(); }}
                                    className="text-green-400 hover:text-green-300 flex-shrink-0"
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs truncate leading-snug">{session.title}</p>
                              )}
                            </div>
                            {editingId !== session.id && (
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(session.id);
                                    setEditTitle(session.title);
                                  }}
                                  className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.06] transition-all"
                                  style={{ color: "#6b7194" }}
                                  title="Rename"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                  }}
                                  className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.06] transition-all text-red-400/60 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="flex-shrink-0 border-t border-white/[0.06] px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: "#7c5cfc" }}>
                S
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate leading-tight">Saqib Nawaz</p>
                <p className="text-[10px] leading-tight" style={{ color: "#6b7194" }}>Pro User</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
