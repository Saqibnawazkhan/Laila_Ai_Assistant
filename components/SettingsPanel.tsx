"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, Volume2, VolumeX, Shield, Trash2, Settings, MessageSquare, Ear, Download, Gauge } from "lucide-react";
import { showToast } from "./Toast";
import { getSpeechRate, setSpeechRate } from "@/lib/speech";

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
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm border-r border-white/[0.08] shadow-2xl flex flex-col"
            style={{ background: "#1a1f2e" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Settings className="text-indigo-400" size={20} />
                <h2 className="text-white font-semibold">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="hover:bg-white/[0.06] w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#6b7194" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Voice Section */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                  Voice
                </h3>
                <button
                  onClick={onToggleVoice}
                  className="w-full flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <div className="flex items-center gap-3">
                    {voiceEnabled ? (
                      <Volume2 size={18} className="text-indigo-400" />
                    ) : (
                      <VolumeX size={18} style={{ color: "#6b7194" }} />
                    )}
                    <div className="text-left">
                      <p className="text-sm" style={{ color: "#e8eaf0" }}>Laila&apos;s Voice</p>
                      <p className="text-xs" style={{ color: "#6b7194" }}>
                        {voiceEnabled ? "Laila will speak responses aloud" : "Voice responses are muted"}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full flex items-center transition-colors"
                    style={{
                      background: voiceEnabled ? "#7c5cfc" : "#2a3042",
                      justifyContent: voiceEnabled ? "flex-end" : "flex-start",
                    }}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full mx-1"
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              </div>

              {/* Voice Speed */}
              {voiceEnabled && (
                <div
                  className="rounded-xl px-4 py-3 mt-2"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Gauge size={16} className="text-indigo-400" />
                    <p className="text-sm" style={{ color: "#e8eaf0" }}>Voice Speed</p>
                    <span className="ml-auto text-xs text-indigo-400 font-mono">{voiceSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                    style={{ background: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: "#4a4f66" }}>
                    <span>Slow</span>
                    <span>Normal</span>
                    <span>Fast</span>
                  </div>
                </div>
              )}

              {/* Wake Word Info */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                  Wake Word
                </h3>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <div className="flex items-center gap-3">
                    <Ear size={18} className="text-indigo-400" />
                    <div className="text-left">
                      <p className="text-sm" style={{ color: "#e8eaf0" }}>Say &quot;Laila&quot;</p>
                      <p className="text-xs" style={{ color: "#6b7194" }}>
                        Laila is always listening for her name. Say &quot;Laila stop talking&quot; to silence her.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                  Permissions
                </h3>
                <div className="space-y-2">
                  {allowedTypes.size === 0 ? (
                    <div
                      className="rounded-xl px-4 py-3"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={16} style={{ color: "#6b7194" }} />
                        <p className="text-sm" style={{ color: "#6b7194" }}>No permissions granted yet</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {Array.from(allowedTypes).map((type) => (
                        <div
                          key={type}
                          className="flex items-center gap-3 rounded-xl px-4 py-3"
                          style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                        >
                          <Shield size={16} className="text-green-400" />
                          <p className="text-sm" style={{ color: "#e8eaf0" }}>{typeLabels[type] || type}</p>
                          <span className="ml-auto text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                            Allowed
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={onResetPermissions}
                        className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-2 hover:text-red-300 transition-colors"
                      >
                        <Shield size={14} />
                        Reset All Permissions
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Data Section */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                  Data
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportChat("txt")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors text-sm"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#9499b3" }}
                    >
                      <Download size={14} />
                      Export .txt
                    </button>
                    <button
                      onClick={() => exportChat("json")}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors text-sm"
                      style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", color: "#9499b3" }}
                    >
                      <Download size={14} />
                      Export .json
                    </button>
                  </div>
                  <button
                    onClick={onClearChats}
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-red-500/10 hover:border-red-500/30 transition-colors group"
                    style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                  >
                    <Trash2 size={16} style={{ color: "#6b7194" }} className="group-hover:text-red-400" />
                    <div className="text-left">
                      <p className="text-sm group-hover:text-red-300" style={{ color: "#e8eaf0" }}>Clear Chat History</p>
                      <p className="text-xs" style={{ color: "#6b7194" }}>Delete all saved conversations</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chat Statistics */}
              {messages.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Messages", value: messages.length },
                      { label: "Your Messages", value: messages.filter((m) => m.role === "user").length },
                      { label: "Laila Replies", value: messages.filter((m) => m.role === "assistant").length },
                      { label: "Total Words", value: messages.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0) },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl px-3 py-2.5 text-center"
                        style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                      >
                        <p className="text-lg font-bold text-indigo-400">{stat.value}</p>
                        <p className="text-[10px]" style={{ color: "#6b7194" }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* About Section */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: "#4a4f66" }}>
                  About
                </h3>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <p className="text-sm font-medium" style={{ color: "#e8eaf0" }}>Laila AI Assistant</p>
                    <span className="ml-auto text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">v2.0</span>
                  </div>
                  <p className="text-xs" style={{ color: "#6b7194" }}>
                    Powered by Groq (Llama 3.3 70B) with voice support, system commands, task management, and 50+ features.
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "#4a4f66" }}>
                    Built by Saqib Nawaz Khan
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
