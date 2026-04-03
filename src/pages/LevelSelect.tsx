import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";

const LEVEL_INFO = [
  { level: 1, letters: 5, color: "bg-game-green" },
  { level: 2, letters: 10, color: "bg-game-blue" },
  { level: 3, letters: 15, color: "bg-game-purple" },
  { level: 4, letters: 26, color: "bg-game-orange" },
];

const LevelSelect = () => {
  const { gameType } = useParams<{ gameType: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-background">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="self-start flex items-center gap-2 text-muted-foreground mb-4 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-body font-bold text-lg">Back</span>
      </button>

      {/* Mascot */}
      <img
        src={capybaraMascot}
        alt="Capybara mascot"
        width={512}
        height={512}
        loading="lazy"
        className="w-28 h-28 object-contain mascot-bounce mb-3"
      />

      <h1 className="font-display text-2xl sm:text-3xl text-foreground text-center mb-6">
        Choose a Level
      </h1>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {LEVEL_INFO.map(({ level, letters, color }) => (
          <button
            key={level}
            onClick={() => navigate(`/game/${gameType}/${level}`)}
            className={`level-btn ${color} text-foreground flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/30 flex items-center justify-center font-display text-xl">
                {level}
              </div>
              <span>Level {level}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-body">
              <Star className="w-4 h-4 star-icon" />
              <span>{letters} letters</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LevelSelect;
