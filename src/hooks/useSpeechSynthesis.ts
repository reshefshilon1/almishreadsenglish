import { useCallback, useRef, useEffect, useState } from "react";

// Female English voices in priority order.
// "Google US English" is intentionally excluded — it maps to a male voice on many systems.
const VOICE_PRIORITY = [
  "Google UK English Female",
  "Microsoft Zira Desktop - English (United States)",
  "Microsoft Zira - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny - English (United States)",
  "Microsoft Aria - English (United States)",
  "Samantha",  // macOS / iOS
  "Karen",     // macOS Australian
  "Victoria",  // macOS
  "Moira",     // macOS Irish
  "Tessa",     // macOS South African
  "Fiona",     // macOS Scottish
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 1. Try the named priority list first
  for (const name of VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // 2. Fall back to any English voice whose name suggests "female"
  const female = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /female|woman|girl|zira|jenny|aria|samantha|karen|victoria|moira|tessa|fiona/i.test(
        v.name
      )
  );
  if (female) return female;
  // 3. Any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function useSpeechSynthesis() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const activeCallRef = useRef(0);
  const [voicesReady, setVoicesReady] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      voicesRef.current = v;
      if (v.length > 0) setVoicesReady(true);
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const cancel = useCallback(() => {
    activeCallRef.current++;
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }

    // Re-try loading voices if not yet available (Chrome async voices)
    if (voicesRef.current.length === 0) {
      voicesRef.current = window.speechSynthesis.getVoices();
    }

    const callId = ++activeCallRef.current;
    const isActive = () => activeCallRef.current === callId;

    let endFired = false;
    const fireEnd = () => {
      if (!isActive() || endFired) return;
      endFired = true;
      onEnd?.();
    };

    window.speechSynthesis.cancel();
    // Chrome Android fix: cancel() can leave synthesis in a paused/broken state.
    // resume() resets it before the next speak() call.
    window.speechSynthesis.resume();

    const voice = pickVoice(voicesRef.current);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    utterance.lang = "en-US";
    if (voice) utterance.voice = voice;

    utterance.onend = fireEnd;
    utterance.onerror = (e) => {
      console.warn("TTS error:", e.error, "text:", text);
      fireEnd();
    };

    // Watchdog: if onend never fires (Chrome bug), advance after estimated duration
    const wordCount = text.split(/\s+/).length;
    setTimeout(fireEnd, wordCount * 600 + 3000);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, cancel, voicesReady };
}
