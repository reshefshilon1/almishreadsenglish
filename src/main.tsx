import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Temporary mobile debugger — remove when done ──────────────────────────────
import eruda from "eruda";
eruda.init();
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById("root")!).render(<App />);
