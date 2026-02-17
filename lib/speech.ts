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
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "aborted") {
      // Normal - recognition was stopped programmatically, not an error
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
let cachedVoice: SpeechSynthesisVoice | null = null;

// Load and cache the preferred voice
function loadPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  voicesLoaded = true;

  // Try to pick a female English voice
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("fiona"))
  ) || voices.find((v) => v.lang.startsWith("en"));

  cachedVoice = preferred || null;
  return cachedVoice;
}

// Initialize voices - call this early
export function initVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Try loading immediately
  loadPreferredVoice();

  // Also listen for async voice loading (Chrome loads voices asynchronously)
  window.speechSynthesis.onvoiceschanged = () => {
    loadPreferredVoice();
  };
}

// Must be called from a user gesture (click/tap) to unlock TTS in Chrome
export function unlockTTS(): void {
  if (ttsUnlocked || typeof window === "undefined" || !window.speechSynthesis) return;

  // Load voices if not already loaded
  if (!voicesLoaded) loadPreferredVoice();

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
    if (!voicesLoaded) loadPreferredVoice();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    if (cachedVoice) {
      utterance.voice = cachedVoice;
    }

    utterance.rate = 1.0;
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
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = true;
      recognition.maxAlternatives = 3;

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
              const remaining = transcript.slice(matchEnd).trim();

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
