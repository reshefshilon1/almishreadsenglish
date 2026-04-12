import { useCallback, useRef, useEffect, useState } from "react";

// ── Mobile unlock ─────────────────────────────────────────────────────────────
// Chrome Android requires speechSynthesis.speak() to be called from a user
// gesture before the API will produce any audio. Game intros fire from a
// useEffect (not a gesture), so they're silently ignored until unlocked.
// We listen for the very first touchstart/click and play a near-silent
// utterance to unlock the API for the rest of the session.
let _speechUnlocked = false;
const _pendingSpeaks: Array<() => void> = [];

function _flushPending() {
  const queue = _pendingSpeaks.splice(0);
  queue.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  const _unlock = () => {
    if (_speechUnlocked) return;
    _speechUnlocked = true;
    try {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      window.speechSynthesis.speak(primer);
    } catch {}
    _flushPending();
  };
  // touchstart fires before click — catches the gesture that navigates to the game
  document.addEventListener("touchstart", _unlock, { once: true, passive: true });
  document.addEventListener("click",      _unlock, { once: true });
}

// ── Voice selection ───────────────────────────────────────────────────────────
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
  for (const name of VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  const female = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /female|woman|girl|zira|jenny|aria|samantha|karen|victoria|moira|tessa|fiona/i.test(v.name)
  );
  if (female) return female;
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

const HEBREW_VOICE_PRIORITY = [
  "Google Hebrew",
  "Carmit",  // macOS/iOS
];

function pickHebrewVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of HEBREW_VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("he")) ?? null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSpeechSynthesis(lang: "en" | "he" = "en") {
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

    const doSpeak = () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const voice = lang === "he" ? pickHebrewVoice(voicesRef.current) : pickVoice(voicesRef.current);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.lang = lang === "he" ? "he-IL" : "en-US";
      if (voice) utterance.voice = voice;

      utterance.onend = fireEnd;
      utterance.onerror = (e) => {
        console.warn("TTS error:", e.error, "text:", text);
        fireEnd();
      };

      const wordCount = text.split(/\s+/).length;
      setTimeout(fireEnd, wordCount * 600 + 3000);

      window.speechSynthesis.speak(utterance);
    };

    if (_speechUnlocked) {
      doSpeak();
    } else {
      // Defer until the user's first gesture unlocks the speech synthesis API
      _pendingSpeaks.push(doSpeak);
    }
  }, [lang]);

  return { speak, cancel, voicesReady };
}
