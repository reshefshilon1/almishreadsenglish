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
  onSilenceTimeout?: () => void,
  onNoResult?: () => void
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonically increasing session counter — used to discard stale callbacks
  const sessionIdRef = useRef(0);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    silenceTimerRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    clearTimers();
    // Invalidate current session so its pending onend/onerror won't fire callbacks
    sessionIdRef.current++;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearTimers]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    // Stop any previous session cleanly — its onend will be ignored via session ID
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    // Each call gets a unique session ID; stale callbacks check against this
    const mySessionId = ++sessionIdRef.current;
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    // Session-local handled flag prevents onend calling onNoResult after onresult
    let handled = false;

    const isCurrentSession = () => sessionIdRef.current === mySessionId;

    recognition.onresult = (event: any) => {
      if (!isCurrentSession() || handled) return;
      handled = true;
      clearTimers();
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
      onResult?.(result);
    };

    recognition.onerror = (event: any) => {
      console.log("Speech error:", event.error);
      if (!isCurrentSession()) return;
      clearTimers();
      setIsListening(false);
      // onend fires after onerror and will call onNoResult if still unhandled
    };

    recognition.onend = () => {
      if (!isCurrentSession()) return;
      clearTimers();
      setIsListening(false);
      if (!handled) {
        handled = true;
        onNoResult?.();
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);

      // At 4.5 s of silence: prompt the child
      silenceTimerRef.current = setTimeout(() => {
        if (isCurrentSession()) onSilenceTimeout?.();
      }, 4500);

      // At 9 s: stop — onend will fire and call onNoResult
      maxTimerRef.current = setTimeout(() => {
        if (!isCurrentSession()) return;
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
        setIsListening(false);
      }, 9000);
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  }, [SpeechRecognition, onResult, onSilenceTimeout, onNoResult, clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
      sessionIdRef.current++; // invalidate on unmount
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [clearTimers]);

  return { isListening, transcript, isSupported, startListening, stopListening };
}
