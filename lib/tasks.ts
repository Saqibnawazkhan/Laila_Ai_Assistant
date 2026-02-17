export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  dueDate?: string;
}

const STORAGE_KEY = "laila_tasks";

export function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(tasks: Task[], title: string, priority: Task["priority"] = "medium", dueDate?: string): Task[] {
  const newTask: Task = {
    id: Date.now().toString(),
    title,
    completed: false,
    priority,
    createdAt: new Date().toISOString(),
    dueDate,
  };
  const updated = [newTask, ...tasks];
  saveTasks(updated);
  return updated;
}

export function toggleTask(tasks: Task[], id: string): Task[] {
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, completed: !t.completed } : t
  );
  saveTasks(updated);
  return updated;
}

export function deleteTask(tasks: Task[], id: string): Task[] {
  const updated = tasks.filter((t) => t.id !== id);
  saveTasks(updated);
  return updated;
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
