import Database from "better-sqlite3";
import path from "path";

// Database file stored in data/ directory
const DB_PATH = path.join(process.cwd(), "data", "laila.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
  `);
}

// --- Session Queries ---

export interface DbSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: number;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function getAllSessions(): DbSession[] {
  const database = getDb();
  return database.prepare(
    "SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
  ).all() as DbSession[];
}

export function getSession(id: string): { session: DbSession; messages: DbMessage[] } | null {
  const database = getDb();
  const session = database.prepare(
    "SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?"
  ).get(id) as DbSession | undefined;

  if (!session) return null;

  const messages = database.prepare(
    "SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY id ASC"
  ).all(id) as DbMessage[];

  return { session, messages };
}

export function createSession(id: string, title: string): DbSession {
  const database = getDb();
  const now = new Date().toISOString();

  database.prepare(
    "INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, title, now, now);

  return { id, title, created_at: now, updated_at: now };
}

export function saveMessages(
  sessionId: string,
  messages: { role: string; content: string }[]
): void {
  const database = getDb();
  const now = new Date().toISOString();

  const saveAll = database.transaction(() => {
    // Delete existing messages for this session
    database.prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);

    // Insert all messages
    const insert = database.prepare(
      "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)"
    );
    for (const msg of messages) {
      insert.run(sessionId, msg.role, msg.content, now);
    }

    // Update session timestamp
    database.prepare(
      "UPDATE chat_sessions SET updated_at = ? WHERE id = ?"
    ).run(now, sessionId);
  });

  saveAll();
}

export function renameSessionDb(id: string, title: string): void {
  const database = getDb();
  database.prepare("UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?").run(title, new Date().toISOString(), id);
}

export function deleteSessionDb(id: string): void {
  const database = getDb();
  database.prepare("DELETE FROM chat_sessions WHERE id = ?").run(id);
}

export function clearAllSessions(): void {
  const database = getDb();
  database.exec("DELETE FROM messages; DELETE FROM chat_sessions;");
}

export function getSessionMessageCount(sessionId: string): number {
  const database = getDb();
  const result = database.prepare(
    "SELECT COUNT(*) as count FROM messages WHERE session_id = ?"
  ).get(sessionId) as { count: number };
  return result.count;
}
