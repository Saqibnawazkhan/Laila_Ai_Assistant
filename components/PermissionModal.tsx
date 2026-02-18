"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, ShieldCheck, Terminal, X, AlertTriangle, Lock, Eye, EyeOff } from "lucide-react";
import { SystemCommand } from "@/lib/command-parser";

interface PermissionModalProps {
  command: SystemCommand | null;
  onAllow: () => void;
  onAlwaysAllow: () => void;
  onDeny: () => void;
}

const SECURITY_PASSWORD = "snkhan";

export default function PermissionModal({ command, onAllow, onAlwaysAllow, onDeny }: PermissionModalProps) {
  // For high-risk: step 1 = first confirm, step 2 = second confirm, step 3 = password
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when command changes
  useEffect(() => {
    setStep(1);
    setPassword("");
    setPasswordError(false);
    setShowPassword(false);
  }, [command]);

  if (!command) return null;

  const isHighRisk = command.risk === "high";

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

  const typeLabels: Record<string, string> = {
    open_app: "opening apps",
    file_op: "file operations",
    terminal: "terminal commands",
    system_info: "system info",
    play_youtube: "playing YouTube videos",
    send_whatsapp: "sending WhatsApp messages",
  };

  const config = riskConfig[command.risk];
  const RiskIcon = config.icon;

  const handleDeny = () => {
    setStep(1);
    setPassword("");
    setPasswordError(false);
    onDeny();
  };

  const handleAllow = () => {
    if (!isHighRisk) {
      onAllow();
      return;
    }
    // High risk: move to step 2
    if (step === 1) {
      setStep(2);
    }
  };

  const handleSecondConfirm = () => {
    // Move to step 3 (password)
    setStep(3);
    setPassword("");
    setPasswordError(false);
  };

  const handlePasswordSubmit = () => {
    if (password === SECURITY_PASSWORD) {
      setStep(1);
      setPassword("");
      onAllow();
    } else {
      setPasswordError(true);
      setPassword("");
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // --- STEP 1: Initial permission (all commands) ---
  if (step === 1) {
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
              <button onClick={handleDeny} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-4">
              <p className="text-gray-300 text-sm mb-4">
                Laila wants to execute a command on your system:
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <p className="text-white font-medium text-sm mb-2">{command.description}</p>
                <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                  <Terminal size={14} className="text-purple-400 flex-shrink-0" />
                  <code className="text-xs text-gray-300 font-mono break-all">{command.command}</code>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} mb-4`}>
                <RiskIcon size={16} className={config.color} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                {isHighRisk && (
                  <span className="text-xs text-red-300 ml-1">- This could damage your system</span>
                )}
              </div>

              {/* High risk warning */}
              {isHighRisk && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15 mb-4">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">
                    This is a <strong className="text-red-200">dangerous command</strong>. You will need to confirm <strong className="text-red-200">twice</strong> and enter your security password to proceed.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-5">
              <div className="flex gap-3">
                <button
                  onClick={handleDeny}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Deny
                </button>
                <button
                  onClick={handleAllow}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                    isHighRisk ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"
                  }`}
                >
                  {isHighRisk ? "I'm Sure" : "Allow Once"}
                </button>
              </div>
              {!isHighRisk && (
                <button
                  onClick={onAlwaysAllow}
                  className="w-full px-4 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-600/30 transition-colors"
                >
                  Always Allow {typeLabels[command.type]}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- STEP 2: Second confirmation (high risk only) ---
  if (step === 2) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md mx-4 bg-gray-900 border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Red warning header */}
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-300 font-bold text-base">Are you REALLY sure?</h3>
                  <p className="text-red-400/70 text-xs mt-0.5">Second confirmation required</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                This command can <strong className="text-red-300">permanently damage</strong> your system.
                Once executed, it <strong className="text-red-300">cannot be undone</strong>.
              </p>

              <div className="bg-black/30 border border-red-500/15 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal size={14} className="text-red-400" />
                  <span className="text-xs text-red-300 font-semibold uppercase tracking-wide">Command</span>
                </div>
                <code className="text-xs text-gray-300 font-mono break-all">{command.command}</code>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Lock size={12} />
                <span>Step 2 of 3 — Password will be required next</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={handleDeny}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSecondConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
              >
                Yes, I&apos;m Sure
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- STEP 3: Password entry (high risk only) ---
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
          transition={{ type: "spring", damping: 20 }}
        >
          {/* Header */}
          <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Lock size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Security Password</h3>
                <p className="text-gray-500 text-xs mt-0.5">Final step — Enter your password to proceed</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-gray-400 text-sm mb-5">
              Enter your security password to authorize this dangerous command.
            </p>

            {/* Password input */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter" && password) handlePasswordSubmit(); }}
                placeholder="Enter security password"
                autoFocus
                className={`w-full px-4 py-3 pr-12 text-sm rounded-xl border bg-black/30 text-gray-200 placeholder-gray-600 focus:outline-none transition-colors ${
                  passwordError
                    ? "border-red-500/50 focus:border-red-500/70 shake"
                    : "border-white/10 focus:border-purple-500/40"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {passwordError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-red-400 text-xs mb-4 flex items-center gap-1.5"
                >
                  <X size={12} />
                  Wrong password. Access denied.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Lock size={11} />
              <span>Step 3 of 3 — This is the final security check</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-5">
            <button
              onClick={handleDeny}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={!password}
              className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-bold transition-colors"
            >
              Authorize
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
