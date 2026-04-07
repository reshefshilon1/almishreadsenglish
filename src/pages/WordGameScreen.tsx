import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Volume2, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import { WORD_LEVELS, WordEntry } from "@/lib/wordData";
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
const WordGameScreen = () => {
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
  const levelWords = WORD_LEVELS[levelNum] ?? WORD_LEVELS[1];

  const [queue] = useState<WordEntry[]>(() => shuffle(levelWords));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [incorrectWords, setIncorrectWords] = useState<WordEntry[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<WordEntry[]>([]);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);

  const totalStarsRef = useRef(0);
  totalStarsRef.current = totalStars;

  const activeQueue = reviewMode ? reviewQueue : queue;
  const currentEntry = activeQueue[currentIndex] ?? null;

  // ── Advance to next word ───────────────────────────────────────────────────
  const nextWord = useCallback(() => {
    setShowNextButton(false);
    const nextIdx = currentIndex + 1;

    if (nextIdx >= activeQueue.length) {
      if (!reviewMode && incorrectWords.length > 0) {
        setReviewMode(true);
        setReviewQueue(shuffle([...incorrectWords]));
        setIncorrectWords([]);
        setCurrentIndex(0);
        setAttempts(0);
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
      setInputDisabled(true);
      setPhase("asking");
      setMascotState("idle");
    }
  }, [currentIndex, activeQueue, reviewMode, incorrectWords, speak, n]);

  // ── Card tap handler ───────────────────────────────────────────────────────
  const handleCardTap = useCallback(
    (tappedWord: string) => {
      if (inputDisabled || phase !== "asking" || !currentEntry) return;
      if (cardStates[tappedWord] === "disabled") return;

      setInputDisabled(true);
      playClick();

      if (tappedWord === currentEntry.word) {
        // ── Correct ────────────────────────────────────────────────────────
        setTotalStars((s) => s + 1);
        setCardStates((cs) => ({ ...cs, [tappedWord]: "correct" }));
        setMascotState("happy");
        playChime();

        if (!reviewMode && attempts > 0) {
          setIncorrectWords((prev) => prev.filter((e) => e.word !== currentEntry.word));
        }

        setTimeout(() => {
          speak(n.veryGoodWord(currentEntry.word), () => {
            setShowNextButton(true);
          });
        }, 300);
      } else {
        // ── Wrong ──────────────────────────────────────────────────────────
        playBoop();
        setCardStates((cs) => ({ ...cs, [tappedWord]: "wrong" }));
        setMascotState("thinking");

        if (attempts === 0) {
          if (!reviewMode) {
            setIncorrectWords((prev) =>
              prev.some((e) => e.word === currentEntry.word) ? prev : [...prev, currentEntry]
            );
          }
          setTimeout(() => {
            speak(n.niceTry, () => {
              setCardStates((cs) => ({ ...cs, [tappedWord]: "default" }));
              setAttempts(1);
              setMascotState("idle");
              setTimeout(() => {
                speak(n.findWord(currentEntry.word), () => {
                  setTimeout(() => speak(currentEntry.word), 700);
                });
                setInputDisabled(false);
              }, 250);
            });
          }, 300);
        } else {
          // Second wrong attempt — highlight the correct card
          setTimeout(() => {
            speak(n.thisIsWord(currentEntry.word), () => {
              setCardStates((cs) => {
                const next: Record<string, CardState> = {};
                for (const w of Object.keys(cs)) {
                  if (w === currentEntry.word) next[w] = "highlighted";
                  else if (w === tappedWord) next[w] = "disabled";
                  else next[w] = cs[w] === "default" ? "default" : "disabled";
                }
                return next;
              });
              setInputDisabled(false);
              setMascotState("idle");
              setTimeout(() => nextWord(), 2500);
            });
          }, 300);
        }
      }
    },
    [inputDisabled, phase, currentEntry, cardStates, attempts, reviewMode, speak, nextWord, n]
  );

  const handleReplay = useCallback(() => {
    if (!currentEntry || phase !== "asking") return;
    speak(n.findWord(currentEntry.word), () => {
      setTimeout(() => speak(currentEntry.word), 700);
    });
  }, [currentEntry, phase, speak, n]);

  // ── Intro: wait for voices, then play welcome message ─────────────────────
  useEffect(() => {
    if (phase !== "intro" || !voicesReady) return;
    setInputDisabled(true);
    speak(n.letsFindWord, () => {
      setPhase("asking");
    });
  }, [phase, speak, voicesReady, n]);

  // ── Asking: generate options + play prompt on each new word ───────────────
  useEffect(() => {
    if (phase !== "asking" || !currentEntry) return;

    const opts = shuffle([currentEntry.word, ...currentEntry.distractors]);
    setOptions(opts);
    setCardStates(Object.fromEntries(opts.map((w) => [w, "default" as CardState])));

    const timer = setTimeout(() => {
      speak(n.findWord(currentEntry.word), () => {
        setTimeout(() => speak(currentEntry.word), 700);
      });
      setInputDisabled(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentEntry]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
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
          <img src={capybaraMascot} alt="Dancing capybara" className="w-44 h-44 object-contain drop-shadow-lg" />
        </div>

        <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center relative z-10">
          {Array.from({ length: Math.min(totalStars, 20) }).map((_, i) => (
            <Star key={i} className="w-8 h-8 star-icon fill-current confetti-star" style={{ animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>

        <h2 className="font-display text-3xl text-foreground text-center mb-1 relative z-10">You did it, {playerName}!</h2>
        <p className="font-body text-xl text-muted-foreground mb-8 relative z-10">You won {totalStars} stars!</p>

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
          onClick={() => { cancel(); navigate("/words"); }}
          className="active:scale-95 transition-transform p-1 rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="w-7 h-7 text-muted-foreground" />
        </button>

        <div className={mascotClass}>
          <img src={capybaraMascot} alt="Capybara mascot" className="w-14 h-14 object-contain drop-shadow-md" />
        </div>

        <div className="flex items-center gap-1.5 bg-game-yellow/40 rounded-full px-3 py-1.5">
          <Star className="w-5 h-5 star-icon fill-current" />
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
              i === currentIndex ? "w-6 bg-primary" : i < currentIndex ? "w-2 bg-game-green" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Center — emoji + 2×2 card grid */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 min-h-0">

        {/* Emoji above cards */}
        <div className="h-20 flex items-center justify-center">
          {currentEntry && (
            <span
              key={currentEntry.word}
              className="animal-popup"
              style={{ fontSize: "clamp(3.5rem, 14vw, 5rem)", lineHeight: 1 }}
              role="img"
              aria-label={currentEntry.word}
            >
              {currentEntry.emoji}
            </span>
          )}
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs sm:max-w-sm">
          {options.map((word, idx) => {
            const color = CARD_COLORS[idx];
            const state = cardStates[word] ?? "default";

            let animClass = "letter-card-enter";
            if (state === "correct") animClass += " letter-card-correct";
            else if (state === "wrong") animClass += " letter-card-wrong";
            else if (state === "highlighted") animClass += " letter-card-highlighted";

            const isCardDisabled = inputDisabled || state === "disabled" || state === "correct";

            return (
              <button
                key={word}
                onClick={() => handleCardTap(word)}
                disabled={isCardDisabled}
                className={`letter-card ${animClass}`}
                style={{
                  backgroundColor: color.bg,
                  boxShadow: `0 6px 0 ${color.shadow}`,
                  animationDelay: `${idx * 0.08}s`,
                }}
                aria-label={`Word ${word}`}
              >
                <span className="letter-card-text" style={{ fontSize: "clamp(1.8rem, 7.5vw, 2.8rem)" }}>
                  {word}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — Next button after correct, Replay otherwise */}
      <div className="flex-shrink-0 flex justify-center px-4 pb-5 pt-2">
        {showNextButton ? (
          <button
            onClick={nextWord}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0" }}
            aria-label="Next word"
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

export default WordGameScreen;
