"use client";

import { motion } from "framer-motion";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isLaila = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isLaila ? "justify-start" : "justify-end"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isLaila
            ? "bg-gradient-to-r from-purple-600/20 to-violet-600/20 border border-purple-500/30 text-gray-100"
            : "bg-white/10 border border-white/10 text-gray-100"
        }`}
      >
        {isLaila && (
          <span className="text-xs font-semibold text-purple-400 block mb-1">
            Laila
          </span>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}
