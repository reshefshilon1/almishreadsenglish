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
    console.log("[TTS] unlock triggered, pending:", _pendingSpeaks.length);
    try {
      const primer = new SpeechSynthesisUtterance(" ");
      primer.volume = 0;
      primer.onend   = () => console.log("[TTS] primer onend");
      primer.onerror = (e) => console.log("[TTS] primer onerror:", e.error);
      window.speechSynthesis.speak(primer);
      console.log("[TTS] primer speak() called");
    } catch (e) {
      console.log("[TTS] primer exception:", e);
    }
    _flushPending();
  };
  document.addEventListener("touchstart", _unlock, { once: true, passive: true });
  document.addEventListener("click",      _unlock, { once: true });
  console.log("[TTS] module loaded, unlock listeners attached");
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
      console.log("[TTS] voices loaded:", v.length, v.slice(0, 5).map((x) => x.name));
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
      const ss = window.speechSynthesis;
      console.log(`[TTS] doSpeak: "${text.slice(0, 40)}" | speaking=${ss.speaking} paused=${ss.pending}`);

      ss.cancel();
      ss.resume();

      const voice = lang === "he" ? pickHebrewVoice(voicesRef.current) : pickVoice(voicesRef.current);
      console.log("[TTS] voice:", voice?.name ?? "none (default)");

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      utterance.lang = lang === "he" ? "he-IL" : "en-US";
      if (voice) utterance.voice = voice;

      utterance.onstart = () => console.log("[TTS] onstart:", text.slice(0, 40));
      utterance.onend   = () => { console.log("[TTS] onend:",   text.slice(0, 40)); fireEnd(); };
      utterance.onerror = (e) => { console.log("[TTS] onerror:", e.error, text.slice(0, 40)); fireEnd(); };

      const wordCount = text.split(/\s+/).length;
      const watchdog = wordCount * 600 + 3000;
      console.log("[TTS] watchdog in", watchdog, "ms");
      setTimeout(fireEnd, watchdog);

      ss.speak(utterance);
      console.log("[TTS] speak() called, speaking now:", ss.speaking);
    };

    if (_speechUnlocked) {
      doSpeak();
    } else {
      console.log("[TTS] not unlocked yet, queuing:", text.slice(0, 40));
      _pendingSpeaks.push(doSpeak);
    }
  }, [lang]);

  return { speak, cancel, voicesReady };
}
