import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { settings, updateSettings } = useSettings();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">

        {/* Drag handle */}
        <div className="flex justify-center mb-4 -mt-2">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Title */}
        <p className="font-display text-sm font-bold text-foreground mb-5">Settings</p>

        {/* Player name */}
        <div className="mb-5">
          <label htmlFor="player-name" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Player name
          </label>
          <Input
            id="player-name"
            value={settings.playerName}
            onChange={(e) => updateSettings({ playerName: e.target.value })}
            placeholder="Enter name"
          />
        </div>

        {/* Player age */}
        <div className="mb-5">
          <label htmlFor="player-age" className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Player age
          </label>
          <Input
            id="player-age"
            type="number"
            min={3}
            max={12}
            value={settings.playerAge}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 3 && n <= 12) updateSettings({ playerAge: n });
            }}
          />
        </div>

        {/* Narration language */}
        <div className="mb-5">
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground mb-2">
              Narration language
            </legend>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={settings.narrationLang === "en"}
                onClick={() => updateSettings({ narrationLang: "en" })}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                  settings.narrationLang === "en"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                aria-pressed={settings.narrationLang === "he"}
                onClick={() => updateSettings({ narrationLang: "he" })}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                  settings.narrationLang === "he"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                🇮🇱 IL
              </button>
            </div>
          </fieldset>
        </div>

        {/* Gender */}
        <div>
          <fieldset>
            <legend className="text-xs font-semibold text-muted-foreground mb-2">
              Player gender
            </legend>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={settings.gender === "f"}
                onClick={() => updateSettings({ gender: "f" })}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                  settings.gender === "f"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                ♀ Girl
              </button>
              <button
                type="button"
                aria-pressed={settings.gender === "m"}
                onClick={() => updateSettings({ gender: "m" })}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                  settings.gender === "m"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground"
                }`}
              >
                ♂ Boy
              </button>
            </div>
          </fieldset>
        </div>

      </SheetContent>
    </Sheet>
  );
}
