export interface SystemCommand {
  type: "open_app" | "file_op" | "terminal" | "system_info";
  command: string;
  description: string;
  risk: "low" | "medium" | "high";
}

// Parse AI response to detect if it contains a system command
export function parseCommandFromResponse(response: string): SystemCommand | null {
  // Look for command blocks in the AI response
  // Format: [COMMAND: <type> | <command> | <description>]
  const commandMatch = response.match(
    /\[COMMAND:\s*(open_app|file_op|terminal|system_info)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\]/
  );

  if (!commandMatch) return null;

  const type = commandMatch[1] as SystemCommand["type"];
  const command = commandMatch[2].trim();
  const description = commandMatch[3].trim();

  // Determine risk level
  let risk: SystemCommand["risk"] = "low";
  if (type === "terminal") {
    risk = isHighRiskCommand(command) ? "high" : "medium";
  } else if (type === "file_op") {
    risk = command.includes("rm ") || command.includes("delete") ? "high" : "medium";
  }

  return { type, command, description, risk };
}

// Strip command tags from the display message
export function cleanResponseText(response: string): string {
  return response
    .replace(/\[COMMAND:.*?\]/g, "")
    .trim();
}

function isHighRiskCommand(command: string): boolean {
  const dangerous = [
    "rm -rf",
    "rm -r",
    "sudo",
    "mkfs",
    "dd ",
    "format",
    "> /dev",
    "chmod 777",
    "shutdown",
    "reboot",
    "kill -9",
    "killall",
  ];
  return dangerous.some((d) => command.toLowerCase().includes(d));
}

// System prompt addition for command awareness
export const COMMAND_SYSTEM_PROMPT = `

You also have the ability to execute system commands on the user's macOS laptop. When the user asks you to do something on their computer, you should include a command tag in your response.

Command format: [COMMAND: type | shell_command | description]

Types:
- open_app: Open applications. Example: [COMMAND: open_app | open -a "Google Chrome" | Open Google Chrome]
- file_op: File operations. Example: [COMMAND: file_op | ls ~/Desktop | List files on Desktop]
- terminal: Terminal commands. Example: [COMMAND: terminal | echo "Hello" | Print Hello to terminal]
- system_info: System info. Example: [COMMAND: system_info | top -l 1 | head -n 12 | Show system processes]

Rules for commands:
- Always use macOS-compatible commands
- For opening apps, use: open -a "App Name"
- For opening websites, use: open "https://url.com"
- For file listing, use: ls with appropriate path
- For system info, use: system_profiler, df, top, etc.
- NEVER use destructive commands (rm -rf /, sudo rm, etc.) unless specifically asked
- Always include a human-readable description
- Only include ONE command per response
- If the user asks for something dangerous, warn them but still include the command with the warning

Example conversation:
User: "Open Chrome for me"
Assistant: "Sure! Let me open Google Chrome for you. [COMMAND: open_app | open -a "Google Chrome" | Open Google Chrome]"

User: "What's on my desktop?"
Assistant: "Let me check your Desktop for you! [COMMAND: file_op | ls -la ~/Desktop | List all files on Desktop]"

User: "How much storage do I have?"
Assistant: "Let me check your disk space! [COMMAND: system_info | df -h / | Check available disk space]"
`;
