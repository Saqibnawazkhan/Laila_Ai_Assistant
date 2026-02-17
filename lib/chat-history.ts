export interface ChatSession {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "laila_chat_sessions";
const ACTIVE_KEY = "laila_active_session";

export function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function createSession(firstUserMessage: string): ChatSession {
  // Generate title from first message (truncate)
  const title = firstUserMessage.length > 40
    ? firstUserMessage.slice(0, 40) + "..."
    : firstUserMessage;

  return {
    id: Date.now().toString(),
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateSession(
  sessions: ChatSession[],
  sessionId: string,
  messages: { role: "user" | "assistant"; content: string }[]
): ChatSession[] {
  const updated = sessions.map((s) =>
    s.id === sessionId
      ? { ...s, messages, updatedAt: new Date().toISOString() }
      : s
  );
  saveSessions(updated);
  return updated;
}

export function deleteSession(sessions: ChatSession[], sessionId: string): ChatSession[] {
  const updated = sessions.filter((s) => s.id !== sessionId);
  saveSessions(updated);
  return updated;
}
