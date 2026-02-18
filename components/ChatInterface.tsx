"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, Settings, Clock, ChevronDown } from "lucide-react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import PermissionModal from "./PermissionModal";
import TaskPanel from "./TaskPanel";
import OnboardingScreen from "./OnboardingScreen";
import SettingsPanel from "./SettingsPanel";
import ChatHistoryPanel from "./ChatHistoryPanel";
import ToastContainer, { showToast } from "./Toast";
import { LAILA_GREETING } from "@/lib/laila-persona";
import { speakText, stopSpeaking, isSpeaking, createWakeWordListener, unlockTTS, initVoices } from "@/lib/speech";
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
  loadSessionsFromDb,
  createSessionInDb,
  saveMessagesToDb,
  deleteSessionFromDb,
  clearAllSessionsFromDb,
  loadSessionWithMessages,
  getActiveSessionId,
  setActiveSessionId,
  generateSessionTitle,
} from "@/lib/chat-history";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
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
    { role: "assistant", timestamp: new Date().toISOString(), content: LAILA_GREETING },
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
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const wakeWordRef = useRef<{ start: () => void; stop: () => void; pause: () => void; resume: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string) => void>(undefined);

  // Load everything on mount
  useEffect(() => {
    setAllowedTypes(loadPermissions());
    setTasks(loadTasks());

    // Load chat sessions from database
    const loadChats = async () => {
      const sessions = await loadSessionsFromDb();
      setChatSessions(sessions);

      // Restore active session with messages
      const savedActiveId = getActiveSessionId();
      if (savedActiveId) {
        const sessionData = await loadSessionWithMessages(savedActiveId);
        if (sessionData && sessionData.messages.length > 0) {
          setMessages(sessionData.messages);
          setActiveSession(savedActiveId);
        }
      }
    };
    loadChats();

    // Show onboarding if first time
    const onboarded = localStorage.getItem("laila_onboarded");
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Auto-save messages to active session in database
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!activeSessionId || messages.length <= 1) return;

    // Debounce saves to avoid excessive API calls
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMessagesToDb(activeSessionId, messages);
      // Update local session list's updatedAt
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, updatedAt: new Date().toISOString() }
            : s
        )
      );
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollBtn(distanceFromBottom > 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Load voices on mount and unlock TTS on first user interaction
  useEffect(() => {
    // Initialize voice loading early (Chrome loads asynchronously)
    initVoices();

    // Chrome requires a user gesture before TTS works
    // Unlock on first click/touch anywhere on the page
    const unlock = () => {
      unlockTTS();
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
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
      const lower = remainingText.toLowerCase().trim();

      // Check for "stop talking" / "stop" / "shut up" / "be quiet" commands
      const stopPhrases = ["stop talking", "stop", "shut up", "be quiet", "quiet", "silence", "enough", "stop it", "chup"];
      if (stopPhrases.some((phrase) => lower.includes(phrase))) {
        stopSpeaking();
        setAvatarStatus("idle");
        const responses = [
          "Okay, I'll be quiet!",
          "Sure, stopping now!",
          "Alright, I've stopped!",
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", timestamp: new Date().toISOString(), content: response },
        ]);
        // Resume wake word listener so it keeps listening
        setTimeout(() => wakeWordRef.current?.resume(), 500);
        return;
      }

      if (remainingText && remainingText.length > 2) {
        // User said "Laila, do something" - process the command directly
        sendMessageRef.current?.(remainingText);
      } else {
        // User just said "Laila" - greet and wait for next command
        const greetings = wakeGreetings.current;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setMessages((prev) => [
          ...prev,
          { role: "assistant", timestamp: new Date().toISOString(), content: greeting },
        ]);
        speakAndAnimate(greeting);
      }
    },
    [speakAndAnimate]
  );

  // Initialize wake word listener - starts after first user gesture
  // Chrome requires a user gesture (click/tap) before allowing microphone access
  const wakeWordInitialized = useRef(false);

  useEffect(() => {
    const onWake = (remaining: string) => {
      handleWakeWordRef.current(remaining);
      // Restart listener after a delay
      setTimeout(() => {
        if (wakeWordRef.current) {
          wakeWordRef.current.start();
        }
      }, 2000);
    };

    const initWakeWord = () => {
      if (wakeWordInitialized.current) return;
      wakeWordInitialized.current = true;

      const listener = createWakeWordListener(onWake, setWakeWordListening);
      wakeWordRef.current = listener;
      listener.start();

      // Remove the gesture listeners once started
      document.removeEventListener("click", initWakeWord);
      document.removeEventListener("touchstart", initWakeWord);
      document.removeEventListener("keydown", initWakeWord);
    };

    // Start on first user gesture (click, touch, or keypress)
    document.addEventListener("click", initWakeWord);
    document.addEventListener("touchstart", initWakeWord);
    document.addEventListener("keydown", initWakeWord);

    return () => {
      document.removeEventListener("click", initWakeWord);
      document.removeEventListener("touchstart", initWakeWord);
      document.removeEventListener("keydown", initWakeWord);
      if (wakeWordRef.current) {
        wakeWordRef.current.stop();
        wakeWordRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep handleWakeWord ref updated
  const handleWakeWordRef = useRef(handleWakeWord);
  useEffect(() => {
    handleWakeWordRef.current = handleWakeWord;
  }, [handleWakeWord]);

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
          { role: "assistant", timestamp: new Date().toISOString(), content: `Now playing! Opened the video for you.` },
        ]);
        speakAndAnimate("Now playing! Enjoy!");
      } else {
        throw new Error(execData.output);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't play that. Please try again." },
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
          { role: "assistant", timestamp: new Date().toISOString(), content: data.output },
        ]);
        speakAndAnimate(message ? `Message sent to ${contact}!` : `Opened chat with ${contact}!`);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", timestamp: new Date().toISOString(), content: data.output },
        ]);
        speakAndAnimate("Sorry, I had trouble with WhatsApp.");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't send the WhatsApp message. Make sure WhatsApp is installed." },
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
              { role: "assistant", timestamp: new Date().toISOString(), content: naturalResponse },
            ]);
            speakAndAnimate(naturalResponse);
          } catch {
            // Fallback: show raw output
            setMessages((prev) => [
              ...prev,
              { role: "assistant", timestamp: new Date().toISOString(), content: `Here's what I found:\n\`\`\`\n${data.output}\n\`\`\`` },
            ]);
            speakAndAnimate(data.output.slice(0, 200));
          }
        } else {
          const resultMsg = data.output
            ? `Done! Here's the result:\n\`\`\`\n${data.output}\n\`\`\``
            : "Done! Command executed successfully.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", timestamp: new Date().toISOString(), content: resultMsg },
          ]);
          speakAndAnimate(data.output ? `Done! Here's the result: ${data.output.slice(0, 150)}` : "Done! The command was executed successfully.");
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", timestamp: new Date().toISOString(), content: `Hmm, something went wrong: ${data.output}` },
        ]);
        speakAndAnimate("Sorry, there was an issue executing that command.");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't execute that command. Please try again." },
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
      { role: "assistant", timestamp: new Date().toISOString(), content: "No problem! I won't run that command. Let me know if you need anything else." },
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
    setMessages([{ role: "assistant", timestamp: new Date().toISOString(), content: LAILA_GREETING }]);
    setActiveSession(null);
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback(async (session: ChatSession) => {
    // Load full messages from database
    const sessionData = await loadSessionWithMessages(session.id);
    if (sessionData && sessionData.messages.length > 0) {
      setMessages(sessionData.messages);
    } else {
      setMessages([{ role: "assistant", timestamp: new Date().toISOString(), content: LAILA_GREETING }]);
    }
    setActiveSession(session.id);
    setActiveSessionId(session.id);
  }, []);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSessionFromDb(id);
      setChatSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        handleNewChat();
      }
      showToast("Chat deleted", "success");
    },
    [activeSessionId, handleNewChat]
  );

  const handleResetPermissions = useCallback(() => {
    setAllowedTypes(new Set());
    savePermissions(new Set());
  }, []);

  const handleClearChats = useCallback(async () => {
    await clearAllSessionsFromDb();
    setChatSessions([]);
    setActiveSession(null);
    setActiveSessionId(null);
    handleNewChat();
    showToast("All chats cleared", "success");
  }, [handleNewChat]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAvatarStatus("thinking");
    stopSpeaking();

    // Create a new session if we don't have one
    if (!activeSessionId) {
      const id = Date.now().toString();
      const title = generateSessionTitle(content);
      const newSession = await createSessionInDb(id, title);
      newSession.messages = updatedMessages;
      setChatSessions((prev) => [newSession, ...prev]);
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
        { role: "assistant", timestamp: new Date().toISOString(), content: cleanText },
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
      const isRateLimit = errorMessage.includes("overwhelmed") || errorMessage.includes("rate") || errorMessage.includes("429");
      const displayMessage = isRateLimit
        ? "Hold on, Saqib! I'm getting too many requests right now. Give me a few seconds and try again."
        : `Sorry, I ran into an issue: ${errorMessage}. Please check your API key in .env.local and restart the server.`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: displayMessage,
        },
      ]);
      if (isRateLimit) {
        speakAndAnimate("Hold on Saqib, give me a few seconds and try again.");
      }
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
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-hidden">
      <ToastContainer />
      {/* Animated gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-700/10 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-fuchsia-600/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

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

        <p className="text-xs text-gray-600 hidden lg:block">
          Say &quot;Laila&quot; to activate · Ctrl+K New Chat
        </p>

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
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
                isLatest={index === messages.length - 1}
              />
            ))}
          </AnimatePresence>
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom floating button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-purple-600/80 backdrop-blur-sm border border-purple-400/30 flex items-center justify-center text-white shadow-lg shadow-purple-900/30 hover:bg-purple-500/90 transition-colors z-10 mx-auto"
              title="Scroll to bottom"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Quick suggestion chips - show when only greeting message */}
      {messages.length <= 1 && !isLoading && (
        <div className="flex-shrink-0 px-3 sm:px-4 pb-2">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
            {[
              "What can you do?",
              "Tell me a joke",
              "What's the weather?",
              "Open YouTube",
              "Play some music",
              "Show my tasks",
            ].map((suggestion) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-white/5 border border-purple-500/20 text-gray-300 hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/40 transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isLoading}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onMicStart={() => wakeWordRef.current?.pause()}
        onMicStop={() => wakeWordRef.current?.resume()}
      />
    </div>
  );
}
