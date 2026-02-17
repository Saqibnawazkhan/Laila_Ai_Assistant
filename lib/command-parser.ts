export interface SystemCommand {
  type: "open_app" | "file_op" | "terminal" | "system_info" | "play_youtube" | "send_whatsapp";
  command: string;
  description: string;
  risk: "low" | "medium" | "high";
}

// Parse AI response to detect if it contains a system command
export function parseCommandFromResponse(response: string): SystemCommand | null {
  // Look for command blocks in the AI response
  // Format: [COMMAND: <type> | <command> | <description>]
  const commandMatch = response.match(
    /\[COMMAND:\s*(open_app|file_op|terminal|system_info|play_youtube|send_whatsapp)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\]/
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

You are DIRECTLY CONNECTED to the user's macOS laptop. You have FULL ACCESS. NEVER say you can't access the device.

Command format: [COMMAND: type | value | description]

Types: open_app, play_youtube, send_whatsapp, file_op, terminal, system_info

Auto-use commands for:
- TIME/DATE → [COMMAND: system_info | date "+%I:%M %p, %A %B %d %Y" | Check time]
- BATTERY → [COMMAND: system_info | pmset -g batt | Check battery]
- DISK/STORAGE → [COMMAND: system_info | df -h / | Check disk space]
- WIFI → [COMMAND: system_info | networksetup -getairportnetwork en0 | Check WiFi]
- OPEN app → [COMMAND: open_app | open -a "AppName" | Open app]
- CLOSE/QUIT app → [COMMAND: terminal | osascript -e 'quit app "AppName"' | Close app]
- PLAY song → [COMMAND: play_youtube | song name | Play on YouTube]
- MESSAGE contact → [COMMAND: send_whatsapp | contact::message | Send WhatsApp]
- SEARCH Google → [COMMAND: open_app | open "https://www.google.com/search?q=QUERY" | Search]
- FILES → [COMMAND: file_op | ls ~/Desktop | List files]

Opening websites (NOT a macOS app): open as website
- "open fiverr/fibre/fiber" → [COMMAND: open_app | open "https://www.fiverr.com" | Open Fiverr]
- Unknown names → [COMMAND: open_app | open "https://www.[name].com" | Open website]

Closing apps: ALWAYS use osascript -e 'quit app "X"'
- "close settings" → [COMMAND: terminal | osascript -e 'quit app "System Settings"' | Close Settings]
- "close Chrome" → [COMMAND: terminal | osascript -e 'quit app "Google Chrome"' | Close Chrome]

WhatsApp rules:
- Format: [COMMAND: send_whatsapp | contact_name::message_text | description]
- No message: contact_name:: (empty after ::)
- Spell names carefully: "Saqib" not "Sakib"
- Natural speech: "WhatsApp Saqib how are you" → [COMMAND: send_whatsapp | Saqib::how are you | Send to Saqib]

Rules:
- Use macOS commands. open -a for apps, open URL for websites
- Only ONE command per response
- NEVER say "I can't access" - you ARE connected
`;
