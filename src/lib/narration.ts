export interface NarrationStrings {
  // Shared
  niceTry: string;
  youDidIt: (n: number) => string;

  // Letters game
  letsFind: string;
  findLetter: (x: string) => string;
  letsTry: string;
  veryGoodLetter: (x: string) => string;
  letterIsFor: (x: string, animal: string) => string;
  tapCorrectLetter: string;

  // Sounds game
  levelIntro: string;
  letsListenSound: string;
  whichLetterStarts: (word: string) => string;
  whichLetterAppears: (word: string) => string;
  veryGoodSound: (x: string, word: string) => string;
  soundLike: (x: string, word: string) => string;
  thisOneIs: (x: string, word: string) => string;

  // Word game
  letsFindWord: string;
  findWord: (word: string) => string;
  veryGoodWord: (word: string) => string;
  thisIsWord: (word: string) => string;
}

export function getNarration(
  lang: "en" | "he",
  playerName: string
): NarrationStrings {
  if (lang === "he") {
    return {
      niceTry: "ניסיון טוב! בואי ננסה שוב.",
      youDidIt: (n) => `כל הכבוד, ${playerName}! זכית ב-${n} כוכבים!`,

      letsFind: `בואי נקשיב ונמצא את האות, ${playerName}!`,
      findLetter: (x) => `מצאי את האות ${x}`,
      letsTry: `בואי ננסה, ${playerName}!`,
      veryGoodLetter: (x) => `כל הכבוד! זו האות ${x}!`,
      letterIsFor: (x, animal) => `${x} זה ${animal}!`,
      tapCorrectLetter: `אפשר ללחוץ על האות הנכונה, ${playerName}!`,

      levelIntro: "בואי נלמד את הצלילים. אני אראה לך כמה דוגמאות.",
      letsListenSound: "בואי נקשיב ונמצא את הצליל!",
      whichLetterStarts: (word) => `באיזו אות פותחת המילה ${word}?`,
      whichLetterAppears: (word) => `איזו אות מופיעה במילה ${word}?`,
      veryGoodSound: (x, word) =>
        `כל הכבוד! האות ${x} פותחת את המילה ${word}!`,
      soundLike: (x, word) => `${x} כמו ${word}`,
      thisOneIs: (x, word) =>
        `זו האות ${x}. האות ${x} פותחת את המילה ${word}.`,

      letsFindWord: `בואי נמצא את המילה, ${playerName}!`,
      findWord: (word) => `מצאי את המילה ${word}`,
      veryGoodWord: (word) => `כל הכבוד! זו המילה ${word}.`,
      thisIsWord: (word) => `זו המילה ${word}.`,
    };
  }

  return {
    niceTry: "Nice try! Let's try again.",
    youDidIt: (n) => `You did it, ${playerName}! You won ${n} stars!`,

    letsFind: `Let's listen and find the letter, ${playerName}!`,
    findLetter: (x) => `Find the letter ${x}`,
    letsTry: `Let's try, ${playerName}!`,
    veryGoodLetter: (x) => `Very good! This is the letter ${x}!`,
    letterIsFor: (x, animal) => `${x} is for ${animal}!`,
    tapCorrectLetter: `You can tap the correct letter, ${playerName}!`,

    levelIntro:
      "Let's learn and practice the sounds. I'll show you some examples.",
    letsListenSound: "Let's listen and find the sound!",
    whichLetterStarts: (word) => `Which letter(s) start the word ${word}?`,
    whichLetterAppears: (word) =>
      `Which letter(s) appear in the word ${word}?`,
    veryGoodSound: (x, word) => `Very good! The letter(s) ${x} start(s) ${word}!`,
    soundLike: (x, word) => `${x} like ${word}`,
    thisOneIs: (x, word) =>
      `This one is the letter(s) ${x}. ${x} starts ${word}.`,

    letsFindWord: `Let's find the word, ${playerName}!`,
    findWord: (word) => `Find the word ${word}`,
    veryGoodWord: (word) => `Very good! This is the word ${word}.`,
    thisIsWord: (word) => `This is the word ${word}.`,
  };
}
