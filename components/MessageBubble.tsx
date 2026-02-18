"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, SmilePlus } from "lucide-react";
import { showToast } from "./Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isLatest?: boolean;
  isGrouped?: boolean;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👀"];

export default function MessageBubble({ role, content, timestamp, isLatest, isGrouped }: MessageBubbleProps) {
  const isLaila = role === "assistant";
  const [displayedText, setDisplayedText] = useState(isLatest && isLaila ? "" : content);
  const [isTyping, setIsTyping] = useState(isLatest && isLaila);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reactions, setReactions] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const charIndex = useRef(0);

  // Typewriter effect for latest Laila message
  useEffect(() => {
    if (!isLatest || !isLaila) {
      setDisplayedText(content);
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    charIndex.current = 0;
    setIsTyping(true);

    const speed = Math.max(8, 30 - content.length * 0.05);
    const interval = setInterval(() => {
      charIndex.current++;
      setDisplayedText(content.slice(0, charIndex.current));
      if (charIndex.current >= content.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, isLatest, isLaila]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReaction = (emoji: string) => {
    setReactions((prev) =>
      prev.includes(emoji) ? prev.filter((r) => r !== emoji) : [...prev, emoji]
    );
    setShowReactionPicker(false);
  };

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isLaila ? "justify-start" : "justify-end"} ${isGrouped ? "mb-1" : "mb-4"} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowReactionPicker(false); }}
    >
      <div
        className="relative max-w-[80%]"
        onDoubleClick={() => {
          navigator.clipboard.writeText(content);
          showToast("Message copied!", "success");
        }}
        title="Double-click to copy"
      >
        <div
          className={`rounded-2xl px-4 py-3 ${
            isLaila
              ? "bg-gradient-to-r from-purple-600/20 to-violet-600/20 border border-purple-500/30 text-gray-100"
              : "bg-white/10 border border-white/10 text-gray-100"
          }`}
        >
          {isLaila && !isGrouped && (
            <span
              className="text-xs font-semibold block mb-1 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]"
            >
              Laila
            </span>
          )}

          {/* Markdown rendered content */}
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg prose-code:text-purple-300 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-a:text-purple-400 prose-strong:text-white prose-blockquote:border-purple-500/50 prose-blockquote:text-gray-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: (props) => {
                  const ref = React.useRef<HTMLPreElement>(null);
                  return (
                    <div className="relative group/code">
                      <button
                        onClick={() => {
                          const text = ref.current?.textContent;
                          if (text) {
                            navigator.clipboard.writeText(text);
                            showToast("Code copied!", "success");
                          }
                        }}
                        className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
                      >
                        Copy
                      </button>
                      <pre ref={ref}>{props.children}</pre>
                    </div>
                  );
                },
              }}
            >
              {displayedText}
            </ReactMarkdown>
            {isTyping && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* Reactions display */}
          {reactions.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {reactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className="text-sm px-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {timeStr && (
            <div className="flex items-center justify-between mt-1">
              {isLaila && content.length > 50 && (
                <span className="text-[10px] text-gray-600">
                  {content.split(/\s+/).length} words · {Math.max(1, Math.ceil(content.split(/\s+/).length / 200))} min read
                </span>
              )}
              <span className="text-[10px] text-gray-500 ml-auto">
                {timeStr}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {hovered && !isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute -top-2 ${isLaila ? "-right-2" : "-left-2"} flex gap-1`}
          >
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check size={12} className="text-green-400" />
              ) : (
                <Copy size={12} className="text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setShowReactionPicker((p) => !p)}
              className="w-7 h-7 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="React"
            >
              <SmilePlus size={12} className="text-gray-400" />
            </button>
          </motion.div>
        )}

        {/* Reaction picker */}
        <AnimatePresence>
          {showReactionPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -5 }}
              className={`absolute -top-10 ${isLaila ? "left-0" : "right-0"} flex gap-1 px-2 py-1.5 rounded-xl bg-gray-800 border border-white/10 shadow-lg z-10`}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  className={`text-base hover:scale-125 transition-transform px-0.5 ${reactions.includes(emoji) ? "opacity-50" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
