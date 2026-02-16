"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, Terminal, X } from "lucide-react";
import { SystemCommand } from "@/lib/command-parser";

interface PermissionModalProps {
  command: SystemCommand | null;
  onAllow: () => void;
  onAlwaysAllow: () => void;
  onDeny: () => void;
}

export default function PermissionModal({ command, onAllow, onAlwaysAllow, onDeny }: PermissionModalProps) {
  if (!command) return null;

  const riskConfig = {
    low: {
      icon: ShieldCheck,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/30",
      label: "Low Risk",
    },
    medium: {
      icon: Shield,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/30",
      label: "Medium Risk",
    },
    high: {
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/30",
      label: "High Risk",
    },
  };

  const typeLabels = {
    open_app: "opening apps",
    file_op: "file operations",
    terminal: "terminal commands",
    system_info: "system info",
  };

  const config = riskConfig[command.risk];
  const RiskIcon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md mx-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="text-purple-400" size={20} />
              <h3 className="text-white font-semibold">Permission Request</h3>
            </div>
            <button
              onClick={onDeny}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-gray-300 text-sm mb-4">
              Laila wants to execute a command on your system:
            </p>

            {/* Command description */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-white font-medium text-sm mb-2">
                {command.description}
              </p>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <Terminal size={14} className="text-purple-400 flex-shrink-0" />
                <code className="text-xs text-gray-300 font-mono break-all">
                  {command.command}
                </code>
              </div>
            </div>

            {/* Risk level */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} mb-4`}>
              <RiskIcon size={16} className={config.color} />
              <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              {command.risk === "high" && (
                <span className="text-xs text-red-300 ml-1">
                  - This command could modify your system
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 px-6 pb-5">
            <div className="flex gap-3">
              <button
                onClick={onDeny}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Deny
              </button>
              <button
                onClick={onAllow}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                  command.risk === "high"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                Allow Once
              </button>
            </div>
            <button
              onClick={onAlwaysAllow}
              className="w-full px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-colors"
            >
              Always Allow {typeLabels[command.type]}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
