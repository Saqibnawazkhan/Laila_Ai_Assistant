import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { contact, message } = await request.json();

    if (!contact) {
      return NextResponse.json({ error: "No contact provided" }, { status: 400 });
    }

    // Escape special characters for AppleScript strings
    const safeContact = contact.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeMessage = message ? message.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : "";

    // AppleScript for native macOS WhatsApp app
    // Clicks directly on the Search field instead of using Cmd+N
    // Uses clipboard paste to avoid typos
    const script = `
      tell application "WhatsApp" to activate
      delay 2

      tell application "System Events"
        tell process "WhatsApp"
          -- Press Escape to close any open panels
          key code 53
          delay 0.5

          -- Try to find and click the Search field in the native WhatsApp Mac app
          -- Method 1: Look for the search text field by placeholder text
          set searchClicked to false
          try
            set allTextFields to every text field of window 1
            repeat with aField in allTextFields
              set pVal to ""
              try
                set pVal to value of attribute "AXPlaceholderValue" of aField
              end try
              if pVal contains "Search" or pVal contains "search" then
                click aField
                set searchClicked to true
                exit repeat
              end if
            end repeat
          end try

          -- Method 2: If search field not found directly, try searching in groups/scroll areas
          if not searchClicked then
            try
              set allGroups to every group of window 1
              repeat with aGroup in allGroups
                try
                  set groupFields to every text field of aGroup
                  repeat with gField in groupFields
                    set pVal2 to ""
                    try
                      set pVal2 to value of attribute "AXPlaceholderValue" of gField
                    end try
                    if pVal2 contains "Search" or pVal2 contains "search" then
                      click gField
                      set searchClicked to true
                      exit repeat
                    end if
                  end repeat
                end try
                if searchClicked then exit repeat
              end repeat
            end try
          end if

          -- Method 3: Fallback - try Cmd+F for search
          if not searchClicked then
            keystroke "f" using command down
            delay 0.5
          end if

          delay 1

          -- Clear any existing text and paste the contact name
          keystroke "a" using command down
          delay 0.2
          set the clipboard to "${safeContact}"
          keystroke "v" using command down
          delay 3

          -- Select the first search result
          -- In native WhatsApp Mac, press Enter from search to open first result
          key code 36
          delay 1

          -- If Enter didn't work, try down arrow then Enter
          -- (this handles both old and new WhatsApp versions)
          key code 125
          delay 0.3
          key code 36
          delay 2

          ${message ? `
          -- Click on the message input area to make sure we're typing there
          -- Try to find the message text field
          try
            set msgFields to every text field of window 1
            if (count of msgFields) > 1 then
              click item (count of msgFields) of msgFields
              delay 0.3
            end if
          end try

          -- Paste message using clipboard (avoids typos)
          set the clipboard to "${safeMessage}"
          keystroke "v" using command down
          delay 0.5

          -- Press Enter to send
          key code 36
          delay 0.5
          ` : ""}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000,
      shell: "/bin/zsh",
    });

    return NextResponse.json({
      success: true,
      output: message
        ? `Sent "${message}" to ${contact} on WhatsApp`
        : `Opened chat with ${contact} on WhatsApp`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";

    // Check if it's an accessibility permission issue
    if (msg.includes("not allowed assistive access") || msg.includes("System Events")) {
      return NextResponse.json({
        success: false,
        output: "I need Accessibility permission to control WhatsApp. Please go to System Settings > Privacy & Security > Accessibility and add your terminal app.",
      });
    }

    return NextResponse.json({
      success: false,
      output: `Couldn't send the message: ${msg}`,
    });
  }
}
