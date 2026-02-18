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
  Clock,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronLeft,
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

  // Order: Today, Yesterday, then rest
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
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed lg:relative z-50 lg:z-auto top-0 left-0 h-full flex flex-col bg-gray-950/95 backdrop-blur-2xl border-r border-white/[0.06] ${
          isOpen ? "w-72" : "w-0 lg:w-[68px]"
        } transition-all duration-300 overflow-hidden`}
      >
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <Sparkles size={18} className="text-white" />
            </div>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-base font-bold text-white tracking-tight">Laila AI</h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Personal Assistant</p>
              </motion.div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all lg:flex hidden"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {isOpen && (
            <button
              onClick={onToggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all lg:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        {isOpen && (
          <div className="px-3 pt-3 flex-shrink-0">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-500 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
            >
              <Search size={14} />
              <span className="flex-1 text-left text-xs">Search...</span>
              <kbd className="flex items-center gap-0.5 text-[10px] text-gray-600 bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 rounded">
                <Command size={9} />K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="px-2 pt-4 pb-2 flex-shrink-0">
          {isOpen && (
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-2 mb-2">Menu</p>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeView;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive
                      ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                  } ${!isOpen ? "justify-center px-0" : ""}`}
                  title={!isOpen ? item.label : undefined}
                >
                  <Icon size={18} className={isActive ? "text-purple-400" : ""} />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Chat History */}
        {isOpen && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-white/[0.04] mt-1">
            <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">History</p>
              <button
                onClick={onNewChat}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-all"
                title="New Chat"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* History search */}
            {sessions.length > 3 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500/30"
                  />
                </div>
              </div>
            )}

            {/* Sessions grouped by date */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center pt-8 px-4">
                  <MessageSquare size={28} className="mx-auto mb-2 text-gray-700" />
                  <p className="text-xs text-gray-600">No conversations yet</p>
                </div>
              ) : grouped.length === 0 ? (
                <div className="text-center pt-6 px-4">
                  <p className="text-xs text-gray-600">No results found</p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-medium text-gray-600 px-2 mb-1">{group.label}</p>
                    <div className="space-y-0.5">
                      {group.sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                            session.id === activeSessionId
                              ? "bg-purple-500/10 text-purple-300"
                              : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-300"
                          }`}
                          onClick={() => {
                            if (editingId !== session.id) {
                              onSelectSession(session);
                            }
                          }}
                        >
                          <MessageSquare size={14} className="flex-shrink-0 opacity-50" />
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
                                  className="w-full text-xs bg-black/30 border border-purple-500/50 rounded px-1.5 py-0.5 text-gray-200 focus:outline-none"
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
                              <p className="text-xs truncate">{session.title}</p>
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
                                className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-purple-400 hover:bg-white/5 transition-all"
                                title="Rename"
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-white/5 transition-all"
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
                ))
              )}
            </div>
          </div>
        )}

        {/* User Profile (bottom) */}
        <div className="flex-shrink-0 border-t border-white/[0.06] p-3">
          <div className={`flex items-center gap-2.5 ${!isOpen ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              S
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium truncate">Saqib Nawaz</p>
                <p className="text-[10px] text-gray-600">Pro User</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
