"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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
    <div className="border-t border-white/[0.06] bg-gray-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 safe-area-bottom flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        {/* Main input container */}
        <div className={`relative flex items-end gap-2 bg-white/[0.04] border rounded-2xl px-3 py-2 transition-colors ${
          isOverLimit ? "border-red-500/30" : "border-white/[0.08] focus-within:border-purple-500/30"
        }`}>
          {/* Left actions */}
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            <button
              onClick={onToggleVoice}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                voiceEnabled ? "text-purple-400 hover:bg-purple-500/10" : "text-gray-600 hover:bg-white/5"
              }`}
              title={voiceEnabled ? "Mute Laila's voice" : "Enable Laila's voice"}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          {/* Text input / Waveform */}
          <div className="flex-1 min-w-0">
            {isListening ? (
              <div className="flex items-center justify-center gap-[3px] py-2" style={{ minHeight: "36px" }}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[2.5px] rounded-full bg-red-400"
                    animate={{ height: [4, Math.random() * 18 + 6, 4] }}
                    transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                  />
                ))}
                <span className="ml-3 text-xs text-red-300 animate-pulse">Listening...</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message to Laila..."
                disabled={disabled}
                rows={1}
                className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none disabled:opacity-50 py-1.5"
                style={{ minHeight: "36px", maxHeight: "120px" }}
              />
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            {/* Mic button */}
            <motion.button
              onClick={toggleListening}
              disabled={disabled}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                isListening ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-purple-400 hover:bg-white/5"
              }`}
              animate={isListening ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              title={isListening ? "Stop listening" : "Speak to Laila"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </motion.button>

            {/* Send button */}
            <motion.button
              onClick={handleSend}
              disabled={disabled || !input.trim() || isOverLimit}
              className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-white/[0.06] disabled:text-gray-600 flex items-center justify-center transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isSending ? (
                  <motion.div key="sending" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <motion.div key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, y: -10 }}>
                    <Send size={14} className={input.trim() && !disabled ? "text-white" : "text-gray-600"} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Bottom info row */}
        <AnimatePresence>
          {charCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between mt-1.5 px-1"
            >
              <span className="text-[10px] text-gray-600">
                Shift+Enter for new line
              </span>
              <span className={`text-[10px] ${isOverLimit ? "text-red-400" : charCount > MAX_CHARS * 0.8 ? "text-yellow-500" : "text-gray-600"}`}>
                {charCount}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
