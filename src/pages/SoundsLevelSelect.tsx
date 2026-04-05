import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import capybaraMascot from "@/assets/capybara-mascot.png";
import { SOUNDS_LEVEL_INFO } from "@/lib/soundsData";

const SoundsLevelSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-background">
      <button
        onClick={() => navigate("/")}
        className="self-start flex items-center gap-2 text-muted-foreground mb-4 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="font-body font-bold text-lg">Back</span>
      </button>

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
        {SOUNDS_LEVEL_INFO.map(({ level, label, count, color }) => (
          <button
            key={level}
            onClick={() => navigate(`/sounds/${level}`)}
            className={`level-btn ${color} text-foreground flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/30 flex items-center justify-center font-display text-xl">
                {level}
              </div>
              <span>{label}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-body">
              <Star className="w-4 h-4 star-icon" />
              <span>{count} sounds</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SoundsLevelSelect;
