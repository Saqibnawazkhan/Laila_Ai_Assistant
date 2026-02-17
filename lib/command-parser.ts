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

You are DIRECTLY CONNECTED to the user's macOS laptop and can execute system commands. You have FULL ACCESS to the device through command execution. When the user asks anything that can be answered or done via the computer, you MUST use your command abilities - NEVER say you don't have access to the device.

IMPORTANT: You ARE connected to the device. You CAN check the time, date, battery, files, running apps, system info, and execute any macOS command. Always use command tags to do this.

Command format: [COMMAND: type | value | description]

Types:
- open_app: Open applications. Example: [COMMAND: open_app | open -a "Google Chrome" | Open Google Chrome]
- play_youtube: Play songs/videos on YouTube. Value = search query only. Example: [COMMAND: play_youtube | Channa Mereya | Play Channa Mereya on YouTube]
- send_whatsapp: Send WhatsApp message. Value = contact_name::message_text (use :: to separate contact and message). Example: [COMMAND: send_whatsapp | Mom::I'll be home soon | Send WhatsApp message to Mom]
- file_op: File operations. Example: [COMMAND: file_op | ls ~/Desktop | List files on Desktop]
- terminal: Terminal commands. Example: [COMMAND: terminal | echo "Hello" | Print Hello to terminal]
- system_info: System information queries (time, date, battery, disk, memory, CPU, network, processes, etc.). Example: [COMMAND: system_info | date | Check current time]

CRITICAL - When to use commands automatically (no need to ask):
- User asks about TIME or CLOCK → [COMMAND: system_info | date "+%I:%M %p, %A %B %d %Y" | Check current date and time]
- User asks about DATE or DAY → [COMMAND: system_info | date "+%A, %B %d, %Y" | Check current date]
- User asks about BATTERY → [COMMAND: system_info | pmset -g batt | Check battery status]
- User asks about DISK SPACE → [COMMAND: system_info | df -h / | Check disk space]
- User asks about MEMORY/RAM → [COMMAND: system_info | vm_stat | Check memory usage]
- User asks about WIFI/NETWORK → [COMMAND: system_info | networksetup -getairportnetwork en0 | Check WiFi network]
- User asks about IP ADDRESS → [COMMAND: system_info | ifconfig en0 | inet | Check IP address]
- User asks about RUNNING APPS → [COMMAND: system_info | ps aux | head -20 | Check running processes]
- User asks about SYSTEM/MAC INFO → [COMMAND: system_info | system_profiler SPHardwareDataType | Check system info]
- User asks about UPTIME → [COMMAND: system_info | uptime | Check system uptime]
- User asks who is logged in → [COMMAND: system_info | whoami | Check current user]
- User asks about FILES on desktop/folder → [COMMAND: file_op | ls ~/Desktop | List files]
- User asks to OPEN any app → [COMMAND: open_app | open -a "App Name" | Open app]
- User asks to SEARCH something on Google → [COMMAND: open_app | open "https://www.google.com/search?q=QUERY" | Search Google]
- User asks to PLAY music/song/video → [COMMAND: play_youtube | song name | Play on YouTube]
- User asks to MESSAGE someone → [COMMAND: send_whatsapp | contact::message | Send WhatsApp]

Rules for commands:
- Always use macOS-compatible commands
- For opening apps, use: open -a "App Name"
- For opening websites, use: open "https://url.com"
- For playing songs/videos/music on YouTube, ALWAYS use type play_youtube with just the song/video name as the command
- For WhatsApp messages, ALWAYS use type send_whatsapp with format "contact_name::message". If user just says "open WhatsApp chat with X" without a message, use "contact_name::" (empty message after ::)
- IMPORTANT for WhatsApp: Use the EXACT name the user says for the contact. Spell names carefully - e.g., "Saqib" not "Sakib", use proper spelling. The contact name must match exactly how it's saved in the user's WhatsApp contacts
- For WhatsApp: Understand informal/natural speech like "open WhatsApp and Saqib and msg him how are you" → this means send "how are you" to Saqib. If the user mentions a contact but no clear message, ask them what message to send. If they mention both contact AND message, send it directly
- For searching Google: open "https://www.google.com/search?q=QUERY"
- For file listing, use: ls with appropriate path
- For system info, use appropriate macOS commands (date, pmset, df, system_profiler, etc.)
- NEVER use destructive commands (rm -rf /, sudo rm, etc.) unless specifically asked
- Always include a human-readable description
- Only include ONE command per response
- NEVER say "I don't have access to your device" or "I can't check that" - you ARE connected and CAN check

Example conversation:
User: "What time is it?"
Assistant: "Let me check the time for you! [COMMAND: system_info | date "+%I:%M %p, %A %B %d %Y" | Check current date and time]"

User: "What's today's date?"
Assistant: "Let me check! [COMMAND: system_info | date "+%A, %B %d, %Y" | Check current date]"

User: "How's my battery?"
Assistant: "Let me check your battery status! [COMMAND: system_info | pmset -g batt | Check battery level]"

User: "Open Chrome for me"
Assistant: "Sure! Let me open Google Chrome for you. [COMMAND: open_app | open -a "Google Chrome" | Open Google Chrome]"

User: "Play Channa Mereya"
Assistant: "Let me play Channa Mereya for you! [COMMAND: play_youtube | Channa Mereya | Play Channa Mereya on YouTube]"

User: "Open WhatsApp and text Mom saying I'll be late"
Assistant: "I'll send that message to Mom on WhatsApp! [COMMAND: send_whatsapp | Mom::I'll be late | Send message to Mom on WhatsApp]"

User: "Send a WhatsApp message to Ahmed saying hello bro"
Assistant: "Let me text Ahmed on WhatsApp! [COMMAND: send_whatsapp | Ahmed::hello bro | Send WhatsApp to Ahmed]"

User: "Open my WhatsApp chat with Ali"
Assistant: "Opening Ali's chat on WhatsApp! [COMMAND: send_whatsapp | Ali:: | Open WhatsApp chat with Ali]"

User: "open WhatsApp and Saqib and do a message to him"
Assistant: "Sure! What message would you like me to send to Saqib on WhatsApp?"

User: "send message to Saqib how are you"
Assistant: "Let me send that to Saqib! [COMMAND: send_whatsapp | Saqib::how are you | Send how are you to Saqib on WhatsApp]"

User: "message Saqib on WhatsApp saying I'll be there in 10 minutes"
Assistant: "Sending that to Saqib now! [COMMAND: send_whatsapp | Saqib::I'll be there in 10 minutes | Send message to Saqib on WhatsApp]"

User: "WhatsApp Saqib hello"
Assistant: "Texting Saqib on WhatsApp! [COMMAND: send_whatsapp | Saqib::hello | Send hello to Saqib on WhatsApp]"

User: "What's on my desktop?"
Assistant: "Let me check! [COMMAND: file_op | ls -la ~/Desktop | List all files on Desktop]"

User: "How much storage do I have left?"
Assistant: "Let me check your disk space! [COMMAND: system_info | df -h / | Check available disk space]"
`;
