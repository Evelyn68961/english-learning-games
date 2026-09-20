// Word Town — season and week definitions.
//
// A week is data, not code. Words are *ids into the question bank*, never
// copies: emoji, 中文 hint and difficulty are resolved from
// shared/question-bank.js at render time, so the bank stays the one source of
// truth. See word-town/DESIGN.md for the pedagogy behind these choices.
//
// Each week supplies one sentence FRAME with three depths. Buying a property
// uses depth 1, and each upgrade steps to the next — so rent scales with
// grammatical depth and the game's economy pays for grammar.
//
// Frame templates understand these slots:
//   {word}    the property's word (its `frameForm` if it has one, else `display`)
//   {n}       the die roll, spelled in English  (week 5)
//   {wordN}   the word, pluralised to agree with {n} (week 5 plural contrast)
//   {are}     "is" when n is 1, otherwise "are" (week 5)
//   {review}  a random word from the Memory Lane set (week 3)
//   {animal}  who is performing the action      (week 6)
//   {subj}    the subject of the sentence       (week 7)
//   {pron}    He or She                          (week 4)
//
// A word may carry `slots` to fill those itself, because a single fixed value
// per week is not enough: "She is my dad" and "The dog is cooking" are both
// wrong, and a beginner must never be asked to say a wrong sentence. A word may
// also carry `frameForm` when the sentence needs a different form from the one
// being taught — the flashcard says `apple`, the frame says `I like apples.`
//
// A set with `review: true` is Memory Lane — words carried over from earlier
// weeks. Every board is 4 sets of 3; from week 2 on, one of them is review.

(function () {

const NUMBER_WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];

const WEEKS = [
    // ---------------------------------------------------------------- week 1
    {
        week: 1, district: 'The Farm', emoji: '🚜', theme: 'animals',
        blurb: 'Momo names the farm animals.',
        frame: {
            l1: '{word}',
            l2: 'This is a {word}.',
            l3: 'Is this a {word}?',
        },
        // Every word is consonant-initial on purpose so "a" vs "an" never comes
        // up in week 1 — that is why `ant` was swapped out for `goat`.
        sets: [
            { key: 'A', name: 'Barn Lane',   color: '#C1793A', words: ['cow', 'pig', 'hen'] },
            { key: 'B', name: 'Green Field', color: '#4C9A5A', words: ['goat', 'dog', 'cat'] },
            { key: 'C', name: 'Duck Pond',   color: '#3E8FB8', words: ['duck', 'fish', 'frog'] },
            { key: 'D', name: 'Fox Woods',   color: '#B8763E', words: ['fox', 'bee', 'bird'] },
        ],
        beats: [
            { on: 'A', text: 'Momo names the barn. The cow says hello!', zh: '摩摩幫穀倉取名字，牛跟他打招呼！' },
            { on: 'B', text: 'The grey field turns green.',              zh: '灰色的田變綠了。' },
            { on: 'C', text: 'The pond fills up with water.',            zh: '池塘裝滿了水。' },
            { on: 'end', text: 'The farm is alive. Momo has friends now!', zh: '農場活起來了，摩摩有朋友了！' },
        ],
    },
    // ---------------------------------------------------------------- week 2
    {
        week: 2, district: 'The Market', emoji: '🛒', theme: 'food',
        blurb: 'Momo is hungry. The stalls need names.',
        // "I like ___" not "I want a ___": the latter breaks on mass nouns
        // (a rice / a milk / a water) and a beginner cannot yet hear why.
        frame: {
            l1: '{word}',
            l2: 'I like {word}.',
            l3: "I don't like {word}.",
        },
        // Countable words carry a plural `frameForm`: the flashcard teaches
        // `apple`, but the sentence has to be "I like apples." The child meets
        // the plural naturally instead of being drilled on it.
        sets: [
            { key: 'A', name: 'Bakery Row',  color: '#D2691E', words: ['cake', 'bread', 'pie'] },
            { key: 'B', name: 'Fresh Stall', color: '#4C9A5A', words: [
                { id: 'apple', frameForm: 'apples' }, 'rice', { id: 'egg', frameForm: 'eggs' } ] },
            { key: 'C', name: 'Drinks Cart', color: '#3E8FB8', words: ['milk', 'juice', 'water'] },
            { key: 'D', name: 'Memory Lane', color: '#8E7CC3', review: true, words: [
                { id: 'cat', frameFrom: 1 }, { id: 'dog', frameFrom: 1 }, { id: 'duck', frameFrom: 1 } ] },
        ],
        beats: [
            { on: 'A', text: 'The bakery opens. It smells wonderful!', zh: '麵包店開張了，好香！' },
            { on: 'B', text: 'Fresh food fills the stall.',           zh: '新鮮的食物擺滿攤位。' },
            { on: 'C', text: 'Momo drinks the cold milk. Yum!',       zh: '摩摩喝下冰牛奶，好喝！' },
            { on: 'end', text: 'The market is busy. Momo is not hungry now!', zh: '市場熱鬧起來，摩摩不餓了！' },
        ],
    },
    // ---------------------------------------------------------------- week 3
    {
        week: 3, district: 'The Paint Shop', emoji: '🎨', theme: 'colors',
        blurb: "Momo's house is grey. Time to paint.",
        // l3 pairs this week's colour with a Memory Lane noun, so the review
        // set is the raw material for the hardest tier rather than decoration.
        frame: {
            l1: '{word}',
            l2: 'It is {word}.',
            l3: 'The {review} is {word}.',
        },
        sets: [
            { key: 'A', name: 'Warm Wall', color: '#E05A2B', words: ['red', 'orange', 'yellow'] },
            { key: 'B', name: 'Cool Wall', color: '#3E8FB8', words: ['blue', 'green', 'purple'] },
            { key: 'C', name: 'Base Wall', color: '#5A5A5A', words: ['black', 'white', 'brown'] },
            { key: 'D', name: 'Memory Lane', color: '#8E7CC3', review: true, words: [
                { id: 'apple', frameFrom: 2, frameForm: 'apples' }, { id: 'milk', frameFrom: 2 }, { id: 'frog', frameFrom: 1 } ] },
        ],
        beats: [
            { on: 'A', text: 'Momo paints the door red!',        zh: '摩摩把門漆成紅色！' },
            { on: 'B', text: 'The windows are blue now.',        zh: '窗戶變成藍色了。' },
            { on: 'C', text: 'The roof is black and white.',     zh: '屋頂是黑白色的。' },
            { on: 'end', text: "Momo's house is not grey. It is beautiful!", zh: '摩摩的家不再灰灰的，好漂亮！' },
        ],
    },
    // ---------------------------------------------------------------- week 4
    {
        week: 4, district: "Momo's House", emoji: '🏡', theme: 'family',
        blurb: "Momo's family comes to visit.",
        // Densest grammar week: he/she + is + my/your. l3 flips my -> your and
        // inverts, forcing real teacher<->child dialogue instead of recitation.
        //
        // Every word declares its own pronoun. A fixed "She is my {word}"
        // would generate "She is my dad", and a child must never be asked to
        // say a wrong sentence. Sets A and B are deliberately all-She and
        // all-He so the contrast is audible street by street.
        frame: {
            l1: '{word}',
            l2: '{pron} is my {word}.',
            l3: 'Is {pron_} your {word}?',
        },
        sets: [
            { key: 'A', name: 'Upstairs',   color: '#D7679B', words: [
                { id: 'mom',     slots: { pron: 'She' } },
                { id: 'sister',  slots: { pron: 'She' } },
                { id: 'grandma', slots: { pron: 'She' } } ] },
            { key: 'B', name: 'Downstairs', color: '#3E8FB8', words: [
                { id: 'dad',     slots: { pron: 'He' } },
                { id: 'brother', slots: { pron: 'He' } },
                { id: 'grandpa', slots: { pron: 'He' } } ] },
            { key: 'C', name: 'The Garden', color: '#4C9A5A', words: [
                { id: 'girl',    slots: { pron: 'She' } },
                { id: 'boy',     slots: { pron: 'He' } },
                { id: 'baby',    slots: { pron: 'He' } } ] },
            { key: 'D', name: 'Memory Lane', color: '#8E7CC3', review: true, words: [
                { id: 'red', frameFrom: 3 }, { id: 'cake', frameFrom: 2 }, { id: 'bird', frameFrom: 1 } ] },
        ],
        beats: [
            { on: 'A', text: 'Mom brings a cake upstairs!',     zh: '媽媽帶蛋糕上樓！' },
            { on: 'B', text: 'Dad and brother play downstairs.', zh: '爸爸和哥哥在樓下玩。' },
            { on: 'C', text: 'Everyone sits in the garden.',     zh: '大家坐在花園裡。' },
            { on: 'end', text: 'The house is full of family. Momo is happy!', zh: '家裡都是家人，摩摩好開心！' },
        ],
    },
    // ---------------------------------------------------------------- week 5
    {
        week: 5, district: 'The Fair', emoji: '🎪', theme: 'numbers',
        blurb: 'The fair comes to town. Everything needs counting.',
        // The die supplies the number, so the randomiser becomes the grammar.
        // Rolling a 1 gives "I see one cat" with no -s: that contrast IS the
        // plural lesson, delivered ~3 times a game. Highlight it, don't hide it.
        frame: {
            l1: '{n}',
            l2: 'I see {n} {wordN}.',
            l3: 'There {are} {n} {wordN}.',
        },
        teaches: NUMBER_WORDS,     // taught in the teach phase, not as properties
        // Irregular plurals are declared, not guessed. This is the plural
        // lesson, so "four fishs" would teach exactly the wrong thing.
        sets: [
            { key: 'A', name: 'Animal Tent', color: '#C1793A', review: true, words: ['cat', 'dog', 'duck'] },
            { key: 'B', name: 'Food Tent',   color: '#D2691E', review: true, words: ['apple', 'cake', 'egg'] },
            { key: 'C', name: 'Pond Tent',   color: '#3E8FB8', review: true, words: [
                'bird', { id: 'fish', slots: { plural: 'fish' } }, 'frog'] },
            { key: 'D', name: 'People Tent', color: '#D7679B', review: true, words: [
                'girl', 'boy', { id: 'baby', slots: { plural: 'babies' } }] },
        ],
        beats: [
            { on: 'A', text: 'Three ducks march past the tent!', zh: '三隻鴨子走過帳篷！' },
            { on: 'B', text: 'Momo counts five cakes. Five!',    zh: '摩摩數了五個蛋糕，五個！' },
            { on: 'C', text: 'Two frogs jump in the pond.',      zh: '兩隻青蛙跳進池塘。' },
            { on: 'end', text: 'Momo can count everything now. Ten out of ten!', zh: '摩摩什麼都會數了，十分滿分！' },
        ],
    },
    // ---------------------------------------------------------------- week 6
    {
        week: 6, district: 'The Talent Show', emoji: '🎤', theme: 'actions',
        blurb: 'Nobody can sleep. What can everyone do?',
        // First week with verbs as properties and the first modal. The animal
        // comes from week 1 review, so every sentence is half old, half new.
        frame: {
            l1: '{word}',
            l2: 'A {animal} can {word}.',
            l3: 'Can a {animal} {word}?',
        },
        // Each verb names its own performer. A random animal would generate
        // "A fish can run", and the child must never be asked to say a false
        // sentence -- the teacher can still make that joke out loud.
        sets: [
            { key: 'A', name: 'Sport Stage', color: '#E05A2B', words: [
                { id: 'run',  slots: { animal: 'dog' } },
                { id: 'jump', slots: { animal: 'frog' } },
                { id: 'swim', slots: { animal: 'fish' } } ] },
            { key: 'B', name: 'Art Stage',   color: '#8E7CC3', words: [
                { id: 'sing',  slots: { animal: 'bird' } },
                { id: 'dance', slots: { animal: 'cat' } },
                { id: 'draw',  slots: { animal: 'girl' } } ] },
            { key: 'C', name: 'Quiet Stage', color: '#3E8FB8', words: [
                { id: 'eat',   slots: { animal: 'pig' } },
                { id: 'sit',   slots: { animal: 'dog' } },
                { id: 'sleep', slots: { animal: 'cat' } } ] },
            { key: 'D', name: 'Memory Lane', color: '#4C9A5A', review: true, words: [
                { id: 'fox', frameFrom: 1 }, { id: 'mom', frameFrom: 4, slots: { pron: 'She' } }, { id: 'blue', frameFrom: 3 } ] },
        ],
        beats: [
            { on: 'A', text: 'The frog jumps the highest!',    zh: '青蛙跳得最高！' },
            { on: 'B', text: 'The bird sings a lovely song.',  zh: '小鳥唱了一首好聽的歌。' },
            { on: 'C', text: 'The cat just sleeps. Very quiet.', zh: '貓只是在睡覺，好安靜。' },
            { on: 'end', text: 'Everyone can do something. What a show!', zh: '每個人都有本事，好棒的表演！' },
        ],
    },
    // ---------------------------------------------------------------- week 7
    {
        week: 7, district: 'The Town Square', emoji: '🏙️', theme: 'actions',
        blurb: 'The town is nearly finished. Everyone is busy.',
        // Memory Lane deliberately holds week 6 verbs in -ing form. The child
        // already owns `run`; now they meet `running`. Same word, new grammar —
        // the clearest possible demonstration of what a tense is.
        frame: {
            l1: '{word}',
            l2: 'The {subj} is {word}.',
            l3: 'What is the {subj} doing?',
        },
        sets: [
            { key: 'A', name: 'Busy Corner',    color: '#E05A2B', words: [
                { id: 'walk', display: 'walking', slots: { subj: 'dog' } },
                { id: 'play', display: 'playing', slots: { subj: 'cat' } },
                { id: 'read', display: 'reading', slots: { subj: 'boy' } } ] },
            { key: 'B', name: 'Work Corner',    color: '#3E8FB8', words: [
                { id: 'cook',  display: 'cooking', slots: { subj: 'woman' } },
                { id: 'write', display: 'writing', slots: { subj: 'girl' } },
                { id: 'wash',  display: 'washing', slots: { subj: 'man' } } ] },
            { key: 'C', name: 'Helping Corner', color: '#4C9A5A', words: [
                { id: 'look', display: 'looking', slots: { subj: 'baby' } },
                { id: 'help', display: 'helping', slots: { subj: 'girl' } },
                { id: 'open', display: 'opening', slots: { subj: 'boy' } } ] },
            // Week 6's verbs return in -ing form. The child already owns `run`;
            // now they meet `running` -- same word, new grammar. These keep
            // week 7's frame on purpose: that contrast IS the lesson.
            { key: 'D', name: 'Memory Lane',    color: '#8E7CC3', review: true, words: [
                { id: 'run',  display: 'running', slots: { subj: 'dog' } },
                { id: 'jump', display: 'jumping', slots: { subj: 'frog' } },
                { id: 'sing', display: 'singing', slots: { subj: 'bird' } } ] },
        ],
        beats: [
            { on: 'A', text: 'The dog is running across the square!', zh: '狗狗正在廣場上跑！' },
            { on: 'B', text: 'Momo is cooking lunch for everyone.',   zh: '摩摩正在幫大家做午餐。' },
            { on: 'C', text: 'The children are helping Momo.',        zh: '孩子們正在幫摩摩。' },
            { on: 'end', text: 'The square is busy and happy. Almost done!', zh: '廣場又熱鬧又快樂，快完成了！' },
        ],
    },
    // ---------------------------------------------------------------- week 8
    {
        week: 8, district: 'Grand Opening', emoji: '🎊', theme: 'animals',
        blurb: 'The town is complete. Everyone comes to the festival.',
        // No new grammar. Each property carries its own frame, so the board
        // cycles through all seven patterns from the season.
        frame: {
            l1: '{word}',
            l2: '{word}',       // overridden per-property by `frameFrom`
            l3: '{word}',
        },
        sets: [
            { key: 'A', name: 'Festival Row',  color: '#C1793A', review: true, words: [
                { id: 'cow', frameFrom: 1 },
                { id: 'apple', frameFrom: 2, frameForm: 'apples' },
                { id: 'red', frameFrom: 3 } ] },
            { key: 'B', name: 'Parade Street', color: '#D7679B', review: true, words: [
                { id: 'mom', frameFrom: 4, slots: { pron: 'She' } },
                { id: 'cat', frameFrom: 5 },
                { id: 'jump', frameFrom: 6, slots: { animal: 'frog' } } ] },
            { key: 'C', name: 'Fireworks Hill', color: '#3E8FB8', review: true, words: [
                { id: 'run', display: 'running', frameFrom: 7, slots: { subj: 'dog' } },
                { id: 'dog', frameFrom: 1 },
                { id: 'milk', frameFrom: 2 } ] },
            { key: 'D', name: "Momo's Choice", color: '#8E7CC3', review: true, words: [
                { id: 'bird', frameFrom: 1 }, { id: 'cake', frameFrom: 2 }, { id: 'blue', frameFrom: 3 } ] },
        ],
        beats: [
            { on: 'A', text: 'The festival begins! Everyone is here.', zh: '慶典開始了！大家都來了。' },
            { on: 'B', text: 'The parade goes down every street.',     zh: '遊行走過每一條街。' },
            { on: 'C', text: 'Fireworks light up the whole town.',     zh: '煙火照亮整個小鎮。' },
            { on: 'end', text: "Momo's town is full of words now. Every one of them is yours!", zh: '摩摩的小鎮充滿了單字，每一個都是你的！' },
        ],
    },
];

// Mystery cards. Speaking-first and always doable — no "go back 3 spaces", no
// fines. Every card is an opportunity, so a bad roll never feels like a loss.
//
// Every card asks for an action, not an acknowledgement. An earlier deck ended
// each card with a single "Done!" button that paid out whether or not the child
// had done anything, which made a quarter of the board free money.
//
// Cards are also built from *this week's* board wherever they can be. The old
// deck was one fixed global list, so week 1 — farm animals, `This is a ___` —
// could ask a child to name a colour (week 3), use week 2's frame, or spell,
// none of which had been taught yet.
//
//   kind: 'quiz'    see the picture, tap its word      (board words)
//   kind: 'listen'  hear the word, tap its picture     (board words)
//   kind: 'echo'    Momo says a word, the child says it back
//   kind: 'ask'     ask the teacher this week's level-3 question
//   kind: 'find'    hunt the spoken word down on the board itself
//   kind: 'tap'     a physical action, one tap per rep, spoken each time
//   kind: 'gift'    coins, or a free upgrade the child chooses
//
// A `tap` card is total physical response: jumping while hearing "jump" is how
// a beginner attaches a verb to a meaning rather than to a translation. The
// actions are deliberately week-agnostic, because the words are instructions
// here, not lesson content.
const MYSTERY_CARDS = [
    { kind: 'quiz',   text: 'Quick question!',              zh: '快問快答！',             coins: 3 },
    { kind: 'listen', text: 'Listen to Momo!',              zh: '聽摩摩說！',             coins: 3 },
    { kind: 'find',   text: 'Find it in the town!',         zh: '在小鎮裡找出來！',        coins: 4 },
    { kind: 'echo',   text: 'Momo says a word — say it back.', zh: '摩摩說一個字，你跟著唸。', coins: 2 },
    { kind: 'ask',    text: 'Ask your teacher!',            zh: '用這句問問老師！',        coins: 3 },
    { kind: 'tap',    text: 'Jump 3 times with Momo!',      zh: '跟摩摩跳三下！',   word: 'Jump!',      taps: 3, coins: 3 },
    { kind: 'tap',    text: 'Clap 5 times and count!',      zh: '拍手五下，一起數！',  count: true,        taps: 5, coins: 3 },
    { kind: 'tap',    text: 'Stand up and sit down twice!', zh: '站起來、坐下，兩次！', word: 'Stand up!',  taps: 2, coins: 2 },
    { kind: 'tap',    text: 'High five Momo 3 times!',      zh: '跟摩摩擊掌三次！',   word: 'High five!', taps: 3, coins: 2 },
    { kind: 'gift',   text: 'Free upgrade! Pick a house you own.', zh: '免費升級！選一間你的房子。', freeUpgrade: true },
    { kind: 'gift',   text: 'Momo found a coin!',           zh: '摩摩撿到錢！',           coins: 3 },
];

// ---------------------------------------------------------------------------
// Resolution helpers
// ---------------------------------------------------------------------------

// Normalise a set's word entry to { id, display, frameFrom }. Entries may be a
// bare string ('cat') or an object ({ id: 'run', display: 'running' }).
function normWord(entry) {
    if (typeof entry === 'string') return { id: entry, display: entry, slots: {} };
    return {
        id: entry.id,
        display: entry.display || entry.id,
        frameForm: entry.frameForm,
        slots: entry.slots || {},
        frameFrom: entry.frameFrom,
    };
}

function getWeek(n) {
    return WEEKS.find(w => w.week === n) || null;
}

// Flatten a week's sets into 12 property definitions, each already joined to
// its bank entry so callers get emoji + 中文 hint without a second lookup.
// Returns [] if the bank has not loaded yet.
function propertiesFor(week) {
    const bank = window.QUESTION_BANK;
    if (!bank) return [];

    // Build one lookup across the whole elementary band. A word may live in
    // more than one theme (walk is in hobbies AND transport); the week's own
    // theme wins so the hint matches the lesson's sense of the word.
    const lookup = new Map();
    for (const t of bank.themes) {
        for (const w of t.words) {
            if (w.difficulty > 2) continue;
            const better = t.id === week.theme;
            if (!lookup.has(w.word) || better) lookup.set(w.word, w);
        }
    }

    const props = [];
    for (const set of week.sets) {
        for (const entry of set.words) {
            const { id, display, frameForm, slots, frameFrom } = normWord(entry);
            const bankWord = lookup.get(id);
            props.push({
                id, display, frameForm, slots, frameFrom,
                emoji: bankWord ? bankWord.emoji : '❓',
                hint:  bankWord ? bankWord.hint  : '',
                themeId: week.theme,
                setKey: set.key,
                setName: set.name,
                color: set.color,
                review: !!set.review,
            });
        }
    }
    return props;
}

// Fill a frame template. `ctx` may carry { word, n, review, animal }.
function renderFrame(template, ctx) {
    const n = ctx.n == null ? 1 : ctx.n;
    const pron = ctx.pron || 'She';
    // {wordN} agrees with the count. Irregulars declare `plural` on the word
    // (fish -> fish, baby -> babies); everything else takes a plain -s. Week 5
    // is the plural lesson, so "four fishs" would be teaching the wrong thing.
    const word = ctx.word || '';
    const counted = n === 1 ? word : (ctx.plural || word + 's');
    return template
        .replace(/\{wordN\}/g,  counted)
        .replace(/\{word\}/g,   word)
        .replace(/\{n\}/g,      NUMBER_WORDS[n] || String(n))
        .replace(/\{are\}/g,    n === 1 ? 'is' : 'are')
        .replace(/\{review\}/g, ctx.review || '')
        .replace(/\{animal\}/g, ctx.animal || 'dog')
        .replace(/\{subj\}/g,   ctx.subj || 'dog')
        .replace(/\{pron_\}/g,  pron.toLowerCase())   // mid-sentence: "Is he your dad?"
        .replace(/\{pron\}/g,   pron);
}

// The sentence a player must produce for a property at a given depth (1-3).
// The word's own `slots` win over the caller's context, so a per-word subject
// or pronoun always beats the week-level default.
// Week 8 properties borrow the frame of the week they came from.
function sentenceFor(week, prop, level, ctx) {
    let frame = week.frame;
    // A word with `frameFrom` keeps the sentence of the week it came from.
    // Memory Lane depends on this: week 4 teaches "{pron} is my {word}", but
    // its review word `red` came from week 3 and must stay "It is red." —
    // "She is my red" would be nonsense. It also means review re-drills the
    // older pattern rather than forcing old words into the new one.
    if (prop.frameFrom) {
        const src = getWeek(prop.frameFrom);
        if (src) frame = src.frame;
    }
    const template = frame['l' + Math.max(1, Math.min(3, level))];
    const merged = Object.assign(
        { word: prop.frameForm || prop.display },
        ctx || {},
        prop.slots || {}
    );
    return renderFrame(template, merged);
}

window.CURRICULUM = {
    weeks: WEEKS,
    mysteryCards: MYSTERY_CARDS,
    numberWords: NUMBER_WORDS,
    getWeek,
    propertiesFor,
    renderFrame,
    sentenceFor,
    normWord,
};

})();
