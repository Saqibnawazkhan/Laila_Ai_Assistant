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
export function createWakeWordListener(
  onWake: (remainingText: string) => void,
  onListeningChange: (isListening: boolean) => void
): { start: () => void; stop: () => void } {
  let recognition: SpeechRecognition | null = null;
  let isRunning = false;
  let shouldRestart = false;

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  function startListening() {
    if (!SpeechRecognitionAPI || isRunning) return;

    recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;

        // Check all alternatives for the wake word
        for (let j = 0; j < event.results[i].length; j++) {
          const transcript = event.results[i][j].transcript.toLowerCase().trim();

          // Check if "laila" (or common misheard variants) is in the transcript
          const wakePatterns = ["laila", "layla", "leila", "leyla", "lyla"];
          const matchedPattern = wakePatterns.find((p) => transcript.includes(p));

          if (matchedPattern) {
            // Extract text after the wake word
            const idx = transcript.indexOf(matchedPattern);
            const remaining = transcript.slice(idx + matchedPattern.length).trim();

            // Pause wake word listening while handling the command
            stopListening();
            onWake(remaining);
            return;
          }
        }
      }
    };

    recognition.onend = () => {
      isRunning = false;
      onListeningChange(false);
      // Auto-restart if we should keep listening
      if (shouldRestart) {
        setTimeout(() => {
          if (shouldRestart) startListening();
        }, 300);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      isRunning = false;
      // Silently restart on recoverable errors
      if (event.error === "no-speech" || event.error === "aborted") {
        if (shouldRestart) {
          setTimeout(() => {
            if (shouldRestart) startListening();
          }, 500);
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

  return {
    start: () => {
      shouldRestart = true;
      startListening();
    },
    stop: stopListening,
  };
}
