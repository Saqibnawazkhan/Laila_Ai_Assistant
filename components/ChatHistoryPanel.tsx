"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trash2, Plus, Clock } from "lucide-react";
import { ChatSession } from "@/lib/chat-history";

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
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

export default function ChatHistoryPanel({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
}: ChatHistoryPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gray-900 border-r border-white/10 shadow-2xl flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="text-purple-400" size={20} />
                <h2 className="text-white font-semibold">Chat History</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="px-5 pt-4">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {sessions.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start chatting with Laila!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition-colors ${
                          session.id === activeSessionId
                            ? "bg-purple-600/20 border border-purple-500/30"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                        onClick={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                      >
                        <MessageSquare
                          size={16}
                          className={session.id === activeSessionId ? "text-purple-400" : "text-gray-500"}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{session.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(session.updatedAt)} · {session.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
