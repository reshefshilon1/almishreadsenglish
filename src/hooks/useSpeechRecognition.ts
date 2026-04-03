import { useState, useCallback, useRef, useEffect } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(
  onResult?: (transcript: string) => void,
  onSilenceTimeout?: () => void
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
  }, []);

  const stopListening = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, [clearTimers]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    setTranscript("");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      clearTimers();
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
      onResult?.(result);
    };

    recognition.onerror = (event: any) => {
      console.log("Speech error:", event.error);
      if (event.error === "no-speech") {
        onSilenceTimeout?.();
      }
      setIsListening(false);
      clearTimers();
    };

    recognition.onend = () => {
      setIsListening(false);
      clearTimers();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);

      // Silence prompt after 4.5 seconds
      silenceTimerRef.current = setTimeout(() => {
        onSilenceTimeout?.();
      }, 4500);

      // Max duration 9 seconds
      maxTimerRef.current = setTimeout(() => {
        stopListening();
      }, 9000);
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  }, [SpeechRecognition, onResult, onSilenceTimeout, clearTimers, stopListening]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [clearTimers]);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
