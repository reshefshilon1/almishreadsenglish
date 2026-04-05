import { useCallback, useRef, useEffect, useState } from "react";

// American English voices in priority order.
// "Google UK English Female" is intentionally excluded — it produces a British accent.
// Preference: named US voices → any en-US female → any en-US → British female fallback.
const VOICE_PRIORITY = [
  "Microsoft Zira Desktop - English (United States)",
  "Microsoft Zira - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny - English (United States)",
  "Microsoft Aria - English (United States)",
  "Samantha",  // macOS / iOS — American
];

// Normalize lang codes: "en_US", "en-us", "en-US" all → "en-us"
const normLang = (lang: string) => lang.replace("_", "-").toLowerCase();
const isEnUS = (v: SpeechSynthesisVoice) => normLang(v.lang) === "en-us";
const isEn   = (v: SpeechSynthesisVoice) => normLang(v.lang).startsWith("en");

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // 1. Named US priority list
  for (const name of VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // 2. Local en-US female (local voices are more reliable on mobile)
  const localUSFemale = voices.find(
    (v) => v.localService && isEnUS(v) &&
      /female|woman|girl|zira|jenny|aria|samantha/i.test(v.name)
  );
  if (localUSFemale) return localUSFemale;
  // 3. Any local en-US voice
  const localUS = voices.find((v) => v.localService && isEnUS(v));
  if (localUS) return localUS;
  // 4. Any en-US voice (including remote)
  const us = voices.find(isEnUS);
  if (us) return us;
  // 5. Any local English voice
  const localEn = voices.find((v) => v.localService && isEn(v));
  if (localEn) return localEn;
  // 6. Any English voice
  return voices.find(isEn) ?? null;
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
    // Failsafe: on some mobile browsers voiceschanged never fires.
    // Unblock the game after 1 s regardless, using whatever voices are available.
    const fallback = setTimeout(() => setVoicesReady(true), 1000);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      clearTimeout(fallback);
    };
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

    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

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
