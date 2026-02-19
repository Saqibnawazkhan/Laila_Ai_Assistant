"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Check, Trash2, Circle, AlertCircle, Clock, ListTodo, Plus } from "lucide-react";
import { Task } from "@/lib/tasks";

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd?: (title: string) => void;
}

export default function TaskPanel({ isOpen, onClose, tasks, onToggle, onDelete, onAdd }: TaskPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const progress = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

  const priorityConfig = {
    high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-l-red-500", icon: AlertCircle, label: "High" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-l-yellow-500", icon: Clock, label: "Medium" },
    low: { color: "text-green-400", bg: "bg-green-500/10", border: "border-l-green-500", icon: Circle, label: "Low" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-sm"
            style={{ background: "var(--overlay-bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm shadow-2xl flex flex-col"
            style={{ background: "var(--background)", borderLeft: "1px solid var(--border)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ListTodo className="text-indigo-400" size={20} />
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>My Tasks</h2>
                {pending.length > 0 && (
                  <span className="text-white text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--badge-bg)" }}>
                    {pending.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="hover:bg-[var(--surface-hover)] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>Progress</span>
                  <span>{progress}% ({completed.length}/{tasks.length})</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(to right, var(--accent), #a78bfa)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Quick add task */}
            {onAdd && (
              <div className="px-5 pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTaskTitle.trim()) {
                        onAdd(newTaskTitle.trim());
                        setNewTaskTitle("");
                      }
                    }}
                    placeholder="Add a task..."
                    className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/30"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                  <button
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        onAdd(newTaskTitle.trim());
                        setNewTaskTitle("");
                      }
                    }}
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                    style={{ background: !newTaskTitle.trim() ? "var(--toggle-off)" : "var(--accent)" }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tasks.length === 0 ? (
                <div className="text-center mt-12">
                  <ListTodo size={48} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tasks yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Tell Laila to add a task!</p>
                  <p className="text-[10px] mt-3" style={{ color: "var(--text-dim)" }}>Try: &quot;Add a task to buy groceries&quot;</p>
                </div>
              ) : (
                <>
                  {pending.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>
                        Pending ({pending.length})
                      </h3>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {pending.map((task) => {
                            const pConfig = priorityConfig[task.priority];
                            const PriorityIcon = pConfig.icon;
                            return (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className={`flex items-center gap-3 ${pConfig.border} border-l-2 rounded-xl px-3 py-3`}
                                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderLeftWidth: "2px" }}
                              >
                                <button
                                  onClick={() => onToggle(task.id)}
                                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 hover:border-indigo-400 transition-colors"
                                  style={{ borderColor: "var(--text-dim)" }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>{task.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] ${pConfig.color}`}>{pConfig.label}</span>
                                    {task.dueDate && (
                                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{task.dueDate}</span>
                                    )}
                                  </div>
                                </div>
                                <div className={`flex-shrink-0 p-1 rounded ${pConfig.bg}`}>
                                  <PriorityIcon size={12} className={pConfig.color} />
                                </div>
                                <button
                                  onClick={() => onDelete(task.id)}
                                  className="flex-shrink-0 hover:text-red-400 transition-colors"
                                  style={{ color: "var(--text-dim)" }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {completed.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-dim)" }}>
                        Completed ({completed.length})
                      </h3>
                      <div className="space-y-2">
                        {completed.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className="flex items-center gap-3 border-l-2 border-l-green-500/50 rounded-xl px-3 py-3"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeftWidth: "2px" }}
                          >
                            <button
                              onClick={() => onToggle(task.id)}
                              className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center"
                            >
                              <Check size={12} className="text-white" />
                            </button>
                            <p className="flex-1 text-sm line-through truncate" style={{ color: "var(--text-muted)" }}>
                              {task.title}
                            </p>
                            <button
                              onClick={() => onDelete(task.id)}
                              className="flex-shrink-0 hover:text-red-400 transition-colors"
                              style={{ color: "var(--text-dim)" }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
