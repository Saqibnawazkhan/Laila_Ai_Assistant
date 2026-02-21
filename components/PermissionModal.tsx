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
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setStep(1);
    setPassword("");
    setPasswordError(false);
    setShowPassword(false);
  }, [command]);

  if (!command) return null;

  const isHighRisk = command.risk === "high";

  const riskConfig = {
    low: { icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "Low Risk" },
    medium: { icon: Shield, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Medium Risk" },
    high: { icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "High Risk" },
  };

  const typeLabels: Record<string, string> = {
    open_app: "opening apps", file_op: "file operations", terminal: "terminal commands",
    system_info: "system info", play_youtube: "playing YouTube videos", send_whatsapp: "sending WhatsApp messages",
  };

  const config = riskConfig[command.risk];
  const RiskIcon = config.icon;

  const handleDeny = () => { setStep(1); setPassword(""); setPasswordError(false); onDeny(); };
  const handleAllow = () => { if (!isHighRisk) { onAllow(); return; } if (step === 1) setStep(2); };
  const handleSecondConfirm = () => { setStep(3); setPassword(""); setPasswordError(false); };
  const handlePasswordSubmit = () => {
    if (password === SECURITY_PASSWORD) { setStep(1); setPassword(""); onAllow(); }
    else { setPasswordError(true); setPassword(""); setTimeout(() => setPasswordError(false), 2000); }
  };

  if (step === 1) {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: "var(--overlay-bg)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--background)", border: "1px solid var(--border)" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 20 }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent-soft)" }}
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Shield size={16} style={{ color: "var(--accent)" }} />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>Permission Request</h3>
                  <p className="text-[10px]" style={{ color: "var(--text-dim)" }}>Step 1{isHighRisk ? " of 3" : ""}</p>
                </div>
              </div>
              <button onClick={handleDeny} className="hover:bg-[var(--surface-hover)] w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div className="px-6 pb-4">
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Laila wants to execute a command on your system:</p>
              <div className="rounded-xl p-4 mb-4" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                <p className="font-medium text-sm mb-2" style={{ color: "var(--text-primary)" }}>{command.description}</p>
                <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--code-bg)" }}>
                  <Terminal size={14} className="text-indigo-400 flex-shrink-0" />
                  <code className="text-xs font-mono break-all" style={{ color: "var(--text-secondary)" }}>{command.command}</code>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bg} mb-4`}>
                <RiskIcon size={16} className={config.color} />
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                {isHighRisk && <span className="text-xs text-red-300 ml-1">- This could damage your system</span>}
              </div>
              {isHighRisk && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15 mb-4">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">This is a <strong className="text-red-200">dangerous command</strong>. You will need to confirm <strong className="text-red-200">twice</strong> and enter your security password to proceed.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 px-6 pb-5">
              <div className="flex gap-3">
                <button onClick={handleDeny} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Deny</button>
                <button onClick={handleAllow} className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${isHighRisk ? "bg-red-600 hover:bg-red-500" : "hover:opacity-90"}`} style={isHighRisk ? {} : { background: "var(--accent)" }}>{isHighRisk ? "I'm Sure" : "Allow Once"}</button>
              </div>
              {!isHighRisk && (
                <button onClick={onAlwaysAllow} className="w-full px-4 py-2.5 rounded-xl text-indigo-300 text-sm font-medium hover:bg-indigo-500/15 transition-colors" style={{ background: "var(--accent-soft)", border: "1px solid rgba(124, 92, 252, 0.2)" }}>Always Allow {typeLabels[command.type]}</button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (step === 2) {
    return (
      <AnimatePresence>
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: "var(--overlay-bg)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--background)", border: "1px solid rgba(239, 68, 68, 0.2)" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}>
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><AlertTriangle size={22} className="text-red-400" /></div>
                <div><h3 className="text-red-300 font-bold text-base">Are you REALLY sure?</h3><p className="text-red-400/70 text-xs mt-0.5">Second confirmation required</p></div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>This command can <strong className="text-red-300">permanently damage</strong> your system. Once executed, it <strong className="text-red-300">cannot be undone</strong>.</p>
              <div className="rounded-xl p-4 mb-5" style={{ background: "var(--code-bg)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                <div className="flex items-center gap-2 mb-2"><Terminal size={14} className="text-red-400" /><span className="text-xs text-red-300 font-semibold uppercase tracking-wide">Command</span></div>
                <code className="text-xs font-mono break-all" style={{ color: "var(--text-secondary)" }}>{command.command}</code>
              </div>
              <div className="flex items-center gap-2 text-xs mb-1" style={{ color: "var(--text-dim)" }}><Lock size={12} /><span>Step 2 of 3 — Password will be required next</span></div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={handleDeny} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={handleSecondConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors">Yes, I&apos;m Sure</button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: "var(--overlay-bg)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--background)", border: "1px solid var(--border)" }} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}>
          <div className="px-6 py-4" style={{ background: "var(--accent-soft)", borderBottom: "1px solid rgba(124, 92, 252, 0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-soft)" }}><Lock size={20} className="text-indigo-400" /></div>
              <div><h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Security Password</h3><p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Final step — Enter your password to proceed</p></div>
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Enter your security password to authorize this dangerous command.</p>
            <div className="relative mb-4">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }} onKeyDown={(e) => { if (e.key === "Enter" && password) handlePasswordSubmit(); }} placeholder="Enter security password" autoFocus className={`w-full px-4 py-3 pr-12 text-sm rounded-xl focus:outline-none transition-colors ${passwordError ? "shake" : ""}`} style={{ background: "var(--code-bg)", border: passwordError ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--border)", color: "var(--foreground)" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--text-muted)" }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <AnimatePresence>{passwordError && (<motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="text-red-400 text-xs mb-4 flex items-center gap-1.5"><X size={12} />Wrong password. Access denied.</motion.p>)}</AnimatePresence>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-dim)" }}><Lock size={11} /><span>Step 3 of 3 — This is the final security check</span></div>
          </div>
          <div className="flex gap-3 px-6 pb-5">
            <button onClick={handleDeny} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-hover)] transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={handlePasswordSubmit} disabled={!password} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors" style={{ background: !password ? "var(--toggle-off)" : "var(--accent)" }}>Authorize</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
