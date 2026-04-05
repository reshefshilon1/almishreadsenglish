import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import LevelSelect from "./pages/LevelSelect.tsx";
import GameScreen from "./pages/GameScreen.tsx";
import SoundsLevelSelect from "./pages/SoundsLevelSelect.tsx";
import SoundsGameScreen from "./pages/SoundsGameScreen.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/levels/:gameType" element={<LevelSelect />} />
          <Route path="/game/:gameType/:level" element={<GameScreen />} />
          <Route path="/sounds" element={<SoundsLevelSelect />} />
          <Route path="/sounds/:level" element={<SoundsGameScreen />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
