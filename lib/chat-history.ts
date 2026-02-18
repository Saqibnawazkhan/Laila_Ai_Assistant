export interface ChatSession {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  createdAt: string;
  updatedAt: string;
}

const ACTIVE_KEY = "laila_active_session";

// --- API-based functions (async, backed by SQLite) ---

export async function loadSessionsFromDb(): Promise<ChatSession[]> {
  try {
    const res = await fetch("/api/sessions");
    const data = await res.json();
    return (data.sessions || []).map((s: { id: string; title: string; created_at: string; updated_at: string }) => ({
      id: s.id,
      title: s.title,
      messages: [],
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function createSessionInDb(id: string, title: string): Promise<ChatSession> {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
    });
    const data = await res.json();
    return {
      id: data.session.id,
      title: data.session.title,
      messages: [],
      createdAt: data.session.created_at,
      updatedAt: data.session.updated_at,
    };
  } catch {
    return { id, title, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

export async function saveMessagesToDb(
  sessionId: string,
  messages: { role: string; content: string }[]
): Promise<void> {
  try {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch {
    // Silently fail - messages will be retried on next save
  }
}

export async function renameSessionInDb(id: string, title: string): Promise<void> {
  try {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  } catch {
    // Silently fail
  }
}

export async function deleteSessionFromDb(id: string): Promise<void> {
  try {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
  } catch {
    // Silently fail
  }
}

export async function clearAllSessionsFromDb(): Promise<void> {
  try {
    await fetch("/api/sessions", { method: "DELETE" });
  } catch {
    // Silently fail
  }
}

export async function loadSessionWithMessages(id: string): Promise<ChatSession | null> {
  try {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.session as ChatSession;
  } catch {
    return null;
  }
}

// --- Active session ID (localStorage — just a quick pointer) ---

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

// --- Helper ---

export function generateSessionTitle(firstUserMessage: string): string {
  return firstUserMessage.length > 40
    ? firstUserMessage.slice(0, 40) + "..."
    : firstUserMessage;
}
