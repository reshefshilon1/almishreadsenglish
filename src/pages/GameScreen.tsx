import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mic, Volume2, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import { LETTER_MAP, LEVELS, matchLetter } from "@/lib/gameData";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type MascotState = "idle" | "listening" | "happy" | "thinking" | "dancing" | "sleeping";
type GamePhase = "intro" | "showing" | "listening" | "result" | "tellme" | "roundEnd" | "review";

const CLAP_SOUND_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

const GameScreen = () => {
  const { gameType, level } = useParams<{ gameType: string; level: string }>();
  const navigate = useNavigate();
  const { speak, cancel } = useSpeechSynthesis();

  const isUppercase = gameType === "uppercase";
  const levelNum = parseInt(level || "1");
  const levelLetters = LEVELS[levelNum] || LEVELS[1];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("intro");
  const [mascotState, setMascotState] = useState<MascotState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [totalStars, setTotalStars] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [incorrectLetters, setIncorrectLetters] = useState<string[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewLetters, setReviewLetters] = useState<string[]>([]);
  const [showTellMe, setShowTellMe] = useState(false);
  const [highlightTellMe, setHighlightTellMe] = useState(false);
  const [silencePrompted, setSilencePrompted] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const activeLetters = reviewMode ? reviewLetters : levelLetters;
  const currentLetter = activeLetters[currentIndex];
  const letterData = currentLetter ? LETTER_MAP[currentLetter] : null;
  const displayLetter = currentLetter
    ? isUppercase
      ? currentLetter.toUpperCase()
      : currentLetter.toLowerCase()
    : "";

  const handleCorrect = useCallback(
    (firstAttempt: boolean) => {
      const stars = firstAttempt ? 1 : 2;
      setEarnedStars(stars);
      setTotalStars((s) => s + stars);
      setMascotState("happy");
      setPhase("result");

      // Play clap
      try {
        const audio = new Audio(CLAP_SOUND_URL);
        audio.play().catch(() => {});
      } catch {}

      const ld = LETTER_MAP[currentLetter];
      const msg = firstAttempt
        ? `Amazing, Alma! This is the letter ${currentLetter}. ${currentLetter} is for ${ld?.animal}!`
        : `Great remembering, Alma! This is the letter ${currentLetter}. ${currentLetter} is for ${ld?.animal}!`;

      speak(msg, () => {
        setTimeout(() => nextLetter(), 800);
      });
    },
    [currentLetter, speak]
  );

  const handleIncorrect = useCallback(() => {
    setMascotState("thinking");

    if (attempts === 0) {
      setAttempts(1);
      speak("Nice try! Let's try again.", () => {
        if (phaseRef.current !== "intro") {
          setPhase("showing");
        }
      });
      // Track as incorrect on first attempt
      if (!reviewMode) {
        setIncorrectLetters((prev) =>
          prev.includes(currentLetter) ? prev : [...prev, currentLetter]
        );
      }
    } else {
      // 2 failed attempts
      setHighlightTellMe(true);
      speak(
        "You can click the Tell Me button shown below to hear the answer.",
        () => {
          setPhase("tellme");
        }
      );
    }
  }, [attempts, currentLetter, reviewMode, speak]);

  const onSpeechResult = useCallback(
    (transcript: string) => {
      if (matchLetter(transcript, currentLetter)) {
        handleCorrect(attempts === 0);
      } else {
        handleIncorrect();
      }
    },
    [currentLetter, attempts, handleCorrect, handleIncorrect]
  );

  const onSilence = useCallback(() => {
    if (!silencePrompted) {
      setSilencePrompted(true);
      speak("You can say it out loud, Alma!");
    }
  }, [silencePrompted, speak]);

  const { isListening, isSupported, startListening, stopListening } =
    useSpeechRecognition(onSpeechResult, onSilence);

  const nextLetter = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= activeLetters.length) {
      if (!reviewMode && incorrectLetters.length > 0) {
        // Start review round
        setReviewMode(true);
        setReviewLetters([...incorrectLetters]);
        setIncorrectLetters([]);
        setCurrentIndex(0);
        setAttempts(0);
        setEarnedStars(0);
        setSilencePrompted(false);
        setShowTellMe(false);
        setHighlightTellMe(false);
        setPhase("showing");
        setMascotState("idle");
      } else {
        // Game complete
        setPhase("roundEnd");
        setMascotState("dancing");
        speak(`You did it, Alma! You won ${totalStars} stars!`);
      }
    } else {
      setCurrentIndex(nextIdx);
      setAttempts(0);
      setEarnedStars(0);
      setSilencePrompted(false);
      setShowTellMe(false);
      setHighlightTellMe(false);
      setPhase("showing");
      setMascotState("idle");
    }
  }, [currentIndex, activeLetters, reviewMode, incorrectLetters, totalStars, speak]);

  const handleTellMe = useCallback(() => {
    const ld = LETTER_MAP[currentLetter];
    setMascotState("thinking");
    speak(`This is the letter ${currentLetter}. ${currentLetter}.`, () => {
      setTimeout(() => nextLetter(), 500);
    });
  }, [currentLetter, speak, nextLetter]);

  // Intro
  useEffect(() => {
    if (phase === "intro") {
      setMascotState("happy");
      speak("Let's learn letters together, Alma!", () => {
        setPhase("showing");
      });
    }
  }, [phase, speak]);

  // Show letter -> start listening
  useEffect(() => {
    if (phase === "showing" && currentLetter) {
      setMascotState("idle");
      setShowTellMe(true);

      const timer = setTimeout(() => {
        speak("What letter is this?", () => {
          if (isSupported) {
            setMascotState("listening");
            setPhase("listening");
            startListening();
          }
        });
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [phase, currentLetter, isSupported, speak, startListening]);

  // Mascot class
  const mascotClass =
    mascotState === "dancing"
      ? "mascot-dance"
      : mascotState === "thinking"
      ? "mascot-think"
      : mascotState === "listening" || mascotState === "idle"
      ? "mascot-bounce"
      : "";

  if (phase === "roundEnd") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
        <div className="mascot-dance mb-6">
          <img
            src={capybaraMascot}
            alt="Dancing capybara"
            width={512}
            height={512}
            className="w-44 h-44 object-contain"
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: Math.min(totalStars, 15) }).map((_, i) => (
            <Star
              key={i}
              className="w-8 h-8 star-icon fill-current"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <h2 className="font-display text-2xl text-foreground text-center mb-2">
          You did it, Alma!
        </h2>
        <p className="font-body text-lg text-muted-foreground mb-8">
          You won {totalStars} stars!
        </p>
        <button
          onClick={() => navigate("/")}
          className="level-btn bg-game-green text-foreground text-xl"
        >
          🏠 Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Animal emoji background */}
      {letterData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <span className="text-[20rem] sm:text-[28rem]">{letterData.emoji}</span>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 relative z-10">
        <button
          onClick={() => {
            cancel();
            stopListening();
            navigate(-1);
          }}
          className="active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-7 h-7 text-muted-foreground" />
        </button>

        <div className={`${mascotClass}`}>
          <img
            src={capybaraMascot}
            alt="Capybara"
            width={512}
            height={512}
            loading="lazy"
            className="w-16 h-16 object-contain"
          />
        </div>

        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 star-icon fill-current" />
          <span className="font-display text-lg text-foreground">{totalStars}</span>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 px-4 mt-2 relative z-10">
        {activeLetters.map((_, i) => (
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

      {/* Center letter */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        {phase !== "intro" && currentLetter && (
          <>
            <div className="letter-enter">
              <div className="letter-display">{displayLetter}</div>
            </div>
            {/* Stars earned this round */}
            {earnedStars > 0 && phase === "result" && (
              <div className="flex gap-2 mt-2">
                {Array.from({ length: earnedStars }).map((_, i) => (
                  <Star key={i} className="w-10 h-10 star-icon fill-current confetti-star" />
                ))}
              </div>
            )}
          </>
        )}

        {phase === "intro" && (
          <div className="text-center">
            <div className="mascot-bounce mb-4">
              <img
                src={capybaraMascot}
                alt="Capybara"
                width={512}
                height={512}
                className="w-36 h-36 object-contain mx-auto"
              />
            </div>
            <p className="font-body text-lg text-muted-foreground">Getting ready...</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-4 pb-8 flex flex-col items-center gap-4">
        {/* Mic indicator */}
        {isListening && (
          <div className="flex items-center gap-2 text-primary">
            <div className="mic-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <span className="font-body font-bold text-sm">Listening...</span>
          </div>
        )}

        {/* Tell Me button */}
        {showTellMe && (
          <button
            onClick={handleTellMe}
            className={`level-btn bg-game-yellow text-foreground flex items-center gap-3 text-lg ${
              highlightTellMe ? "tell-me-highlight" : ""
            }`}
          >
            <Volume2 className="w-6 h-6" />
            Tell Me
          </button>
        )}

        {/* Mic not supported fallback */}
        {!isSupported && phase === "showing" && (
          <p className="font-body text-sm text-muted-foreground text-center">
            Voice not available — use "Tell Me" to hear letters
          </p>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
