export interface TeachingExample {
  word: string;
  emoji: string;
  highlight: string; // substring of word to highlight
}

export interface TeachingSlide {
  focusText: string;   // "A", "SH", "EE"
  intro: string;       // spoken first ("The letter A starts these words.")
  heIntro?: string;    // Hebrew intro shown to the learner
  words: string[];     // spoken one by one with pauses after intro
  examples: TeachingExample[];
}

export const TEACHING_SLIDES: Record<number, TeachingSlide[]> = {
  // Level 2 — Short Vowels
  2: [
    {
      focusText: "A",
      intro: "The letter A starts these words.",
      heIntro: "הצליל A עושה 'aah' כמו במילה ant",
      words: ["ant", "as", "after"],
      examples: [
        { word: "ant",   emoji: "🐜",  highlight: "a" },
        { word: "as",    emoji: "➕",  highlight: "a" },
        { word: "after", emoji: "⏭️", highlight: "a" },
      ],
    },
    {
      focusText: "I",
      intro: "The letter I starts these words.",
      heIntro: "הצליל I עושה 'ih' כמו במילה iguana",
      words: ["it", "iguana", "igloo", "ink"],
      examples: [
        { word: "it",     emoji: "👉",  highlight: "i" },
        { word: "iguana", emoji: "🦎",  highlight: "i" },
        { word: "igloo",  emoji: "🧊",  highlight: "i" },
        { word: "ink",    emoji: "🖊️", highlight: "i" },
      ],
    },
    {
      focusText: "O",
      intro: "The letter O starts these words.",
      heIntro: "הצליל O עושה 'oh' כמו במילה octopus",
      words: ["octopus", "ostrich", "Oscar"],
      examples: [
        { word: "octopus", emoji: "🐙", highlight: "o" },
        { word: "ostrich", emoji: "🦤", highlight: "o" },
        { word: "Oscar",   emoji: "👦", highlight: "o" },
      ],
    },
    {
      focusText: "E",
      intro: "The letter E starts these words.",
      heIntro: "הצליל E עושה 'eh' כמו במילה elephant",
      words: ["elephant", "echo", "eraser"],
      examples: [
        { word: "elephant", emoji: "🐘", highlight: "e" },
        { word: "echo",     emoji: "🔊", highlight: "e" },
        { word: "eraser",   emoji: "✏️", highlight: "e" },
      ],
    },
    {
      focusText: "U",
      intro: "The letter U starts these words.",
      heIntro: "הצליל U עושה 'uh' כמו במילה umbrella",
      words: ["umbrella", "up", "under", "upset"],
      examples: [
        { word: "umbrella", emoji: "☂️", highlight: "u" },
        { word: "up",       emoji: "⬆️", highlight: "u" },
        { word: "under",    emoji: "⬇️", highlight: "u" },
        { word: "upset",    emoji: "😢", highlight: "u" },
      ],
    },
  ],

  // Level 3 — Consonant Digraphs
  3: [
    {
      focusText: "SH",
      intro: "The letters S H start these words.",
      heIntro: "הצליל SH עושה 'shh' כמו במילה shore",
      words: ["shore", "shout", "shrink", "shower"],
      examples: [
        { word: "shore",  emoji: "🏖️", highlight: "sh" },
        { word: "shout",  emoji: "📣",  highlight: "sh" },
        { word: "shrink", emoji: "🔬",  highlight: "sh" },
        { word: "shower", emoji: "🚿",  highlight: "sh" },
      ],
    },
    {
      focusText: "CH",
      intro: "The letters C H start these words.",
      heIntro: "הצליל CH עושה 'chh' כמו במילה chair",
      words: ["chair", "child", "change", "chalk"],
      examples: [
        { word: "chair",  emoji: "🪑", highlight: "ch" },
        { word: "child",  emoji: "👦", highlight: "ch" },
        { word: "change", emoji: "🔄", highlight: "ch" },
        { word: "chalk",  emoji: "🎨", highlight: "ch" },
      ],
    },
    {
      focusText: "PH",
      intro: "The letters P H start these words.",
      heIntro: "הצליל PH עושה 'fuh' כמו במילה phone",
      words: ["phone", "photo", "phase"],
      examples: [
        { word: "phone", emoji: "📱", highlight: "ph" },
        { word: "photo", emoji: "📸", highlight: "ph" },
        { word: "phase", emoji: "🌙", highlight: "ph" },
      ],
    },
    {
      focusText: "TH",
      intro: "The letters T H can sound like this.",
      heIntro: "הצליל TH יכול להשמע כמו במילה think",
      words: ["think", "three", "thunder", "thumb"],
      examples: [
        { word: "think",   emoji: "💭",  highlight: "th" },
        { word: "three",   emoji: "3️⃣", highlight: "th" },
        { word: "thunder", emoji: "⛈️", highlight: "th" },
        { word: "thumb",   emoji: "👍",  highlight: "th" },
      ],
    },
    {
      focusText: "TH",
      intro: "They can also sound like this.",
      heIntro: "הוא יכול להשמע גם כמו במילה this",
      words: ["this", "that", "they", "there"],
      examples: [
        { word: "this",  emoji: "👇",     highlight: "th" },
        { word: "that",  emoji: "👆",     highlight: "th" },
        { word: "they",  emoji: "👨‍👩‍👦", highlight: "th" },
        { word: "there", emoji: "👉",     highlight: "th" },
      ],
    },
  ],

  // Level 4 — Vowel Clusters
  4: [
    {
      focusText: "AI",
      intro: "The letters A I are in these words.",
      heIntro: "הצליל AI עושה 'ay' כמו במילה rain",
      words: ["rain", "train", "brain"],
      examples: [
        { word: "rain",  emoji: "🌧️", highlight: "ai" },
        { word: "train", emoji: "🚂",  highlight: "ai" },
        { word: "brain", emoji: "🧠",  highlight: "ai" },
      ],
    },
    {
      focusText: "EE",
      intro: "The letters E E are in these words.",
      heIntro: "הצליל EE עושה 'eee' כמו במילה bee",
      words: ["bee", "tree", "feet"],
      examples: [
        { word: "bee",  emoji: "🐝", highlight: "ee" },
        { word: "tree", emoji: "🌳", highlight: "ee" },
        { word: "feet", emoji: "🦶", highlight: "ee" },
      ],
    },
    {
      focusText: "EA",
      intro: "The letters E A start these words.",
      heIntro: "הצליל EA עושה 'eee' כמו במילה eagle",
      words: ["easy", "eat", "eagle"],
      examples: [
        { word: "easy",  emoji: "✅",  highlight: "ea" },
        { word: "eat",   emoji: "🍽️", highlight: "ea" },
        { word: "eagle", emoji: "🦅",  highlight: "ea" },
      ],
    },
    {
      focusText: "AU",
      intro: "The letters A U are in these words.",
      heIntro: "הצליל AU עושה 'aw' כמו במילה autumn",
      words: ["autumn", "sauce", "author"],
      examples: [
        { word: "autumn", emoji: "🍂", highlight: "au" },
        { word: "sauce",  emoji: "🫙", highlight: "au" },
        { word: "author", emoji: "✍️", highlight: "au" },
      ],
    },
    {
      focusText: "OO",
      intro: "The letters O O are in these words.",
      heIntro: "הצליל OO עושה 'ooo' כמו במילה boot",
      words: ["boot", "root", "moon"],
      examples: [
        { word: "boot", emoji: "👢", highlight: "oo" },
        { word: "root", emoji: "🌱", highlight: "oo" },
        { word: "moon", emoji: "🌙", highlight: "oo" },
      ],
    },
    {
      focusText: "IE",
      intro: "The letters I E are in these words.",
      heIntro: "הצליל IE עושה 'eye' כמו במילה pie",
      words: ["pie", "tie", "lie"],
      examples: [
        { word: "pie", emoji: "🥧", highlight: "ie" },
        { word: "tie", emoji: "👔", highlight: "ie" },
        { word: "lie", emoji: "🤥", highlight: "ie" },
      ],
    },
  ],
};
