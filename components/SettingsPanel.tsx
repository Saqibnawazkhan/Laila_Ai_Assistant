"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Shield, Trash2, Settings, MessageSquare } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  allowedTypes: Set<string>;
  onResetPermissions: () => void;
  onClearChats: () => void;
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
}: SettingsPanelProps) {
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
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gray-900 border-r border-white/10 shadow-2xl flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="text-purple-400" size={20} />
                <h2 className="text-white font-semibold">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Voice Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Voice
                </h3>
                <button
                  onClick={onToggleVoice}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {voiceEnabled ? (
                      <Volume2 size={18} className="text-purple-400" />
                    ) : (
                      <VolumeX size={18} className="text-gray-500" />
                    )}
                    <div className="text-left">
                      <p className="text-sm text-gray-200">Laila&apos;s Voice</p>
                      <p className="text-xs text-gray-500">
                        {voiceEnabled ? "Laila will speak responses aloud" : "Voice responses are muted"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full flex items-center transition-colors ${
                      voiceEnabled ? "bg-purple-600 justify-end" : "bg-gray-700 justify-start"
                    }`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full mx-1"
                      layout
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </button>
              </div>

              {/* Permissions Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Permissions
                </h3>
                <div className="space-y-2">
                  {allowedTypes.size === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-gray-500" />
                        <p className="text-sm text-gray-500">No permissions granted yet</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {Array.from(allowedTypes).map((type) => (
                        <div
                          key={type}
                          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                        >
                          <Shield size={16} className="text-green-400" />
                          <p className="text-sm text-gray-200">{typeLabels[type] || type}</p>
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Data
                </h3>
                <button
                  onClick={onClearChats}
                  className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-red-500/10 hover:border-red-500/30 transition-colors group"
                >
                  <Trash2 size={16} className="text-gray-500 group-hover:text-red-400" />
                  <div className="text-left">
                    <p className="text-sm text-gray-200 group-hover:text-red-300">Clear Chat History</p>
                    <p className="text-xs text-gray-500">Delete all saved conversations</p>
                  </div>
                </button>
              </div>

              {/* About Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  About
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare size={16} className="text-purple-400" />
                    <p className="text-sm text-gray-200 font-medium">Laila AI Assistant</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Powered by Groq (Llama 3.3 70B) with voice support, system commands, and task management.
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
