"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="relative bg-gradient-to-r from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-2xl px-4 py-3 overflow-hidden">
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <span className="text-xs font-semibold text-purple-400 block mb-1.5">
          Laila is thinking...
        </span>
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "rgb(192, 132, 252)" }}
              animate={{
                y: [0, -8, 0],
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
