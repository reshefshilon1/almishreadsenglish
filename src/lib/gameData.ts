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
  Q: { letter: "Q", animal: "Queen", emoji: "👑" },
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

// Letters that look or sound similar — used to pick meaningful distractors
const SIMILAR_LETTERS: Record<string, string[]> = {
  A: ["H", "N", "E", "R"],
  B: ["D", "P", "R", "Q"],
  C: ["G", "O", "Q", "S"],
  D: ["B", "P", "Q", "O"],
  E: ["F", "B", "A", "L"],
  F: ["E", "T", "P", "L"],
  G: ["C", "O", "Q", "S"],
  H: ["A", "N", "M", "K"],
  I: ["J", "L", "T", "F"],
  J: ["I", "L", "T", "F"],
  K: ["R", "X", "H", "Y"],
  L: ["I", "J", "F", "T"],
  M: ["N", "W", "H", "A"],
  N: ["M", "H", "W", "A"],
  O: ["C", "G", "Q", "D"],
  P: ["B", "D", "R", "F"],
  Q: ["O", "G", "C", "D"],
  R: ["B", "P", "K", "F"],
  S: ["Z", "C", "G", "O"],
  T: ["F", "I", "L", "J"],
  U: ["V", "W", "Y", "N"],
  V: ["U", "W", "Y", "X"],
  W: ["M", "N", "V", "U"],
  X: ["K", "Y", "Z", "V"],
  Y: ["V", "X", "K", "U"],
  Z: ["S", "X", "N", "E"],
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDistractors(target: string, count: number): string[] {
  const upper = target.toUpperCase();
  const allLetters = Object.keys(LETTER_MAP);
  const preferred = (SIMILAR_LETTERS[upper] ?? []).filter((l) => l !== upper);

  const pool: string[] = [];
  for (const l of preferred) {
    if (pool.length >= count) break;
    pool.push(l);
  }

  const remaining = shuffleArray(allLetters.filter((l) => l !== upper && !pool.includes(l)));
  for (const l of remaining) {
    if (pool.length >= count) break;
    pool.push(l);
  }

  return pool.slice(0, count);
}
