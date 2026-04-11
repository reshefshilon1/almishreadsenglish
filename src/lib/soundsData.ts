export interface SoundEntry {
  sound: string;
  exampleWord: string;
  phonemeGroup: string;
  ttsSound: string;
  ttsName: string;
  emoji: string;
}

export const SOUND_MAP: Record<string, SoundEntry> = {
  // Level 1 — Consonant sounds
  b:  { sound: "b",  exampleWord: "bear",     phonemeGroup: "b",    ttsSound: "buh",  ttsName: "b",   emoji: "🐻" },
  c:  { sound: "c",  exampleWord: "cat",      phonemeGroup: "k",    ttsSound: "kuh",  ttsName: "c",   emoji: "🐱" },
  d:  { sound: "d",  exampleWord: "dog",      phonemeGroup: "d",    ttsSound: "duh",  ttsName: "d",   emoji: "🐶" },
  f:  { sound: "f",  exampleWord: "fox",      phonemeGroup: "f",    ttsSound: "f",    ttsName: "f",   emoji: "🦊" },
  g:  { sound: "g",  exampleWord: "gorilla",  phonemeGroup: "g",    ttsSound: "guh",  ttsName: "g",   emoji: "🦍" },
  h:  { sound: "h",  exampleWord: "horse",    phonemeGroup: "h",    ttsSound: "huh",  ttsName: "h",   emoji: "🐴" },
  j:  { sound: "j",  exampleWord: "jar",      phonemeGroup: "g",    ttsSound: "juh",  ttsName: "j",   emoji: "🫙" },
  k:  { sound: "k",  exampleWord: "kite",     phonemeGroup: "k",    ttsSound: "kuh",  ttsName: "k",   emoji: "🪁" },
  l:  { sound: "l",  exampleWord: "lion",     phonemeGroup: "l",    ttsSound: "l",    ttsName: "l",   emoji: "🦁" },
  m:  { sound: "m",  exampleWord: "moon",     phonemeGroup: "m",    ttsSound: "muh",  ttsName: "m",   emoji: "🌙" },
  n:  { sound: "n",  exampleWord: "nest",     phonemeGroup: "n",    ttsSound: "nuh",  ttsName: "n",   emoji: "🪺" },
  p:  { sound: "p",  exampleWord: "pig",      phonemeGroup: "p",    ttsSound: "puh",  ttsName: "p",   emoji: "🐷" },
  q:  { sound: "q",  exampleWord: "queen",    phonemeGroup: "k",    ttsSound: "kwuh", ttsName: "q",   emoji: "👑" },
  r:  { sound: "r",  exampleWord: "rain",     phonemeGroup: "r",    ttsSound: "ruh",  ttsName: "r",   emoji: "🌧️" },
  s:  { sound: "s",  exampleWord: "sun",      phonemeGroup: "s",    ttsSound: "s",    ttsName: "s",   emoji: "☀️" },
  t:  { sound: "t",  exampleWord: "tiger",    phonemeGroup: "t",    ttsSound: "tuh",  ttsName: "t",   emoji: "🐯" },
  v:  { sound: "v",  exampleWord: "violin",   phonemeGroup: "v",    ttsSound: "vuh",  ttsName: "v",   emoji: "🎻" },
  w:  { sound: "w",  exampleWord: "whale",    phonemeGroup: "w",    ttsSound: "wuh",  ttsName: "w",   emoji: "🐳" },
  y:  { sound: "y",  exampleWord: "yak",      phonemeGroup: "y",    ttsSound: "yuh",  ttsName: "y",   emoji: "🦬" },
  z:  { sound: "z",  exampleWord: "zebra",    phonemeGroup: "z",    ttsSound: "zuh",  ttsName: "z",   emoji: "🦓" },
  // Level 2 — Short vowels
  a:  { sound: "a",  exampleWord: "ant",      phonemeGroup: "short-a", ttsSound: "aah", ttsName: "a",  emoji: "🐜" },
  e:  { sound: "e",  exampleWord: "elephant", phonemeGroup: "short-e", ttsSound: "eh",  ttsName: "e",  emoji: "🐘" },
  i:  { sound: "i",  exampleWord: "iguana",   phonemeGroup: "short-i", ttsSound: "ih",  ttsName: "i",  emoji: "🦎" },
  o:  { sound: "o",  exampleWord: "octopus",  phonemeGroup: "short-o", ttsSound: "oh",  ttsName: "o",  emoji: "🐙" },
  u:  { sound: "u",  exampleWord: "umbrella", phonemeGroup: "short-u", ttsSound: "uh",  ttsName: "u",  emoji: "☂️" },
  // Level 3 — Consonant digraphs
  sh: { sound: "sh", exampleWord: "shore",    phonemeGroup: "sh",   ttsSound: "shh",  ttsName: "S H", emoji: "🏖️" },
  ch: { sound: "ch", exampleWord: "chair",    phonemeGroup: "ch",   ttsSound: "chh",  ttsName: "C H", emoji: "🪑" },
  th: { sound: "th", exampleWord: "thunder",  phonemeGroup: "th",   ttsSound: "thh",  ttsName: "T H", emoji: "⛈️" },
  ph: { sound: "ph", exampleWord: "phone",    phonemeGroup: "f",    ttsSound: "fuh",  ttsName: "P H", emoji: "📱" },
  // Level 4 — Vowel clusters
  ee: { sound: "ee", exampleWord: "bee",      phonemeGroup: "long-e",  ttsSound: "eee", ttsName: "E E", emoji: "🐝" },
  ea: { sound: "ea", exampleWord: "eagle",    phonemeGroup: "long-e",  ttsSound: "eee", ttsName: "E A", emoji: "🦅" },
  ai: { sound: "ai", exampleWord: "aim",      phonemeGroup: "long-a",  ttsSound: "ay",  ttsName: "A I", emoji: "🎯" },
  au: { sound: "au", exampleWord: "autumn",   phonemeGroup: "aw",      ttsSound: "aw",  ttsName: "A U", emoji: "🍂" },
  ie: { sound: "ie", exampleWord: "pie",      phonemeGroup: "long-i",  ttsSound: "eye", ttsName: "I E", emoji: "🥧" },
  oa: { sound: "oa", exampleWord: "boat",     phonemeGroup: "long-o",  ttsSound: "oh",  ttsName: "O A", emoji: "⛵" },
};

export const SOUNDS_LEVELS: Record<number, string[]> = {
  1: ["b", "c", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "y", "z"],
  2: ["a", "e", "i", "o", "u"],
  3: ["sh", "ch", "th", "ph"],
  4: ["ee", "ea", "ai", "au", "ie", "oa"],
};

export const SOUNDS_LEVEL_INFO = [
  { level: 1, label: "Consonants",     count: 20, color: "bg-game-green"  },
  { level: 2, label: "Short Vowels",   count: 5,  color: "bg-game-blue"   },
  { level: 3, label: "Digraphs",       count: 4,  color: "bg-game-purple" },
  { level: 4, label: "Vowel Clusters", count: 6,  color: "bg-game-orange" },
];

// Phonetically confusable sounds — preferred distractors per target.
// c and k share phonemeGroup "k" so they can never be distractors for each other.
const SIMILAR_SOUNDS: Record<string, string[]> = {
  b:  ["p", "m", "d", "t"],
  c:  ["g", "t", "d", "p"],      // k is same phonemeGroup → auto-forbidden
  d:  ["b", "g", "t", "n", "j"],
  f:  ["v", "t", "b", "s"],
  g:  ["d", "b", "k", "z"],      // j is same phonemeGroup → auto-forbidden
  h:  ["w", "y", "r"],
  j:  ["ch", "y", "sh", "z"],    // g is same phonemeGroup → auto-forbidden
  k:  ["g", "t", "d", "p"],      // c is same phonemeGroup → auto-forbidden
  l:  ["r", "n", "m", "b"],
  m:  ["n", "b", "l", "r"],
  n:  ["m", "l", "r", "b"],
  p:  ["b", "t", "d", "m"],
  q:  ["w", "y", "t", "d"],      // c and k are same phonemeGroup → auto-forbidden
  r:  ["l", "n", "m", "s"],
  s:  ["f", "t", "n", "r"],
  t:  ["b", "s", "n", "m"],
  v:  ["f", "b", "w", "z"],
  w:  ["v", "y", "h", "r"],
  y:  ["j", "w", "h"],
  z:  ["s", "v", "f"],
  sh: ["s", "ch", "th"],
  ch: ["sh", "th", "t"],
  th: ["f", "s", "sh"],
  ph: ["sh", "ch", "th"],        // f is same phonemeGroup → auto-forbidden
  ee: ["i", "e", "ai"],          // ea is same phonemeGroup → auto-forbidden
  ea: ["i", "e", "ai"],          // ee is same phonemeGroup → auto-forbidden
  ai: ["a", "e", "ee"],
  au: ["o", "u", "a"],
  ie: ["i", "e", "ai"],          // long-i sound — ee/ea are different phonemeGroup, safe distractors
  oa: ["o", "u", "au"],          // long-o sound
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

  // 1. Preferred sounds within the level
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

// Sounds whose letters appear in the middle of the example word (vowel clusters)
export const CONTAINS_SOUNDS = new Set(["ee", "ea", "ai", "au", "ie", "oo", "oa"]);

export function getSoundPrompt(sound: string): string {
  const entry = SOUND_MAP[sound];
  if (!entry) return `Find the card that starts the word ${sound}`;
  const letterWord = sound.length > 1 ? "letters" : "letter";
  if (CONTAINS_SOUNDS.has(sound)) {
    return `Which ${letterWord} appear in the word ${entry.exampleWord}?`;
  }
  return `Which ${letterWord} start the word ${entry.exampleWord}?`;
}
