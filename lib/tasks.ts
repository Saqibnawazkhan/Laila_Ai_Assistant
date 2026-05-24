export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  dueDate?: string;
}

interface DbTaskShape {
  id: string;
  title: string;
  completed: number;
  priority: Task["priority"];
  due_date: string | null;
  created_at: string;
}

function fromDb(t: DbTaskShape): Task {
  return {
    id: t.id,
    title: t.title,
    completed: t.completed === 1,
    priority: t.priority,
    createdAt: t.created_at,
    dueDate: t.due_date ?? undefined,
  };
}

const LEGACY_STORAGE_KEY = "laila_tasks";
const MIGRATION_FLAG = "laila_tasks_migrated_v1";

async function migrateLegacyTasks(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacy: Task[] = saved ? JSON.parse(saved) : [];
    for (const t of legacy) {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: t.id,
          title: t.title,
          priority: t.priority,
          dueDate: t.dueDate ?? null,
        }),
      });
      if (t.completed) {
        await fetch(`/api/tasks/${t.id}`, { method: "PATCH" });
      }
    }
    localStorage.setItem(MIGRATION_FLAG, "1");
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Migration failed — leave flag unset to retry next load
  }
}

export async function loadTasks(): Promise<Task[]> {
  try {
    await migrateLegacyTasks();
    const res = await fetch("/api/tasks");
    const data = await res.json();
    return (data.tasks || []).map(fromDb);
  } catch {
    return [];
  }
}

export async function addTask(
  title: string,
  priority: Task["priority"] = "medium",
  dueDate?: string,
): Promise<Task[]> {
  try {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: Date.now().toString(),
        title,
        priority,
        dueDate: dueDate ?? null,
      }),
    });
  } catch {
    // Silently fail — next loadTasks will reflect actual state
  }
  return loadTasks();
}

export async function toggleTask(id: string): Promise<Task[]> {
  try {
    await fetch(`/api/tasks/${id}`, { method: "PATCH" });
  } catch {
    // Silently fail
  }
  return loadTasks();
}

export async function deleteTask(id: string): Promise<Task[]> {
  try {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  } catch {
    // Silently fail
  }
  return loadTasks();
}

export function getPendingTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.completed);
}

export function getTasksSummary(tasks: Task[]): string {
  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const high = pending.filter((t) => t.priority === "high");

  if (pending.length === 0) return "You have no pending tasks. You're all caught up!";

  let summary = `You have ${pending.length} pending task${pending.length > 1 ? "s" : ""}`;
  if (completed.length > 0) summary += ` and ${completed.length} completed`;
  summary += ".\n\n";

  if (high.length > 0) {
    summary += `High priority:\n${high.map((t) => `- ${t.title}`).join("\n")}\n\n`;
  }

  summary += `All pending:\n${pending.map((t) => `- [${t.priority}] ${t.title}`).join("\n")}`;
  return summary;
}

// Parse task commands from AI response
// Format: [TASK: action | title | priority | due_date]
export function parseTaskFromResponse(response: string): {
  action: "add" | "complete" | "delete" | "list";
  title?: string;
  priority?: Task["priority"];
  dueDate?: string;
} | null {
  const match = response.match(
    /\[TASK:\s*(add|complete|delete|list)\s*(?:\|\s*(.+?))?\s*(?:\|\s*(low|medium|high))?\s*(?:\|\s*(.+?))?\s*\]/
  );
  if (!match) return null;

  return {
    action: match[1] as "add" | "complete" | "delete" | "list",
    title: match[2]?.trim(),
    priority: (match[3] as Task["priority"]) || "medium",
    dueDate: match[4]?.trim(),
  };
}

export function cleanTaskTags(response: string): string {
  return response.replace(/\[TASK:.*?\]/g, "").trim();
}
