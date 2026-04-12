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
// Ordered by preference: feminine American accent first, then other English voices.
// Names must match window.speechSynthesis.getVoices() exactly (case-sensitive).
const VOICE_PRIORITY = [
  // ── Android Chrome ────────────────────────────────────────────────────────
  "Google US English",                                    // Android / Chrome desktop — female-sounding, en-US
  // ── Windows (feminine American) ───────────────────────────────────────────
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Zira Desktop - English (United States)",
  "Microsoft Zira - English (United States)",
  "Microsoft Jenny - English (United States)",
  "Microsoft Aria - English (United States)",
  // ── macOS / iOS (feminine American) ───────────────────────────────────────
  "Samantha",   // en-US — default macOS/iOS female American
  "Nicky",      // en-US — iOS
  "Ava",        // en-US — iOS
  "Allison",    // en-US — iOS
  "Susan",      // en-US — iOS
  "Zoe",        // en-US — iOS
  // ── Other English female voices (non-American, last resort) ───────────────
  "Google UK English Female",
  "Karen",      // macOS en-AU
  "Victoria",   // macOS en-AU
  "Moira",      // macOS en-IE
  "Tessa",      // macOS en-ZA
  "Fiona",      // macOS en-GB
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // Log all English voices so we can see what's available on this device
  const enVoices = voices.filter((v) => v.lang.startsWith("en"));
  console.log("[TTS] English voices available:", enVoices.map((v) => `${v.name} (${v.lang})`).join(", "));

  // Prefer en-US female voices to avoid lang mismatch and get the right accent
  const femaleUS = voices.find(
    (v) =>
      v.lang === "en-US" &&
      /female|woman|girl|zira|jenny|aria|samantha|nicky|ava|allison|susan|zoe/i.test(v.name)
  );
  if (femaleUS) return femaleUS;
  // Any en-US voice beats a non-US English voice (avoids lang="en-AU" mismatch)
  const anyUS = voices.find((v) => v.lang === "en-US");
  if (anyUS) return anyUS;
  // Return null — let the browser pick its own default for utterance.lang="en-US"
  // rather than forcing a voice that may cause synthesis-failed
  return null;
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
      console.log("[TTS] voice:", voice?.name ?? "none (default)", "| voice.lang:", voice?.lang ?? "n/a");

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.05;
      utterance.volume = 1;
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;   // must match the voice — mismatches cause synthesis-failed on iOS
      } else {
        utterance.lang = lang === "he" ? "he-IL" : "en-US";
      }

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
