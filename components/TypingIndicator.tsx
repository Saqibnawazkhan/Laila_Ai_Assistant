"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 mt-6"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "rgba(255,140,0,0.10)", border: "1.5px solid rgba(255,140,0,0.20)" }}
      >
        <Sparkles size={12} style={{ color: "#ff8c00" }} />
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold" style={{ color: "#ff8c00" }}>Laila</span>
          {elapsed > 2 && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px]" style={{ color: "rgba(0,0,0,0.35)" }}>
              {elapsed}s
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 0.15, 0.30].map((delay) => (
            <motion.span
              key={delay}
              className="w-2 h-2 rounded-full"
              style={{ background: "#ff8c00" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
