"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Volume2, VolumeX, Shield, Trash2, Settings, MessageSquare, Ear, Download, Gauge, Sun, Moon, Palette, ChevronRight } from "lucide-react";
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
    if (messages.length === 0) {
      showToast("No messages to export", "info");
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(messages, null, 2);
      filename = `laila-chat-${Date.now()}.json`;
      mimeType = "application/json";
    } else {
      content = messages
        .map((m) => {
          const time = m.timestamp ? new Date(m.timestamp).toLocaleString() : "";
          const role = m.role === "assistant" ? "Laila" : "You";
          return `[${time}] ${role}: ${m.content}`;
        })
        .join("\n\n");
      filename = `laila-chat-${Date.now()}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Chat exported as ${format.toUpperCase()}`, "success");
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
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm shadow-2xl flex flex-col"
            style={{ background: "var(--background)", borderRight: "1px solid var(--border)" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
                  <Settings size={14} style={{ color: "var(--accent)" }} />
                </div>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-[var(--surface-hover)] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Theme Toggle */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Palette size={12} style={{ color: "var(--text-dim)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Appearance</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:bg-[var(--surface-hover)]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme === "dark" ? "rgba(139,92,246,0.15)" : "rgba(245,158,11,0.15)" }}>
                      {theme === "dark" ? <Moon size={15} className="text-violet-400" /> : <Sun size={15} className="text-amber-500" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Tap to switch</p>
                    </div>
                  </div>
                  <div
                    className="w-10 h-[22px] rounded-full flex items-center transition-colors"
                    style={{
                      background: theme === "light" ? "var(--accent)" : "var(--toggle-off)",
                      justifyContent: theme === "light" ? "flex-end" : "flex-start",
                    }}
                  >
                    <motion.div
                      className="w-[18px] h-[18px] bg-white rounded-full mx-0.5"
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              </div>

              {/* Voice Section */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Volume2 size={12} style={{ color: "var(--text-dim)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Voice</span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={onToggleVoice}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:bg-[var(--surface-hover)]"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: voiceEnabled ? "rgba(139,92,246,0.15)" : "var(--surface-hover)" }}>
                        {voiceEnabled ? <Volume2 size={15} style={{ color: "var(--accent)" }} /> : <VolumeX size={15} style={{ color: "var(--text-muted)" }} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Voice Responses</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{voiceEnabled ? "Enabled" : "Muted"}</p>
                      </div>
                    </div>
                    <div
                      className="w-10 h-[22px] rounded-full flex items-center transition-colors"
                      style={{
                        background: voiceEnabled ? "var(--accent)" : "var(--toggle-off)",
                        justifyContent: voiceEnabled ? "flex-end" : "flex-start",
                      }}
                    >
                      <motion.div
                        className="w-[18px] h-[18px] bg-white rounded-full mx-0.5"
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </button>

                  {voiceEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl px-4 py-3"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge size={13} style={{ color: "var(--accent)" }} />
                        <p className="text-[12px] font-medium" style={{ color: "var(--foreground)" }}>Speed</p>
                        <span className="ml-auto text-[11px] font-mono" style={{ color: "var(--accent)" }}>{voiceSpeed.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={voiceSpeed}
                        onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-violet-500"
                        style={{ background: "var(--border)" }}
                      />
                      <div className="flex justify-between text-[9px] mt-1" style={{ color: "var(--text-dim)" }}>
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </motion.div>
                  )}

                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                        <Ear size={15} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Wake Word</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Say &quot;Laila&quot; to activate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Shield size={12} style={{ color: "var(--text-dim)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Permissions</span>
                </div>
                <div className="space-y-1.5">
                  {allowedTypes.size === 0 ? (
                    <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No permissions granted yet</p>
                    </div>
                  ) : (
                    <>
                      {Array.from(allowedTypes).map((type) => (
                        <div
                          key={type}
                          className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        >
                          <Shield size={13} className="text-emerald-400" />
                          <p className="text-[12px] flex-1" style={{ color: "var(--foreground)" }}>{typeLabels[type] || type}</p>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      ))}
                      <button
                        onClick={onResetPermissions}
                        className="w-full flex items-center justify-center gap-2 text-red-400 text-[12px] py-2 hover:text-red-300 transition-colors"
                      >
                        <Shield size={12} />
                        Reset Permissions
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Data */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <Download size={12} style={{ color: "var(--text-dim)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Data</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportChat("txt")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] transition-all hover:bg-[var(--surface-hover)]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      <Download size={12} />
                      .txt
                    </button>
                    <button
                      onClick={() => exportChat("json")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[12px] transition-all hover:bg-[var(--surface-hover)]"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                    >
                      <Download size={12} />
                      .json
                    </button>
                  </div>
                  <button
                    onClick={onClearChats}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-red-500/5 transition-colors group"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <Trash2 size={14} style={{ color: "var(--text-muted)" }} className="group-hover:text-red-400" />
                    <div className="text-left">
                      <p className="text-[12px] group-hover:text-red-300 transition-colors" style={{ color: "var(--foreground)" }}>Clear History</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Delete all conversations</p>
                    </div>
                    <ChevronRight size={14} className="ml-auto" style={{ color: "var(--text-dim)" }} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              {messages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <MessageSquare size={12} style={{ color: "var(--text-dim)" }} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Stats</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Messages", value: messages.length },
                      { label: "You", value: messages.filter((m) => m.role === "user").length },
                      { label: "Laila", value: messages.filter((m) => m.role === "assistant").length },
                      { label: "Words", value: messages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0) },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl px-3 py-2.5 text-center"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      >
                        <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>{stat.value}</p>
                        <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About */}
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[13px] font-medium" style={{ color: "var(--foreground)" }}>Laila AI</p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>v2.0</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Powered by Groq &middot; Built by Saqib Nawaz Khan
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
