"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

const thinkingMessages = [
  "Thinking...",
  "Crafting a response...",
  "Processing...",
  "Almost there...",
  "Working on it...",
];

export default function TypingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mt-5"
    >
      {/* Animated avatar */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse-glow" style={{ background: "var(--logo-bg-solid)" }}>
        <Sparkles size={12} style={{ color: "var(--logo-icon)" }} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Laila</span>
          {elapsed > 2 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-0.5 text-[9px]"
              style={{ color: "var(--text-dim)" }}
            >
              <Zap size={8} />
              {elapsed}s
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {/* Wave dots */}
          <div className="flex gap-[4px] items-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-[6px] h-[6px] rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.25, 1, 0.25],
                  scale: [0.8, 1.3, 0.8],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: [0.45, 0, 0.55, 1],
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={msgIndex}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              transition={{ duration: 0.2 }}
              className="text-[12px]"
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
