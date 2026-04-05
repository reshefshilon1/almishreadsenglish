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

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 1. Try the named US priority list first
  for (const name of VOICE_PRIORITY) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // 2. Any en-US voice whose name suggests "female"
  const usFemale = voices.find(
    (v) =>
      v.lang === "en-US" &&
      /female|woman|girl|zira|jenny|aria|samantha/i.test(v.name)
  );
  if (usFemale) return usFemale;
  // 3. Any en-US voice (American accent over British female)
  const us = voices.find((v) => v.lang === "en-US");
  if (us) return us;
  // 4. Any English female voice (last resort)
  const anyFemale = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      /female|woman|girl|zira|jenny|aria|samantha|karen|victoria|moira|tessa|fiona/i.test(
        v.name
      )
  );
  if (anyFemale) return anyFemale;
  // 5. Any English voice
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
