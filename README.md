# English Learning Games for Kids

A collection of browser-based games designed to help young learners practice English fundamentals — letters, vocabulary, grammar, and more. All games run as standalone HTML files with no build tools or dependencies required.

## Games

### Letter Mole

Whack-a-mole style arcade game with two modes:

- **Letters Mode** — Moles pop up carrying letters. Match the target letter shown at the top. Progress through 4 levels (A-F, G-L, M-R, S-Z) as your score grows.
- **Words Mode** — Pick a vocabulary category (Animals, Colors, Food, Body), then work through a 3-step learning flow:
  1. **Flashcards** — Tap cards to reveal the English word for each emoji
  2. **Memory Match** — Pair emojis with their words in a 4x3 card grid
  3. **Mole Game** — Whack the mole carrying the correct word for the target emoji

### Word Garden Defense

Tower-defense inspired game where you answer English questions to plant sunflowers and peashooters to defend your garden from zombies.

### Word Runner (Roblox Runner)

Endless-runner style game where you pick the correct word gate to keep running and collect coins.

### Grammar Games

A set of focused grammar exercises:

- **Present Tense**
  - *Verb Match* — Match subjects with the correct form of "be" (am / is / are)
  - *Fill the Gap* — Choose the right verb to complete a sentence
  - *Sentence Builder* — Drag words into the correct order
- **Adjectives**
  - *Bigger & Best!* — Practice comparative and superlative forms (-er, -est, more, most)
- **Adverbs**
  - *How Often?* — Learn frequency adverbs (always, usually, often, sometimes, seldom, never)

## Shared Content

Every game draws its vocabulary and grammar from one place:

- **`shared/question-bank.js`** — 17 themes covering ~1,840 words and ~1,965 grammar items,
  each tagged with a difficulty from 0 (pre-A1 starter) to 8 (分科測驗). Call
  `QUESTION_BANK.forLevel('elementary' | 'junior' | 'senior')` to get a filtered copy;
  each band inherits everything below it.
- **`shared/MOE-curriculum-reference.md`** — the Taiwan MOE 108 課綱 and 大考中心 mapping
  the difficulty tiers are built from, plus the rules for placing a word at a tier.
- **`shared/validate-bank.js`** — run `node shared/validate-bank.js` after editing the
  bank. It checks that every grammar answer appears in its own options, that no word is
  duplicated within a theme, that `level` and `difficulty` agree, and that every theme has
  enough content at each tier for a game to build a round.

## Running Locally

Open `index.html` in any modern browser. No server, bundler, or install step needed — every game is a self-contained HTML file.

## Tech

- Plain HTML / CSS / JavaScript — no frameworks or dependencies
- Mobile-friendly with touch support
- Sound effects via Web Audio API
- Progress saved in `localStorage`
