"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Check, Trash2, Plus, Target, Sparkles } from "lucide-react";
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

  const priorityDot = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.20)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[320px] flex flex-col"
            style={{
              background: "#ffffff",
              borderLeft: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "-8px 0 32px rgba(0,0,0,0.10)",
            }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,140,0,0.12)" }}>
                  <Sparkles size={14} style={{ color: "#ff8c00" }} />
                </div>
                <span className="text-[15px] font-semibold" style={{ color: "#111827" }}>Tasks</span>
                {pending.length > 0 && (
                  <span className="text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#ff8c00" }}>
                    {pending.length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color: "rgba(0,0,0,0.40)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Progress */}
            {tasks.length > 0 && (
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-medium" style={{ color: "#111827" }}>{completed.length} of {tasks.length} completed</span>
                  <span className="text-[12px] font-semibold" style={{ color: "#ff8c00" }}>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #ff8c00, #ffaa33)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                {progress === 100 && (
                  <p className="text-[11px] mt-1.5 text-emerald-600 font-medium">🎉 All done!</p>
                )}
              </div>
            )}

            {/* Add task */}
            {onAdd && (
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newTaskTitle.trim()) { onAdd(newTaskTitle.trim()); setNewTaskTitle(""); } }}
                    placeholder="Add a new task..."
                    className="flex-1 text-[13px] rounded-xl px-3 py-2 focus:outline-none transition-all"
                    style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.08)", color: "#111827" }}
                  />
                  <motion.button
                    onClick={() => { if (newTaskTitle.trim()) { onAdd(newTaskTitle.trim()); setNewTaskTitle(""); } }}
                    disabled={!newTaskTitle.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30"
                    style={{ background: "#ff8c00" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {tasks.length === 0 ? (
                <div className="text-center mt-16">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#f3f4f6" }}>
                    <Target size={22} style={{ color: "rgba(0,0,0,0.25)" }} />
                  </div>
                  <p className="text-[13px] font-medium" style={{ color: "rgba(0,0,0,0.45)" }}>No tasks yet</p>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,0.30)" }}>Ask Laila to add one!</p>
                </div>
              ) : (
                <>
                  {pending.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: "rgba(0,0,0,0.35)" }}>Pending · {pending.length}</p>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {pending.map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40 }}
                              className="flex items-center gap-3 rounded-2xl px-3.5 py-3 group transition-colors hover:bg-gray-50"
                              style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}
                            >
                              <button
                                onClick={() => onToggle(task.id)}
                                className="flex-shrink-0 w-5 h-5 rounded-full border-2 hover:border-orange-400 transition-colors flex items-center justify-center"
                                style={{ borderColor: "rgba(0,0,0,0.20)" }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] truncate font-medium" style={{ color: "#111827" }}>{task.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityDot[task.priority] }} />
                                    <span style={{ color: "rgba(0,0,0,0.40)" }}>{task.priority}</span>
                                  </span>
                                  {task.dueDate && <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>{task.dueDate}</span>}
                                </div>
                              </div>
                              <button onClick={() => onDelete(task.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500">
                                <Trash2 size={13} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {completed.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: "rgba(0,0,0,0.35)" }}>Completed · {completed.length}</p>
                      <div className="space-y-1.5">
                        {completed.map((task) => (
                          <motion.div key={task.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 group" style={{ background: "#f9fafb", opacity: 0.6 }}>
                            <button onClick={() => onToggle(task.id)} className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#10b981" }}>
                              <Check size={11} className="text-white" />
                            </button>
                            <p className="flex-1 text-[13px] line-through truncate" style={{ color: "rgba(0,0,0,0.45)" }}>{task.title}</p>
                            <button onClick={() => onDelete(task.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400">
                              <Trash2 size={13} />
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
