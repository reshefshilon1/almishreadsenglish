export interface SoundEntry {
  sound: string;
  exampleWord: string;
  phonemeGroup: string; // used to enforce "never same phoneme as distractor"
  ttsSound: string;     // phonetic approximation TTS speaks for the sound (not the letter name)
  ttsName: string;      // how TTS should read the letter/cluster NAME
                        // single letters: use the letter itself ("r" → TTS says "ar")
                        // multi-char: space-separated uppercase ("S H" → TTS says "ess aitch")
}

export const SOUND_MAP: Record<string, SoundEntry> = {
  // Level 1 — Consonant sounds
  // ttsSound: schwa form ("luh", "ruh") — single syllable TTS reads as a word, not a letter name.
  // Repeated letters ("lll") are read as "el el el" by TTS, so we avoid them entirely.
  b:  { sound: "b",  exampleWord: "bear",     phonemeGroup: "b",       ttsSound: "buh",  ttsName: "b"   },
  m:  { sound: "m",  exampleWord: "moon",     phonemeGroup: "m",       ttsSound: "muh",  ttsName: "m"   },
  s:  { sound: "s",  exampleWord: "sun",      phonemeGroup: "s",       ttsSound: "suh",  ttsName: "s"   },
  t:  { sound: "t",  exampleWord: "tiger",    phonemeGroup: "t",       ttsSound: "tuh",  ttsName: "t"   },
  f:  { sound: "f",  exampleWord: "fox",      phonemeGroup: "f",       ttsSound: "fuh",  ttsName: "f"   },
  l:  { sound: "l",  exampleWord: "lion",     phonemeGroup: "l",       ttsSound: "luh",  ttsName: "l"   },
  n:  { sound: "n",  exampleWord: "nest",     phonemeGroup: "n",       ttsSound: "nuh",  ttsName: "n"   },
  r:  { sound: "r",  exampleWord: "rain",     phonemeGroup: "r",       ttsSound: "ruh",  ttsName: "r"   },
  // Level 2 — Short vowels
  a:  { sound: "a",  exampleWord: "apple",    phonemeGroup: "short-a", ttsSound: "aah",  ttsName: "a"   },
  e:  { sound: "e",  exampleWord: "egg",      phonemeGroup: "short-e", ttsSound: "eh",   ttsName: "e"   },
  i:  { sound: "i",  exampleWord: "igloo",    phonemeGroup: "short-i", ttsSound: "ih",   ttsName: "i"   },
  o:  { sound: "o",  exampleWord: "octopus",  phonemeGroup: "short-o", ttsSound: "oh",   ttsName: "o"   },
  u:  { sound: "u",  exampleWord: "umbrella", phonemeGroup: "short-u", ttsSound: "uh",   ttsName: "u"   },
  // Level 3 — Consonant digraphs
  // ttsName: spaced uppercase so TTS reads each letter name ("S H" → "ess aitch")
  sh: { sound: "sh", exampleWord: "shout",    phonemeGroup: "sh",      ttsSound: "shh",  ttsName: "S H" },
  ch: { sound: "ch", exampleWord: "chair",    phonemeGroup: "ch",      ttsSound: "chh",  ttsName: "C H" },
  th: { sound: "th", exampleWord: "think",    phonemeGroup: "th",      ttsSound: "thh",  ttsName: "T H" },
  ph: { sound: "ph", exampleWord: "phone",    phonemeGroup: "f",       ttsSound: "fuh",  ttsName: "P H" }, // same phoneme as f
  // Level 4 — Vowel clusters
  // Example words chosen so the target cluster appears at the START ("eel", "aim"),
  // making the "starts the word" prompt factually correct.
  ee: { sound: "ee", exampleWord: "eel",      phonemeGroup: "long-e",  ttsSound: "eee",  ttsName: "E E" },
  ea: { sound: "ea", exampleWord: "eat",      phonemeGroup: "long-e",  ttsSound: "eee",  ttsName: "E A" }, // same phoneme as ee
  ai: { sound: "ai", exampleWord: "aim",      phonemeGroup: "long-a",  ttsSound: "ay",   ttsName: "A I" },
  au: { sound: "au", exampleWord: "autumn",   phonemeGroup: "aw",      ttsSound: "aw",   ttsName: "A U" },
};

export const SOUNDS_LEVELS: Record<number, string[]> = {
  1: ["b", "m", "s", "t", "f", "l", "n", "r"],
  2: ["a", "e", "i", "o", "u"],
  3: ["sh", "ch", "th", "ph"],
  4: ["ee", "ea", "ai", "au"],
};

export const SOUNDS_LEVEL_INFO = [
  { level: 1, label: "Consonants",     count: 8, color: "bg-game-green"  },
  { level: 2, label: "Short Vowels",   count: 5, color: "bg-game-blue"   },
  { level: 3, label: "Digraphs",       count: 4, color: "bg-game-purple" },
  { level: 4, label: "Vowel Clusters", count: 4, color: "bg-game-orange" },
];

// Phonetically confusable sounds — preferred distractors per target
const SIMILAR_SOUNDS: Record<string, string[]> = {
  b:  ["m", "t", "n", "l"],
  m:  ["n", "b", "l", "r"],
  s:  ["f", "t", "n", "r"],
  t:  ["b", "s", "n", "m"],
  f:  ["s", "b", "t", "l"],
  l:  ["r", "n", "m", "b"],
  n:  ["m", "l", "r", "b"],
  r:  ["l", "n", "m", "s"],
  a:  ["e", "i", "u", "o"],
  e:  ["a", "i", "u"],
  i:  ["e", "a", "u"],
  o:  ["u", "a", "e"],
  u:  ["o", "a", "i"],
  sh: ["s", "ch", "th"],
  ch: ["sh", "th", "t"],
  th: ["f", "s", "sh"],
  ph: ["sh", "ch", "th"],   // never "f" — same phoneme
  ee: ["i", "e", "ai"],     // never "ea" — same phoneme
  ea: ["i", "e", "ai"],     // never "ee" — same phoneme
  ai: ["a", "e", "ee"],
  au: ["o", "u", "a"],
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getSoundDistractors(
  target: string,
  levelSounds: string[],
  count: number
): string[] {
  const targetEntry = SOUND_MAP[target];
  if (!targetEntry) return [];

  const targetPhoneme = targetEntry.phonemeGroup;

  // Never pick a sound that represents the same phoneme as the target
  const forbidden = new Set(
    Object.entries(SOUND_MAP)
      .filter(([k, v]) => k !== target && v.phonemeGroup === targetPhoneme)
      .map(([k]) => k)
  );

  const validInLevel = levelSounds.filter((s) => s !== target && !forbidden.has(s));
  const preferred = (SIMILAR_SOUNDS[target] ?? []).filter(
    (s) => !forbidden.has(s) && SOUND_MAP[s]
  );

  const pool: string[] = [];

  // 1. Preferred sounds that are in the current level
  for (const s of preferred) {
    if (validInLevel.includes(s) && !pool.includes(s) && pool.length < count) pool.push(s);
  }

  // 2. Remaining valid sounds from the current level (shuffled)
  for (const s of shuffleArray(validInLevel.filter((s) => !pool.includes(s)))) {
    if (pool.length >= count) break;
    pool.push(s);
  }

  // 3. Preferred cross-level sounds (if still short)
  for (const s of preferred) {
    if (!pool.includes(s) && pool.length < count) pool.push(s);
  }

  // 4. Any valid sound from the full map as final fallback
  for (const s of shuffleArray(
    Object.keys(SOUND_MAP).filter((s) => s !== target && !forbidden.has(s) && !pool.includes(s))
  )) {
    if (pool.length >= count) break;
    pool.push(s);
  }

  return pool.slice(0, count);
}

export function getSoundPrompt(sound: string): string {
  const entry = SOUND_MAP[sound];
  if (!entry) return `Find the card that starts the word ${sound}`;
  const letterWord = sound.length > 1 ? "letters" : "letter";
  return `Which ${letterWord} starts the word ${entry.exampleWord}?`;
}
