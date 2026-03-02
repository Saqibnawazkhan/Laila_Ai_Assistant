"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react";
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
    if (!isLatest || !isLaila) { setDisplayedText(content); setIsTyping(false); return; }
    setDisplayedText(""); charIndex.current = 0; setIsTyping(true);
    const speed = Math.max(6, 28 - content.length * 0.04);
    const interval = setInterval(() => {
      charIndex.current++;
      setDisplayedText(content.slice(0, charIndex.current));
      if (charIndex.current >= content.length) { clearInterval(interval); setIsTyping(false); }
    }, speed);
    return () => clearInterval(interval);
  }, [content, isLatest, isLaila]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    showToast("Copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "";

  // USER MESSAGE
  if (!isLaila) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex justify-end ${isGrouped ? "mt-1" : "mt-6 first:mt-0"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="max-w-[78%] sm:max-w-[65%]">
          {!isGrouped && timeStr && (
            <div className="flex justify-end mb-1 mr-1">
              <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.30)" }}>{timeStr}</span>
            </div>
          )}
          <div
            className="relative px-4 py-2.5 rounded-2xl rounded-br-md text-[14px] leading-relaxed select-text"
            style={{
              background: "linear-gradient(135deg, #ff8c00, #f97316)",
              color: "#ffffff",
              boxShadow: "0 2px 12px rgba(255,140,0,0.25)",
            }}
            onDoubleClick={() => { navigator.clipboard.writeText(content); showToast("Copied!", "success"); }}
          >
            {content}
            {hovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                onClick={handleCopy}
                className="absolute -bottom-1 -left-1 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                {copied ? <Check size={10} style={{ color: "#ff8c00" }} /> : <Copy size={10} style={{ color: "rgba(0,0,0,0.40)" }} />}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ASSISTANT MESSAGE
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isGrouped ? "mt-1" : "mt-6 first:mt-0"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isGrouped ? (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(255,140,0,0.10)", border: "1.5px solid rgba(255,140,0,0.20)" }}
        >
          <Sparkles size={12} style={{ color: "#ff8c00" }} />
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0 max-w-[90%]">
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-semibold" style={{ color: "#ff8c00" }}>Laila</span>
            {timeStr && <span className="text-[10px]" style={{ color: "rgba(0,0,0,0.30)" }}>{timeStr}</span>}
          </div>
        )}

        <div className="relative">
          <div className="text-[14px] leading-[1.75] select-text prose prose-sm max-w-none
            prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
            prose-pre:my-3 prose-a:no-underline hover:prose-a:underline
            prose-code:text-orange-700 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5
            prose-code:rounded-md prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none
            prose-strong:text-gray-900 prose-a:text-orange-600 prose-blockquote:border-orange-300"
            style={{ color: "#1f2937" }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: (props) => {
                  const ref = React.useRef<HTMLPreElement>(null);
                  const [codeCopied, setCodeCopied] = React.useState(false);
                  const codeEl = React.Children.toArray(props.children).find(
                    (child): child is React.ReactElement<{ className?: string }> =>
                      React.isValidElement(child) && child.type === "code"
                  );
                  const lang = (codeEl?.props?.className || "").replace("language-", "") || "code";
                  return (
                    <div className="overflow-hidden rounded-xl my-3" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fafafa" }}>
                      <div className="flex items-center justify-between px-4 py-2" style={{ background: "#f3f4f6", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: "#ff8c00" }} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.50)" }}>{lang}</span>
                        </div>
                        <button
                          onClick={() => { const text = ref.current?.textContent; if (text) { navigator.clipboard.writeText(text); setCodeCopied(true); showToast("Copied!", "success"); setTimeout(() => setCodeCopied(false), 2000); } }}
                          className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-lg transition-all hover:bg-white"
                          style={{ color: "rgba(0,0,0,0.45)" }}
                        >
                          {codeCopied ? <><Check size={10} className="text-orange-500" /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                      <pre ref={ref} className="!my-0 !rounded-none overflow-x-auto px-4 py-3 text-[13px]" style={{ background: "#fafafa" }}>{props.children}</pre>
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
                style={{ background: "#ff8c00" }}
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
          </div>

          {hovered && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}
              className="flex items-center gap-0.5 mt-2"
            >
              <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg transition-all hover:bg-gray-100" style={{ color: copied ? "#ff8c00" : "rgba(0,0,0,0.40)" }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button onClick={() => showToast("Thanks!", "success")} className="p-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: "rgba(0,0,0,0.30)" }}>
                <ThumbsUp size={11} />
              </button>
              <button onClick={() => showToast("Noted!", "info")} className="p-1.5 rounded-lg transition-all hover:bg-gray-100" style={{ color: "rgba(0,0,0,0.30)" }}>
                <ThumbsDown size={11} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
