import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Volume2, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import { LETTER_MAP, LEVELS, getDistractors } from "@/lib/gameData";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSettings } from "@/contexts/SettingsContext";
import { getNarration } from "@/lib/narration";

// ── Card color palette ───────────────────────────────────────────────────────
const CARD_COLORS = [
  { bg: "#A7D8FF", shadow: "#7db8e8" }, // blue
  { bg: "#FFD6A5", shadow: "#e8b87a" }, // peach
  { bg: "#B8F2E6", shadow: "#85d4c0" }, // mint
  { bg: "#FFF3B0", shadow: "#e8d47a" }, // yellow
];

// ── Types ────────────────────────────────────────────────────────────────────
type CardState = "default" | "correct" | "wrong" | "highlighted" | "disabled";
type MascotState = "idle" | "happy" | "thinking" | "dancing";
// "intro"    = welcome message before first card
// "asking"   = cards visible, waiting for child to tap
// "roundEnd" = all letters done, celebration screen
type GamePhase = "intro" | "asking" | "roundEnd";

// ── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Web Audio sound effects ──────────────────────────────────────────────────
// AudioContext is created lazily inside a user-gesture handler to satisfy
// browser autoplay policies (especially iOS Safari).
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx || _audioCtx.state === "closed") {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
}

function playClick(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 820;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}

function playBoop(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [360, 270].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.11);
  });
}

function playChime(): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    const t = ctx.currentTime + i * 0.09;
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    osc.start(t);
    osc.stop(t + 0.75);
  });
}

// ── Component ────────────────────────────────────────────────────────────────
const GameScreen = () => {
  const { gameType, level } = useParams<{ gameType: string; level: string }>();
  const navigate = useNavigate();
  // voicesReady: true once the browser has loaded its TTS voice list.
  // We gate the intro narration on this so the first utterance always uses
  // the selected female voice rather than whatever default fires before voices load.
  const { settings } = useSettings();
  const { playerName, narrationLang, gender } = settings;
  const n = useMemo(
    () => getNarration(narrationLang, playerName, gender),
    [narrationLang, playerName, gender]
  );
  const { speak, cancel, voicesReady } = useSpeechSynthesis(narrationLang);

  const isUppercase = gameType === "uppercase";
  const levelNum = parseInt(level ?? "1");
  const levelLetters = LEVELS[levelNum] ?? LEVELS[1];

  const [queue] = useState<string[]>(() => shuffle(levelLetters));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [incorrectLetters, setIncorrectLetters] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [inputDisabled, setInputDisabled] = useState(true);
  // Emoji of the animal that pops in after a correct answer
  const [currentAnimal, setCurrentAnimal] = useState<{ emoji: string; name: string } | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);

  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalStarsRef = useRef(0);
  totalStarsRef.current = totalStars;
  const nextButtonFallbackRef = useRef<number | null>(null);
  const inputFallbackRef = useRef<number | null>(null);
  const inputBlockedRef = useRef(true); // synchronous lock — updated immediately, unlike React state
  const phaseRef = useRef<GamePhase>("intro");
  phaseRef.current = phase;

  const activeQueue = reviewMode ? reviewQueue : queue;
  const currentLetter = activeQueue[currentIndex] ?? null;

  // ── Timer helpers ──────────────────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    replayTimerRef.current = null;
    idleTimerRef.current = null;
  }, []);

  const armIdleTimers = useCallback(
    (letter: string) => {
      clearTimers();
      replayTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "asking") {
          speak(n.findLetter(letter.toUpperCase()));
        }
      }, 5000);
      idleTimerRef.current = setTimeout(() => {
        if (phaseRef.current === "asking") {
          setMascotState("thinking");
          speak(n.letsTry);
        }
      }, 8000);
    },
    [clearTimers, speak, n]
  );

  // ── Advance to next letter ─────────────────────────────────────────────────
  const nextLetter = useCallback(() => {
    if (nextButtonFallbackRef.current !== null) {
      clearTimeout(nextButtonFallbackRef.current);
      nextButtonFallbackRef.current = null;
    }
    if (inputFallbackRef.current !== null) {
      clearTimeout(inputFallbackRef.current);
      inputFallbackRef.current = null;
    }
    clearTimers();
    setCurrentAnimal(null);
    setShowNextButton(false);
    const nextIdx = currentIndex + 1;

    if (nextIdx >= activeQueue.length) {
      if (!reviewMode && incorrectLetters.length > 0) {
        setReviewMode(true);
        setReviewQueue(shuffle([...incorrectLetters]));
        setIncorrectLetters([]);
        setCurrentIndex(0);
        setAttempts(0);
        inputBlockedRef.current = true;
        setInputDisabled(true);
        setPhase("asking");
        setMascotState("idle");
      } else {
        setPhase("roundEnd");
        setMascotState("dancing");
        speak(n.youDidIt(totalStarsRef.current));
      }
    } else {
      setCurrentIndex(nextIdx);
      setAttempts(0);
      inputBlockedRef.current = true;
      setInputDisabled(true);
      setPhase("asking");
      setMascotState("idle");
    }
  }, [currentIndex, activeQueue, reviewMode, incorrectLetters, clearTimers, speak, n]);

  // ── Card tap handler ───────────────────────────────────────────────────────
  const handleCardTap = useCallback(
    (tappedLetter: string) => {
      if (inputBlockedRef.current || phase !== "asking" || !currentLetter) return;
      if (cardStates[tappedLetter] === "disabled") return;

      inputBlockedRef.current = true; // lock synchronously before any await/setState
      setInputDisabled(true);
      clearTimers();
      playClick();

      if (tappedLetter === currentLetter) {
        // ── Correct ────────────────────────────────────────────────────────
        setTotalStars((s) => s + 1);
        setCardStates((cs) => ({ ...cs, [tappedLetter]: "correct" }));
        setMascotState("happy");
        playChime();

        if (!reviewMode && attempts > 0) {
          setIncorrectLetters((prev) => prev.filter((l) => l !== currentLetter));
        }

        const letterName = currentLetter.toUpperCase();
        const letterData = LETTER_MAP[letterName];
        const animal = letterData?.animal ?? "";
        const emoji = letterData?.emoji ?? "";

        setTimeout(() => {
          let fired = false;
          const showNext = () => {
            if (fired) return;
            fired = true;
            if (nextButtonFallbackRef.current !== null) {
              clearTimeout(nextButtonFallbackRef.current);
              nextButtonFallbackRef.current = null;
            }
            setShowNextButton(true);
          };
          speak(n.veryGoodLetter(letterName), () => {
            if (emoji) {
              setCurrentAnimal({ emoji, name: animal });
            }
            setTimeout(() => {
              speak(n.letterIsFor(letterName, animal), showNext);
            }, 350);
          });
          nextButtonFallbackRef.current = window.setTimeout(showNext, 5000);
        }, 300);
      } else {
        // ── Wrong ──────────────────────────────────────────────────────────
        playBoop();
        setCardStates((cs) => ({ ...cs, [tappedLetter]: "wrong" }));
        setMascotState("thinking");

        if (attempts === 0) {
          if (!reviewMode) {
            setIncorrectLetters((prev) =>
              prev.includes(currentLetter) ? prev : [...prev, currentLetter]
            );
          }
          setTimeout(() => {
            let fired = false;
            const afterNiceTry = () => {
              if (fired) return;
              fired = true;
              if (inputFallbackRef.current !== null) {
                clearTimeout(inputFallbackRef.current);
                inputFallbackRef.current = null;
              }
              setCardStates((cs) => ({ ...cs, [tappedLetter]: "default" }));
              setAttempts(1);
              setMascotState("idle");
              setTimeout(() => {
                speak(n.findLetter(currentLetter.toUpperCase()));
                inputBlockedRef.current = false;
                setInputDisabled(false);
                armIdleTimers(currentLetter);
              }, 250);
            };
            speak(n.niceTry, afterNiceTry);
            inputFallbackRef.current = window.setTimeout(afterNiceTry, 4000);
          }, 300);
        } else {
          // Second wrong attempt — highlight the correct card
          setTimeout(() => {
            let fired = false;
            const afterTapCorrect = () => {
              if (fired) return;
              fired = true;
              if (inputFallbackRef.current !== null) {
                clearTimeout(inputFallbackRef.current);
                inputFallbackRef.current = null;
              }
              setCardStates((cs) => {
                const next: Record<string, CardState> = {};
                for (const l of Object.keys(cs)) {
                  if (l === currentLetter) next[l] = "highlighted";
                  else if (l === tappedLetter) next[l] = "disabled";
                  else next[l] = cs[l] === "default" ? "default" : "disabled";
                }
                return next;
              });
              inputBlockedRef.current = false;
              setInputDisabled(false);
              setMascotState("idle");
            };
            speak(n.tapCorrectLetter, afterTapCorrect);
            inputFallbackRef.current = window.setTimeout(afterTapCorrect, 4000);
          }, 300);
        }
      }
    },
    [
      phase,
      currentLetter,
      cardStates,
      attempts,
      reviewMode,
      clearTimers,
      speak,
      nextLetter,
      armIdleTimers,
      n,
    ]
  );

  const handleReplay = useCallback(() => {
    if (!currentLetter || phase !== "asking") return;
    clearTimers();
    speak(n.findLetter(currentLetter.toUpperCase()));
    armIdleTimers(currentLetter);
  }, [currentLetter, phase, clearTimers, speak, armIdleTimers, n]);

  // ── Intro: wait for voices, then play welcome message ─────────────────────
  useEffect(() => {
    if (phase !== "intro" || !voicesReady) return;
    setInputDisabled(true);
    speak(n.letsFind, () => {
      setPhase("asking");
    });
  }, [phase, speak, voicesReady, n]);

  // ── Asking: generate options + play instruction on each new letter ─────────
  useEffect(() => {
    if (phase !== "asking" || !currentLetter) return;

    const distractors = getDistractors(currentLetter, 3);
    const opts = shuffle([currentLetter, ...distractors]);
    setOptions(opts);
    setCardStates(Object.fromEntries(opts.map((l) => [l, "default" as CardState])));

    const timer = setTimeout(() => {
      speak(n.findLetter(currentLetter.toUpperCase()));
      armIdleTimers(currentLetter);
      inputBlockedRef.current = false;
      setInputDisabled(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentLetter]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimers();
      cancel();
    };
  }, [clearTimers, cancel]);

  const mascotClass =
    mascotState === "dancing"
      ? "mascot-dance"
      : mascotState === "happy"
      ? "mascot-happy"
      : mascotState === "thinking"
      ? "mascot-think"
      : "mascot-bounce";

  // ── Round-end screen ───────────────────────────────────────────────────────
  if (phase === "roundEnd") {
    const confettiColors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6BD6"];
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center px-4 bg-background overflow-hidden relative">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              backgroundColor: confettiColors[i % confettiColors.length],
              left: `${4 + (i * 4.2) % 92}%`,
              top: `${Math.random() * 30}%`,
              animationDelay: `${i * 0.06}s`,
              animationDuration: `${1.2 + (i % 4) * 0.2}s`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
          />
        ))}

        <div className="mascot-dance mb-4 relative z-10">
          <img
            src={capybaraMascot}
            alt="Dancing capybara"
            className="w-44 h-44 object-contain drop-shadow-lg"
          />
        </div>

        <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center relative z-10">
          {Array.from({ length: Math.min(totalStars, 20) }).map((_, i) => (
            <Star
              key={i}
              className="w-8 h-8 star-icon fill-current confetti-star"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>

        <h2 className="font-display text-3xl text-foreground text-center mb-1 relative z-10">
          You did it, {playerName}!
        </h2>
        <p className="font-body text-xl text-muted-foreground mb-8 relative z-10">
          You won {totalStars} stars!
        </p>

        <button
          onClick={() => navigate("/")}
          className="level-btn bg-game-green text-foreground flex items-center gap-2 text-xl relative z-10"
        >
          🏠 Go Home
        </button>
      </div>
    );
  }

  // ── Main game screen ───────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => {
            cancel();
            clearTimers();
            navigate(`/levels/${gameType}`);
          }}
          className="active:scale-95 transition-transform p-1 rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="w-7 h-7 text-muted-foreground" />
        </button>

        <div className={mascotClass}>
          <img
            src={capybaraMascot}
            alt="Capybara mascot"
            className="w-14 h-14 object-contain drop-shadow-md"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-game-yellow/40 rounded-full px-3 py-1.5">
          <Star className="w-5 h-5 star-icon fill-current" />
          {/* key={totalStars} remounts the span on every change, re-triggering the bump animation */}
          <span key={totalStars} className="font-display text-xl text-foreground star-counter-bump">
            {totalStars}
          </span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 px-4 py-1 flex-shrink-0">
        {activeQueue.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-6 bg-primary"
                : i < currentIndex
                ? "w-2 bg-game-green"
                : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Center — animal + stars + 2×2 card grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-2 min-h-0">

        {/* Animal pop-in — shown next to the letter, big */}
        <div className="h-24 flex items-center justify-center">
          {currentAnimal && (
            <div key={currentAnimal.emoji} className="animal-popup flex items-center gap-3">
              {/* The letter that was just answered */}
              <span
                className="font-display leading-none text-foreground"
                style={{ fontSize: "clamp(3.5rem, 14vw, 5rem)" }}
              >
                {currentLetter && (isUppercase ? currentLetter.toUpperCase() : currentLetter.toLowerCase())}
              </span>
              {/* Animal emoji at matching size */}
              <span
                style={{ fontSize: "clamp(3.5rem, 14vw, 5rem)", lineHeight: 1 }}
                role="img"
                aria-label={currentAnimal.name}
              >
                {currentAnimal.emoji}
              </span>
              {/* Animal name */}
              <span className="font-display text-foreground leading-tight" style={{ fontSize: "clamp(2rem, 8vw, 3rem)" }}>
                {currentAnimal.name.toLowerCase()}
              </span>
            </div>
          )}
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs sm:max-w-sm">
          {options.map((letter, idx) => {
            const color = CARD_COLORS[idx];
            const state = cardStates[letter] ?? "default";
            const displayL = isUppercase ? letter.toUpperCase() : letter.toLowerCase();

            let animClass = "letter-card-enter";
            if (state === "correct") animClass += " letter-card-correct";
            else if (state === "wrong") animClass += " letter-card-wrong";
            else if (state === "highlighted") animClass += " letter-card-highlighted";

            const isCardDisabled =
              inputDisabled || state === "disabled" || state === "correct";

            return (
              <button
                key={letter}
                onClick={() => handleCardTap(letter)}
                disabled={isCardDisabled}
                className={`letter-card ${animClass}`}
                style={{
                  backgroundColor: color.bg,
                  boxShadow: `0 6px 0 ${color.shadow}`,
                  animationDelay: `${idx * 0.08}s`,
                }}
                aria-label={`Letter ${displayL}`}
              >
                <span className="letter-card-text">{displayL}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — Next button after correct, Replay otherwise */}
      <div className="flex-shrink-0 flex justify-center px-4 pb-5 pt-2">
        {showNextButton ? (
          <button
            onClick={nextLetter}
            className="replay-btn"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0" }}
            aria-label="Next letter"
          >
            <span>Next</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
          </button>
        ) : (
          <button
            onClick={handleReplay}
            disabled={inputDisabled || phase !== "asking"}
            className="replay-btn"
            aria-label="Replay instruction"
          >
            <Volume2 className="w-6 h-6" />
            <span>Replay</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
