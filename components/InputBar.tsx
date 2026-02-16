"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { createSpeechRecognition } from "@/lib/speech";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export default function InputBar({ onSend, disabled, voiceEnabled, onToggleVoice }: InputBarProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput("");
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
      return;
    }

    const recognition = createSpeechRecognition(
      (text) => {
        // Auto-send the recognized text
        onSend(text);
      },
      () => {
        setIsListening(false);
      },
      (error) => {
        console.error(error);
        setIsListening(false);
      }
    );

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="border-t border-white/10 bg-black/40 backdrop-blur-xl p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {/* Voice toggle button */}
        <button
          onClick={onToggleVoice}
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            voiceEnabled
              ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
              : "bg-white/5 text-gray-500 border border-white/10"
          }`}
          title={voiceEnabled ? "Mute Laila's voice" : "Enable Laila's voice"}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Mic button */}
        <motion.button
          onClick={toggleListening}
          disabled={disabled}
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
            isListening
              ? "bg-red-500 text-white"
              : "bg-white/5 text-gray-400 border border-white/10 hover:text-purple-400"
          }`}
          animate={isListening ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          title={isListening ? "Stop listening" : "Speak to Laila"}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </motion.button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Message Laila..."}
            disabled={disabled || isListening}
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:opacity-50 flex items-center justify-center transition-colors"
        >
          <Send size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
}
