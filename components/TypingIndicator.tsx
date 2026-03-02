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
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse-glow"
        style={{
          background: "rgba(255,140,0,0.12)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,140,0,0.22)",
        }}
      >
        <Sparkles size={12} style={{ color: "#ff8c00" }} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5 font-mono">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#ff8c00", textShadow: "0 0 6px rgba(255,140,0,0.4)" }}>LAILA &gt;</span>
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
        <div className="flex items-center gap-2 font-mono text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          <span>// processing</span>
          <motion.span
            style={{ color: "#ff8c00", textShadow: "0 0 6px rgba(255,140,0,0.5)" }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >_</motion.span>
          {elapsed > 2 && (
            <span className="text-[10px]" style={{ color: "rgba(255,140,0,0.40)" }}>[{elapsed}s]</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
