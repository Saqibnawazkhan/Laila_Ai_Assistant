"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, Globe, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createSpeechRecognition } from "@/lib/speech";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onMicStart?: () => void;
  onMicStop?: () => void;
}

const MAX_CHARS = 2000;

export default function InputBar({ onSend, disabled, voiceEnabled, onToggleVoice, onMicStart, onMicStop }: InputBarProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && trimmed.length <= MAX_CHARS) {
      setIsSending(true);
      onSend(trimmed);
      setInput("");
      setTimeout(() => setIsSending(false), 300);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      onMicStop?.();
      return;
    }

    onMicStart?.();

    setTimeout(() => {
      const recognition = createSpeechRecognition(
        (text) => {
          onSend(text);
          onMicStop?.();
        },
        () => {
          setIsListening(false);
          onMicStop?.();
        },
        (error) => {
          console.error(error);
          setIsListening(false);
          onMicStop?.();
        }
      );

      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } else {
        onMicStop?.();
      }
    }, 300);
  };

  const charCount = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="flex-shrink-0 safe-area-bottom px-4 sm:px-6 pb-1 pt-3">
      <div className="max-w-3xl mx-auto">
        {/* Glass input container */}
        <div
          className={`flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all ${
            isOverLimit
              ? "border-red-500/30"
              : isListening
                ? "border-red-400/20"
                : "focus-within:border-indigo-500/20"
          }`}
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Left icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onToggleVoice}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
              style={{ color: voiceEnabled ? "#7c5cfc" : "#4a4f66" }}
              title={voiceEnabled ? "Mute Laila's voice" : "Enable Laila's voice"}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
              style={{ color: "#4a4f66" }}
              title="Multilingual support"
            >
              <Globe size={16} />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
              style={{ color: "#4a4f66" }}
              title="Chat"
            >
              <MessageCircle size={16} />
            </button>
          </div>

          {/* Input area */}
          <div className="flex-1 min-w-0">
            {isListening ? (
              <div className="flex items-center justify-center gap-[3px] h-9">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2px] rounded-full"
                    style={{ background: "#ef4444" }}
                    animate={{ height: [3, Math.random() * 16 + 5, 3] }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                <span className="ml-3 text-xs text-red-400 animate-pulse">Listening...</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={disabled}
                rows={1}
                className="w-full bg-transparent text-sm text-white placeholder-[#6b7194] resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
                style={{ minHeight: "36px", maxHeight: "120px" }}
              />
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Mic */}
            <motion.button
              onClick={toggleListening}
              disabled={disabled}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
              style={{
                color: isListening ? "#ef4444" : "#8b8fa3",
                background: isListening ? "rgba(239, 68, 68, 0.1)" : "transparent",
              }}
              animate={isListening ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              title={isListening ? "Stop listening" : "Speak to Laila"}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
            </motion.button>

            {/* Send */}
            <motion.button
              onClick={handleSend}
              disabled={disabled || !input.trim() || isOverLimit}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: input.trim() && !disabled && !isOverLimit ? "#7c5cfc" : "rgba(255, 255, 255, 0.04)",
                color: input.trim() && !disabled && !isOverLimit ? "#ffffff" : "#4a4f66",
              }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isSending ? (
                  <motion.div
                    key="sending"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, y: -8 }}
                  >
                    <Send size={14} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Char counter */}
        <AnimatePresence>
          {charCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between mt-1.5 px-2"
            >
              <span className="text-[10px]" style={{ color: "#4a4f66" }}>Shift+Enter for new line</span>
              <span
                className="text-[10px]"
                style={{ color: isOverLimit ? "#ef4444" : charCount > MAX_CHARS * 0.8 ? "#eab308" : "#4a4f66" }}
              >
                {charCount}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
