"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Check, Trash2, ListTodo, Plus, Target } from "lucide-react";
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
    high: { color: "text-red-400", label: "High", dot: "bg-red-400" },
    medium: { color: "text-amber-400", label: "Med", dot: "bg-amber-400" },
    low: { color: "text-emerald-400", label: "Low", dot: "bg-emerald-400" },
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
            <div className="flex items-center justify-between px-5 h-14 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                  <ListTodo size={14} style={{ color: "var(--accent)" }} />
                </div>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Tasks</h2>
                {pending.length > 0 && (
                  <span className="text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)" }}>
                    {pending.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="hover:bg-[var(--surface-hover)] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress ring */}
            {tasks.length > 0 && (
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface)" strokeWidth="3" />
                      <motion.circle
                        cx="18" cy="18" r="15.5" fill="none"
                        stroke="var(--accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${progress * 0.97} 100`}
                        initial={{ strokeDasharray: "0 100" }}
                        animate={{ strokeDasharray: `${progress * 0.97} 100` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: "var(--accent)" }}>{progress}%</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{completed.length} of {tasks.length} done</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {progress === 100 ? "All tasks completed!" : progress >= 50 ? "Keep going, almost there!" : `${pending.length} remaining`}
                    </p>
                  </div>
                  {progress === 100 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-lg"
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      🎉
                    </motion.span>
                  )}
                </div>
              </div>
            )}

            {/* Quick add */}
            {onAdd && (
              <div className="px-5 pt-2 pb-1">
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
                    className="flex-1 text-[13px] rounded-xl px-3 py-2 focus:outline-none"
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
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30"
                    style={{ background: !newTaskTitle.trim() ? "var(--toggle-off)" : "var(--accent)" }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {tasks.length === 0 ? (
                <div className="text-center mt-16">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--surface)" }}>
                    <Target size={24} style={{ color: "var(--text-dim)" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-muted)" }}>No tasks yet</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>Ask Laila to add one!</p>
                </div>
              ) : (
                <>
                  {pending.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                        Pending
                      </p>
                      <div className="space-y-1.5">
                        <AnimatePresence>
                          {pending.map((task) => {
                            const pConfig = priorityConfig[task.priority];
                            return (
                              <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 group"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                              >
                                <button
                                  onClick={() => onToggle(task.id)}
                                  className="flex-shrink-0 w-[18px] h-[18px] rounded-full border-[1.5px] hover:border-violet-400 transition-colors flex items-center justify-center"
                                  style={{ borderColor: "var(--text-dim)" }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] truncate" style={{ color: "var(--foreground)" }}>{task.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`flex items-center gap-1 text-[9px] ${pConfig.color}`}>
                                      <span className={`w-1 h-1 rounded-full ${pConfig.dot}`} />
                                      {pConfig.label}
                                    </span>
                                    {task.dueDate && (
                                      <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>{task.dueDate}</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => onDelete(task.id)}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                                  style={{ color: "var(--text-dim)" }}
                                >
                                  <Trash2 size={12} />
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
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-dim)" }}>
                        Done ({completed.length})
                      </p>
                      <div className="space-y-1">
                        {completed.map((task) => (
                          <motion.div
                            key={task.id}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 opacity-50 group"
                            style={{ background: "var(--surface)" }}
                          >
                            <button
                              onClick={() => onToggle(task.id)}
                              className="flex-shrink-0 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center"
                            >
                              <Check size={10} className="text-white" />
                            </button>
                            <p className="flex-1 text-[12px] line-through truncate" style={{ color: "var(--text-muted)" }}>
                              {task.title}
                            </p>
                            <button
                              onClick={() => onDelete(task.id)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                              style={{ color: "var(--text-dim)" }}
                            >
                              <Trash2 size={12} />
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
