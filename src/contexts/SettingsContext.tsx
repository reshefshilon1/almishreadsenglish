import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppSettings {
  playerName: string;
  playerAge: number;
  narrationLang: "en" | "he";
  gender: "f" | "m";
}

const STORAGE_KEY = "almish-settings";

const DEFAULTS: AppSettings = {
  playerName: "Alma",
  playerAge: 6,
  narrationLang: "en",
  gender: "f",
};

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      playerName: typeof parsed.playerName === "string" ? parsed.playerName : DEFAULTS.playerName,
      playerAge:
        typeof parsed.playerAge === "number" && parsed.playerAge >= 3 && parsed.playerAge <= 12
          ? parsed.playerAge
          : DEFAULTS.playerAge,
      narrationLang:
        parsed.narrationLang === "en" || parsed.narrationLang === "he"
          ? parsed.narrationLang
          : DEFAULTS.narrationLang,
      gender: parsed.gender === "f" || parsed.gender === "m" ? parsed.gender : DEFAULTS.gender,
    };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
