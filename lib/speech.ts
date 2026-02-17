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
    if (event.error === "no-speech") {
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

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Stop any current speech
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  // Try to pick a female English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("fiona"))
  ) || voices.find((v) => v.lang.startsWith("en"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.volume = 1;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
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
  let shouldRestart = false;
  let isPaused = false;

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  // Word-boundary regex patterns for wake word detection
  // Only match "laila" as a standalone word, not inside other words
  const wakeRegex = /\b(laila|layla|leila|leyla)\b/i;

  function startListening() {
    if (!SpeechRecognitionAPI || isRunning || isPaused) return;

    // Don't start if Laila is currently speaking (would hear her own voice)
    if (isSpeaking()) {
      setTimeout(() => {
        if (shouldRestart && !isPaused) startListening();
      }, 1000);
      return;
    }

    recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Skip if paused or Laila is speaking
      if (isPaused || isSpeaking()) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;

        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        const confidence = event.results[i][0].confidence;

        // Require decent confidence to avoid garbage triggers
        if (confidence < 0.5) continue;

        // Check for wake word using word-boundary regex
        const match = transcript.match(wakeRegex);

        if (match) {
          // Extract text after the wake word
          const matchIndex = match.index!;
          const matchEnd = matchIndex + match[0].length;
          const remaining = transcript.slice(matchEnd).trim();

          // Stop listening and trigger wake
          stopListening();
          onWake(remaining);
          return;
        }
      }
    };

    recognition.onend = () => {
      isRunning = false;
      onListeningChange(false);
      // Auto-restart if we should keep listening
      if (shouldRestart && !isPaused) {
        setTimeout(() => {
          if (shouldRestart && !isPaused) startListening();
        }, 500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isRunning = false;
      // Silently restart on recoverable errors
      if (event.error === "no-speech" || event.error === "aborted") {
        if (shouldRestart && !isPaused) {
          setTimeout(() => {
            if (shouldRestart && !isPaused) startListening();
          }, 1000);
        }
      } else if (event.error === "not-allowed") {
        shouldRestart = false;
        onListeningChange(false);
      }
    };

    try {
      recognition.start();
      isRunning = true;
      onListeningChange(true);
    } catch {
      isRunning = false;
    }
  }

  function stopListening() {
    shouldRestart = false;
    isPaused = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
      recognition = null;
    }
    isRunning = false;
    onListeningChange(false);
  }

  function pauseListening() {
    isPaused = true;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
      recognition = null;
    }
    isRunning = false;
    onListeningChange(false);
  }

  function resumeListening() {
    if (!shouldRestart) return;
    isPaused = false;
    // Wait a moment for TTS to fully stop before resuming
    setTimeout(() => {
      if (shouldRestart && !isPaused && !isSpeaking()) {
        startListening();
      } else if (shouldRestart && !isPaused) {
        // Still speaking, try again later
        resumeListening();
      }
    }, 800);
  }

  return {
    start: () => {
      shouldRestart = true;
      isPaused = false;
      startListening();
    },
    stop: stopListening,
    pause: pauseListening,
    resume: resumeListening,
  };
}
