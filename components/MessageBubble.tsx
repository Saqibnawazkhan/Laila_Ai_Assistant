"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
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

  // --- USER MESSAGE ---
  if (!isLaila) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex justify-end ${isGrouped ? "mt-0.5" : "mt-5 first:mt-0"} group`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="max-w-[80%] sm:max-w-[70%]">
          {!isGrouped && timeStr && (
            <div className="flex justify-end mb-1 mr-1">
              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{timeStr}</span>
            </div>
          )}

          <div className="relative">
            <div
              className="px-4 py-2.5 rounded-2xl rounded-br-sm text-white text-[14px] leading-relaxed"
              style={{ background: "var(--user-bubble)", boxShadow: "0 2px 12px rgba(139, 92, 246, 0.25)" }}
              onDoubleClick={() => {
                navigator.clipboard.writeText(content);
                showToast("Copied!", "success");
              }}
            >
              {content}
            </div>

            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleCopy}
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              >
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} style={{ color: "var(--text-muted)" }} />}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- ASSISTANT MESSAGE ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isGrouped ? "mt-0.5" : "mt-5 first:mt-0"} group`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isGrouped ? (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--logo-bg-solid)", boxShadow: "var(--shadow-sm)" }}>
          <Sparkles size={12} style={{ color: "var(--logo-icon)" }} />
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[88%]">
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Laila</span>
            {timeStr && <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{timeStr}</span>}
          </div>
        )}

        <div
          className="relative"
          onDoubleClick={() => {
            navigator.clipboard.writeText(content);
            showToast("Copied!", "success");
          }}
        >
          <div
            className={`text-[14px] leading-[1.7] prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-3 prose-pre:rounded-xl prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-violet-500/30 ${
              theme === "dark"
                ? "prose-invert prose-code:text-violet-300 prose-code:bg-white/5 prose-strong:text-white prose-blockquote:text-[#8b8fa3]"
                : "prose-code:text-violet-600 prose-code:bg-violet-50 prose-strong:text-gray-900 prose-blockquote:text-gray-500"
            } prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[12px] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none`}
            style={{ color: "var(--assistant-text)" }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: (props) => {
                  const ref = React.useRef<HTMLPreElement>(null);
                  const [codeCopied, setCodeCopied] = React.useState(false);
                  // Detect language from className
                  const codeEl = React.Children.toArray(props.children).find(
                    (child): child is React.ReactElement => React.isValidElement(child) && child.type === "code"
                  );
                  const langClass = codeEl?.props?.className || "";
                  const lang = langClass.replace("language-", "") || "code";
                  return (
                    <div className="relative group/code rounded-xl overflow-hidden" style={{ border: "1px solid var(--code-border)" }}>
                      <div className="flex items-center justify-between px-4 py-1.5" style={{ background: "var(--code-bg)", borderBottom: "1px solid var(--code-border)" }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
                          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{lang}</span>
                        </div>
                        <button
                          onClick={() => {
                            const text = ref.current?.textContent;
                            if (text) {
                              navigator.clipboard.writeText(text);
                              setCodeCopied(true);
                              showToast("Code copied!", "success");
                              setTimeout(() => setCodeCopied(false), 2000);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md transition-all hover:bg-white/5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {codeCopied ? <><Check size={10} className="text-emerald-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                      <pre ref={ref} className="!my-0 !rounded-none" style={{ background: "var(--code-bg)" }}>{props.children}</pre>
                    </div>
                  );
                },
              }}
            >
              {displayedText}
            </ReactMarkdown>
            {isTyping && (
              <motion.span
                className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-full"
                style={{ background: "var(--accent)" }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          {/* Action buttons on hover */}
          {hovered && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-px mt-1.5 p-0.5 rounded-xl w-fit"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-lg transition-all hover:bg-[var(--surface-hover)]"
                style={{ color: copied ? "var(--success)" : "var(--text-muted)" }}
                title="Copy to clipboard"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <div className="w-px h-3" style={{ background: "var(--border)" }} />
              <button
                className="p-1.5 rounded-lg transition-all hover:bg-[var(--surface-hover)] hover:text-emerald-400"
                style={{ color: "var(--text-dim)" }}
                onClick={() => showToast("Thanks for the feedback!", "success")}
                title="Good response"
              >
                <ThumbsUp size={11} />
              </button>
              <button
                className="p-1.5 rounded-lg transition-all hover:bg-[var(--surface-hover)] hover:text-red-400"
                style={{ color: "var(--text-dim)" }}
                onClick={() => showToast("Feedback noted!", "info")}
                title="Bad response"
              >
                <ThumbsDown size={11} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
