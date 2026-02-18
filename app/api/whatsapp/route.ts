import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Shared AppleScript for searching a contact and opening their chat
function searchContactScript(safeContact: string): string {
  return `
    tell application "WhatsApp" to activate
    delay 2

    tell application "System Events"
      tell process "WhatsApp"
        -- Press Escape to close any open panels
        key code 53
        delay 0.5

        -- Find and click the Search field
        set searchClicked to false

        -- Method 1: Look for search text field by placeholder
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

        -- Method 2: Search in groups/scroll areas
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

        -- Method 3: Fallback Cmd+F
        if not searchClicked then
          keystroke "f" using command down
          delay 0.5
        end if

        delay 1

        -- Search for the contact
        keystroke "a" using command down
        delay 0.2
        set the clipboard to "${safeContact}"
        keystroke "v" using command down
        delay 3

        -- Select first result
        key code 36
        delay 1
        key code 125
        delay 0.3
        key code 36
        delay 2
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { contact, message } = await request.json();

    if (!contact) {
      return NextResponse.json({ error: "No contact provided" }, { status: 400 });
    }

    const isVoiceCall = message === "__CALL__";
    const isVideoCall = message === "__VIDEO_CALL__";
    const isCall = isVoiceCall || isVideoCall;

    const safeContact = contact.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const safeMessage = (!isCall && message) ? message.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : "";

    let script: string;

    if (isCall) {
      // --- CALL SCRIPT ---
      // WhatsApp Mac button descriptions are:
      //   "Start voice call with {Name}" and "Start video call with {Name}"
      // These are deeply nested, so we use `entire contents` to find them.
      const callType = isVideoCall ? "video call" : "voice call";
      script = searchContactScript(safeContact) + `

            -- Now we're in the chat. Find the call button using entire contents.
            -- WhatsApp buttons have descriptions like "Start voice call with ContactName"
            set callClicked to false
            try
              set allElems to entire contents of window 1
              repeat with elem in allElems
                if not callClicked then
                  try
                    if role of elem is "AXButton" then
                      set d to ""
                      try
                        set d to description of elem as string
                      end try
                      if d contains "${callType}" or d contains "Start ${callType}" then
                        click elem
                        set callClicked to true
                      end if
                    end if
                  end try
                end if
              end repeat
            end try

            delay 1
          end tell
        end tell
      `;
    } else {
      // --- MESSAGE SCRIPT ---
      script = searchContactScript(safeContact) + `

            ${safeMessage ? `
            -- Click on the message input area
            try
              set msgFields to every text field of window 1
              if (count of msgFields) > 1 then
                click item (count of msgFields) of msgFields
                delay 0.3
              end if
            end try

            -- Paste and send message
            set the clipboard to "${safeMessage}"
            keystroke "v" using command down
            delay 0.5
            key code 36
            delay 0.5
            ` : ""}
          end tell
        end tell
      `;
    }

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 30000,
      shell: "/bin/zsh",
    });

    let output: string;
    if (isVoiceCall) {
      output = `Calling ${contact} on WhatsApp...`;
    } else if (isVideoCall) {
      output = `Starting video call with ${contact} on WhatsApp...`;
    } else if (safeMessage) {
      output = `Sent "${message}" to ${contact} on WhatsApp`;
    } else {
      output = `Opened chat with ${contact} on WhatsApp`;
    }

    return NextResponse.json({ success: true, output });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed";

    if (msg.includes("not allowed assistive access") || msg.includes("System Events")) {
      return NextResponse.json({
        success: false,
        output: "I need Accessibility permission to control WhatsApp. Please go to System Settings > Privacy & Security > Accessibility and add your terminal app.",
      });
    }

    return NextResponse.json({
      success: false,
      output: `Couldn't complete the WhatsApp action: ${msg}`,
    });
  }
}
