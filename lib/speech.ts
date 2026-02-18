// Common misrecognition corrections for Urdu/Hindi names and words
// Maps what speech-to-text produces → what user actually said
const SPEECH_CORRECTIONS: Record<string, string> = {
  // Names (lowercase keys)
  "aahat": "Ahad",
  "ahat": "Ahad",
  "a hot": "Ahad",
  "a hut": "Ahad",
  "jahid": "Zahid",
  "javed": "Zahid",
  "sahib": "Saqib",
  "sakib": "Saqib",
  "sick": "Saqib",
  "sucked": "Saqib",
  "soccer": "Saqib",
  "sake": "Saqib",
  "lyla": "Laila",
  "lila": "Laila",
  "leela": "Laila",
  "lighter": "Laila",
  // Urdu/Hindi words commonly misheard
  "cola": "kholo",
  "color": "kholo",
  "hollow": "hallo",
  "bought": "baat",
  "but": "baat",
  "car": "kar",
  "cargo": "karo",
  "caller": "karo",
  "bhejo": "bhejo",
  "badge": "bhej",
  "banner": "band",
  "band": "band",
  "gun": "gaana",
  "gonna": "gaana",
  "challah": "chala",
  "shallow": "chalo",
  "shall oh": "chalo",
  "butter": "batao",
  "motor": "batao",
  "walk": "waqt",
  "walked": "waqt",
  "sugar": "shukriya",
  "sugar yeah": "shukriya",
  "chop": "chup",
  "job": "chup",
};

// Apply corrections to transcript
function correctTranscript(text: string): string {
  let corrected = text;
  // Try full phrase corrections first
  const lower = text.toLowerCase().trim();
  if (SPEECH_CORRECTIONS[lower]) {
    return SPEECH_CORRECTIONS[lower];
  }
  // Try word-by-word corrections
  const words = corrected.split(/\s+/);
  const correctedWords = words.map((word) => {
    const key = word.toLowerCase().replace(/[.,!?]/g, "");
    return SPEECH_CORRECTIONS[key] || word;
  });
  return correctedWords.join(" ");
}

// Speech-to-Text using Web Speech API
export function createSpeechRecognition(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: string) => void
): SpeechRecognition | null {
  const SpeechRecognition =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognition) {
    onError("Speech recognition is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  // en-IN handles South Asian names & Hinglish much better than en-US
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    // Pick the best transcript from all alternatives
    let bestTranscript = "";
    let bestConfidence = 0;

    for (let alt = 0; alt < event.results[0].length; alt++) {
      const transcript = event.results[0][alt].transcript;
      const confidence = event.results[0][alt].confidence;
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestTranscript = transcript;
      }
    }

    // Apply name/word corrections
    const corrected = correctTranscript(bestTranscript);
    onResult(corrected);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "aborted") {
      onEnd();
      return;
    } else if (event.error === "no-speech") {
      onError("I didn't hear anything. Try again?");
    } else if (event.error === "not-allowed") {
      onError("Microphone access denied. Please allow microphone in browser settings.");
    } else {
      onError(`Speech error: ${event.error}`);
    }
    onEnd();
  };

  return recognition;
}

// Text-to-Speech using Web Speech API
let currentUtterance: SpeechSynthesisUtterance | null = null;
let ttsUnlocked = false;
let voicesLoaded = false;
let cachedEnglishVoice: SpeechSynthesisVoice | null = null;
let cachedHindiVoice: SpeechSynthesisVoice | null = null;
let speechRate = 1.0;

export function setSpeechRate(rate: number): void {
  speechRate = Math.max(0.5, Math.min(2.0, rate));
}

export function getSpeechRate(): number {
  return speechRate;
}

// Detect if text contains Urdu/Hindi/Roman Urdu
function detectLanguage(text: string): "hindi" | "english" {
  // Check for Urdu script (Arabic-based)
  if (/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return "hindi";
  // Check for Devanagari script (Hindi)
  if (/[\u0900-\u097F]/.test(text)) return "hindi";

  // Check for common Roman Urdu / Hinglish words
  const romanUrduWords = [
    "kya", "hai", "haal", "kaise", "ho", "karo", "karna", "kar",
    "mujhe", "mera", "meri", "mere", "tera", "teri", "tere",
    "acha", "accha", "theek", "thik", "nahi", "nahin", "nah",
    "bhai", "bhaiya", "yaar", "yar", "dost",
    "gaana", "gana", "bajao", "chalao", "chala", "chalo",
    "kholo", "band", "karo", "batao", "bhejo", "bhej",
    "waqt", "mausam", "shukriya", "dhanyavaad",
    "aur", "lekin", "kyun", "kyunke", "kahan", "kab", "kaun",
    "bohot", "bahut", "bohat", "zyada", "kam", "achha",
    "abhi", "baad", "pehle", "phir", "wahan", "yahan",
    "suno", "dekho", "bolo", "jao", "aao", "ruko",
    "chup", "bas", "haan", "ji", "bilkul",
    "khana", "pani", "ghar", "kaam", "dil", "pyar",
    "samajh", "pata", "lagao", "dikhao", "sunao",
    "WhatsApp pe", "pe call", "ko call", "ko message",
    "bata", "bataiye", "bataye", "dijiye", "kijiye",
    "raha", "rahi", "rahe", "wala", "wali", "wale",
  ];

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  let romanUrduCount = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?'"]/g, "");
    if (romanUrduWords.includes(cleanWord)) {
      romanUrduCount++;
    }
  }

  // If more than 30% of words are Roman Urdu/Hindi, use Hindi voice
  if (words.length > 0 && romanUrduCount / words.length > 0.3) return "hindi";
  // Or if at least 2 Roman Urdu words found in short text
  if (romanUrduCount >= 2) return "hindi";

  return "english";
}

// Load and cache voices for both languages
function loadVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;

  voicesLoaded = true;

  // English voice - prefer female
  cachedEnglishVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("fiona"))
  ) || voices.find((v) => v.lang.startsWith("en")) || null;

  // Hindi/Urdu voice - Lekha (hi_IN) is best for Urdu/Hindi on macOS
  cachedHindiVoice = voices.find(
    (v) => v.lang.startsWith("hi") &&
      v.name.toLowerCase().includes("lekha")
  ) || voices.find(
    (v) => v.lang.startsWith("hi")
  ) || voices.find(
    (v) => v.lang === "ur-PK" || v.lang === "ur_PK"
  ) || null;
}

// Get the right voice for the text
function getVoiceForText(text: string): SpeechSynthesisVoice | null {
  const lang = detectLanguage(text);
  if (lang === "hindi" && cachedHindiVoice) return cachedHindiVoice;
  return cachedEnglishVoice;
}

// Initialize voices - call this early
export function initVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  loadVoices();

  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices();
  };
}

// Must be called from a user gesture (click/tap) to unlock TTS in Chrome
export function unlockTTS(): void {
  if (ttsUnlocked || typeof window === "undefined" || !window.speechSynthesis) return;

  if (!voicesLoaded) loadVoices();

  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
  window.speechSynthesis.cancel();
  ttsUnlocked = true;
}

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  // Stop any current speech
  window.speechSynthesis.cancel();
  currentUtterance = null;

  // Chrome bug: need a small delay after cancel() before speak()
  // Otherwise the new utterance is silently dropped
  setTimeout(() => {
    // Ensure voices are loaded
    if (!voicesLoaded) loadVoices();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Pick the right voice based on text language
    const voice = getVoiceForText(text);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = speechRate;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    let started = false;
    let ended = false;

    const fireEnd = () => {
      if (ended) return;
      ended = true;
      currentUtterance = null;
      onEnd?.();
    };

    utterance.onstart = () => {
      started = true;
      onStart?.();
    };
    utterance.onend = fireEnd;
    utterance.onerror = (e) => {
      // "interrupted" happens when we cancel() to speak something new - not a real error
      if (e.error !== "interrupted") {
        console.warn("TTS error:", e.error);
      }
      fireEnd();
    };

    window.speechSynthesis.speak(utterance);

    // Chrome bug: speechSynthesis can get stuck, force a resume
    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 100);

    // Safety net: if TTS didn't start after 2 seconds, fire onEnd
    // This prevents the UI from getting stuck in "talking" state
    setTimeout(() => {
      if (!started && !ended) {
        console.warn("TTS did not start, firing safety onEnd");
        fireEnd();
      }
    }, 2000);

    // Chrome bug: long utterances get cut off at ~15 seconds
    // Workaround: periodically call resume() to keep it alive
    const keepAlive = setInterval(() => {
      if (ended || !window.speechSynthesis.speaking) {
        clearInterval(keepAlive);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

  }, 200);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined") return false;
  return window.speechSynthesis?.speaking ?? false;
}

// Wake word listener - continuously listens for "Laila"
// Uses word-boundary matching and confidence checks to avoid false triggers
export function createWakeWordListener(
  onWake: (remainingText: string) => void,
  onListeningChange: (isListening: boolean) => void
): { start: () => void; stop: () => void; pause: () => void; resume: () => void } {
  let recognition: SpeechRecognition | null = null;
  let isRunning = false;
  let isActive = false; // master switch - true when listener should be on
  let isPaused = false;

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Word-boundary regex patterns for wake word detection
  const wakeRegex = /\b(laila|layla|leila|leyla|lila|lyla)\b/i;

  function startListening() {
    if (!SpeechRecognitionAPI || isRunning || isPaused || !isActive) return;

    // Don't start if Laila is currently speaking
    if (isSpeaking()) {
      setTimeout(() => {
        if (isActive && !isPaused) startListening();
      }, 1000);
      return;
    }

    try {
      recognition = new SpeechRecognitionAPI();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.continuous = true;
      recognition.maxAlternatives = 5;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (isPaused || isSpeaking()) return;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue;

          // Check all alternatives for the wake word
          for (let alt = 0; alt < event.results[i].length; alt++) {
            const transcript = event.results[i][alt].transcript.toLowerCase().trim();
            const confidence = event.results[i][alt].confidence;

            if (confidence < 0.3) continue;

            const match = transcript.match(wakeRegex);

            if (match) {
              const matchEnd = match.index! + match[0].length;
              const rawRemaining = transcript.slice(matchEnd).trim();
              // Apply corrections to the remaining text after wake word
              const remaining = correctTranscript(rawRemaining);

              // Stop recognition but keep isActive true so we can restart
              if (recognition) {
                try { recognition.stop(); } catch { /* ok */ }
                recognition = null;
              }
              isRunning = false;
              onListeningChange(false);

              onWake(remaining);
              return;
            }
          }
        }
      };

      recognition.onend = () => {
        isRunning = false;
        onListeningChange(false);
        // Auto-restart if still active
        if (isActive && !isPaused) {
          setTimeout(() => {
            if (isActive && !isPaused) startListening();
          }, 300);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        isRunning = false;
        if (event.error === "no-speech" || event.error === "aborted") {
          if (isActive && !isPaused) {
            setTimeout(() => {
              if (isActive && !isPaused) startListening();
            }, 500);
          }
        } else if (event.error === "not-allowed") {
          console.warn("Microphone permission denied for wake word listener");
          isActive = false;
          onListeningChange(false);
        }
      };

      recognition.start();
      isRunning = true;
      onListeningChange(true);
    } catch {
      isRunning = false;
      // Retry after a delay
      if (isActive && !isPaused) {
        setTimeout(() => startListening(), 2000);
      }
    }
  }

  function stopListening() {
    isActive = false;
    isPaused = false;
    if (recognition) {
      try { recognition.stop(); } catch { /* ok */ }
      recognition = null;
    }
    isRunning = false;
    onListeningChange(false);
  }

  function pauseListening() {
    isPaused = true;
    if (recognition) {
      try { recognition.stop(); } catch { /* ok */ }
      recognition = null;
    }
    isRunning = false;
    onListeningChange(false);
  }

  function resumeListening() {
    if (!isActive) return;
    isPaused = false;
    // Wait for TTS to fully stop
    setTimeout(() => {
      if (isActive && !isPaused && !isSpeaking()) {
        startListening();
      } else if (isActive && !isPaused) {
        // Still speaking, try again
        resumeListening();
      }
    }, 600);
  }

  return {
    start: () => {
      isActive = true;
      isPaused = false;
      startListening();
    },
    stop: stopListening,
    pause: pauseListening,
    resume: resumeListening,
  };
}
