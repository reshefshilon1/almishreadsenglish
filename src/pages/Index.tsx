import { useNavigate } from "react-router-dom";
// ── Once you save the painting to src/assets/capybara-duck.jpg, replace the
//    next line with:  import capybaraDuck from "@/assets/capybara-duck.jpg";
import capybaraDuck from "@/assets/capybara-duck.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="h-[100dvh] flex flex-row overflow-hidden bg-background">

      {/* ── Left half: capybara painting ───────────────────────────────── */}
      {/* Background colour sampled from the jungle edges of the painting */}
      <div className="w-[45%] relative overflow-hidden flex-shrink-0 flex items-center justify-center"
           style={{ backgroundColor: "#4a7c3f" }}>
        <img
          src={capybaraDuck}
          alt="Capybara with rubber duck"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* ── Right half: title + game buttons ───────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-6 gap-5 overflow-y-auto">

        <h1 className="font-display text-center text-foreground leading-snug"
            style={{ fontSize: "clamp(1.3rem, 5vw, 2rem)" }}>
          Almish<br />Reads English
        </h1>

        {/* Uppercase card */}
        <button
          onClick={() => navigate("/levels/uppercase")}
          className="home-game-btn game-card-pink"
          style={{ width: "min(100%, 190px)" }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
            <span className="font-display text-3xl text-foreground">A</span>
          </div>
          <div className="text-left min-w-0">
            <div className="font-display text-base text-foreground leading-tight">Big Letters</div>
            <div className="font-body text-xs text-foreground/70 mt-0.5">Uppercase A–Z</div>
          </div>
        </button>

        {/* Lowercase card */}
        <button
          onClick={() => navigate("/levels/lowercase")}
          className="home-game-btn game-card-blue"
          style={{ width: "min(100%, 190px)" }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
            <span className="font-display text-3xl text-foreground">a</span>
          </div>
          <div className="text-left min-w-0">
            <div className="font-display text-base text-foreground leading-tight">Small Letters</div>
            <div className="font-body text-xs text-foreground/70 mt-0.5">Lowercase a–z</div>
          </div>
        </button>

        {/* Sounds card */}
        <button
          onClick={() => navigate("/sounds")}
          className="home-game-btn game-card-green"
          style={{ width: "min(100%, 190px)" }}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/30 flex items-center justify-center">
            <span className="font-display text-3xl text-foreground">🔊</span>
          </div>
          <div className="text-left min-w-0">
            <div className="font-display text-base text-foreground leading-tight">Sounds Game</div>
            <div className="font-body text-xs text-foreground/70 mt-0.5">Phonics sh, ch…</div>
          </div>
        </button>

      </div>
    </div>
  );
};

export default Index;
