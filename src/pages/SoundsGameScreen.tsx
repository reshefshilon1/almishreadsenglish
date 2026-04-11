import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Volume2, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import capybaraDuck from "@/assets/capybara-duck.png";
import {
  SOUND_MAP,
  SOUNDS_LEVELS,
  CONTAINS_SOUNDS,
  getSoundDistractors,
} from "@/lib/soundsData";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TEACHING_SLIDES, type TeachingSlide } from "@/lib/teachingData";
import { useSettings } from "@/contexts/SettingsContext";
import { getNarration } from "@/lib/narration";

// ── Card color palette (same as letter game) ─────────────────────────────────
const CARD_COLORS = [
  { bg: "#A7D8FF", shadow: "#7db8e8" }, // blue
  { bg: "#FFD6A5", shadow: "#e8b87a" }, // peach
  { bg: "#B8F2E6", shadow: "#85d4c0" }, // mint
  { bg: "#FFF3B0", shadow: "#e8d47a" }, // yellow
];

// ── Types ─────────────────────────────────────────────────────────────────────
type CardState = "default" | "correct" | "wrong" | "highlighted" | "disabled";
type MascotState = "idle" | "happy" | "thinking" | "dancing";
type GamePhase = "levelIntro" | "teaching" | "intro" | "asking" | "roundEnd";

// ── Helpers ───────────────────────────────────────────────────────────────────
function highlightWord(word: string, hl: string): JSX.Element {
  const idx = word.toLowerCase().indexOf(hl.toLowerCase());
  if (idx === -1) return <>{word}</>;
  return (
    <>
      {word.slice(0, idx)}
      <span className="text-primary font-black">{word.slice(idx, idx + hl.length)}</span>
      {word.slice(idx + hl.length)}
    </>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Web Audio sound effects ───────────────────────────────────────────────────
let _audioCtxSounds: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtxSounds || _audioCtxSounds.state === "closed") {
      _audioCtxSounds = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtxSounds.state === "suspended") _audioCtxSounds.resume();
    return _audioCtxSounds;
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

// ── Component ─────────────────────────────────────────────────────────────────
const SoundsGameScreen = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { playerName, narrationLang, gender } = settings;
  const n = useMemo(
    () => getNarration(narrationLang, playerName, gender),
    [narrationLang, playerName, gender]
  );
  const { speak, cancel, voicesReady } = useSpeechSynthesis(narrationLang);

  const levelNum = parseInt(level ?? "1");
  const levelSounds = SOUNDS_LEVELS[levelNum] ?? SOUNDS_LEVELS[1];

  const slides: TeachingSlide[] = useMemo(() => TEACHING_SLIDES[levelNum] ?? [], [levelNum]);
  const hasTeaching = slides.length > 0;

  const [queue] = useState<string[]>(() => shuffle(levelSounds));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>(() => hasTeaching ? "levelIntro" : "intro");
  const [slideIndex, setSlideIndex] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [incorrectSounds, setIncorrectSounds] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [inputDisabled, setInputDisabled] = useState(true);
  // Image shown during question + label shown after correct tap
  const [currentWordEmoji, setCurrentWordEmoji] = useState<string | null>(null);
  const [showWordLabel, setShowWordLabel] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);

  const totalStarsRef = useRef(0);
  totalStarsRef.current = totalStars;
  const nextButtonFallbackRef = useRef<number | null>(null);
  const inputFallbackRef = useRef<number | null>(null);
  const inputBlockedRef = useRef(true); // synchronous lock — updated immediately, unlike React state

  const activeQueue = reviewMode ? reviewQueue : queue;
  const currentSound = activeQueue[currentIndex] ?? null;

  // ── Advance to next sound ─────────────────────────────────────────────────
  const nextSound = useCallback(() => {
    if (nextButtonFallbackRef.current !== null) {
      clearTimeout(nextButtonFallbackRef.current);
      nextButtonFallbackRef.current = null;
    }
    if (inputFallbackRef.current !== null) {
      clearTimeout(inputFallbackRef.current);
      inputFallbackRef.current = null;
    }
    setCurrentWordEmoji(null);
    setShowWordLabel(false);
    setShowNextButton(false);
    const nextIdx = currentIndex + 1;

    if (nextIdx >= activeQueue.length) {
      if (!reviewMode && incorrectSounds.length > 0) {
        setReviewMode(true);
        setReviewQueue(shuffle([...incorrectSounds]));
        setIncorrectSounds([]);
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
  }, [currentIndex, activeQueue, reviewMode, incorrectSounds, speak, n]);

  // ── Card tap handler ──────────────────────────────────────────────────────
  const handleCardTap = useCallback(
    (tappedSound: string) => {
      if (inputBlockedRef.current || phase !== "asking" || !currentSound) return;
      if (cardStates[tappedSound] === "disabled") return;

      inputBlockedRef.current = true; // lock synchronously before any await/setState
      setInputDisabled(true);
      playClick();

      const entry = SOUND_MAP[currentSound];
      const word = entry?.exampleWord ?? "";
      const name = entry?.ttsName ?? currentSound;

      if (tappedSound === currentSound) {
        // ── Correct ──────────────────────────────────────────────────────────
        setTotalStars((s) => s + 1);
        setCardStates((cs) => ({ ...cs, [tappedSound]: "correct" }));
        setMascotState("happy");
        playChime();

        if (!reviewMode && attempts > 0) {
          setIncorrectSounds((prev) => prev.filter((s) => s !== currentSound));
        }
        const praise = n.veryGoodSound(name, word);

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
          speak(praise, () => {
            setShowWordLabel(true);
            setTimeout(() => {
              speak(n.soundLike(name, word), showNext);
            }, 350);
          });
          nextButtonFallbackRef.current = window.setTimeout(showNext, 5000);
        }, 300);
      } else {
        // ── Wrong ─────────────────────────────────────────────────────────────
        playBoop();
        setCardStates((cs) => ({ ...cs, [tappedSound]: "wrong" }));
        setMascotState("thinking");

        if (attempts === 0) {
          if (!reviewMode) {
            setIncorrectSounds((prev) =>
              prev.includes(currentSound) ? prev : [...prev, currentSound]
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
              setCardStates((cs) => ({ ...cs, [tappedSound]: "default" }));
              setAttempts(1);
              setMascotState("idle");
              setTimeout(() => {
                const entry = SOUND_MAP[currentSound];
                speak(
                  CONTAINS_SOUNDS.has(currentSound)
                    ? n.whichLetterAppears(entry?.exampleWord ?? currentSound)
                    : n.whichLetterStarts(entry?.exampleWord ?? currentSound)
                );
                inputBlockedRef.current = false;
                setInputDisabled(false);
              }, 250);
            };
            speak(n.niceTry, afterNiceTry);
            inputFallbackRef.current = window.setTimeout(afterNiceTry, 4000);
          }, 300);
        } else {
          // Second wrong attempt — reveal letter name + word, then auto-advance
          setTimeout(() => {
            let fired = false;
            const afterThisIs = () => {
              if (fired) return;
              fired = true;
              if (inputFallbackRef.current !== null) {
                clearTimeout(inputFallbackRef.current);
                inputFallbackRef.current = null;
              }
              setCardStates((cs) => {
                const next: Record<string, CardState> = {};
                for (const s of Object.keys(cs)) {
                  if (s === currentSound) next[s] = "highlighted";
                  else if (s === tappedSound) next[s] = "disabled";
                  else next[s] = cs[s] === "default" ? "default" : "disabled";
                }
                return next;
              });
              setTimeout(nextSound, 2500);
            };
            speak(n.thisOneIs(name, word), afterThisIs);
            inputFallbackRef.current = window.setTimeout(afterThisIs, 4000);
          }, 300);
        }
      }
    },
    [
      phase,
      currentSound,
      cardStates,
      attempts,
      reviewMode,
      speak,
      nextSound,
      n,
    ]
  );

  const handleReplay = useCallback(() => {
    if (!currentSound || phase !== "asking") return;
    const entry = SOUND_MAP[currentSound];
    speak(
      CONTAINS_SOUNDS.has(currentSound)
        ? n.whichLetterAppears(entry?.exampleWord ?? currentSound)
        : n.whichLetterStarts(entry?.exampleWord ?? currentSound)
    );
  }, [currentSound, phase, speak, n]);

  const handleNextSlide = useCallback(() => {
    cancel();
    if (slideIndex < slides.length - 1) {
      setSlideIndex((i) => i + 1);
    } else {
      setSlideIndex(0);
      setPhase("intro");
    }
  }, [slideIndex, slides.length, cancel]);

  // ── Level intro narration ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "levelIntro" || !voicesReady) return;
    speak(n.levelIntro);
  }, [phase, voicesReady, speak, n]);

  // ── Teaching slide narration (intro sentence + each word with pauses) ───────
  useEffect(() => {
    if (phase !== "teaching" || !voicesReady) return;
    const slide = slides[slideIndex];
    if (!slide) return;

    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    cancel();

    const t0 = setTimeout(() => {
      if (!active) return;
      speak((narrationLang === "he" && slide.heIntro) ? slide.heIntro : slide.intro, () => {
        if (!active) return;
        let i = 0;
        const speakNext = () => {
          if (!active || i >= slide.words.length) return;
          const word = slide.words[i++];
          const t = setTimeout(() => {
            if (!active) return;
            speak(word, speakNext);
          }, 600);
          timers.push(t);
        };
        speakNext();
      });
    }, 400);
    timers.push(t0);

    return () => {
      active = false;
      timers.forEach(clearTimeout);
      cancel();
    };
  }, [phase, slideIndex, voicesReady, slides, speak, cancel, narrationLang]);

  // ── Intro: wait for voices, then play welcome ─────────────────────────────
  useEffect(() => {
    if (phase !== "intro" || !voicesReady) return;
    setInputDisabled(true);
    speak(n.letsListenSound, () => {
      setPhase("asking");
    });
  }, [phase, speak, voicesReady, n]);

  // ── Asking: generate options + play prompt on each new sound ──────────────
  useEffect(() => {
    if (phase !== "asking" || !currentSound) return;

    const entry = SOUND_MAP[currentSound];
    setCurrentWordEmoji(entry?.emoji ?? null);
    setShowWordLabel(false);
    setShowNextButton(false);

    const distractors = getSoundDistractors(currentSound, levelSounds, 3);
    const opts = shuffle([currentSound, ...distractors]);
    setOptions(opts);
    setCardStates(Object.fromEntries(opts.map((s) => [s, "default" as CardState])));

    const timer = setTimeout(() => {
      speak(
        CONTAINS_SOUNDS.has(currentSound)
          ? n.whichLetterAppears(entry?.exampleWord ?? currentSound)
          : n.whichLetterStarts(entry?.exampleWord ?? currentSound)
      );
      inputBlockedRef.current = false;
      setInputDisabled(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSound]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { cancel(); };
  }, [cancel]);

  const mascotClass =
    mascotState === "dancing"
      ? "mascot-dance"
      : mascotState === "happy"
      ? "mascot-happy"
      : mascotState === "thinking"
      ? "mascot-think"
      : "mascot-bounce";

  // ── Level intro screen ────────────────────────────────────────────────────
  if (phase === "levelIntro") {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
        {/* Back */}
        <div className="flex items-center px-4 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={() => { cancel(); navigate("/sounds"); }}
            className="active:scale-95 transition-transform p-1 rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="w-7 h-7 text-muted-foreground" />
          </button>
        </div>

        {/* Capybara image */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
          <img
            src={capybaraDuck}
            alt="Capybara with rubber duck"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title + button */}
        <div className="flex-shrink-0 flex flex-col items-center px-6 pt-5 pb-8 gap-4 bg-background">
          <h1
            className="font-display text-foreground text-center"
            style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }}
          >
            Let's learn sounds
          </h1>
          <button
            onClick={() => { cancel(); setPhase("teaching"); }}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0", minWidth: "160px" }}
          >
            <span>Start</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Teaching slides ───────────────────────────────────────────────────────
  if (phase === "teaching") {
    const slide = slides[slideIndex];
    const isLastSlide = slideIndex === slides.length - 1;

    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={() => {
              cancel();
              if (slideIndex > 0) setSlideIndex((i) => i - 1);
              else setPhase("levelIntro");
            }}
            className="active:scale-95 transition-transform p-1 rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="w-7 h-7 text-muted-foreground" />
          </button>

          {/* Progress dots */}
          <div className="flex gap-1.5 items-center">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === slideIndex ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="w-9" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-start px-5 pt-2 gap-4 min-h-0 overflow-y-auto">
          {/* Focus text */}
          <div
            className="font-display text-foreground leading-none"
            style={{ fontSize: "clamp(4.5rem, 18vw, 7rem)" }}
          >
            {slide.focusText}
          </div>

          {/* Example rows */}
          <div className="flex flex-col gap-2.5 w-full max-w-sm">
            {slide.examples.map((ex, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-3"
              >
                <span style={{ fontSize: "2rem", lineHeight: 1 }} role="img">
                  {ex.emoji}
                </span>
                <span
                  className="font-display text-foreground"
                  style={{ fontSize: "clamp(1.5rem, 6vw, 2rem)" }}
                >
                  {highlightWord(ex.word, ex.highlight)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next button */}
        <div className="flex-shrink-0 flex justify-center px-4 pb-6 pt-3">
          <button
            onClick={handleNextSlide}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0", minWidth: "160px" }}
            aria-label={isLastSlide ? "Start game" : "Next slide"}
          >
            <span>{isLastSlide ? "Play!" : "Next"}</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Round-end screen ──────────────────────────────────────────────────────
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

  // ── Main game screen ──────────────────────────────────────────────────────
  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => {
            cancel();
            navigate("/sounds");
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
          {/* key remount re-triggers the bump animation on each increment */}
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

      {/* Center — word image + label + 2×2 card grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3 min-h-0">

        {/* Word image — visible throughout the round */}
        <div className="flex flex-col items-center justify-center gap-1 flex-shrink-0">
          {currentWordEmoji && (
            <span
              key={currentWordEmoji}
              className="animal-popup"
              style={{ fontSize: "clamp(3.5rem, 14vw, 5rem)", lineHeight: 1 }}
              role="img"
              aria-label={currentSound ?? ""}
            >
              {currentWordEmoji}
            </span>
          )}
          {showWordLabel && currentSound && SOUND_MAP[currentSound] && (
            <div key="word-label" className="animal-popup font-display text-foreground text-center" style={{ fontSize: "clamp(1.8rem, 7vw, 2.6rem)" }}>
              {currentSound} like {SOUND_MAP[currentSound].exampleWord}
            </div>
          )}
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs sm:max-w-sm">
          {options.map((sound, idx) => {
            const color = CARD_COLORS[idx];
            const state = cardStates[sound] ?? "default";

            let animClass = "letter-card-enter";
            if (state === "correct") animClass += " letter-card-correct";
            else if (state === "wrong") animClass += " letter-card-wrong";
            else if (state === "highlighted") animClass += " letter-card-highlighted";

            const isCardDisabled =
              inputDisabled || state === "disabled" || state === "correct";

            return (
              <button
                key={sound}
                onClick={() => handleCardTap(sound)}
                disabled={isCardDisabled}
                className={`letter-card ${animClass}`}
                style={{
                  backgroundColor: color.bg,
                  boxShadow: `0 6px 0 ${color.shadow}`,
                  animationDelay: `${idx * 0.08}s`,
                }}
                aria-label={`Sound ${sound}`}
              >
                <span className="letter-card-text">{sound}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — replay button or Next button */}
      <div className="flex-shrink-0 flex justify-center px-4 pb-5 pt-2">
        {showNextButton ? (
          <button
            onClick={nextSound}
            className="replay-btn"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0" }}
            aria-label="Next sound"
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

export default SoundsGameScreen;
