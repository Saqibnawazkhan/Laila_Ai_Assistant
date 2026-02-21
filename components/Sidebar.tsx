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
  Hash,
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
    { id: "chat", label: "Chat", icon: MessageSquare, onClick: onNewChat },
    { id: "voice", label: "Voice", icon: Mic, onClick: () => {} },
    { id: "tasks", label: "Tasks", icon: ListTodo, onClick: onOpenTasks, badge: pendingTaskCount > 0 ? pendingTaskCount : undefined },
    { id: "settings", label: "Settings", icon: Settings, onClick: onOpenSettings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
            style={{ background: "var(--overlay-bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full flex flex-col overflow-hidden"
        style={{ background: "var(--background-secondary)", borderRight: "1px solid var(--border)" }}
        initial={false}
        animate={{ width: isOpen ? 272 : 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="w-[272px] h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--logo-bg-solid)", boxShadow: "var(--shadow-glow)" }}>
                <Sparkles size={14} style={{ color: "var(--logo-icon)" }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>Laila</h1>
                <p className="text-[9px] leading-tight" style={{ color: "var(--text-dim)" }}>AI Assistant</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-hover)] transition-all flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
              title="Close sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          {/* New Chat + Search */}
          <div className="px-3 pt-3 space-y-2 flex-shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-white text-[13px] font-medium rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-glow)" }}
            >
              <Plus size={15} />
              New Chat
            </button>

            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-[var(--surface-hover)] transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <Search size={13} />
              <span className="flex-1 text-left text-[11px]">Search...</span>
              <kbd className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                <Command size={8} />K
              </kbd>
            </button>
          </div>

          {/* Navigation - horizontal pills */}
          <div className="px-3 pt-3 flex-shrink-0">
            <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "var(--surface)" }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all relative ${
                      isActive ? "text-white" : ""
                    }`}
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      color: isActive ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    <Icon size={13} />
                    <span className="hidden sm:inline">{item.label}</span>
                    {item.badge && (
                      <span className="absolute -top-1 -right-0.5 w-4 h-4 text-[9px] rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--error)" }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="flex items-center justify-between px-4 pb-1 flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Recent</p>
              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{sessions.length}</span>
            </div>

            {/* History search */}
            {sessions.length > 3 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }} />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Filter chats..."
                    className="w-full pl-7 pr-2 py-1.5 text-[11px] rounded-lg focus:outline-none"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
            )}

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {sessions.length === 0 ? (
                <div className="text-center pt-8 px-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: "var(--surface)" }}>
                    <Hash size={18} style={{ color: "var(--text-dim)" }} />
                  </div>
                  <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>No conversations</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>Start chatting with Laila!</p>
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center pt-4 px-4">
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No results</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <p className="text-[9px] font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: "var(--text-dim)" }}>{group.label}</p>
                      <div className="space-y-px">
                        {group.sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`group flex items-center gap-2 px-2.5 py-[7px] rounded-lg cursor-pointer transition-all ${
                              session.id === activeSessionId
                                ? ""
                                : "hover:bg-[var(--surface-hover)]"
                            }`}
                            style={{
                              background: session.id === activeSessionId ? "var(--accent-soft)" : undefined,
                              color: session.id === activeSessionId ? "var(--accent)" : "var(--text-secondary)",
                            }}
                            onClick={() => {
                              if (editingId !== session.id) onSelectSession(session);
                            }}
                          >
                            <MessageSquare size={13} className="flex-shrink-0 opacity-40" />
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
                                    className="w-full text-[11px] rounded px-1.5 py-0.5 focus:outline-none"
                                    style={{ background: "var(--code-bg)", border: "1px solid var(--accent)", color: "var(--foreground)" }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); confirmRename(); }}
                                    className="text-emerald-400 hover:text-emerald-300 flex-shrink-0"
                                  >
                                    <Check size={11} />
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] truncate leading-snug">{session.title}</p>
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
                                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-all"
                                  style={{ color: "var(--text-muted)" }}
                                  title="Rename"
                                >
                                  <Pencil size={10} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                  }}
                                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-all text-red-400/60 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 size={10} />
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
          <div className="flex-shrink-0 px-3 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2.5 px-1">
              <div className="relative flex-shrink-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "var(--accent)" }}>
                  S
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2" style={{ ringColor: "var(--background-secondary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium truncate leading-tight" style={{ color: "var(--text-primary)" }}>Saqib Nawaz</p>
                <p className="text-[9px] leading-tight flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
                  <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
