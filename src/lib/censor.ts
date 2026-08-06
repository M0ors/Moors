const WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "shit",
  "shitting",
  "bitch",
  "bastard",
  "asshole",
  "cunt",
  "cock",
  "dick",
  "pussy",
  "slut",
  "whore",
  "cum",
  "cumming",
  "deepthroat",
  "blowjob",
  "handjob",
  "anal",
  "nude",
  "nudes",
  "porn",
  "porno",
  "xxx",
  "sex",
  "sexy",
  "horny",
  "boob",
  "boobs",
  "tits",
  "tit",
  "penis",
  "vagina",
  "orgasm",
  "masturbat",
  "nsfw",
  "nigger",
  "nigga",
];

function maskWord(word: string) {
  if (word.length <= 1) return "*";
  if (word.length === 2) return `${word[0]}*`;
  return `${word[0]}${"*".repeat(word.length - 2)}${word[word.length - 1]}`;
}

const PATTERN = new RegExp(
  `\\b(${WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\w*\\b`,
  "gi"
);

export function censorText(text: string | null | undefined, showUncensored: boolean) {
  if (!text) return text ?? "";
  if (showUncensored) return text;
  return text.replace(PATTERN, (match) => maskWord(match));
}
