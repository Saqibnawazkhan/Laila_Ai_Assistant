"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, Circle, AlertCircle, Clock, ListTodo } from "lucide-react";
import { Task } from "@/lib/tasks";

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskPanel({ isOpen, onClose, tasks, onToggle, onDelete }: TaskPanelProps) {
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
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gray-900 border-l border-white/10 shadow-2xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ListTodo className="text-purple-400" size={20} />
                <h2 className="text-white font-semibold">My Tasks</h2>
                {pending.length > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {pending.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{progress}% ({completed.length}/{tasks.length})</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tasks.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <ListTodo size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs mt-1">Tell Laila to add a task!</p>
                  <p className="text-[10px] mt-3 text-gray-600">Try: &quot;Add a task to buy groceries&quot;</p>
                </div>
              ) : (
                <>
                  {/* Pending Tasks */}
                  {pending.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
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
                                className={`flex items-center gap-3 bg-white/5 border border-white/10 ${pConfig.border} border-l-2 rounded-xl px-3 py-3`}
                              >
                                <button
                                  onClick={() => onToggle(task.id)}
                                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-500 hover:border-purple-400 transition-colors"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-200 truncate">{task.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] ${pConfig.color}`}>{pConfig.label}</span>
                                    {task.dueDate && (
                                      <span className="text-[10px] text-gray-500">{task.dueDate}</span>
                                    )}
                                  </div>
                                </div>
                                <div className={`flex-shrink-0 p-1 rounded ${pConfig.bg}`}>
                                  <PriorityIcon size={12} className={pConfig.color} />
                                </div>
                                <button
                                  onClick={() => onDelete(task.id)}
                                  className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
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

                  {/* Completed Tasks */}
                  {completed.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Completed ({completed.length})
                      </h3>
                      <div className="space-y-2">
                        {completed.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            className="flex items-center gap-3 bg-white/5 border border-white/5 border-l-2 border-l-green-500/50 rounded-xl px-3 py-3"
                          >
                            <button
                              onClick={() => onToggle(task.id)}
                              className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center"
                            >
                              <Check size={12} className="text-white" />
                            </button>
                            <p className="flex-1 text-sm text-gray-400 line-through truncate">
                              {task.title}
                            </p>
                            <button
                              onClick={() => onDelete(task.id)}
                              className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors"
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
