"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Volume2, VolumeX, Shield, Trash2, MessageSquare, Ear, Download, Gauge, Sun, Moon, Palette, ChevronRight, Sparkles } from "lucide-react";
import { showToast } from "./Toast";
import { getSpeechRate, setSpeechRate } from "@/lib/speech";
import { useTheme } from "@/lib/theme";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  allowedTypes: Set<string>;
  onResetPermissions: () => void;
  onClearChats: () => void;
  messages?: { role: string; content: string; timestamp?: string }[];
}

const typeLabels: Record<string, string> = {
  open_app: "Opening Apps",
  file_op: "File Operations",
  terminal: "Terminal Commands",
  system_info: "System Info",
  play_youtube: "YouTube Playback",
  send_whatsapp: "WhatsApp Messages",
};

export default function SettingsPanel({
  isOpen,
  onClose,
  voiceEnabled,
  onToggleVoice,
  allowedTypes,
  onResetPermissions,
  onClearChats,
  messages = [],
}: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme();
  const [voiceSpeed, setVoiceSpeed] = useState(getSpeechRate());

  const handleSpeedChange = (val: number) => {
    setVoiceSpeed(val);
    setSpeechRate(val);
  };

  const exportChat = (format: "txt" | "json") => {
    if (messages.length === 0) { showToast("No messages to export", "info"); return; }
    let content: string;
    let filename: string;
    let mimeType: string;
    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      filename = `laila-chat-${Date.now()}.json`;
      mimeType = "application/json";
    } else {
      content = messages.map((m) => {
        const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
        return `[${time}] ${m.role === "assistant" ? "Laila" : "You"}: ${m.content}`;
      }).join("\n\n");
      filename = `laila-chat-${Date.now()}.txt`;
      mimeType = "text/plain";
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as ${format.toUpperCase()}`, "success");
  };

  const Section = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-3 px-1">
      <Icon size={13} style={{ color: "rgba(0,0,0,0.30)" }} />
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)" }}>{label}</span>
    </div>
  );

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
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-[320px] flex flex-col"
            style={{
              background: "#ffffff",
              borderRight: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "8px 0 32px rgba(0,0,0,0.10)",
            }}
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,140,0,0.12)" }}>
                  <Sparkles size={14} style={{ color: "#ff8c00" }} />
                </div>
                <span className="text-[15px] font-semibold" style={{ color: "#111827" }}>Settings</span>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color: "rgba(0,0,0,0.40)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Appearance */}
              <div>
                <Section label="Appearance" icon={Palette} />
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all hover:bg-gray-50"
                  style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme === "dark" ? "#1f2937" : "#fef3c7" }}>
                      {theme === "dark" ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium" style={{ color: "#111827" }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                      <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.40)" }}>Click to switch</p>
                    </div>
                  </div>
                  <div className="w-10 h-[22px] rounded-full flex items-center transition-all" style={{ background: theme === "light" ? "#ff8c00" : "rgba(0,0,0,0.15)", justifyContent: theme === "light" ? "flex-end" : "flex-start" }}>
                    <motion.div className="w-[18px] h-[18px] bg-white rounded-full mx-0.5 shadow-sm" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                  </div>
                </button>
              </div>

              {/* Voice */}
              <div>
                <Section label="Voice" icon={Volume2} />
                <div className="space-y-2">
                  <button
                    onClick={onToggleVoice}
                    className="w-full flex items-center justify-between rounded-2xl px-4 py-3 transition-all hover:bg-gray-50"
                    style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: voiceEnabled ? "rgba(255,140,0,0.12)" : "rgba(0,0,0,0.05)" }}>
                        {voiceEnabled ? <Volume2 size={15} style={{ color: "#ff8c00" }} /> : <VolumeX size={15} style={{ color: "rgba(0,0,0,0.35)" }} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-medium" style={{ color: "#111827" }}>Voice Responses</p>
                        <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.40)" }}>{voiceEnabled ? "Enabled" : "Muted"}</p>
                      </div>
                    </div>
                    <div className="w-10 h-[22px] rounded-full flex items-center transition-all" style={{ background: voiceEnabled ? "#ff8c00" : "rgba(0,0,0,0.12)", justifyContent: voiceEnabled ? "flex-end" : "flex-start" }}>
                      <motion.div className="w-[18px] h-[18px] bg-white rounded-full mx-0.5 shadow-sm" layout transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                    </div>
                  </button>

                  {voiceEnabled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="rounded-2xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}
                    >
                      <div className="flex items-center gap-2 mb-2.5">
                        <Gauge size={13} style={{ color: "#ff8c00" }} />
                        <p className="text-[12px] font-medium" style={{ color: "#111827" }}>Speed</p>
                        <span className="ml-auto text-[12px] font-semibold" style={{ color: "#ff8c00" }}>{voiceSpeed.toFixed(1)}x</span>
                      </div>
                      <input type="range" min="0.5" max="2.0" step="0.1" value={voiceSpeed} onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: "#ff8c00" }} />
                      <div className="flex justify-between text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.30)" }}>
                        <span>0.5x Slow</span><span>2.0x Fast</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="rounded-2xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,140,0,0.10)" }}>
                        <Ear size={15} style={{ color: "#ff8c00" }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "#111827" }}>Wake Word</p>
                        <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.40)" }}>Say &quot;Laila&quot; to activate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <Section label="Permissions" icon={Shield} />
                <div className="space-y-1.5">
                  {allowedTypes.size === 0 ? (
                    <div className="rounded-2xl px-4 py-3" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <p className="text-[12px]" style={{ color: "rgba(0,0,0,0.40)" }}>No permissions granted yet</p>
                    </div>
                  ) : (
                    <>
                      {Array.from(allowedTypes).map((type) => (
                        <div key={type} className="flex items-center gap-3 rounded-2xl px-4 py-2.5" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[12px] flex-1" style={{ color: "#111827" }}>{typeLabels[type] || type}</p>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Active</span>
                        </div>
                      ))}
                      <button onClick={onResetPermissions} className="w-full text-[12px] py-2 text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5">
                        <Shield size={12} /> Reset Permissions
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Data */}
              <div>
                <Section label="Data" icon={Download} />
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    {(["txt", "json"] as const).map((fmt) => (
                      <button key={fmt} onClick={() => exportChat(fmt)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-medium transition-all hover:bg-gray-100"
                        style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.60)" }}
                      >
                        <Download size={12} /> .{fmt}
                      </button>
                    ))}
                  </div>
                  <button onClick={onClearChats}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all hover:bg-red-50 group"
                    style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}
                  >
                    <Trash2 size={14} className="text-red-400 group-hover:text-red-500 transition-colors" />
                    <div className="text-left">
                      <p className="text-[13px] font-medium group-hover:text-red-600 transition-colors" style={{ color: "#111827" }}>Clear History</p>
                      <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.40)" }}>Delete all conversations</p>
                    </div>
                    <ChevronRight size={14} className="ml-auto" style={{ color: "rgba(0,0,0,0.25)" }} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              {messages.length > 0 && (
                <div>
                  <Section label="Stats" icon={MessageSquare} />
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Messages", value: messages.length },
                      { label: "You", value: messages.filter((m) => m.role === "user").length },
                      { label: "Laila", value: messages.filter((m) => m.role === "assistant").length },
                      { label: "Words", value: messages.reduce((a, m) => a + m.content.split(/\s+/).length, 0) },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl px-3 py-3 text-center" style={{ background: "#f9fafb", border: "1px solid rgba(0,0,0,0.07)" }}>
                        <p className="text-xl font-bold" style={{ color: "#ff8c00" }}>{s.value}</p>
                        <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(0,0,0,0.40)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(255,140,0,0.06)", border: "1px solid rgba(255,140,0,0.15)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-semibold" style={{ color: "#111827" }}>Laila AI</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,140,0,0.15)", color: "#ff8c00" }}>v2.0</span>
                </div>
                <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.45)" }}>Powered by Groq · Built by Saqib Nawaz Khan</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
