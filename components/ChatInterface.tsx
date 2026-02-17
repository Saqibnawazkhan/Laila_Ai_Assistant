"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, Settings, Clock, Ear, EarOff } from "lucide-react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import PermissionModal from "./PermissionModal";
import TaskPanel from "./TaskPanel";
import OnboardingScreen from "./OnboardingScreen";
import SettingsPanel from "./SettingsPanel";
import ChatHistoryPanel from "./ChatHistoryPanel";
import { LAILA_GREETING } from "@/lib/laila-persona";
import { speakText, stopSpeaking, isSpeaking, createWakeWordListener } from "@/lib/speech";
import {
  parseCommandFromResponse,
  cleanResponseText,
  SystemCommand,
} from "@/lib/command-parser";
import {
  Task,
  loadTasks,
  addTask,
  toggleTask,
  deleteTask,
  getTasksSummary,
  parseTaskFromResponse,
  cleanTaskTags,
} from "@/lib/tasks";
import {
  ChatSession,
  loadSessions,
  saveSessions,
  getActiveSessionId,
  setActiveSessionId,
  createSession,
  updateSession,
  deleteSession as deleteChatSession,
} from "@/lib/chat-history";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Load saved permissions from localStorage
function loadPermissions(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem("laila_permissions");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

// Save permissions to localStorage
function savePermissions(permissions: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("laila_permissions", JSON.stringify([...permissions]));
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: LAILA_GREETING },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "thinking" | "talking">("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<SystemCommand | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSession] = useState<string | null>(null);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const wakeWordRef = useRef<{ start: () => void; stop: () => void; pause: () => void; resume: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string) => void>(undefined);

  // Load everything on mount
  useEffect(() => {
    setAllowedTypes(loadPermissions());
    setTasks(loadTasks());
    setChatSessions(loadSessions());
    setActiveSession(getActiveSessionId());

    // Show onboarding if first time
    const onboarded = localStorage.getItem("laila_onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Auto-save messages to active session
  useEffect(() => {
    if (!activeSessionId || messages.length <= 1) return;
    const updated = updateSession(chatSessions, activeSessionId, messages);
    setChatSessions(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K = New Chat
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
      // Ctrl/Cmd + H = Toggle History
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setIsHistoryOpen((prev) => !prev);
      }
      // Ctrl/Cmd + , = Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
      }
      // Escape = Close panels
      if (e.key === "Escape") {
        setIsTaskPanelOpen(false);
        setIsSettingsOpen(false);
        setIsHistoryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, []);

  const speakAndAnimate = useCallback(
    (text: string) => {
      // Pause wake word listener so it doesn't hear Laila's own voice
      if (wakeWordRef.current) {
        wakeWordRef.current.pause();
      }

      if (voiceEnabled) {
        setAvatarStatus("talking");
        speakText(
          text,
          () => setAvatarStatus("talking"),
          () => {
            setAvatarStatus("idle");
            // Resume wake word listener after Laila finishes speaking
            if (wakeWordRef.current) {
              wakeWordRef.current.resume();
            }
          }
        );
      } else {
        setAvatarStatus("talking");
        setTimeout(() => {
          setAvatarStatus("idle");
          // Resume wake word listener
          if (wakeWordRef.current) {
            wakeWordRef.current.resume();
          }
        }, 2000);
      }
    },
    [voiceEnabled]
  );

  // Wake word greetings (randomized)
  const wakeGreetings = useRef([
    "Hello Saqib! How can I assist you today?",
    "Hey Saqib! What can I do for you?",
    "Hi Saqib! I'm here, what do you need?",
    "Yes Saqib! I'm listening, go ahead!",
    "Hey! What's up Saqib? How can I help?",
  ]);

  // Handle wake word detection
  const handleWakeWord = useCallback(
    (remainingText: string) => {
      if (remainingText && remainingText.length > 2) {
        // User said "Laila, do something" - process the command directly
        sendMessageRef.current?.(remainingText);
      } else {
        // User just said "Laila" - greet and wait for next command
        const greetings = wakeGreetings.current;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: greeting },
        ]);
        speakAndAnimate(greeting);
      }
    },
    [speakAndAnimate]
  );

  // Initialize wake word listener
  useEffect(() => {
    if (wakeWordEnabled) {
      // Use a wrapper that always calls the latest handleWakeWord via ref
      const onWake = (remaining: string) => {
        handleWakeWordRef.current(remaining);
        // After handling, restart the listener (it was stopped by the wake detection)
        // The speakAndAnimate will pause/resume it to avoid hearing Laila's own voice
        setTimeout(() => {
          if (wakeWordRef.current) {
            wakeWordRef.current.start();
            // Immediately pause if Laila is speaking
            if (isSpeaking()) {
              wakeWordRef.current.pause();
            }
          }
        }, 500);
      };

      const listener = createWakeWordListener(onWake, setWakeWordListening);
      wakeWordRef.current = listener;
      listener.start();

      return () => {
        listener.stop();
        wakeWordRef.current = null;
      };
    } else {
      if (wakeWordRef.current) {
        wakeWordRef.current.stop();
        wakeWordRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordEnabled]);

  // Keep handleWakeWord ref updated
  const handleWakeWordRef = useRef(handleWakeWord);
  useEffect(() => {
    handleWakeWordRef.current = handleWakeWord;
  }, [handleWakeWord]);

  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled((prev) => !prev);
  }, []);

  const playYouTube = useCallback(async (query: string) => {
    try {
      const searchRes = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const searchData = await searchRes.json();
      const videoUrl = searchData.url;

      if (!videoUrl) throw new Error("Couldn't find the video");

      const execRes = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: `open "${videoUrl}"`, type: "open_app" }),
      });
      const execData = await execRes.json();

      if (execData.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Now playing! Opened the video for you.` },
        ]);
        speakAndAnimate("Now playing! Enjoy!");
      } else {
        throw new Error(execData.output);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't play that. Please try again." },
      ]);
      setAvatarStatus("idle");
    }
  }, [speakAndAnimate]);

  const sendWhatsApp = useCallback(async (value: string) => {
    try {
      const parts = value.split("::");
      const contact = parts[0]?.trim();
      const message = parts[1]?.trim() || "";

      if (!contact) throw new Error("No contact specified");

      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, message }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.output },
        ]);
        speakAndAnimate(message ? `Message sent to ${contact}!` : `Opened chat with ${contact}!`);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.output },
        ]);
        speakAndAnimate("Sorry, I had trouble with WhatsApp.");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't send the WhatsApp message. Make sure WhatsApp is installed." },
      ]);
      setAvatarStatus("idle");
    }
  }, [speakAndAnimate]);

  const executeCommand = useCallback(async (command: SystemCommand) => {
    if (command.type === "play_youtube") {
      return playYouTube(command.command);
    }

    if (command.type === "send_whatsapp") {
      return sendWhatsApp(command.command);
    }

    try {
      const response = await fetch("/api/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.command, type: command.type }),
      });

      const data = await response.json();

      if (data.success) {
        if (command.type === "system_info" && data.output) {
          // For system info, send the result back to AI for natural interpretation
          try {
            const interpretRes = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [
                  { role: "user", content: `I asked: "${command.description}". The system returned: "${data.output}". Please give me a brief, natural, friendly answer based on this result. End with a short follow-up like "Is there anything else I can help with?" or "What else can I do for you?". Do NOT include any [COMMAND:] or [TASK:] tags in your response.` },
                ],
              }),
            });
            const interpretData = await interpretRes.json();
            const naturalResponse = cleanResponseText(interpretData.reply || data.output);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: naturalResponse },
            ]);
            speakAndAnimate(naturalResponse);
          } catch {
            // Fallback: show raw output
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Here's what I found:\n\`\`\`\n${data.output}\n\`\`\`` },
            ]);
            speakAndAnimate(data.output.slice(0, 200));
          }
        } else {
          const resultMsg = data.output
            ? `Done! Here's the result:\n\`\`\`\n${data.output}\n\`\`\``
            : "Done! Command executed successfully.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: resultMsg },
          ]);
          speakAndAnimate(data.output ? `Done! Here's the result: ${data.output.slice(0, 150)}` : "Done! The command was executed successfully.");
        }
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
  }, [speakAndAnimate, playYouTube, sendWhatsApp]);

  const handleAllowCommand = () => {
    if (pendingCommand) {
      executeCommand(pendingCommand);
    }
    setPendingCommand(null);
  };

  const handleAlwaysAllowCommand = () => {
    if (pendingCommand) {
      const newPermissions = new Set(allowedTypes);
      newPermissions.add(pendingCommand.type);
      setAllowedTypes(newPermissions);
      savePermissions(newPermissions);
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

  // Task handlers
  const handleTaskAction = useCallback(
    (response: string) => {
      const taskCommand = parseTaskFromResponse(response);
      if (!taskCommand) return;

      switch (taskCommand.action) {
        case "add":
          if (taskCommand.title) {
            const updated = addTask(tasks, taskCommand.title, taskCommand.priority, taskCommand.dueDate);
            setTasks(updated);
          }
          break;
        case "complete":
          if (taskCommand.title) {
            const match = tasks.find(
              (t) => t.title.toLowerCase() === taskCommand.title!.toLowerCase() && !t.completed
            );
            if (match) {
              const updated = toggleTask(tasks, match.id);
              setTasks(updated);
            }
          }
          break;
        case "delete":
          if (taskCommand.title) {
            const match = tasks.find(
              (t) => t.title.toLowerCase() === taskCommand.title!.toLowerCase()
            );
            if (match) {
              const updated = deleteTask(tasks, match.id);
              setTasks(updated);
            }
          }
          break;
        case "list":
          setIsTaskPanelOpen(true);
          break;
      }
    },
    [tasks]
  );

  const handleToggleTask = useCallback(
    (id: string) => {
      const updated = toggleTask(tasks, id);
      setTasks(updated);
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      const updated = deleteTask(tasks, id);
      setTasks(updated);
    },
    [tasks]
  );

  // Chat history handlers
  const handleNewChat = useCallback(() => {
    setMessages([{ role: "assistant", content: LAILA_GREETING }]);
    setActiveSession(null);
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback((session: ChatSession) => {
    setMessages(
      session.messages.length > 0
        ? session.messages
        : [{ role: "assistant", content: LAILA_GREETING }]
    );
    setActiveSession(session.id);
    setActiveSessionId(session.id);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      const updated = deleteChatSession(chatSessions, id);
      setChatSessions(updated);
      if (activeSessionId === id) {
        handleNewChat();
      }
    },
    [chatSessions, activeSessionId, handleNewChat]
  );

  const handleResetPermissions = useCallback(() => {
    setAllowedTypes(new Set());
    savePermissions(new Set());
  }, []);

  const handleClearChats = useCallback(() => {
    setChatSessions([]);
    saveSessions([]);
    setActiveSession(null);
    setActiveSessionId(null);
    handleNewChat();
  }, [handleNewChat]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAvatarStatus("thinking");
    stopSpeaking();

    // Create a new session if we don't have one
    if (!activeSessionId) {
      const newSession = createSession(content);
      newSession.messages = updatedMessages;
      const updatedSessions = [newSession, ...chatSessions];
      setChatSessions(updatedSessions);
      saveSessions(updatedSessions);
      setActiveSession(newSession.id);
      setActiveSessionId(newSession.id);
    }

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

      // Check if response contains a system command or task command
      const command = parseCommandFromResponse(data.reply);
      const taskCommand = parseTaskFromResponse(data.reply);

      // Clean both command and task tags from display text
      let cleanText = cleanResponseText(data.reply);
      cleanText = cleanTaskTags(cleanText);

      // Inject task summary if it's a list command
      if (taskCommand?.action === "list") {
        const summary = getTasksSummary(tasks);
        cleanText = cleanText ? `${cleanText}\n\n${summary}` : summary;
      }

      // Add the clean message (without command/task tags)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanText },
      ]);

      // Handle task commands
      if (taskCommand) {
        handleTaskAction(data.reply);
      }

      if (command) {
        if (allowedTypes.has(command.type)) {
          speakAndAnimate(cleanText);
          executeCommand(command);
        } else {
          setPendingCommand(command);
          speakAndAnimate(cleanText);
        }
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

  // Keep sendMessage ref updated for wake word handler
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Permission Modal */}
      <PermissionModal
        command={pendingCommand}
        onAllow={handleAllowCommand}
        onAlwaysAllow={handleAlwaysAllowCommand}
        onDeny={handleDenyCommand}
      />

      {/* Task Panel */}
      <TaskPanel
        isOpen={isTaskPanelOpen}
        onClose={() => setIsTaskPanelOpen(false)}
        tasks={tasks}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        wakeWordEnabled={wakeWordEnabled}
        onToggleWakeWord={toggleWakeWord}
        allowedTypes={allowedTypes}
        onResetPermissions={handleResetPermissions}
        onClearChats={handleClearChats}
      />

      {/* Chat History Panel */}
      <ChatHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={handleNewChat}
      />

      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-2 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/10 transition-all text-xs sm:text-sm"
            title="Chat History (Ctrl+H)"
          >
            <Clock size={16} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/10 transition-all text-xs sm:text-sm"
            title="Settings (Ctrl+,)"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Wake Word Toggle + Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleWakeWord}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border text-xs sm:text-sm transition-all ${
              wakeWordEnabled
                ? wakeWordListening
                  ? "bg-purple-600/20 border-purple-500/30 text-purple-400 animate-pulse"
                  : "bg-purple-600/20 border-purple-500/30 text-purple-400"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/10"
            }`}
            title={wakeWordEnabled ? 'Say "Laila" to activate (listening...)' : 'Enable wake word "Laila"'}
          >
            {wakeWordEnabled ? <Ear size={16} /> : <EarOff size={16} />}
            <span className="hidden sm:inline">
              {wakeWordEnabled ? (wakeWordListening ? "Listening..." : "Wake On") : "Wake Off"}
            </span>
          </button>
          <p className="text-xs text-gray-600 hidden lg:block">
            Ctrl+K New Chat · Ctrl+H History
          </p>
        </div>

        <button
          onClick={() => setIsTaskPanelOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-purple-400 hover:bg-white/10 transition-all text-xs sm:text-sm"
          title="Tasks"
        >
          <ListTodo size={16} />
          <span className="hidden sm:inline">Tasks</span>
          {pendingTaskCount > 0 && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingTaskCount}
            </span>
          )}
        </button>
      </div>

      {/* Avatar Section */}
      <motion.div
        className="flex-shrink-0 flex justify-center pt-4 sm:pt-8 pb-2 sm:pb-4 border-b border-white/5 bg-black/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Avatar status={avatarStatus} />
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
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
