export interface WordEntry {
  word: string;
  emoji: string;
  distractors: string[]; // exactly 3
}

export const WORD_LEVELS: Record<number, WordEntry[]> = {
  1: [
    { word: "bat", emoji: "🦇", distractors: ["mat", "bit", "bag"] },
    { word: "cat", emoji: "🐱", distractors: ["bat", "hat", "cut"] },
    { word: "hat", emoji: "🎩", distractors: ["cat", "bat", "hot"] },
    { word: "rat", emoji: "🐀", distractors: ["bat", "cat", "rot"] },
    { word: "dog", emoji: "🐶", distractors: ["log", "dig", "dot"] },
    { word: "log", emoji: "🪵", distractors: ["dog", "leg", "fog"] },
    { word: "hen", emoji: "🐔", distractors: ["ten", "pen", "hit"] },
    { word: "ten", emoji: "🔟", distractors: ["hen", "pen", "tan"] },
    { word: "pen", emoji: "✏️", distractors: ["ten", "hen", "pin"] },
    { word: "sit", emoji: "🪑", distractors: ["bit", "sat", "set"] },
    { word: "cup", emoji: "🥤", distractors: ["cap", "cut", "cub"] },
    { word: "bug", emoji: "🐛", distractors: ["mug", "big", "bag"] },
    { word: "sun", emoji: "☀️", distractors: ["run", "fun", "sin"] },
    { word: "map", emoji: "🗺️", distractors: ["mop", "mat", "cap"] },
  ],
  2: [
    { word: "stop", emoji: "🛑",  distractors: ["step", "shop", "top"] },
    { word: "step", emoji: "👣",  distractors: ["stop", "stem", "drip"] },
    { word: "spot", emoji: "🔦",  distractors: ["stop", "shot", "pot"] },
    { word: "spin", emoji: "🌀",  distractors: ["spit", "plan", "bin"] },
    { word: "plan", emoji: "📋",  distractors: ["clan", "pan", "flat"] },
    { word: "clap", emoji: "👏",  distractors: ["flap", "cap", "clip"] },
    { word: "flag", emoji: "🚩",  distractors: ["flat", "frog", "lag"] },
    { word: "frog", emoji: "🐸",  distractors: ["fog", "log", "drug"] },
    { word: "drum", emoji: "🥁",  distractors: ["drip", "trim", "bum"] },
    { word: "trim", emoji: "✂️",  distractors: ["trip", "drum", "rim"] },
    { word: "best", emoji: "⭐",  distractors: ["rest", "bet", "test"] },
    { word: "fast", emoji: "🏃",  distractors: ["last", "fat", "cast"] },
    { word: "nest", emoji: "🪺",  distractors: ["best", "rest", "net"] },
    { word: "hand", emoji: "🤚",  distractors: ["band", "land", "had"] },
  ],
  3: [
    { word: "ship", emoji: "🚢", distractors: ["sip", "chip", "shop"] },
    { word: "shop", emoji: "🛒", distractors: ["ship", "chop", "mop"] },
    { word: "chin", emoji: "🫦", distractors: ["shin", "thin", "can"] },
    { word: "chat", emoji: "💬", distractors: ["that", "hat", "chip"] },
    { word: "this", emoji: "👇", distractors: ["thin", "wish", "his"] },
    { word: "that", emoji: "👆", distractors: ["chat", "flat", "hat"] },
    { word: "thin", emoji: "🥢", distractors: ["this", "chin", "tin"] },
    { word: "then", emoji: "⏭️", distractors: ["when", "hen", "ten"] },
    { word: "wish", emoji: "⭐", distractors: ["fish", "dish", "with"] },
    { word: "fish", emoji: "🐟", distractors: ["wish", "dish", "fist"] },
  ],
  4: [
    { word: "bee",   emoji: "🐝",  distractors: ["see", "fee", "need"] },
    { word: "tree",  emoji: "🌳",  distractors: ["free", "bee", "see"] },
    { word: "need",  emoji: "🙏",  distractors: ["feed", "seed", "feel"] },
    { word: "feel",  emoji: "🤲",  distractors: ["reel", "heel", "need"] },
    { word: "eat",   emoji: "🍽️", distractors: ["seat", "beat", "oat"] },
    { word: "leaf",  emoji: "🍃",  distractors: ["loaf", "leap", "read"] },
    { word: "seat",  emoji: "💺",  distractors: ["beat", "heat", "eat"] },
    { word: "book",  emoji: "📚",  distractors: ["look", "cook", "boot"] },
    { word: "look",  emoji: "👀",  distractors: ["book", "cook", "lock"] },
    { word: "boot",  emoji: "👢",  distractors: ["book", "loot", "root"] },
    { word: "moon",  emoji: "🌙",  distractors: ["noon", "soon", "moan"] },
    { word: "pie",   emoji: "🥧",  distractors: ["tie", "lie", "die"] },
    { word: "tie",   emoji: "👔",  distractors: ["pie", "lie", "die"] },
    { word: "pause", emoji: "⏸️", distractors: ["cause", "sauce", "paws"] },
    { word: "haul",  emoji: "💪",  distractors: ["hall", "hull", "haunt"] },
  ],
};

export const WORD_LEVEL_INFO = [
  { level: 1, label: "Simple Words",   description: "CVC words",          count: 14, color: "bg-game-green"  },
  { level: 2, label: "Clusters",       description: "Consonant clusters",  count: 14, color: "bg-game-blue"   },
  { level: 3, label: "Digraphs",       description: "sh, ch, th words",   count: 10, color: "bg-game-purple" },
  { level: 4, label: "Vowel Clusters", description: "ee, ea, oo, ie, au", count: 15, color: "bg-game-orange" },
];
