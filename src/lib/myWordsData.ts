// ── My Words game data ──────────────────────────────────────────────────────
// Teaching phase + gameplay content across 4 levels.
// {name} and {age} are resolved at render time from SettingsContext
// (applied to target text AND distractors so exact-text comparison still works).

export interface MyWordsItem {
  text: string;                 // may contain {name} / {age} placeholders
  emoji?: string;
  distractors?: string[];       // only used for gameplay items (not teaching)
}

export interface MyWordsLevelTeaching {
  words: MyWordsItem[];
  phrases: MyWordsItem[];       // phrases AND sentences
}

// ── Teaching content per level ─────────────────────────────────────────────
export const MY_WORDS_TEACHING: Record<1 | 2 | 3 | 4, MyWordsLevelTeaching> = {
  1: {
    words: [
      { text: "Hi", emoji: "👋" },
      { text: "my",   emoji: "🙋‍♀️" },
      { text: "I",    emoji: "🙋‍♀️" },
      { text: "am" },
      { text: "this", emoji: "👇" },
      { text: "me",   emoji: "🙂" },
    ],
    phrases: [],
  },
  2: {
    words: [
      { text: "name" },
      { text: "is" },
      { text: "the" },
    ],
    phrases: [
      { text: "my name" },
      { text: "I am" },
      { text: "this is" },
    ],
  },
  3: {
    words: [
      { text: "mom", emoji: "👩" },
      { text: "dad", emoji: "👨" },
      { text: "sister", emoji: "👧" },
      { text: "she" },
      { text: "he" },
    ],
    phrases: [
      { text: "This is me",         emoji: "🙂" },
      { text: "She is my mom",      emoji: "👩" },
      { text: "He is my dad",       emoji: "👨" },
      { text: "This is my sister",  emoji: "👧" },
    ],
  },
  4: {
    words: [],
    phrases: [
      { text: "Hi",               emoji: "👋" },
      { text: "My name is {name}" },
      { text: "I am {age}" },
    ],
  },
};

// ── Gameplay items per level (with precomputed distractors) ───────────────
// Distractor rule: change only ONE element of the target.
export const MY_WORDS_LEVELS: Record<1 | 2 | 3 | 4, MyWordsItem[]> = {
  1: [
    { text: "Hi",   emoji: "👋", distractors: ["my",   "I",   "me"]   },
    { text: "my",                distractors: ["me",   "I",   "am"]   },
    { text: "I",                 distractors: ["my",   "me",  "am"]   },
    { text: "am",                distractors: ["I",    "is",  "my"]   },
    { text: "this",              distractors: ["is",   "me",  "the"]  },
    { text: "me",   emoji: "🙂", distractors: ["my",   "I",   "this"] },
  ],
  2: [
    // New single words from L2
    { text: "name",             distractors: ["is",   "the",  "my"]   },
    { text: "is",               distractors: ["am",   "the",  "name"] },
    { text: "the",              distractors: ["is",   "name", "this"] },
    // Short phrases
    { text: "my name",          distractors: ["my is",   "the name", "I name"]   },
    { text: "I am",             distractors: ["I is",    "this am",  "my am"]    },
    { text: "this is",          distractors: ["this am", "my is",    "the is"]   },
  ],
  3: [
    {
      text: "This is me",
      emoji: "🙂",
      distractors: ["She is me", "He is me", "This is my sister"],
    },
    {
      text: "She is my mom",
      emoji: "👩",
      distractors: ["He is my mom", "She is my dad", "She is my sister"],
    },
    {
      text: "He is my dad",
      emoji: "👨",
      distractors: ["She is my dad", "He is my mom", "He is my sister"],
    },
    {
      text: "This is my sister",
      emoji: "👧",
      distractors: ["This is my mom", "This is my dad", "This is me"],
    },
  ],
  4: [
    { text: "Hi", emoji: "👋", distractors: ["my", "me", "I"] },
    {
      text: "My name is {name}",
      distractors: ["My name is mom", "This is {name}", "I am {name}"],
    },
    {
      text: "I am {age}",
      distractors: ["I am 5", "My name is {age}", "This is {age}"],
    },
  ],
};

// ── Level-select metadata ──────────────────────────────────────────────────
export const MY_WORDS_LEVEL_INFO = [
  { level: 1, label: "Single Words",    description: "Hi, my, I, am…",           count: 6, color: "bg-game-green"  },
  { level: 2, label: "Short Phrases",   description: "my name, I am…",           count: 6, color: "bg-game-blue"   },
  { level: 3, label: "Simple Sentences", description: "She is my mom…",           count: 4, color: "bg-game-purple" },
  { level: 4, label: "Mixed Sentences", description: "My name is…, I am…",       count: 3, color: "bg-game-orange" },
];

// ── Template resolution ────────────────────────────────────────────────────
export function resolveTemplate(
  text: string,
  playerName: string,
  playerAge: number
): string {
  return text.replace(/\{name\}/g, playerName).replace(/\{age\}/g, String(playerAge));
}

export function resolveItem(
  item: MyWordsItem,
  playerName: string,
  playerAge: number
): MyWordsItem {
  return {
    text: resolveTemplate(item.text, playerName, playerAge),
    emoji: item.emoji,
    distractors: item.distractors?.map((d) => resolveTemplate(d, playerName, playerAge)),
  };
}
