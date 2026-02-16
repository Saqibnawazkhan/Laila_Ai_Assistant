"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import PermissionModal from "./PermissionModal";
import { LAILA_GREETING } from "@/lib/laila-persona";
import { speakText, stopSpeaking } from "@/lib/speech";
import {
  parseCommandFromResponse,
  cleanResponseText,
  SystemCommand,
} from "@/lib/command-parser";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: LAILA_GREETING },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "thinking" | "talking">("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<SystemCommand | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, []);

  const speakAndAnimate = useCallback(
    (text: string) => {
      if (voiceEnabled) {
        setAvatarStatus("talking");
        speakText(
          text,
          () => setAvatarStatus("talking"),
          () => setAvatarStatus("idle")
        );
      } else {
        setAvatarStatus("talking");
        setTimeout(() => setAvatarStatus("idle"), 2000);
      }
    },
    [voiceEnabled]
  );

  const executeCommand = async (command: SystemCommand) => {
    try {
      const response = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.command, type: command.type }),
      });

      const data = await response.json();

      if (data.success) {
        const resultMsg = data.output
          ? `Done! Here's the result:\n\`\`\`\n${data.output}\n\`\`\``
          : "Done! Command executed successfully.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: resultMsg },
        ]);
        speakAndAnimate("Done! The command was executed successfully.");
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Hmm, something went wrong: ${data.output}` },
        ]);
        speakAndAnimate("Sorry, there was an issue executing that command.");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't execute that command. Please try again." },
      ]);
      setAvatarStatus("idle");
    }
  };

  const handleAllowCommand = () => {
    if (pendingCommand) {
      executeCommand(pendingCommand);
    }
    setPendingCommand(null);
  };

  const handleDenyCommand = () => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "No problem! I won't run that command. Let me know if you need anything else." },
    ]);
    speakAndAnimate("No problem! I won't run that command.");
    setPendingCommand(null);
  };

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAvatarStatus("thinking");
    stopSpeaking();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Check if response contains a system command
      const command = parseCommandFromResponse(data.reply);
      const cleanText = cleanResponseText(data.reply);

      // Add the clean message (without command tags)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanText },
      ]);

      // If there's a command, show permission modal
      if (command) {
        setPendingCommand(command);
        speakAndAnimate(cleanText);
      } else {
        speakAndAnimate(cleanText);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I ran into an issue: ${errorMessage}. Please check your API key in .env.local and restart the server.`,
        },
      ]);
      setAvatarStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Permission Modal */}
      <PermissionModal
        command={pendingCommand}
        onAllow={handleAllowCommand}
        onDeny={handleDenyCommand}
      />

      {/* Avatar Section */}
      <motion.div
        className="flex-shrink-0 flex justify-center pt-8 pb-4 border-b border-white/5 bg-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Avatar status={avatarStatus} />
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <MessageBubble key={index} role={msg.role} content={msg.content} />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isLoading}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
      />
    </div>
  );
}
