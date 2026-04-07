import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppSettings {
  playerName: string;
  narrationLang: "en" | "he";
}

const STORAGE_KEY = "almish-settings";

const DEFAULTS: AppSettings = {
  playerName: "Alma",
  narrationLang: "en",
};

function loadFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      playerName: typeof parsed.playerName === "string" ? parsed.playerName : DEFAULTS.playerName,
      narrationLang:
        parsed.narrationLang === "en" || parsed.narrationLang === "he"
          ? parsed.narrationLang
          : DEFAULTS.narrationLang,
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
