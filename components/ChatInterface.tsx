"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, Settings, ChevronDown, Search, X, Plus, RefreshCw, Volume2, VolumeX, Menu, Sparkles, Terminal, MessageSquare, Music } from "lucide-react";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";
import PermissionModal from "./PermissionModal";
import TaskPanel from "./TaskPanel";
import OnboardingScreen from "./OnboardingScreen";
import SettingsPanel from "./SettingsPanel";
import Sidebar from "./Sidebar";
import ConfirmDialog from "./ConfirmDialog";
import KeyboardShortcuts from "./KeyboardShortcuts";
import CommandPalette, { type CommandItem } from "./CommandPalette";
import ToastContainer, { showToast } from "./Toast";
import { LAILA_GREETING, GREETINGS } from "@/lib/laila-persona";
import { speakText, stopSpeaking, createWakeWordListener, unlockTTS, initVoices } from "@/lib/speech";
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
  renameSessionInDb,
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

function loadPermissions(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem("laila_permissions");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function savePermissions(permissions: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem("laila_permissions", JSON.stringify([...permissions]));
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: LAILA_GREETING },
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && !prev[0].timestamp) {
        return [{ ...prev[0], timestamp: new Date().toISOString() }];
      }
      return prev;
    });
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "thinking" | "talking">("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [pendingCommand, setPendingCommand] = useState<SystemCommand | null>(null);
  const [allowedTypes, setAllowedTypes] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSession] = useState<string | null>(null);
  const [wakeWordListening, setWakeWordListening] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const wakeWordRef = useRef<{ start: () => void; stop: () => void; pause: () => void; resume: () => void } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string) => void>(undefined);

  // Load everything on mount
  useEffect(() => {
    setAllowedTypes(loadPermissions());
    setTasks(loadTasks());

    const loadChats = async () => {
      const sessions = await loadSessionsFromDb();
      setChatSessions(sessions);
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

    const onboarded = localStorage.getItem("laila_onboarded");
    if (!onboarded) setShowOnboarding(true);

    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  // Auto-save messages
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!activeSessionId || messages.length <= 1) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMessagesToDb(activeSessionId, messages);
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, updatedAt: new Date().toISOString() } : s
        )
      );
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const unread = messages.filter((m) => m.role === "assistant").length;
    document.title = unread > 1 ? `(${unread}) Laila AI Assistant` : "Laila AI Assistant";
    return () => { document.title = "Laila AI Assistant"; };
  }, [messages]);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    initVoices();
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
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); handleNewChat(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "h") { e.preventDefault(); setSidebarOpen((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") { e.preventDefault(); setIsSettingsOpen((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && (e.key === "?" || (e.shiftKey && e.key === "/"))) { e.preventDefault(); setShowShortcuts((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") { e.preventDefault(); setSearchOpen((p) => !p); setSearchQuery(""); }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") { e.preventDefault(); setShowCommandPalette((p) => !p); }
      if (e.key === "Escape") { setIsTaskPanelOpen(false); setIsSettingsOpen(false); setSearchOpen(false); setSearchQuery(""); setShowShortcuts(false); setShowCommandPalette(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => { if (prev) stopSpeaking(); return !prev; });
  }, []);

  const speakAndAnimate = useCallback(
    (text: string) => {
      if (wakeWordRef.current) wakeWordRef.current.pause();
      if (voiceEnabled) {
        setAvatarStatus("talking");
        speakText(text, () => setAvatarStatus("talking"), () => {
          setAvatarStatus("idle");
          if (wakeWordRef.current) wakeWordRef.current.resume();
        });
      } else {
        setAvatarStatus("talking");
        setTimeout(() => {
          setAvatarStatus("idle");
          if (wakeWordRef.current) wakeWordRef.current.resume();
        }, 2000);
      }
    },
    [voiceEnabled]
  );

  const wakeGreetings = useRef([
    "Hello Saqib! How can I assist you today?",
    "Hey Saqib! What can I do for you?",
    "Hi Saqib! I'm here, what do you need?",
    "Yes Saqib! I'm listening, go ahead!",
    "Hey! What's up Saqib? How can I help?",
  ]);

  const handleWakeWord = useCallback(
    (remainingText: string) => {
      const lower = remainingText.toLowerCase().trim();
      const stopPhrases = ["stop talking", "stop", "shut up", "be quiet", "quiet", "silence", "enough", "stop it", "chup"];
      if (stopPhrases.some((phrase) => lower.includes(phrase))) {
        stopSpeaking();
        setAvatarStatus("idle");
        const responses = ["Okay, I'll be quiet!", "Sure, stopping now!", "Alright, I've stopped!"];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: response }]);
        setTimeout(() => wakeWordRef.current?.resume(), 500);
        return;
      }
      if (remainingText && remainingText.length > 2) {
        sendMessageRef.current?.(remainingText);
      } else {
        const greetings = wakeGreetings.current;
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: greeting }]);
        speakAndAnimate(greeting);
      }
    },
    [speakAndAnimate]
  );

  const wakeWordInitialized = useRef(false);
  const handleWakeWordRef = useRef(handleWakeWord);
  useEffect(() => { handleWakeWordRef.current = handleWakeWord; }, [handleWakeWord]);

  useEffect(() => {
    const onWake = (remaining: string) => {
      handleWakeWordRef.current(remaining);
      setTimeout(() => { if (wakeWordRef.current) wakeWordRef.current.start(); }, 2000);
    };
    const initWakeWord = () => {
      if (wakeWordInitialized.current) return;
      wakeWordInitialized.current = true;
      const listener = createWakeWordListener(onWake, setWakeWordListening);
      wakeWordRef.current = listener;
      listener.start();
      document.removeEventListener("click", initWakeWord);
      document.removeEventListener("touchstart", initWakeWord);
      document.removeEventListener("keydown", initWakeWord);
    };
    document.addEventListener("click", initWakeWord);
    document.addEventListener("touchstart", initWakeWord);
    document.addEventListener("keydown", initWakeWord);
    return () => {
      document.removeEventListener("click", initWakeWord);
      document.removeEventListener("touchstart", initWakeWord);
      document.removeEventListener("keydown", initWakeWord);
      if (wakeWordRef.current) { wakeWordRef.current.stop(); wakeWordRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playYouTube = useCallback(async (query: string) => {
    try {
      const searchRes = await fetch("/api/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      const searchData = await searchRes.json();
      if (!searchData.url) throw new Error("Couldn't find the video");
      const execRes = await fetch("/api/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: `open "${searchData.url}"`, type: "open_app" }) });
      const execData = await execRes.json();
      if (execData.success) {
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: `Now playing! Opened the video for you.` }]);
        speakAndAnimate("Now playing! Enjoy!");
      } else throw new Error(execData.output);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't play that. Please try again." }]);
      setAvatarStatus("idle");
    }
  }, [speakAndAnimate]);

  const sendWhatsApp = useCallback(async (value: string) => {
    try {
      const parts = value.split("::"); const contact = parts[0]?.trim(); const message = parts[1]?.trim() || "";
      if (!contact) throw new Error("No contact specified");
      const res = await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contact, message }) });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: data.output }]);
        speakAndAnimate(message ? `Message sent to ${contact}!` : `Opened chat with ${contact}!`);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: data.output }]);
        speakAndAnimate("Sorry, I had trouble with WhatsApp.");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't send the WhatsApp message. Make sure WhatsApp is installed." }]);
      setAvatarStatus("idle");
    }
  }, [speakAndAnimate]);

  const executeCommand = useCallback(async (command: SystemCommand) => {
    if (command.type === "play_youtube") return playYouTube(command.command);
    if (command.type === "send_whatsapp") return sendWhatsApp(command.command);
    try {
      const response = await fetch("/api/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: command.command, type: command.type }) });
      const data = await response.json();
      if (data.success) {
        if (command.type === "system_info" && data.output) {
          try {
            const interpretRes = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `I asked: "${command.description}". The system returned: "${data.output}". Please give me a brief, natural, friendly answer based on this result. Do NOT include any [COMMAND:] or [TASK:] tags.` }] }) });
            const interpretData = await interpretRes.json();
            const naturalResponse = cleanResponseText(interpretData.reply || data.output);
            setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: naturalResponse }]);
            speakAndAnimate(naturalResponse);
          } catch {
            setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: `Here's what I found:\n\`\`\`\n${data.output}\n\`\`\`` }]);
            speakAndAnimate(data.output.slice(0, 200));
          }
        } else {
          const resultMsg = data.output ? `Done! Here's the result:\n\`\`\`\n${data.output}\n\`\`\`` : "Done! Command executed successfully.";
          setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: resultMsg }]);
          speakAndAnimate(data.output ? `Done! ${data.output.slice(0, 150)}` : "Done! Command executed successfully.");
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: `Hmm, something went wrong: ${data.output}` }]);
        speakAndAnimate("Sorry, there was an issue executing that command.");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: "Sorry, I couldn't execute that command. Please try again." }]);
      setAvatarStatus("idle");
    }
  }, [speakAndAnimate, playYouTube, sendWhatsApp]);

  const handleAllowCommand = () => { if (pendingCommand) executeCommand(pendingCommand); setPendingCommand(null); };
  const handleAlwaysAllowCommand = () => {
    if (pendingCommand) {
      const np = new Set(allowedTypes); np.add(pendingCommand.type); setAllowedTypes(np); savePermissions(np);
      executeCommand(pendingCommand);
    }
    setPendingCommand(null);
  };
  const handleDenyCommand = () => {
    setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: "No problem! I won't run that command. Let me know if you need anything else." }]);
    speakAndAnimate("No problem! I won't run that command.");
    setPendingCommand(null);
  };

  const handleTaskAction = useCallback((response: string) => {
    const taskCommand = parseTaskFromResponse(response);
    if (!taskCommand) return;
    switch (taskCommand.action) {
      case "add":
        if (taskCommand.title) setTasks(addTask(tasks, taskCommand.title, taskCommand.priority, taskCommand.dueDate));
        break;
      case "complete":
        if (taskCommand.title) { const m = tasks.find((t) => t.title.toLowerCase() === taskCommand.title!.toLowerCase() && !t.completed); if (m) setTasks(toggleTask(tasks, m.id)); }
        break;
      case "delete":
        if (taskCommand.title) { const m = tasks.find((t) => t.title.toLowerCase() === taskCommand.title!.toLowerCase()); if (m) setTasks(deleteTask(tasks, m.id)); }
        break;
      case "list": setIsTaskPanelOpen(true); break;
    }
  }, [tasks]);

  const handleToggleTask = useCallback((id: string) => setTasks(toggleTask(tasks, id)), [tasks]);
  const handleDeleteTask = useCallback((id: string) => setTasks(deleteTask(tasks, id)), [tasks]);

  const handleNewChat = useCallback(() => {
    const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setMessages([{ role: "assistant", timestamp: new Date().toISOString(), content: randomGreeting }]);
    setActiveSession(null);
    setActiveSessionId(null);
  }, []);

  const handleSelectSession = useCallback(async (session: ChatSession) => {
    const sessionData = await loadSessionWithMessages(session.id);
    if (sessionData && sessionData.messages.length > 0) setMessages(sessionData.messages);
    else setMessages([{ role: "assistant", timestamp: new Date().toISOString(), content: LAILA_GREETING }]);
    setActiveSession(session.id);
    setActiveSessionId(session.id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setConfirmAction({
      title: "Delete Chat",
      message: "This conversation will be permanently deleted.",
      onConfirm: async () => {
        await deleteSessionFromDb(id);
        setChatSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) handleNewChat();
        showToast("Chat deleted", "success");
        setConfirmAction(null);
      },
    });
  }, [activeSessionId, handleNewChat]);

  const handleRenameSession = useCallback(async (id: string, title: string) => {
    await renameSessionInDb(id, title);
    setChatSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    showToast("Chat renamed", "success");
  }, []);

  const handleResetPermissions = useCallback(() => { setAllowedTypes(new Set()); savePermissions(new Set()); }, []);

  const handleClearChats = useCallback(() => {
    setConfirmAction({
      title: "Clear All Chats",
      message: "All conversations will be permanently deleted.",
      onConfirm: async () => {
        await clearAllSessionsFromDb();
        setChatSessions([]); setActiveSession(null); setActiveSessionId(null);
        handleNewChat(); showToast("All chats cleared", "success"); setConfirmAction(null);
      },
    });
  }, [handleNewChat]);

  const sendMessage = async (content: string) => {
    const userMessage: Message = { role: "user", content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAvatarStatus("thinking");
    stopSpeaking();

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
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updatedMessages }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get response");

      const command = parseCommandFromResponse(data.reply);
      const taskCommand = parseTaskFromResponse(data.reply);
      let cleanText = cleanResponseText(data.reply);
      cleanText = cleanTaskTags(cleanText);
      if (taskCommand?.action === "list") { const summary = getTasksSummary(tasks); cleanText = cleanText ? `${cleanText}\n\n${summary}` : summary; }

      setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: cleanText }]);
      if (taskCommand) handleTaskAction(data.reply);

      if (command) {
        // High-risk commands ALWAYS require 3-step confirmation (never auto-allowed)
        if (command.risk === "high") { setPendingCommand(command); speakAndAnimate(cleanText); }
        else if (allowedTypes.has(command.type)) { speakAndAnimate(cleanText); executeCommand(command); }
        else { setPendingCommand(command); speakAndAnimate(cleanText); }
      } else { speakAndAnimate(cleanText); }
      setLastFailedMessage(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      const isRateLimit = errorMessage.includes("overwhelmed") || errorMessage.includes("rate") || errorMessage.includes("429");
      const displayMessage = isRateLimit
        ? "Hold on, Saqib! Too many requests. Give me a few seconds."
        : `Sorry, I ran into an issue: ${errorMessage}. Check your API key in .env.local.`;
      setMessages((prev) => [...prev, { role: "assistant", timestamp: new Date().toISOString(), content: displayMessage }]);
      setLastFailedMessage(content);
      if (isRateLimit) speakAndAnimate("Hold on Saqib, give me a few seconds.");
      setAvatarStatus("idle");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { sendMessageRef.current = sendMessage; });

  if (showOnboarding) return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;

  const pendingTaskCount = tasks.filter((t) => !t.completed).length;

  const featureCards = [
    { icon: MessageSquare, label: "Smart Chat", desc: "Natural conversations", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20", iconColor: "text-purple-400", suggestion: "What can you do?" },
    { icon: Terminal, label: "System Control", desc: "Command your Mac", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", iconColor: "text-blue-400", suggestion: "Open YouTube" },
    { icon: Music, label: "Music & Media", desc: "Play anything", color: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20", iconColor: "text-pink-400", suggestion: "Play some music" },
    { icon: ListTodo, label: "Task Manager", desc: "Track your tasks", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20", iconColor: "text-emerald-400", suggestion: "Show my tasks" },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <ToastContainer />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((p) => !p)}
        sessions={chatSessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTasks={() => setIsTaskPanelOpen(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        activeView="chat"
        pendingTaskCount={pendingTaskCount}
      />

      {/* Modals */}
      <PermissionModal command={pendingCommand} onAllow={handleAllowCommand} onAlwaysAllow={handleAlwaysAllowCommand} onDeny={handleDenyCommand} />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={[
          { id: "new-chat", label: "New Chat", icon: <Plus size={16} />, shortcut: "Ctrl+K", action: handleNewChat },
          { id: "sidebar", label: "Toggle Sidebar", icon: <Menu size={16} />, shortcut: "Ctrl+H", action: () => setSidebarOpen((p) => !p) },
          { id: "settings", label: "Settings", icon: <Settings size={16} />, shortcut: "Ctrl+,", action: () => setIsSettingsOpen(true) },
          { id: "tasks", label: "Task Manager", icon: <ListTodo size={16} />, action: () => setIsTaskPanelOpen(true) },
          { id: "search", label: "Search Messages", icon: <Search size={16} />, shortcut: "Ctrl+F", action: () => setSearchOpen(true) },
          { id: "shortcuts", label: "Shortcuts", icon: <Search size={16} />, shortcut: "Ctrl+?", action: () => setShowShortcuts(true) },
          { id: "voice", label: voiceEnabled ? "Mute Voice" : "Enable Voice", icon: voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />, action: handleToggleVoice },
        ] as CommandItem[]}
      />
      <ConfirmDialog isOpen={!!confirmAction} title={confirmAction?.title || ""} message={confirmAction?.message || ""} onConfirm={() => confirmAction?.onConfirm()} onCancel={() => setConfirmAction(null)} />
      <TaskPanel isOpen={isTaskPanelOpen} onClose={() => setIsTaskPanelOpen(false)} tasks={tasks} onToggle={handleToggleTask} onDelete={handleDeleteTask} onAdd={(title: string) => setTasks(addTask(tasks, title))} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} voiceEnabled={voiceEnabled} onToggleVoice={handleToggleVoice} allowedTypes={allowedTypes} onResetPermissions={handleResetPermissions} onClearChats={handleClearChats} messages={messages} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-gray-950">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-600/[0.03] rounded-full blur-[150px]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-fuchsia-600/[0.02] rounded-full blur-[120px]" />
        </div>

        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl flex-shrink-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-all"
              title="Toggle sidebar (Ctrl+H)"
            >
              <Menu size={18} />
            </button>
            <div className="h-5 w-px bg-white/[0.06] mx-1 hidden sm:block" />
            <button
              onClick={() => { setSearchOpen((p) => !p); setSearchQuery(""); }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                searchOpen ? "bg-purple-500/15 text-purple-400" : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.06]"
              }`}
              title="Search (Ctrl+F)"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Center status */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${wakeWordListening ? "bg-green-500 animate-pulse" : "bg-gray-700"}`} />
            <span className="hidden sm:inline whitespace-nowrap">{wakeWordListening ? 'Listening for "Laila"' : 'Say "Laila" to activate'}</span>
            {avatarStatus === "thinking" && (
              <span className="flex items-center gap-1 text-purple-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />Thinking...
              </span>
            )}
            {avatarStatus === "talking" && (
              <span className="flex items-center gap-1 text-pink-400 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />Speaking...
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleVoice}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                voiceEnabled ? "text-purple-400 hover:bg-purple-500/10" : "text-gray-600 hover:bg-white/[0.06]"
              }`}
              title={voiceEnabled ? "Mute voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
              title="New Chat (Ctrl+K)"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl relative z-10 flex-shrink-0"
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages..."
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20"
                  />
                </div>
                {searchQuery && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} found
                  </span>
                )}
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages / Welcome */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">

            {/* Welcome State */}
            {messages.length <= 1 && !searchQuery && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center pt-[12vh] pb-8"
              >
                {/* Logo */}
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-purple-500/25 mb-5"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Sparkles size={24} className="text-white" />
                </motion.div>

                {/* Greeting */}
                <motion.h1
                  className="text-2xl sm:text-3xl font-bold text-white mb-1.5 text-center"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Hello, Saqib
                </motion.h1>
                <motion.p
                  className="text-gray-500 text-sm mb-1 text-center"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  How can I assist you today?
                </motion.p>
                <motion.p
                  className="text-gray-600 text-xs text-center max-w-sm mb-8"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Chat with me, control your system, manage tasks, play music and more.
                </motion.p>

                {/* Quick suggestion pills */}
                <motion.div
                  className="flex flex-wrap gap-2 justify-center mb-8 max-w-md"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  {["What can you do?", "Tell me a joke", "Open YouTube", "Play some music", "Show my tasks", "What's the weather?"].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3.5 py-2 text-xs rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/20 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>

                {/* Feature cards */}
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-xl"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {featureCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.label}
                        onClick={() => sendMessage(card.suggestion)}
                        className={`group bg-gradient-to-b ${card.color} border ${card.border} rounded-xl p-3.5 text-left hover:scale-[1.02] active:scale-[0.98] transition-all`}
                      >
                        <Icon size={20} className={`${card.iconColor} mb-2`} />
                        <p className="text-[13px] font-medium text-gray-200 leading-tight">{card.label}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{card.desc}</p>
                      </button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* Messages */}
            {(messages.length > 1 || searchQuery) && (
              <div className="py-4">
                <AnimatePresence>
                  {messages
                    .map((msg, index) => ({ msg, index }))
                    .filter(({ msg }) => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(({ msg, index }, filteredIdx, filtered) => {
                      const showDateSep = (() => {
                        if (!msg.timestamp || filteredIdx === 0) return msg.timestamp ? new Date(msg.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : null;
                        const prev = filtered[filteredIdx - 1]?.msg;
                        if (!prev?.timestamp) return null;
                        return new Date(msg.timestamp).toDateString() !== new Date(prev.timestamp).toDateString()
                          ? new Date(msg.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
                          : null;
                      })();
                      const prevMsg = filteredIdx > 0 ? filtered[filteredIdx - 1]?.msg : null;
                      const isGrouped = prevMsg?.role === msg.role && !showDateSep;
                      return (
                        <div key={index}>
                          {showDateSep && (
                            <div className="flex items-center gap-3 my-5">
                              <div className="flex-1 h-px bg-white/[0.06]" />
                              <span className="text-[10px] text-gray-600 font-medium px-2">{showDateSep}</span>
                              <div className="flex-1 h-px bg-white/[0.06]" />
                            </div>
                          )}
                          <MessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} isLatest={index === messages.length - 1} isGrouped={isGrouped} />
                        </div>
                      );
                    })}
                </AnimatePresence>

                {isLoading && <TypingIndicator />}

                {/* Retry button */}
                {lastFailedMessage && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex pl-10 pt-2"
                  >
                    <button
                      onClick={() => {
                        const msg = lastFailedMessage;
                        setLastFailedMessage(null);
                        setMessages((prev) => prev.slice(0, -1));
                        sendMessage(msg);
                      }}
                      className="flex items-center gap-2 px-3.5 py-1.5 text-xs rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <RefreshCw size={12} /> Retry message
                    </button>
                  </motion.div>
                )}

                {/* Quick replies — indented to align with message text (past avatar) */}
                {!isLoading && !lastFailedMessage && messages.length > 2 && messages[messages.length - 1]?.role === "assistant" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-1.5 pl-10 pt-2"
                  >
                    {["Tell me more", "Thanks!", "Can you explain?", "What else?"].map((reply) => (
                      <button
                        key={reply}
                        onClick={() => sendMessage(reply)}
                        className="px-3 py-1.5 text-[11px] rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-500 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/20 transition-all"
                      >
                        {reply}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          <AnimatePresence>
            {showScrollBtn && (
              <motion.button initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} onClick={scrollToBottom} className="sticky bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-gray-800/90 backdrop-blur-sm border border-white/10 flex items-center justify-center text-gray-400 shadow-lg hover:bg-gray-700 hover:text-white transition-colors z-10 mx-auto">
                <ChevronDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <InputBar onSend={sendMessage} disabled={isLoading} voiceEnabled={voiceEnabled} onToggleVoice={handleToggleVoice} onMicStart={() => wakeWordRef.current?.pause()} onMicStop={() => wakeWordRef.current?.resume()} />
      </main>
    </div>
  );
}
