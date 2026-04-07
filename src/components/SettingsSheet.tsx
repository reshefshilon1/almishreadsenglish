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
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Player name
          </label>
          <Input
            value={settings.playerName}
            onChange={(e) => updateSettings({ playerName: e.target.value })}
            placeholder="Enter name"
          />
        </div>

        {/* Narration language */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Narration language
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ narrationLang: "en" })}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                settings.narrationLang === "en"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-border bg-background text-foreground"
              }`}
            >
              🇺🇸 EN
            </button>
            <button
              onClick={() => updateSettings({ narrationLang: "he" })}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                settings.narrationLang === "he"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-border bg-background text-foreground"
              }`}
            >
              🇮🇱 IL
            </button>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Player gender
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => updateSettings({ gender: "f" })}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                settings.gender === "f"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-border bg-background text-foreground"
              }`}
            >
              ♀ Girl
            </button>
            <button
              onClick={() => updateSettings({ gender: "m" })}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors ${
                settings.gender === "m"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-border bg-background text-foreground"
              }`}
            >
              ♂ Boy
            </button>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}
