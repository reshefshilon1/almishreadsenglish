import { useNavigate } from "react-router-dom";
import capybaraMascot from "@/assets/capybara-mascot.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 bg-background">
      {/* Title */}
      <h1 className="font-display text-3xl sm:text-4xl text-foreground text-center mt-2 mb-2">
        Almish Reads English
      </h1>

      {/* Mascot */}
      <div className="mascot-bounce mb-4">
        <img
          src={capybaraMascot}
          alt="Capybara mascot with rubber duck"
          width={512}
          height={512}
          className="w-40 h-40 sm:w-52 sm:h-52 object-contain drop-shadow-lg"
        />
      </div>

      {/* Game cards */}
      <div className="w-full max-w-md flex flex-col gap-5">
        {/* Uppercase card */}
        <button
          onClick={() => navigate("/levels/uppercase")}
          className="game-card game-card-pink flex items-center gap-4"
        >
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-foreground/30 flex items-center justify-center">
            <span className="font-display text-5xl text-foreground">A</span>
          </div>
          <div className="text-left">
            <div className="font-display text-xl text-foreground">Big Letters Game</div>
            <div className="text-sm text-foreground/70 font-body mt-1">Learn uppercase letters!</div>
            <div className="text-3xl mt-1">🐜🐻🦒</div>
          </div>
        </button>

        {/* Lowercase card */}
        <button
          onClick={() => navigate("/levels/lowercase")}
          className="game-card game-card-blue flex items-center gap-4"
        >
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-foreground/30 flex items-center justify-center">
            <span className="font-display text-5xl text-foreground">a</span>
          </div>
          <div className="text-left">
            <div className="font-display text-xl text-foreground">Small Letters Game</div>
            <div className="text-sm text-foreground/70 font-body mt-1">Learn lowercase letters!</div>
            <div className="text-3xl mt-1">🐘🦊🐧</div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Index;
