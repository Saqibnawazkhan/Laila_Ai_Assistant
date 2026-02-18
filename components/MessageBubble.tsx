"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, User } from "lucide-react";
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

export default function MessageBubble({ role, content, timestamp, isLatest, isGrouped }: MessageBubbleProps) {
  const isLaila = role === "assistant";
  const [displayedText, setDisplayedText] = useState(isLatest && isLaila ? "" : content);
  const [isTyping, setIsTyping] = useState(isLatest && isLaila);
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const charIndex = useRef(0);

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

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 ${isGrouped ? "mt-1" : "mt-5"} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isGrouped ? (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isLaila
            ? "bg-gradient-to-br from-purple-500 to-fuchsia-600"
            : "bg-white/[0.08] border border-white/[0.06]"
        }`}>
          {isLaila ? (
            <Sparkles size={14} className="text-white" />
          ) : (
            <User size={14} className="text-gray-400" />
          )}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + time */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${isLaila ? "text-purple-400" : "text-gray-300"}`}>
              {isLaila ? "Laila" : "You"}
            </span>
            {timeStr && <span className="text-[10px] text-gray-600">{timeStr}</span>}
          </div>
        )}

        {/* Message body */}
        <div
          className="relative"
          onDoubleClick={() => {
            navigator.clipboard.writeText(content);
            showToast("Message copied!", "success");
          }}
        >
          <div className="text-sm leading-relaxed text-gray-200 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl prose-code:text-purple-300 prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-a:text-purple-400 prose-strong:text-white prose-blockquote:border-purple-500/30 prose-blockquote:text-gray-400">
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
                        className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded-md bg-white/[0.06] text-gray-400 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
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

          {/* Copy button on hover */}
          {hovered && !isTyping && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleCopy}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-md bg-gray-800 border border-white/[0.08] flex items-center justify-center hover:bg-gray-700 transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check size={11} className="text-green-400" />
              ) : (
                <Copy size={11} className="text-gray-400" />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
