# Word Town — Season 1 Design

A Monopoly-shaped board game for teaching English to a beginner in a **30-minute
weekly lesson**, one teacher and one child sharing one screen.

Season 1 is **8 lessons / 4 hours of instruction**, teaching **68 words** and
**7 sentence patterns**, ending at present continuous. Every word is drawn from
`shared/question-bank.js` at difficulty 0–1.

---

## 1. Why not just port Monopoly

Classic Monopoly is a poor teaching game and it is worth being explicit about why,
because each flaw dictates a rule change.

| Monopoly does this | Effect on a lesson | What Word Town does |
|---|---|---|
| Runs 60–120 minutes | Never finishes in a 30-min slot | Fixed turn clock, ~18 min of play |
| Most turn time is money arithmetic | That is maths practice, not English | Coins are small integers; no change-making |
| Players go bankrupt and are eliminated | A child crying at minute 22 | Coins floor at zero; nobody is ever out |
| Two dice, average 7 | Laps too fast to revisit a property | One die, average 3.5 |
| Rent is a pure tax | Dead time, no learning | **Rent is a spoken sentence** |
| Winner is richest | Rewards luck and hoarding | Winner owns the most buildings |

The one mechanic worth keeping is the reason to build this at all:

> **Rent is review.** You buy a property by learning a word. Every later landing —
> yours or the teacher's — makes that word get said again. Monopoly's core loop is
> already a dice-scheduled spaced-repetition engine.

Colour groups map onto vocabulary sets. That is the whole design.

---

## 2. The central mechanic: the purchase sentence *is* the grammar

Each lesson has exactly **one sentence frame**. The board is a place in the story,
the 12 properties are things in that place, and the frame is how you claim them.

Week 2 is the Market. The 12 properties are stalls:

```
🍎  →  "I like apples."   →  you own the stall
```

Landing on the teacher's stall means saying it again with their word. Across ~40
landings in 18 minutes the child produces **one frame roughly 40 times with 12
different words in the slot**. That is how a beginner internalises a pattern: a
high-frequency frame with a rotating slot. It beats 40 unrelated gap-fills, and it
is less content to author, not more.

### The depth ladder

Upgrading a property is not "add a house" — it is saying the same word at greater
grammatical depth. Rent scales with depth, so **the economy pays for grammar**.

| Level | Building | Week 2 example | Rent |
|---|---|---|---|
| 1 | 🏠 hut | `apple` | 1 coin |
| 2 | 🏡 house | `I like apples.` | 2 coins |
| 3 | 🏘️ shop | `I don't like apples.` | 4 coins |

Level 3 is a *transformation* of the frame — negative, question, or third person,
chosen per week. The child upgrades out of greed. The greed is the pedagogy.

---

## 3. The board

**20 squares, one die.** One die averages 3.5, giving ~6 turns per lap — slow enough
to revisit properties, and the child says a number 1–6 in English every single turn.

```
        13   14   15   16   17   18
     12 ┌────────────────────────┐ 19
     11 │                        │ 20
     10 │      WORD TOWN         │  1  START 🏠
      9 │                        │  2
      8 └────────────────────────┘  3
        7    6    5    4
```

| # | Square | Effect |
|---|---|---|
| 1 | **Start** 🏠 | Pass or land: +5 coins. Momo speaks one owned word aloud. |
| 2–4 | Set A ▲ (3 properties) | |
| 5 | **Mystery** ❓ | Draw a card (§4) |
| 6–8 | Set B ● (3 properties) | |
| 9 | **Practice Corner** 📚 | Not jail. Free flashcard drill, no penalty, no turn lost. |
| 10 | **Mystery** ❓ | Draw a card |
| 11–13 | Set C ■ (3 properties) | |
| 14 | **Park** 🌳 | Rest. 15-second mini-game for +2 coins. |
| 15 | **Mystery** ❓ | Draw a card |
| 16–18 | Set D ◆ (3 properties) | |
| 19 | **Shop** 🛒 | Spend coins (§5) |
| 20 | **Mystery** ❓ | Draw a card |

12 properties in 4 sets of 3. From Week 2 onward, **Set D is always Memory Lane** —
review words from earlier weeks, visually distinct. So each board is 9 new + 3 review.

---

## 4. Rules

**Setup.** Both players start on Start with **10 coins**. The clock reads
`🚂 The train leaves in 20 turns.`

**A turn.**
1. Roll one die. Say the number in English. *(This is a free rep, every turn.)*
2. Move. Momo walks the squares.
3. Resolve the square.
4. Clock ticks down by one.

**Landing on an unowned property.**
Answer the week's question at level 1 (tap the word for the picture). Correct → pay
3 coins and build a 🏠. Wrong → nothing happens, the property stays free. **No coin
penalty for a wrong answer, ever.** The message is "the word ran away — catch it next
lap," not "you lose."

**Landing on your own property.**
Offered an upgrade: pay 5 coins and answer at the next depth. Decline freely.

**Landing on the other player's property.**
Pay rent by *saying the sentence at that property's level*. The teacher taps ✓ or ↻.
↻ means try once more with Momo speaking it first; there is no failure state, and
rent is paid either way. Coins floor at zero — a player at zero keeps playing and
keeps answering.

**Completing a set.** Own all 3 in a colour → the street lights up, rent doubles on
those properties, and **a story beat plays** (§7).

**End.** When the clock hits zero, the finale beat plays regardless of progress, then
the report card. **Winner owns the most buildings** — count 🏠=1, 🏡=2, 🏘️=3. Coins
are not score; they are fuel.

**Mystery cards.** 12 per week, drawn at random. Speaking-first, always doable:
- *Say 3 animals in 10 seconds* → +3 coins
- *Momo says a word — repeat it* → +2 coins
- *Ask your teacher: "Do you like cake?"* → +3 coins
- *Move to any Memory Lane square*
- *Free upgrade on any property you own*
- *Momo is hungry — give him a food word* → +2 coins

No "go back 3 spaces", no "pay a fine". Every card is an opportunity.

---

## 5. Economy

| Action | Cost / gain |
|---|---|
| Start (pass or land) | +5 |
| Buy a property | −3 |
| Upgrade a property | −5 |
| Rent received | +1 / +2 / +4 by level, doubled on a complete set |
| Park mini-game | +2 |
| Mystery card | +2 or +3 |
| Shop: hint token | −3 (reveals the 中文 hint once) |
| Shop: choose your move | −5 (move exactly where you want next turn) |

That last one matters. Pure dice makes a child a passenger; one purchasable choice
per lap restores agency without adding rules.

---

## 6. The 30-minute lesson

| Time | Phase | What happens |
|---|---|---|
| 0–8 min | **Teach** | Flashcards for the 9 new words. Momo speaks each; the child repeats. Then the week's frame, modelled 3 times. |
| 8–26 min | **Play** | ~20 turns each. ≈40 word encounters, ~3 exposures per word. |
| 26–30 min | **Report** | Words mastered, words missed, next week's preview. |

The teach phase reuses the flow already in [letter-mole](../letter-mole/) —
flashcards → matching → game. Step 3 is simply the board instead of the mole.

### Report card

```
🏘️  WORD TOWN — Week 2: The Market

    Momo's town grew by 7 buildings today!

    ✅ You learned      cake · bread · milk · juice · apple · egg · rice
    🔁 Practice again   pie · water
    💬 You said "I like ___" 38 times

    ⭐ Next week: Momo paints his new house.
```

Screenshot-able for parents. This is what makes the app a teaching tool rather than a
game with words in it.

---

## 7. Season 1 — *Momo Comes to Town*

**Premise.** Momo the Mole (already the mascot in [letter-mole](../letter-mole/))
digs up into an empty grey town where nothing has a name. Naming things brings them
back to life. Each week one district wakes up. In Week 8 the whole town opens.

Naming = building. This maps exactly onto learn word → own property → building appears.

**Story beats** fire on completing sets A, B and C; the finale fires when the train
leaves, so the child never misses the ending. Each beat is ~2 sentences of simple
English with a 中文 line underneath, ~15 seconds. Not a cutscene — beginners cannot
sit through one.

### Season at a glance

| Wk | District | Sentence frame | Level 3 transformation | New |
|---|---|---|---|---|
| 1 | 🚜 The Farm | `This is a ___.` | `Is this a ___?` | 12 |
| 2 | 🛒 The Market | `I like ___.` | `I don't like ___.` | 9 |
| 3 | 🎨 The Paint Shop | `It is ___.` | `The cat is black.` | 9 |
| 4 | 🏡 Momo's House | `He / She is my ___.` | `Is she your ___?` | 9 |
| 5 | 🎪 The Fair | `I see four ___s.` | `There are four ___s.` | 11 numbers |
| 6 | 🎤 The Talent Show | `A frog can ___.` | `Can a frog ___?` | 9 |
| 7 | 🏙️ The Town Square | `The dog is ___ing.` | `What is the dog doing?` | 9 |
| 8 | 🎊 Grand Opening | all seven | — | 0 |

68 new words across 4 hours — about 8 per lesson, the right rate for a beginner.

---

### Week 1 · 🚜 The Farm — `This is a ___.`

Momo climbs out of his hole into a grey field. Nothing has a name yet.

**No Memory Lane this week** — all 12 properties are new.

| Set | Street | Properties |
|---|---|---|
| ▲ | Barn Lane | cow · pig · hen |
| ● | Green Field | goat · dog · cat |
| ■ | Duck Pond | duck · fish · frog |
| ◆ | Fox Woods | fox · bee · bird |

**Ladder** — `cow` → `This is a cow.` → `Is this a cow?`

**Beats** — A: *Momo names the barn. The cow says hello!* · B: *The field turns
green.* · C: *The pond fills with water.* · Finale: *The farm is alive. Momo has
friends now.*

> **Note.** Every word is consonant-initial on purpose, so `a` vs `an` never comes up
> in week 1. `ant` was swapped for `goat` for exactly this reason. Article choice
> arrives in Season 2.

---

### Week 2 · 🛒 The Market — `I like ___.`

Momo is hungry. The market stalls are empty until they are named.

| Set | Street | Properties |
|---|---|---|
| ▲ | Bakery Row | cake · bread · pie |
| ● | Fresh Stall | apple · rice · egg |
| ■ | Drinks Cart | milk · juice · water |
| ◆ | Memory Lane | cat · dog · duck |

**Ladder** — `cake` → `I like cake.` → `I don't like cake.`

> **Why `I like` and not `I want a`.** `I want a ___` breaks on mass nouns — *a rice*,
> *a milk*, *a water* are all wrong, and a beginner cannot yet hear why. `I like ___`
> is grammatical with every food word, countable or not, and is the single most useful
> sentence a beginner can say. Countability is a Season 2 problem.

Level 3 gives the child `I don't like ___`, which they will use constantly and with
enormous enthusiasm.

---

### Week 3 · 🎨 The Paint Shop — `It is ___.`

Momo's house is grey. The paint shop has colour but no names for it.

| Set | Street | Properties |
|---|---|---|
| ▲ | Warm Wall | red · orange · yellow |
| ● | Cool Wall | blue · green · purple |
| ■ | Base Wall | black · white · brown |
| ◆ | Memory Lane | apple · milk · frog |

**Ladder** — `red` → `It is red.` → `The cat is black.`

Level 3 combines this week's colour with a **Week 1–2 noun**, so the review set is not
just decoration — it is the raw material for the hardest tier. This is the first week
where two lessons combine into one sentence.

---

### Week 4 · 🏡 Momo's House — `He is my ___. / She is my ___.`

Momo's family arrives for the housewarming.

| Set | Street | Properties |
|---|---|---|
| ▲ | Upstairs | mom · sister · baby |
| ● | Downstairs | dad · brother · friend |
| ■ | The Garden | girl · boy · family |
| ◆ | Memory Lane | red · cake · bird |

**Ladder** — `mom` → `She is my mom.` → `Is she your mom?`

The densest grammar week in the season: **he/she**, **is**, and **my/your** all at
once. Level 3 flips `my` → `your` and inverts to a question, which forces genuine
teacher↔child dialogue rather than recitation. This is the core of A1 and worth
slowing down for.

---

### Week 5 · 🎪 The Fair — `I see four ___s.`

The fair comes to town. Everything needs counting.

**The die supplies the number.** Roll a 4, land on the cat stall, say
*"I see four cats."* The randomiser becomes the grammar — no new noun content, so
this is a consolidation week that only *feels* like a new one.

| Set | Tent | Properties (all review) |
|---|---|---|
| ▲ | Animal Tent | cat · dog · duck |
| ● | Food Tent | apple · cake · egg |
| ■ | Pond Tent | bird · fish · frog |
| ◆ | People Tent | girl · boy · baby |

**New content** — `one two three four five six seven eight nine ten zero`, plus the
plural `-s` rule.

**Ladder** — `four` → `I see four cats.` → `There are four cats.`

> Rolling a **1** produces *"I see one cat"* — no `-s`. That contrast is the entire
> plural lesson, delivered by the dice roughly three times a game. Do not suppress it;
> highlight it.

---

### Week 6 · 🎤 The Talent Show — `A frog can ___.`

Nobody can sleep. Momo throws a talent show to find out what everyone can do.

| Set | Stage | Properties |
|---|---|---|
| ▲ | Sport Stage | run · jump · swim |
| ● | Art Stage | sing · dance · draw |
| ■ | Quiet Stage | eat · sit · sleep |
| ◆ | Memory Lane | fox · mom · blue |

**Ladder** — `jump` → `A frog can jump.` → `Can a frog jump?`

First week with **verbs as properties**, and the first modal. The animal comes from
Week 1 review, so every sentence is half old and half new — the sweet spot. The
teacher can also deny: *"A fish cannot jump!"* is a reliable laugh and teaches the
negative for free.

---

### Week 7 · 🏙️ The Town Square — `The dog is ___ing.`

The town is nearly finished. Everyone is busy in the square.

| Set | Corner | Properties |
|---|---|---|
| ▲ | Busy Corner | walking · playing · reading |
| ● | Work Corner | cooking · writing · washing |
| ■ | Helping Corner | looking · helping · opening |
| ◆ | Memory Lane | run**ning** · jump**ing** · sing**ing** |

**Ladder** — `running` → `The dog is running.` → `What is the dog doing?`

Memory Lane deliberately holds **Week 6 verbs in `-ing` form**. The child already owns
`run`; now they meet `running`. Same word, new grammar — the clearest possible
demonstration of what a tense is.

`run → running` also introduces consonant doubling. Show it, do not explain the rule.

---

### Week 8 · 🎊 Grand Opening — every frame

The town is complete. Everyone Momo has named comes to the festival.

All 12 properties are review, drawn from Weeks 1–7. **Each property is tagged with the
frame it belongs to**, so the board cycles through all seven patterns:

| Set | Properties | Frames in play |
|---|---|---|
| ▲ | cow · apple · red | `This is a ___` · `I like ___` · `It is ___` |
| ● | mom · cat · jump | `She is my ___` · `I see three ___s` · `A frog can ___` |
| ■ | running · dog · milk | `The dog is ___ing` · `This is a ___` · `I like ___` |
| ◆ | Momo's Choice ×3 | any frame, child picks |

No new grammar. This is the assessment lesson and the emotional payoff: the report
card shows the **whole season** — every word, every frame, the finished town.

**Finale** — *Momo's town is full of words now. Every one of them is yours.*

---

## 8. The Word Town map — the long hook

Every property mastered stays built on a **persistent town map** that carries across
weeks. Week 1 leaves a farm, Week 2 adds a market, Week 5 a fairground. By Week 8 the
child sees a town they built out of ~68 words they own.

This is the single most motivating artifact in the app, and it is nearly free: it is a
render of the `mastered` array that
[word-garden-defense/progress.js](../word-garden-defense/progress.js) already keeps.
Tapping any building replays its word.

It doubles as the review pool — Memory Lane draws from it.

---

## 9. Technical plan

Plain HTML/CSS/JS, no build step, consistent with the rest of the repo.

```
word-town/
  index.html      screens: menu → teach → board → report
  board.js        20 squares, dice, movement, ownership, rent
  game.js         turn loop, economy, question flow
  story.js        Momo beats, mystery cards
  styles.css
  DESIGN.md       this file
shared/
  curriculum.js   NEW — season/week definitions
  progress.js     MOVED from word-garden-defense/
  speech.js       NEW — thin Web Speech wrapper
```

**`shared/curriculum.js`** is the new piece. A week is data, not code:

```js
{
  week: 2, district: 'The Market', emoji: '🛒',
  frame:  { l1: '{word}', l2: 'I like {word}.', l3: "I don't like {word}." },
  sets: [
    { key: 'A', name: 'Bakery Row', words: ['cake','bread','pie'] },
    { key: 'B', name: 'Fresh Stall', words: ['apple','rice','egg'] },
    { key: 'C', name: 'Drinks Cart', words: ['milk','juice','water'] },
    { key: 'D', name: 'Memory Lane', review: true, words: ['cat','dog','duck'] },
  ],
  beats: [ /* 4 story beats */ ],
}
```

Words are **ids into the bank**, not copies — emoji, 中文 hint and difficulty come from
`shared/question-bank.js` at render time. One source of truth.

**Promoting `progress.js` to `shared/`.** Word Garden currently owns it and writes to
`localStorage` key `wgd-progress-v1`. Moving it lets Word Town read the same mastery
record, which is what makes Memory Lane work. Keep the existing key and add a
namespaced `wt-` section rather than migrating — no risk to existing saves.

**`shared/speech.js`** wraps `speechSynthesis`. Every word is spoken, always. For a
beginner, hearing the word is half the learning, it costs nothing, and it is the
difference between a board that feels alive and one that feels like a worksheet.

**Build order.** Week 1 end-to-end first — board, dice, buy/rent/upgrade, beats, report,
map — with Weeks 2–8 present as data but untested. Playtest with a real child before
authoring the remaining seven weeks, because the rent-as-speaking loop is the one
assumption in this document that has not been checked against a live human.

---

## 10. Deliberately cut

Trading · mortgages · auctions · taxes · bankruptcy · elimination · houses-before-hotels
scarcity · two dice · money change-making · AI opponent (the teacher is player 2).

Trading is worth revisiting in a later season — it is excellent speaking practice — but
it is far too much English for a beginner, and it stalls a 30-minute clock.

---

## 11. Open questions

1. **Does rent-as-speaking hold up?** The whole design rests on a child cheerfully
   saying a sentence to pay rent 20 times per lesson. Plausible, unverified. If it
   drags, the fallback is tap-to-answer at level 1 and speaking only at levels 2–3.
2. **Is 20 turns right?** 18 minutes of play at ~25s/turn. Needs a real timing test.
3. **Is Week 4 too dense?** he/she + is + my/your in one lesson. May need splitting,
   which would push the season to 9 weeks.
4. **Season length.** 8 weeks keeps the theme order changeable between seasons. If a
   child needs food vocabulary sooner, Season 2 can reorder — a 40-week arc could not.
