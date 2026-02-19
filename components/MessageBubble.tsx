"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles } from "lucide-react";
import { showToast } from "./Toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/lib/theme";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isLatest?: boolean;
  isGrouped?: boolean;
}

export default function MessageBubble({ role, content, timestamp, isLatest, isGrouped }: MessageBubbleProps) {
  const { theme } = useTheme();
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

  // --- USER MESSAGE (right side) ---
  if (!isLaila) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`flex justify-end ${isGrouped ? "mt-1" : "mt-4 first:mt-0"} group`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="max-w-[80%] sm:max-w-[70%]">
          {/* Timestamp */}
          {!isGrouped && timeStr && (
            <div className="flex justify-end mb-1">
              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{timeStr}</span>
            </div>
          )}

          {/* Bubble */}
          <div className="relative">
            <div
              className="px-4 py-2.5 rounded-2xl rounded-br-md text-white text-sm leading-relaxed"
              style={{ background: "var(--user-bubble)" }}
              onDoubleClick={() => {
                navigator.clipboard.writeText(content);
                showToast("Message copied!", "success");
              }}
            >
              {content}
            </div>

            {/* Copy on hover */}
            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleCopy}
                className="absolute -top-1 -left-1 w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                title="Copy message"
              >
                {copied ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} style={{ color: "var(--text-muted)" }} />
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- ASSISTANT MESSAGE (left side) ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-2.5 ${isGrouped ? "mt-1" : "mt-4 first:mt-0"} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isGrouped ? (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-black/10" style={{ background: "var(--logo-bg)" }}>
          <Sparkles size={13} style={{ color: "var(--logo-icon)" }} />
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Name + time */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-400">Laila</span>
            {timeStr && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{timeStr}</span>}
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
          <div
            className={`text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-pre:rounded-xl prose-a:text-indigo-400 prose-blockquote:border-indigo-500/30 ${
              theme === "dark"
                ? "prose-invert prose-code:text-indigo-300 prose-code:bg-black/20 prose-strong:text-white prose-blockquote:text-[#8b8fa3]"
                : "prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-strong:text-gray-900 prose-blockquote:text-gray-500"
            } prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none`}
            style={{ color: "var(--assistant-text)" }}
          >
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
                        className="absolute top-2 right-2 px-2 py-1 text-[10px] rounded-md hover:text-white transition-all opacity-0 group-hover/code:opacity-100"
                        style={{ background: "var(--surface)", color: "var(--text-muted)" }}
                      >
                        Copy
                      </button>
                      <pre ref={ref} style={{ background: "var(--code-bg)", border: `1px solid var(--code-border)` }}>{props.children}</pre>
                    </div>
                  );
                },
              }}
            >
              {displayedText}
            </ReactMarkdown>
            {isTyping && (
              <motion.span
                className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle"
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
              className="absolute -top-1 -right-1 w-6 h-6 rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              title="Copy message"
            >
              {copied ? (
                <Check size={11} className="text-emerald-400" />
              ) : (
                <Copy size={11} style={{ color: "var(--text-muted)" }} />
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
