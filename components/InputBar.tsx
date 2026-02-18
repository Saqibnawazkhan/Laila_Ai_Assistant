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

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  // Focus textarea on mount
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

    // Pause wake word listener before starting mic (Chrome allows only one SpeechRecognition)
    onMicStart?.();

    // Small delay to let wake word listener fully stop
    setTimeout(() => {
      const recognition = createSpeechRecognition(
        (text) => {
          // Auto-send the recognized text
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
  const charRatio = charCount / MAX_CHARS;

  return (
    <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl p-2 sm:p-4 safe-area-bottom">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Voice toggle button */}
          <button
            onClick={onToggleVoice}
            className={`flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors ${
              voiceEnabled
                ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                : "bg-white/5 text-gray-500 border border-white/10"
            }`}
            title={voiceEnabled ? "Mute Laila's voice" : "Enable Laila's voice"}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Mic button */}
          <motion.button
            onClick={toggleListening}
            disabled={disabled}
            className={`flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
              isListening
                ? "bg-red-500 text-white"
                : "bg-white/5 text-gray-400 border border-white/10 hover:text-purple-400"
            }`}
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            title={isListening ? "Stop listening" : "Speak to Laila"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Message Laila..."}
              disabled={disabled || isListening}
              rows={1}
              className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-colors ${
                isOverLimit
                  ? "border-red-500/50 focus:border-red-500/50"
                  : "border-white/10 focus:border-purple-500/50"
              }`}
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isOverLimit}
            className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:opacity-50 flex items-center justify-center transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isSending ? (
                <motion.div
                  key="sending"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                />
              ) : (
                <motion.div
                  key="send"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, y: -10 }}
                >
                  <Send size={16} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Character count - shows when typing */}
        <AnimatePresence>
          {charCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between mt-1 px-1"
            >
              <span className="text-[10px] text-gray-600">
                Shift+Enter for new line
              </span>
              <span className={`text-[10px] ${isOverLimit ? "text-red-400" : charRatio > 0.8 ? "text-yellow-500" : "text-gray-600"}`}>
                {charCount}/{MAX_CHARS}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
