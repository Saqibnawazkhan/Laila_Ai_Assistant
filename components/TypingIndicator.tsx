"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const thinkingMessages = [
  "Thinking...",
  "Crafting a response...",
  "Processing...",
  "Almost there...",
  "Working on it...",
];

export default function TypingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mt-5"
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-black/10" style={{ background: "var(--logo-bg)" }}>
        <Sparkles size={14} style={{ color: "var(--logo-icon)" }} />
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-indigo-400">Laila</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={msgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {thinkingMessages[msgIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
