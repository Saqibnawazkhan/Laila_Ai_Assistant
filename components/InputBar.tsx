"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Mic, MicOff, ArrowUp } from "lucide-react";
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

export default function InputBar({ onSend, disabled, onMicStart, onMicStop }: InputBarProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
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

  const canSend = input.trim() && !disabled && input.length <= MAX_CHARS;

  return (
    <div className="flex-shrink-0 safe-area-bottom px-3 sm:px-6 pb-2 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: isFocused ? "rgba(0,255,136,0.03)" : "rgba(0,0,0,0.6)",
            border: isListening
              ? "1px solid rgba(0, 229, 255, 0.5)"
              : input.length > MAX_CHARS
                ? "1px solid rgba(255, 34, 68, 0.5)"
                : isFocused
                  ? "1px solid rgba(0, 255, 136, 0.6)"
                  : "1px solid rgba(0, 255, 136, 0.12)",
            boxShadow: canSend
              ? "0 0 16px rgba(0,255,136,0.20), 0 0 0 1px rgba(0,255,136,0.10)"
              : isFocused
                ? "0 0 12px rgba(0,255,136,0.12), 0 0 0 2px rgba(0,255,136,0.06)"
                : "none",
          }}
        >
          {/* Textarea / Listening */}
          <div className="px-4 pt-3 pb-1">
            {/* Terminal prompt prefix */}
            {!isListening && (
              <div className="flex items-start gap-2">
                <span className="font-mono text-[14px] mt-0.5 select-none flex-shrink-0" style={{ color: "#00ff88", textShadow: "0 0 6px rgba(0,255,136,0.5)" }}>&gt;_</span>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="enter command..."
                  disabled={disabled}
                  rows={1}
                  className="w-full bg-transparent text-[14px] resize-none disabled:opacity-50 leading-relaxed font-mono"
                  style={{
                    minHeight: "40px",
                    maxHeight: "140px",
                    outline: "none",
                    border: "none",
                    boxShadow: "none",
                    color: "var(--foreground)",
                    caretColor: "var(--caret)",
                  }}
                />
              </div>
            )}
            {isListening ? (
              <div className="flex items-center justify-center gap-[3px] h-[40px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full"
                    style={{ background: "var(--error)" }}
                    animate={{ height: [3, Math.random() * 20 + 6, 3] }}
                    transition={{
                      duration: 0.35 + Math.random() * 0.35,
                      repeat: Infinity,
                      delay: i * 0.04,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                <span className="ml-3 text-xs animate-pulse" style={{ color: "var(--error)" }}>Listening...</span>
              </div>
            ) : null}
          </div>

          {/* Bottom action row */}
          <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
            <div className="flex items-center gap-1">
              {/* Mic */}
              <motion.button
                onClick={toggleListening}
                disabled={disabled}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                style={{
                  color: isListening ? "var(--error)" : "var(--icon-secondary)",
                  background: isListening ? "rgba(239, 68, 68, 0.1)" : "transparent",
                }}
                animate={isListening ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                title={isListening ? "Stop" : "Voice input"}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </motion.button>

              {/* Hints */}
              {input.length === 0 && !isListening && (
                <span className="text-[10px] ml-1 hidden sm:inline" style={{ color: "var(--text-dim)" }}>
                  Press Enter to send, Shift+Enter for new line
                </span>
              )}
            </div>

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: canSend ? "linear-gradient(135deg, #00ff88, #00e5ff)" : "rgba(0,255,136,0.05)",
                color: canSend ? "#000000" : "#1a3d2e",
                boxShadow: canSend ? "0 0 16px rgba(0,255,136,0.4), 0 2px 8px rgba(0,0,0,0.4)" : "none",
                border: canSend ? "none" : "1px solid rgba(0,255,136,0.10)",
              }}
              whileTap={canSend ? { scale: 0.82 } : {}}
              whileHover={canSend ? { scale: 1.08 } : {}}
            >
              <AnimatePresence mode="wait">
                {isSending ? (
                  <motion.div
                    key="sending"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  />
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0, y: -8, opacity: 0 }}
                  >
                    <ArrowUp size={16} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Character counter */}
        <AnimatePresence>
          {input.length > MAX_CHARS * 0.7 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-end mt-1 px-1"
            >
              <span
                className="text-[10px] font-mono"
                style={{ color: input.length > MAX_CHARS ? "var(--error)" : input.length > MAX_CHARS * 0.9 ? "var(--warning)" : "var(--text-dim)" }}
              >
                {input.length}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
