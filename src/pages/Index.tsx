import { useNavigate } from "react-router-dom";
import capybaraDuck from "@/assets/capybara-duck.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">

      {/* ── Top: capybara painting ─────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
        <img
          src={capybaraDuck}
          alt="Capybara with rubber duck"
          className="w-full h-full object-contain"
        />
      </div>

      {/* ── Bottom: title + game buttons ───────────────────────────────────── */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center px-4 py-5 gap-4 bg-background">

        <h1 className="font-display text-center text-foreground leading-snug"
            style={{ fontSize: "clamp(1.3rem, 5vw, 2rem)" }}>
          Almish Reads English
        </h1>

        <div className="flex flex-row gap-3 justify-center flex-wrap">

          {/* Uppercase card */}
          <button
            onClick={() => navigate("/levels/uppercase")}
            className="home-game-btn game-card-pink"
            style={{ width: "min(100%, 160px)" }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">A</span>
            </div>
            <div className="text-left min-w-0">
              <div className="font-display text-sm text-foreground leading-tight">Big Letters</div>
              <div className="font-body text-xs text-foreground/70 mt-0.5">Uppercase A–Z</div>
            </div>
          </button>

          {/* Lowercase card */}
          <button
            onClick={() => navigate("/levels/lowercase")}
            className="home-game-btn game-card-blue"
            style={{ width: "min(100%, 160px)" }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">a</span>
            </div>
            <div className="text-left min-w-0">
              <div className="font-display text-sm text-foreground leading-tight">Small Letters</div>
              <div className="font-body text-xs text-foreground/70 mt-0.5">Lowercase a–z</div>
            </div>
          </button>

          {/* Sounds card */}
          <button
            onClick={() => navigate("/sounds")}
            className="home-game-btn game-card-green"
            style={{ width: "min(100%, 160px)" }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">🔊</span>
            </div>
            <div className="text-left min-w-0">
              <div className="font-display text-sm text-foreground leading-tight">Sounds Game</div>
              <div className="font-body text-xs text-foreground/70 mt-0.5">Phonics sh, ch…</div>
            </div>
          </button>

          {/* Find the Word card */}
          <button
            onClick={() => navigate("/words")}
            className="home-game-btn game-card-orange"
            style={{ width: "min(100%, 160px)" }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
              <span className="font-display text-2xl text-foreground">📖</span>
            </div>
            <div className="text-left min-w-0">
              <div className="font-display text-sm text-foreground leading-tight">Find the Word</div>
              <div className="font-body text-xs text-foreground/70 mt-0.5">Word reading</div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Index;
