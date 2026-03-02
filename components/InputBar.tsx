"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { ArrowUp, Mic, MicOff } from "lucide-react";
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
  const [isFocused, setIsFocused] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && trimmed.length <= MAX_CHARS) { onSend(trimmed); setInput(""); }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); onMicStop?.(); return; }
    onMicStart?.();
    setTimeout(() => {
      const recognition = createSpeechRecognition(
        (text) => { onSend(text); onMicStop?.(); },
        () => { setIsListening(false); onMicStop?.(); },
        (error) => { console.error(error); setIsListening(false); onMicStop?.(); }
      );
      if (recognition) { recognitionRef.current = recognition; recognition.start(); setIsListening(true); }
      else { onMicStop?.(); }
    }, 300);
  };

  const canSend = input.trim() && !disabled && input.length <= MAX_CHARS;

  return (
    <div className="flex-shrink-0 px-4 sm:px-6 pb-2 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className="relative rounded-2xl transition-all duration-200"
          style={{
            background: "#ffffff",
            border: isListening ? "1.5px solid rgba(255,140,0,0.50)"
              : input.length > MAX_CHARS ? "1.5px solid #ef4444"
              : isFocused ? "1.5px solid rgba(255,140,0,0.45)"
              : "1.5px solid rgba(0,0,0,0.10)",
            boxShadow: isFocused || canSend
              ? "0 4px 24px rgba(255,140,0,0.10), 0 1px 6px rgba(0,0,0,0.06)"
              : "0 1px 6px rgba(0,0,0,0.06)",
          }}
        >
          <div className="px-4 pt-3 pb-1">
            {isListening ? (
              <div className="flex items-center justify-center gap-[3px] h-[40px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div key={i} className="w-[2.5px] rounded-full" style={{ background: "#ff8c00" }}
                    animate={{ height: [3, Math.random() * 20 + 6, 3] }}
                    transition={{ duration: 0.35 + Math.random() * 0.35, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }}
                  />
                ))}
                <span className="ml-3 text-[12px] font-medium animate-pulse" style={{ color: "#ff8c00" }}>Listening…</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Message Laila…"
                disabled={disabled}
                rows={1}
                className="w-full bg-transparent text-[14px] resize-none disabled:opacity-50 leading-relaxed"
                style={{ minHeight: "40px", maxHeight: "120px", outline: "none", border: "none", boxShadow: "none", color: "#111827" }}
              />
            )}
          </div>

          <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
            <div className="flex items-center gap-1">
              <motion.button onClick={toggleListening} disabled={disabled}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  color: isListening ? "#ff8c00" : "rgba(0,0,0,0.35)",
                  background: isListening ? "rgba(255,140,0,0.08)" : "transparent",
                  border: isListening ? "1px solid rgba(255,140,0,0.25)" : "1px solid transparent",
                }}
                animate={isListening ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                title={isListening ? "Stop" : "Voice input"}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </motion.button>
              {input.length === 0 && !isListening && (
                <span className="text-[11px] ml-1 hidden sm:inline" style={{ color: "rgba(0,0,0,0.28)" }}>
                  Enter to send · Shift+Enter for new line
                </span>
              )}
            </div>

            <motion.button onClick={handleSend} disabled={!canSend}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: canSend ? "linear-gradient(135deg, #ff8c00, #f97316)" : "rgba(0,0,0,0.06)",
                color: canSend ? "#ffffff" : "rgba(0,0,0,0.25)",
                boxShadow: canSend ? "0 2px 10px rgba(255,140,0,0.30)" : "none",
              }}
              whileTap={canSend ? { scale: 0.85 } : {}}
              whileHover={canSend ? { scale: 1.06 } : {}}
            >
              <ArrowUp size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {input.length > MAX_CHARS * 0.7 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex justify-end mt-1 px-1">
              <span className="text-[10px]" style={{ color: input.length > MAX_CHARS ? "#ef4444" : input.length > MAX_CHARS * 0.9 ? "#f59e0b" : "rgba(0,0,0,0.35)" }}>
                {input.length}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
