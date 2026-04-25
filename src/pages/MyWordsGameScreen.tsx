import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Volume2, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import {
  MY_WORDS_LEVELS,
  MY_WORDS_TEACHING,
  MyWordsItem,
  resolveItem,
  resolveTemplate,
} from "@/lib/myWordsData";
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
type GamePhase =
  | "intro"
  | "wordSlide"
  | "sentenceSlide"
  | "levelIntro"
  | "asking"
  | "roundEnd";

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
      _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

// ── Narration helpers (word vs phrase) ──────────────────────────────────────
function buildPrompt(text: string, lang: string): string {
  const isPhrase = text.trim().includes(" ");
  if (lang === "he") return isPhrase ? `מצא את הצירוף: ${text}` : `מצא את המילה: ${text}`;
  return isPhrase ? `Find the phrase: ${text}` : `Find the word: ${text}`;
}

function buildNiceTryClickedOn(text: string, lang: string): string {
  const isPhrase = text.trim().includes(" ");
  if (lang === "he") return isPhrase ? "ניסיון טוב! לחצת על הצירוף" : "ניסיון טוב! לחצת על המילה";
  return isPhrase ? "Nice try! You clicked on the phrase" : "Nice try! You clicked on the word";
}

function hereIsHowYouWrite(lang: string): string {
  return lang === "he" ? "כך כותבים:" : "Here is how you write:";
}

function buildPraise(text: string, lang: string): string {
  const isPhrase = text.trim().includes(" ");
  if (lang === "he") return isPhrase ? `כל הכבוד! זה הצירוף ${text}` : `כל הכבוד! זו המילה ${text}`;
  return isPhrase ? `Very good! This is the phrase ${text}.` : `Very good! This is the word ${text}.`;
}

// ── Component ────────────────────────────────────────────────────────────────
const MyWordsGameScreen = () => {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { playerName, playerAge, narrationLang, gender } = settings;
  const n = useMemo(
    () => getNarration(narrationLang, playerName, gender),
    [narrationLang, playerName, gender]
  );
  const { speak, cancel, voicesReady } = useSpeechSynthesis(narrationLang);

  const levelNum = (parseInt(level ?? "1") as 1 | 2 | 3 | 4);
  const safeLevel = ([1, 2, 3, 4] as const).includes(levelNum) ? levelNum : 1;

  // ── Teaching slides (words first, then phrases) ────────────────────────────
  const teaching = MY_WORDS_TEACHING[safeLevel];
  const resolvedWordSlides = useMemo(
    () => teaching.words.map((item) => resolveItem(item, playerName, playerAge)),
    [teaching.words, playerName, playerAge]
  );
  const resolvedSentenceSlides = useMemo(
    () => teaching.phrases.map((item) => resolveItem(item, playerName, playerAge)),
    [teaching.phrases, playerName, playerAge]
  );

  // ── Gameplay queue (targets with resolved distractors) ─────────────────────
  const [queue] = useState<MyWordsItem[]>(() =>
    shuffle(MY_WORDS_LEVELS[safeLevel].map((item) => resolveItem(item, playerName, playerAge)))
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const initialPhase: GamePhase = "intro";

  const [phase, setPhase] = useState<GamePhase>(initialPhase);
  const [wordSlideIndex, setWordSlideIndex] = useState(0);
  const [sentenceSlideIndex, setSentenceSlideIndex] = useState(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [incorrectItems, setIncorrectItems] = useState<MyWordsItem[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<MyWordsItem[]>([]);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [showNextButton, setShowNextButton] = useState(false);

  const totalStarsRef = useRef(0);
  totalStarsRef.current = totalStars;

  const nextButtonFallbackRef = useRef<number | null>(null);
  const inputFallbackRef = useRef<number | null>(null);
  const inputBlockedRef = useRef(true); // synchronous lock

  const activeQueue = reviewMode ? reviewQueue : queue;
  const currentEntry = activeQueue[currentIndex] ?? null;

  // ── Teaching navigation ────────────────────────────────────────────────────
  const advanceFromIntro = useCallback(() => {
    cancel();
    if (resolvedWordSlides.length > 0) {
      setWordSlideIndex(0);
      setPhase("wordSlide");
    } else if (resolvedSentenceSlides.length > 0) {
      setSentenceSlideIndex(0);
      setPhase("sentenceSlide");
    } else {
      setPhase("levelIntro");
    }
  }, [cancel, resolvedWordSlides.length, resolvedSentenceSlides.length]);

  const handleNextWordSlide = useCallback(() => {
    cancel();
    if (wordSlideIndex < resolvedWordSlides.length - 1) {
      setWordSlideIndex((i) => i + 1);
    } else if (resolvedSentenceSlides.length > 0) {
      setSentenceSlideIndex(0);
      setPhase("sentenceSlide");
    } else {
      setPhase("levelIntro");
    }
  }, [cancel, wordSlideIndex, resolvedWordSlides.length, resolvedSentenceSlides.length]);

  const handleNextSentenceSlide = useCallback(() => {
    cancel();
    if (sentenceSlideIndex < resolvedSentenceSlides.length - 1) {
      setSentenceSlideIndex((i) => i + 1);
    } else {
      setPhase("levelIntro");
    }
  }, [cancel, sentenceSlideIndex, resolvedSentenceSlides.length]);

  const handleBackWordSlide = useCallback(() => {
    cancel();
    if (wordSlideIndex > 0) setWordSlideIndex((i) => i - 1);
    else setPhase("intro");
  }, [cancel, wordSlideIndex]);

  const handleBackSentenceSlide = useCallback(() => {
    cancel();
    if (sentenceSlideIndex > 0) setSentenceSlideIndex((i) => i - 1);
    else if (resolvedWordSlides.length > 0) {
      setWordSlideIndex(resolvedWordSlides.length - 1);
      setPhase("wordSlide");
    } else {
      setPhase("intro");
    }
  }, [cancel, sentenceSlideIndex, resolvedWordSlides.length]);

  // ── Advance to next gameplay item ──────────────────────────────────────────
  const nextItem = useCallback(() => {
    if (nextButtonFallbackRef.current !== null) {
      clearTimeout(nextButtonFallbackRef.current);
      nextButtonFallbackRef.current = null;
    }
    if (inputFallbackRef.current !== null) {
      clearTimeout(inputFallbackRef.current);
      inputFallbackRef.current = null;
    }
    setShowNextButton(false);
    const nextIdx = currentIndex + 1;

    if (nextIdx >= activeQueue.length) {
      if (!reviewMode && incorrectItems.length > 0) {
        setReviewMode(true);
        setReviewQueue(shuffle([...incorrectItems]));
        setIncorrectItems([]);
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
  }, [currentIndex, activeQueue, reviewMode, incorrectItems, speak, n]);

  // ── Card tap handler ───────────────────────────────────────────────────────
  const handleCardTap = useCallback(
    (tappedText: string) => {
      if (inputBlockedRef.current || phase !== "asking" || !currentEntry) return;
      if (cardStates[tappedText] === "disabled") return;

      inputBlockedRef.current = true;
      setInputDisabled(true);
      playClick();

      if (tappedText === currentEntry.text) {
        // ── Correct ──
        setTotalStars((s) => s + 1);
        setCardStates((cs) => ({ ...cs, [tappedText]: "correct" }));
        setMascotState("happy");
        playChime();

        if (!reviewMode && attempts > 0) {
          setIncorrectItems((prev) => prev.filter((e) => e.text !== currentEntry.text));
        }

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
          speak(buildPraise(currentEntry.text, narrationLang), showNext);
          nextButtonFallbackRef.current = window.setTimeout(showNext, 3500);
        }, 300);
      } else {
        // ── Wrong ──
        playBoop();
        setCardStates((cs) => ({ ...cs, [tappedText]: "wrong" }));
        setMascotState("thinking");

        if (attempts === 0) {
          if (!reviewMode) {
            setIncorrectItems((prev) =>
              prev.some((e) => e.text === currentEntry.text) ? prev : [...prev, currentEntry]
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
              setCardStates((cs) => ({ ...cs, [tappedText]: "default" }));
              setAttempts(1);
              setMascotState("idle");
              setTimeout(() => {
                speak(n.findMyWord(currentEntry.text), () => {
                  setTimeout(() => speak(currentEntry.text), 700);
                });
                inputBlockedRef.current = false;
                setInputDisabled(false);
              }, 250);
            };
            // clicked on [word/phrase] → [short pause] → tapped → [pause] → find [word/phrase]: → [pause] → correct
            speak(buildNiceTryClickedOn(tappedText, narrationLang), () => {
              setTimeout(() => {
                speak(tappedText, () => {
                  setTimeout(() => {
                    speak(buildPrompt(currentEntry.text, narrationLang), () => {
                      setTimeout(() => speak(currentEntry.text, afterNiceTry), 700);
                    });
                  }, 250);
                });
              }, 150);
            });
            inputFallbackRef.current = window.setTimeout(afterNiceTry, 11000);
          }, 300);
        } else {
          // Second wrong — narrate clicked/correct, then highlight + show Next button
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
                for (const t of Object.keys(cs)) {
                  if (t === currentEntry.text) next[t] = "highlighted";
                  else if (t === tappedText) next[t] = "disabled";
                  else next[t] = cs[t] === "default" ? "default" : "disabled";
                }
                return next;
              });
              setMascotState("idle");
              setShowNextButton(true);
            };
            speak(buildNiceTryClickedOn(tappedText, narrationLang), () => {
              setTimeout(() => {
                speak(tappedText, () => {
                  setTimeout(() => {
                    speak(hereIsHowYouWrite(narrationLang), () => {
                      setTimeout(() => speak(currentEntry.text, afterThisIs), 150);
                    });
                  }, 300);
                });
              }, 150);
            });
            inputFallbackRef.current = window.setTimeout(afterThisIs, 10000);
          }, 300);
        }
      }
    },
    [phase, currentEntry, cardStates, attempts, reviewMode, speak, nextItem, n, narrationLang]
  );

  const handleReplay = useCallback(() => {
    if (!currentEntry || phase !== "asking") return;
    speak(buildPrompt(currentEntry.text, narrationLang), () => {
      setTimeout(() => speak(currentEntry.text), 700);
    });
  }, [currentEntry, phase, speak, narrationLang]);

  // ── Intro narration ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro" || !voicesReady) return;
    setInputDisabled(true);
    speak(n.myWordsIntro);
  }, [phase, speak, voicesReady, n]);

  // ── Word-slide narration (auto-speak each word twice with a pause) ─────────
  useEffect(() => {
    if (phase !== "wordSlide" || !voicesReady) return;
    const slide = resolvedWordSlides[wordSlideIndex];
    if (!slide) return;
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    cancel();
    const t = setTimeout(() => {
      if (!active) return;
      speak(slide.text, () => {
        if (!active) return;
        const t2 = setTimeout(() => {
          if (!active) return;
          speak(slide.text);
        }, 550);
        timers.push(t2);
      });
    }, 250);
    timers.push(t);
    return () => {
      active = false;
      timers.forEach(clearTimeout);
      cancel();
    };
  }, [phase, wordSlideIndex, voicesReady, resolvedWordSlides, speak, cancel]);

  // ── Sentence-slide narration (speak twice with a pause) ────────────────────
  useEffect(() => {
    if (phase !== "sentenceSlide" || !voicesReady) return;
    const slide = resolvedSentenceSlides[sentenceSlideIndex];
    if (!slide) return;
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    cancel();
    const t = setTimeout(() => {
      if (!active) return;
      speak(slide.text, () => {
        if (!active) return;
        const t2 = setTimeout(() => {
          if (!active) return;
          speak(slide.text);
        }, 700);
        timers.push(t2);
      });
    }, 250);
    timers.push(t);
    return () => {
      active = false;
      timers.forEach(clearTimeout);
      cancel();
    };
  }, [phase, sentenceSlideIndex, voicesReady, resolvedSentenceSlides, speak, cancel]);

  // ── Level intro → asking ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "levelIntro" || !voicesReady) return;
    setInputDisabled(true);
    speak(n.myWordsLevelIntro, () => {
      setPhase("asking");
    });
  }, [phase, speak, voicesReady, n]);

  // ── Asking: build options + prompt ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "asking" || !currentEntry) return;

    const distractors = currentEntry.distractors ?? [];
    const opts = shuffle([currentEntry.text, ...distractors]);
    setOptions(opts);
    setCardStates(Object.fromEntries(opts.map((t) => [t, "default" as CardState])));

    const timer = setTimeout(() => {
      speak(buildPrompt(currentEntry.text, narrationLang), () => {
        setTimeout(() => speak(currentEntry.text), 700);
      });
      inputBlockedRef.current = false;
      setInputDisabled(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIndex]);

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

  // ── Intro screen ───────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={() => { cancel(); navigate("/my-words"); }}
            className="active:scale-95 transition-transform p-1 rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="w-7 h-7 text-muted-foreground" />
          </button>
          <div className="w-9" />
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <div className="mascot-bounce">
            <img src={capybaraMascot} alt="Capybara mascot" className="w-40 h-40 object-contain drop-shadow-md" />
          </div>
          <h2
            className="font-display text-foreground text-center"
            style={{ fontSize: "clamp(1.6rem, 6vw, 2.3rem)" }}
          >
            {resolveTemplate(
              narrationLang === "he"
                ? "בואי נלמד מילים עליך!"
                : "Let's learn some words about you!",
              playerName,
              playerAge
            )}
          </h2>
        </div>

        <div className="flex-shrink-0 flex justify-center px-4 pb-6 pt-3">
          <button
            onClick={advanceFromIntro}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0", minWidth: "160px" }}
            aria-label="Start"
          >
            <span>Start</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Word / sentence slide screen ───────────────────────────────────────────
  if (phase === "wordSlide" || phase === "sentenceSlide") {
    const isSentence = phase === "sentenceSlide";
    const slides = isSentence ? resolvedSentenceSlides : resolvedWordSlides;
    const idx = isSentence ? sentenceSlideIndex : wordSlideIndex;
    const slide = slides[idx];
    const isLast = idx === slides.length - 1;
    // "Play!" only when this is the final slide AND no sentence slides follow
    const goesToGameNext = isSentence
      ? isLast
      : isLast && resolvedSentenceSlides.length === 0;

    const onBack = isSentence ? handleBackSentenceSlide : handleBackWordSlide;
    const onNext = isSentence ? handleNextSentenceSlide : handleNextWordSlide;

    return (
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={onBack}
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
                  i === idx ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="w-9" />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
          {slide.emoji && (
            <span style={{ fontSize: "clamp(3.5rem, 14vw, 5.5rem)", lineHeight: 1 }} role="img">
              {slide.emoji}
            </span>
          )}
          <div
            className="font-display text-foreground text-center leading-tight"
            style={{
              fontSize: isSentence
                ? "clamp(2rem, 8vw, 3rem)"
                : "clamp(3.5rem, 14vw, 5.5rem)",
            }}
          >
            {slide.text}
          </div>
        </div>

        {/* Next button */}
        <div className="flex-shrink-0 flex justify-center px-4 pb-6 pt-3">
          <button
            onClick={onNext}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0", minWidth: "160px" }}
            aria-label={goesToGameNext ? "Start game" : "Next slide"}
          >
            <span>{goesToGameNext ? "Play!" : "Next"}</span>
            <span style={{ fontSize: "1.2rem" }}>→</span>
          </button>
        </div>
      </div>
    );
  }

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

  // ── Main game screen (levelIntro + asking share this) ──────────────────────
  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
        <button
          onClick={() => { cancel(); navigate("/my-words"); }}
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
          {currentEntry?.emoji && (
            <span
              key={currentEntry.text}
              className="animal-popup"
              style={{ fontSize: "clamp(3.5rem, 14vw, 5rem)", lineHeight: 1 }}
              role="img"
              aria-label={currentEntry.text}
            >
              {currentEntry.emoji}
            </span>
          )}
        </div>

        {/* 2×2 card grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs sm:max-w-sm">
          {options.map((text, idx) => {
            const color = CARD_COLORS[idx];
            const state = cardStates[text] ?? "default";

            let animClass = "letter-card-enter";
            if (state === "correct") animClass += " letter-card-correct";
            else if (state === "wrong") animClass += " letter-card-wrong";
            else if (state === "highlighted") animClass += " letter-card-highlighted";

            const isCardDisabled = inputDisabled || state === "disabled" || state === "correct";

            // Font size shrinks as text gets longer so sentences fit
            const len = text.length;
            const fontSize =
              len <= 4
                ? "clamp(1.8rem, 7.5vw, 2.8rem)"
                : len <= 10
                ? "clamp(1.2rem, 5vw, 1.8rem)"
                : len <= 18
                ? "clamp(0.95rem, 4vw, 1.3rem)"
                : "clamp(0.8rem, 3.4vw, 1.1rem)";

            return (
              <button
                key={text}
                onClick={() => handleCardTap(text)}
                disabled={isCardDisabled}
                className={`letter-card ${animClass}`}
                style={{
                  backgroundColor: color.bg,
                  boxShadow: `0 6px 0 ${color.shadow}`,
                  animationDelay: `${idx * 0.08}s`,
                }}
                aria-label={text}
              >
                <span
                  className="letter-card-text text-center px-2 break-words"
                  style={{ fontSize, lineHeight: 1.15 }}
                >
                  {text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — Next after correct, Replay otherwise */}
      <div className="flex-shrink-0 flex justify-center px-4 pb-5 pt-2">
        {showNextButton ? (
          <button
            onClick={nextItem}
            className="replay-btn justify-center"
            style={{ backgroundColor: "#B8F2E6", boxShadow: "0 4px 0 #85d4c0" }}
            aria-label="Next"
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

export default MyWordsGameScreen;
