export interface LetterData {
  letter: string;
  animal: string;
  emoji: string;
}

export const LETTER_MAP: Record<string, LetterData> = {
  A: { letter: "A", animal: "Ant", emoji: "🐜" },
  B: { letter: "B", animal: "Bear", emoji: "🐻" },
  C: { letter: "C", animal: "Capybara", emoji: "🦫" },
  D: { letter: "D", animal: "Dog", emoji: "🐕" },
  E: { letter: "E", animal: "Elephant", emoji: "🐘" },
  F: { letter: "F", animal: "Fox", emoji: "🦊" },
  G: { letter: "G", animal: "Giraffe", emoji: "🦒" },
  H: { letter: "H", animal: "Horse", emoji: "🐴" },
  I: { letter: "I", animal: "Iguana", emoji: "🦎" },
  J: { letter: "J", animal: "Jellyfish", emoji: "🪼" },
  K: { letter: "K", animal: "Kangaroo", emoji: "🦘" },
  L: { letter: "L", animal: "Lion", emoji: "🦁" },
  M: { letter: "M", animal: "Monkey", emoji: "🐒" },
  N: { letter: "N", animal: "Narwhal", emoji: "🐳" },
  O: { letter: "O", animal: "Owl", emoji: "🦉" },
  P: { letter: "P", animal: "Penguin", emoji: "🐧" },
  Q: { letter: "Q", animal: "Quail", emoji: "🐦" },
  R: { letter: "R", animal: "Rabbit", emoji: "🐇" },
  S: { letter: "S", animal: "Snake", emoji: "🐍" },
  T: { letter: "T", animal: "Tiger", emoji: "🐯" },
  U: { letter: "U", animal: "Unicorn", emoji: "🦄" },
  V: { letter: "V", animal: "Vulture", emoji: "🦅" },
  W: { letter: "W", animal: "Wolf", emoji: "🐺" },
  X: { letter: "X", animal: "X-ray fish", emoji: "🐟" },
  Y: { letter: "Y", animal: "Yak", emoji: "🐃" },
  Z: { letter: "Z", animal: "Zebra", emoji: "🦓" },
};

export const LEVELS: Record<number, string[]> = {
  1: ["A", "B", "C", "D", "M"],
  2: ["E", "F", "G", "H", "I", "L", "O", "P", "R", "T"],
  3: ["J", "K", "N", "S", "U", "V", "W", "X", "Y", "Z", "Q", "A", "B", "C"],
  4: Object.keys(LETTER_MAP),
};

// Phonetic variations for tolerant matching
const PHONETIC_MAP: Record<string, string[]> = {
  A: ["a", "ay", "eh", "ae"],
  B: ["b", "be", "bee", "bea"],
  C: ["c", "ce", "see", "sea", "si"],
  D: ["d", "de", "dee", "dea"],
  E: ["e", "ee", "ea"],
  F: ["f", "ef", "eff"],
  G: ["g", "ge", "gee", "ji", "jee"],
  H: ["h", "aitch", "ach", "ha"],
  I: ["i", "ai", "eye", "aye"],
  J: ["j", "jay", "je", "jei"],
  K: ["k", "ka", "kay", "ke"],
  L: ["l", "el", "ell"],
  M: ["m", "em", "mm"],
  N: ["n", "en", "nn"],
  O: ["o", "oh", "oo"],
  P: ["p", "pe", "pee", "pi"],
  Q: ["q", "cu", "cue", "queue", "kew", "kyu"],
  R: ["r", "ar", "are"],
  S: ["s", "es", "ess"],
  T: ["t", "te", "tee", "ti"],
  U: ["u", "you", "yu", "oo"],
  V: ["v", "ve", "vee", "vi"],
  W: ["w", "double u", "double you", "dub"],
  X: ["x", "ex", "eks"],
  Y: ["y", "why", "wai", "wy"],
  Z: ["z", "ze", "zee", "zed", "zet"],
};

export function matchLetter(spoken: string, targetLetter: string): boolean {
  const clean = spoken.trim().toLowerCase();
  if (!clean) return false;

  // Direct match
  if (clean === targetLetter.toLowerCase()) return true;

  // Phonetic match
  const variants = PHONETIC_MAP[targetLetter.toUpperCase()] || [];
  if (variants.some((v) => clean.includes(v) || v.includes(clean))) return true;

  // Check if the spoken text contains the letter name
  const animalData = LETTER_MAP[targetLetter.toUpperCase()];
  if (animalData && clean.includes(animalData.animal.toLowerCase())) return true;

  return false;
}
