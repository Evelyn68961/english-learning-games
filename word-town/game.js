// Word Town — turn loop, screens and the economy.
//
// Two humans share one screen: the child is player 0, the teacher is player 1.
// There is no AI, which is why the teacher can judge spoken answers with a
// tap. Nothing here can eliminate a player or take a turn away: coins floor at
// zero, a wrong answer costs nothing, and the game always ends on the clock.

(function () {

// ------------------------------------------------------------------ config

const TOTAL_ROUNDS  = 20;   // one round = both players; ~16 min of play
const START_COINS   = 10;
const PASS_START    = 5;
const COST_BUY      = 3;
const COST_UPGRADE  = 5;
const RENT          = [0, 1, 2, 4];   // by building level
const COST_HINT     = 3;
const COST_WARP     = 5;
const STEP_MS       = 170;
const PARK_SECONDS  = 15;   // the park mini-game's clock

// ------------------------------------------------------------------ state

let state = null;
let unlockAll = false;

function newState(week) {
    return {
        week,
        squares: window.BOARD.buildSquares(week),
        players: [
            { name: 'You',     token: '🧒',    coins: START_COINS, pos: 0, isChild: true,  hints: 0, warp: false },
            { name: 'Teacher', token: '👩‍🏫', coins: START_COINS, pos: 0, isChild: false, hints: 0, warp: false },
        ],
        turn: 0,
        roundsLeft: TOTAL_ROUNDS,
        beatsFired: {},                 // set key -> true, so each beat plays once
        busy: false,
        stats: { learned: [], missed: [], framesSaid: 0 },
    };
}

const $ = id => document.getElementById(id);

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active');
}

function current() { return state.players[state.turn]; }
function other()   { return state.players[(state.turn + 1) % 2]; }

// Coins never go negative. A child who cannot afford a property still gets it
// for answering correctly — the lesson is the point, not the budget.
function pay(player, amount) {
    player.coins = Math.max(0, player.coins - amount);
}

// ------------------------------------------------------------------ menu

function renderMenu() {
    const grid = $('week-grid');
    grid.innerHTML = '';

    const cleared = window.WT_PROGRESS.weeks();

    for (const week of window.CURRICULUM.weeks) {
        const open = unlockAll || window.WT_PROGRESS.isWeekUnlocked(week.week);
        const done = cleared[week.week];

        const card = document.createElement('button');
        card.className = 'week-card' + (open ? '' : ' locked');
        card.disabled = !open;

        const emoji = STORY.el('span', 'wk-emoji', open ? week.emoji : '🔒');
        const body = STORY.el('div', 'wk-body');
        body.appendChild(STORY.el('div', 'wk-title', `Week ${week.week} · ${week.district}`));
        body.appendChild(STORY.el('div', 'wk-frame', week.frame.l2.replace('{word}', '___')));

        card.appendChild(emoji);
        card.appendChild(body);
        if (done) card.appendChild(STORY.el('span', 'wk-badge', '✓'));

        card.onclick = () => { if (open) startWeek(week); };
        grid.appendChild(card);
    }

    const size = window.WT_PROGRESS.buildingCount();
    $('town-summary').textContent = size
        ? `🏘️ Your town has ${size} building${size === 1 ? '' : 's'}.`
        : '🌱 Your town is empty. Play Week 1 to start building!';
}

// ------------------------------------------------------------------ teach

let teachSeen = null;

// The properties a week warms up before play. Weeks 5 and 8 are consolidation
// weeks where every set is review, so "new words" is empty for them and the
// board itself is what gets modelled. Without this the frame step rendered
// nothing at all on those two weeks.
function warmupProps(week) {
    const props = window.CURRICULUM.propertiesFor(week);
    const fresh = props.filter(p => !p.review);
    return fresh.length ? fresh : props;
}

function toCard(p) {
    return { word: p.display, emoji: p.emoji, hint: p.hint };
}

// Cards for the teach phase: this week's new properties, plus any words the
// week teaches without putting on the board (week 5's number words).
function teachCards(week) {
    const props = window.CURRICULUM.propertiesFor(week);
    const cards = props.filter(p => !p.review).map(toCard);

    if (week.teaches) {
        const lookup = new Map();
        for (const t of window.QUESTION_BANK.themes) {
            for (const w of t.words) if (!lookup.has(w.word)) lookup.set(w.word, w);
        }
        for (const id of week.teaches) {
            const w = lookup.get(id);
            if (w) cards.push({ word: w.word, emoji: w.emoji, hint: w.hint });
        }
    }

    // Week 8 introduces nothing — no new properties and no extra words — so
    // its warm-up is the board itself. Left empty, the Next button had nothing
    // to enable it and the lesson could never be started at all.
    return cards.length ? cards : props.map(toCard);
}

function startWeek(week) {
    state = newState(week);
    teachSeen = new Set();
    STORY.resetBeats();

    $('teach-emoji').textContent = week.emoji;
    $('teach-title').textContent = `Week ${week.week} · ${week.district}`;
    $('teach-blurb').textContent = week.blurb;

    const cards = teachCards(week);
    const wrap = $('flashcards');
    wrap.innerHTML = '';
    $('cards-total').textContent = String(cards.length);
    $('cards-seen').textContent = '0';

    for (const card of cards) {
        const btn = document.createElement('button');
        btn.className = 'flashcard';
        btn.appendChild(STORY.el('span', 'fc-emoji', card.emoji));
        btn.appendChild(STORY.el('span', 'fc-word', card.word));
        btn.appendChild(STORY.el('span', 'fc-hint', card.hint));
        btn.onclick = () => {
            btn.classList.add('seen');
            window.SPEECH.speak(card.word);
            teachSeen.add(card.word);
            $('cards-seen').textContent = String(teachSeen.size);
            // Unlock the next step once most cards have been heard; demanding
            // all of them just punishes a child who taps one twice.
            if (teachSeen.size >= Math.ceil(cards.length * 0.75)) {
                $('btn-to-frame').disabled = false;
            }
        };
        wrap.appendChild(btn);
    }

    $('btn-to-frame').disabled = cards.length === 0;
    $('teach-step-cards').classList.remove('hidden');
    $('teach-step-frame').classList.add('hidden');
    showScreen('screen-teach');
}

// Model the week's frame three times with three different words, so the child
// hears the pattern hold while the slot changes.
function showFrameStep() {
    const week = state.week;
    const picks = warmupProps(week).slice(0, 3);

    const demo = $('frame-demo');
    demo.innerHTML = '';

    for (const p of picks) {
        const ctx = frameContext(p, 3);
        const sentence = window.CURRICULUM.sentenceFor(week, p, 2, ctx);
        const line = STORY.el('div', 'frame-line');
        line.appendChild(STORY.el('span', 'fl-emoji', p.emoji));
        line.appendChild(STORY.el('span', 'fl-text', sentence));
        const play = STORY.el('button', 'fl-play', '🔊');
        play.onclick = () => window.SPEECH.speak(sentence, { rate: 0.8 });
        line.appendChild(play);
        demo.appendChild(line);
    }

    $('teach-step-cards').classList.add('hidden');
    $('teach-step-frame').classList.remove('hidden');
    if (picks.length) {
        window.SPEECH.speak(window.CURRICULUM.sentenceFor(week, picks[0], 2, frameContext(picks[0], 3)), { rate: 0.8 });
    }
}

// ------------------------------------------------------------------ frames

// Week-level slot values. Anything a single word needs for itself (its
// pronoun, its subject, its performer) lives on the word and overrides these —
// see sentenceFor(). All that is left here is the die roll and, for week 3's
// depth-3 sentence, a noun pulled from Memory Lane.
function frameContext(prop, dieValue) {
    const week = state ? state.week : null;
    const ctx = { n: dieValue };
    if (!week) return ctx;

    const reviewSet = week.sets.find(s => s.review);
    if (reviewSet) {
        const words = reviewSet.words.map(w => window.CURRICULUM.normWord(w).display);
        ctx.review = words[Math.floor(Math.random() * words.length)];
    }
    return ctx;
}

function sentenceAt(prop, level, dieValue) {
    return window.CURRICULUM.sentenceFor(state.week, prop, level, frameContext(prop, dieValue));
}

// ------------------------------------------------------------------ HUD

function renderHUD() {
    const wrap = $('hud-players');
    wrap.innerHTML = '';
    state.players.forEach((p, i) => {
        const box = STORY.el('div', 'hud-player' + (i === state.turn ? ' active' : ''));
        box.appendChild(STORY.el('span', null, p.token));
        box.appendChild(STORY.el('span', 'hp-name', p.name));
        // Hints are shown only when held. A bought hint that appears nowhere is
        // a coin the child spent on nothing they can see.
        const stats = `🪙${p.coins} 🏠${buildingsOf(i)}` + (p.hints ? ` 💡${p.hints}` : '');
        box.appendChild(STORY.el('span', 'hp-stats', stats));
        wrap.appendChild(box);
    });

    const clock = $('hud-clock');
    clock.textContent = `🚂 ${state.roundsLeft}`;
    clock.classList.toggle('urgent', state.roundsLeft <= 3);

    $('turn-label').textContent = current().isChild ? 'Your turn' : "Teacher's turn";
}

function buildingsOf(playerIndex) {
    return state.squares
        .filter(s => s.type === 'property' && s.owner === playerIndex)
        .reduce((sum, s) => sum + s.level, 0);
}

function repaint() {
    window.BOARD.render($('board'), state);
    renderHUD();
}

// ------------------------------------------------------------------ game

function startGame() {
    const week = state.week;
    $('center-frame').textContent = week.frame.l2.replace('{word}', '___');
    $('die').textContent = '🎲';
    $('die').className = 'die';
    showScreen('screen-board');
    repaint();
    setRollEnabled(true);
}

function setRollEnabled(on) {
    const btn = $('btn-roll');
    const p = state.players[state.turn];

    if (on && p.warp) {
        btn.textContent = 'Tap a square!';
        btn.disabled = true;
        armWarp();
        return;
    }
    btn.textContent = 'Roll!';
    btn.disabled = !on;
    state.busy = !on;
}

// Let the child answer by tapping the board itself. Used by the shop's warp and
// by the "find it in the town" mystery card.
//
// The board stays armed until the caller disarms it, because a wrong tap is not
// necessarily an answer: "find it in the town" allows a second guess, and
// disarming on the first tap would leave the child tapping a dead board.
function armBoardPick(onPick) {
    const board = $('board');
    const handler = ev => {
        const el = ev.target.closest('.square');
        if (el) onPick(Number(el.dataset.index));
    };
    board.addEventListener('click', handler);
    board.classList.add('picking');
    return function disarm() {
        board.removeEventListener('click', handler);
        board.classList.remove('picking');
    };
}

// "Choose your move" from the shop: one purchasable choice per lap so the dice
// don't make the child a passenger.
function armWarp() {
    const disarm = armBoardPick(target => {
        disarm();
        const p = current();
        p.warp = false;
        const steps = (target - p.pos + window.BOARD.size) % window.BOARD.size || window.BOARD.size;
        $('btn-roll').textContent = 'Roll!';
        // A warp still needs a number for the week-5 frame, which counts with
        // the die. Passing 0 used to produce "I see zero cats." — a sentence no
        // beginner should ever be asked to say.
        walk(steps, 1 + Math.floor(Math.random() * 6));
    });
}

function roll() {
    if (state.busy) return;
    setRollEnabled(false);

    const die = $('die');
    die.className = 'die rolling';
    die.textContent = '🎲';

    window.setTimeout(() => {
        const value = 1 + Math.floor(Math.random() * 6);
        die.className = 'die die-value';
        die.textContent = String(value);
        // The number is said in English every single turn — a free rep that
        // costs no board space and no lesson time.
        window.SPEECH.speak(window.CURRICULUM.numberWords[value]);
        window.setTimeout(() => walk(value, value), 550);
    }, 450);
}

// Move one square at a time so the child can follow the token and count along.
function walk(steps, dieValue) {
    const p = current();
    let left = steps;

    const step = () => {
        p.pos = (p.pos + 1) % window.BOARD.size;
        if (p.pos === 0) p.coins += PASS_START;   // passing Start pays too
        repaint();
        left -= 1;
        if (left > 0) {
            window.setTimeout(step, STEP_MS);
        } else {
            window.BOARD.highlight($('board'), p.pos);
            window.setTimeout(() => resolve(dieValue), 320);
        }
    };
    window.setTimeout(step, STEP_MS);
}

function resolve(dieValue) {
    const sq = state.squares[current().pos];
    switch (sq.type) {
        case 'start':    return onStart();
        case 'mystery':  return onMystery();
        case 'practice': return onPractice();
        case 'park':     return onPark();
        case 'shop':     return onShop();
        case 'property': return onProperty(sq, dieValue);
        default:         return endTurn();
    }
}

// ------------------------------------------------------------------ questions

// The 12 property words on the current board.
function boardProps() {
    return state.squares.filter(s => s.type === 'property').map(s => s.prop);
}

function pickProp() {
    const props = boardProps();
    return props[Math.floor(Math.random() * props.length)];
}

// Picture -> word. The child sees the thing and picks its name; this is the
// direction the board's own buy question already tests.
function pictureQuestion(prop) {
    const pool = boardProps().filter(p => p.display !== prop.display).map(p => p.display);
    const options = shuffle([prop.display].concat(shuffle(pool).slice(0, 2)));
    return {
        prompt: 'What is this?',
        face: prop.emoji,
        options: options.map(w => ({ label: w, value: w })),
        answer: prop.display,
        answerSpeak: prop.display,
    };
}

// Word -> picture. The child hears it and picks the thing. The board never
// tests this direction, which is exactly why the drills do: recognising a
// written word and recognising a spoken one are two different skills, and only
// the second one survives contact with a real conversation.
function listenQuestion(prop) {
    const pool = boardProps().filter(p => p.display !== prop.display && p.emoji !== prop.emoji);
    const options = shuffle([prop].concat(shuffle(pool).slice(0, 3)));
    return {
        prompt: 'Listen to Momo!',
        sub: 'Tap the picture you hear.',
        face: '🔊',
        speak: prop.display,
        emoji: true,
        options: options.map(p => ({ label: p.emoji, value: p.display })),
        answer: prop.display,
        answerSpeak: prop.display,
    };
}

// ------------------------------------------------------------------ squares

// Landing on Start does not pay again — walk() already gave the pass-through
// bonus on the way in, and the modal only reports it. What the square is for
// is the lap review: the child picks one word they own and says it with Momo.
function onStart() {
    const owned = state.squares.filter(s => s.type === 'property' && s.owner !== null);
    const picks = shuffle(owned.slice()).slice(0, 3).map(s => s.prop);

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🏠'));
        m.appendChild(STORY.el('h3', null, 'Home again!'));
        m.appendChild(STORY.el('div', 'coin-note', `+${PASS_START} 🪙`));

        if (!picks.length) {
            m.appendChild(STORY.el('p', 'm-sub', 'Momo waves hello. Go and name something!'));
        } else {
            m.appendChild(STORY.el('p', 'm-sub', 'Tap a word and say it with Momo.'));
            const opts = STORY.el('div', 'm-options');
            for (const prop of picks) {
                const b = STORY.el('button', 'opt-btn', `${prop.emoji} ${prop.display}`);
                b.onclick = () => {
                    b.classList.add('right');
                    window.SPEECH.speak(prop.display);
                };
                opts.appendChild(b);
            }
            m.appendChild(opts);
        }

        const ok = STORY.el('button', 'btn primary wide', 'Thanks, Momo!');
        ok.style.marginTop = '14px';
        ok.onclick = () => { STORY.closeModal(); endTurn(); };
        m.appendChild(ok);
    });
}

// Four of the twenty squares are mystery, so a fifth of every lap lands here.
// That is too much of the board to spend on a button that pays out whether or
// not the child did anything, which is what the old single "Done!" card was.
// Every kind below asks for an action first.
function onMystery() {
    const cards = window.CURRICULUM.mysteryCards;
    const card = cards[Math.floor(Math.random() * cards.length)];

    switch (card.kind) {
        case 'quiz':   return mysteryQuiz(card, pictureQuestion);
        case 'listen': return mysteryQuiz(card, listenQuestion);
        case 'find':   return mysteryFind(card);
        case 'echo':   return mysteryEcho(card);
        case 'ask':    return mysteryAsk(card);
        case 'tap':    return STORY.showTapCard(card, () => award(card.coins));
        default:       return mysteryGift(card);
    }
}

// A mystery card never punishes. Getting one wrong still pays a coin, because
// a card the child learns to dread is worse than one that pays too generously.
const CONSOLATION = 1;

function award(coins) {
    current().coins += coins || 0;
    repaint();
    endTurn();
}

function mysteryQuiz(card, build) {
    const q = build(pickProp());
    q.prompt = '❓ ' + card.text;
    q.sub = card.zh;
    STORY.showQuiz(q, ok => award(ok ? card.coins : CONSOLATION));
}

// The card that uses the board as its answer sheet. Momo says a word and the
// child hunts for the square it lives on — reading practice dressed up as a
// treasure hunt, and the only mechanic that makes them read the whole town.
function mysteryFind(card) {
    const squares = state.squares.filter(s => s.type === 'property');
    const target = squares[Math.floor(Math.random() * squares.length)];
    const word = target.prop.display;

    const hunt = () => {
        $('turn-label').textContent = `🔍 Find "${word}"`;
        let tries = 0;
        const disarm = armBoardPick(index => {
            if (index === target.index) {
                disarm();
                window.BOARD.highlight($('board'), index);
                window.SPEECH.speak(word);
                return window.setTimeout(() => award(card.coins), 800);
            }
            tries += 1;
            window.SPEECH.speak(word);
            // Two misses and Momo points at it himself. Hunting forever is not
            // a game, and the clock is still running.
            if (tries >= 2) {
                disarm();
                window.BOARD.highlight($('board'), target.index);
                window.setTimeout(() => award(CONSOLATION), 1000);
            }
        });
    };

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🔍'));
        m.appendChild(STORY.el('h3', null, card.text));
        m.appendChild(STORY.el('div', 'm-zh', card.zh));
        m.appendChild(STORY.el('div', 'm-sentence', word));
        m.appendChild(STORY.speakButton(word));
        const go = STORY.el('button', 'btn primary wide', 'Find it!');
        go.onclick = () => { STORY.closeModal(); hunt(); };
        m.appendChild(go);
    });
    window.SPEECH.speak(word);
}

function mysteryEcho(card) {
    const owned = state.squares.filter(s => s.type === 'property' && s.owner !== null);
    const pool = owned.length ? owned.map(s => s.prop) : boardProps();
    const prop = pool[Math.floor(Math.random() * pool.length)];

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', prop.emoji));
        m.appendChild(STORY.el('h3', null, card.text));
        m.appendChild(STORY.el('div', 'm-zh', card.zh));
        m.appendChild(STORY.el('div', 'm-sentence', prop.display));

        const row = STORY.el('div', 'm-buttons');
        const again = STORY.el('button', 'btn ghost', '↻ Again');
        again.onclick = () => window.SPEECH.speak(prop.display, { rate: 0.7 });
        const said = STORY.el('button', 'btn primary', '✓ Said it!');
        said.onclick = () => { STORY.closeModal(); award(card.coins); };
        row.appendChild(again);
        row.appendChild(said);
        m.appendChild(row);
    });
    window.SPEECH.speak(prop.display);
}

// The old deck hardcoded 'Ask your teacher: "Do you like cake?"' — week 2's
// frame and week 2's noun, dealt in every week of the season. This asks the
// current week's level-3 sentence, which is the question form by design, so
// the card produces real teacher<->child dialogue instead of a recital.
function mysteryAsk(card) {
    const p = current();
    const prop = pickProp();
    const sentence = sentenceAt(prop, 3, 1 + Math.floor(Math.random() * 6));

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', prop.emoji));
        m.appendChild(STORY.el('h3', null, card.text));
        m.appendChild(STORY.el('div', 'm-zh', card.zh));
        m.appendChild(STORY.el('div', 'm-sentence', sentence));

        const row = STORY.el('div', 'm-buttons');
        const again = STORY.el('button', 'btn ghost', '↻ Again');
        again.onclick = () => window.SPEECH.speak(sentence, { rate: 0.7 });
        const asked = STORY.el('button', 'btn primary', '✓ Asked it!');
        asked.onclick = () => {
            if (p.isChild) state.stats.framesSaid += 1;
            STORY.closeModal();
            award(card.coins);
        };
        row.appendChild(again);
        row.appendChild(asked);
        m.appendChild(row);
    });
    window.SPEECH.speak(sentence, { rate: 0.8 });
}

function mysteryGift(card) {
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', card.freeUpgrade ? '🎁' : '🪙'));
        m.appendChild(STORY.el('h3', null, card.text));
        m.appendChild(STORY.el('div', 'm-zh', card.zh));
        if (card.coins) m.appendChild(STORY.el('div', 'coin-note', `+${card.coins} 🪙`));

        const ok = STORY.el('button', 'btn primary wide', card.freeUpgrade ? 'Pick one!' : 'Thanks, Momo!');
        ok.onclick = () => {
            current().coins += card.coins || 0;
            STORY.closeModal();
            if (card.freeUpgrade) return offerFreeUpgrade();
            repaint();
            endTurn();
        };
        m.appendChild(ok);
    });
}

// A free upgrade card is only worth offering if the player owns something that
// can still grow; otherwise it silently becomes a couple of coins.
function offerFreeUpgrade() {
    const p = current();
    const mine = state.squares.filter(s =>
        s.type === 'property' && s.owner === state.turn && s.level < 3);

    if (!mine.length) { p.coins += 2; repaint(); return endTurn(); }

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, 'Free upgrade!'));
        m.appendChild(STORY.el('p', 'm-sub', 'Pick a building to grow.'));
        const opts = STORY.el('div', 'm-options');
        for (const sq of mine) {
            const b = STORY.el('button', 'opt-btn',
                `${window.BOARD.HOUSE[sq.level]} ${sq.prop.display}`);
            b.onclick = () => {
                STORY.closeModal();
                applyUpgrade(sq, true);
            };
            opts.appendChild(b);
        }
        m.appendChild(opts);
    });
}

// Not jail. A free drill with no cost and no lost turn — landing here should
// feel like a rest, not a punishment. It is a drill the child *answers*,
// though: the old version dealt three cards with a Next button under each,
// which asked nothing, so it taught nothing.
function onPractice() {
    const picks = shuffle(boardProps()).slice(0, 3);
    let i = 0;
    let got = 0;

    const next = () => {
        if (i >= picks.length) return practiceDone(got);
        const prop = picks[i];
        // Alternate the direction: see the picture, then hear the word. Both
        // halves of knowing a word, and the board only ever tests the first.
        const q = i % 2 === 0 ? pictureQuestion(prop) : listenQuestion(prop);
        q.sub = `📚 Practice Corner · ${i + 1} of ${picks.length}`;
        i += 1;
        STORY.showQuiz(q, ok => {
            if (ok) got += 1;
            else if (current().isChild) noteMissed(prop.display);
            next();
        });
    };
    next();
}

function practiceDone(got) {
    const p = current();
    // Never nothing: a square that can pay zero is a square the child hopes to
    // miss, and this one is supposed to be the friendly one.
    const paid = Math.max(1, got);
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', got === 3 ? '🌟' : '📚'));
        m.appendChild(STORY.el('h3', null, got === 3 ? 'All three!' : 'Good practice!'));
        m.appendChild(STORY.el('p', 'm-sub', `${got} of 3 right.`));
        m.appendChild(STORY.el('div', 'coin-note', `+${paid} 🪙`));
        const ok = STORY.el('button', 'btn primary wide', 'Back to the board');
        ok.onclick = () => { p.coins += paid; STORY.closeModal(); repaint(); endTurn(); };
        m.appendChild(ok);
    });
}

// Not a nap. The park is the season's one timed drill: Momo says a word, the
// child taps the picture, over and over for fifteen seconds. A good run is
// eight or nine reps — more than the rest of the lap puts together.
//
// This square used to be a modal saying "Momo takes a little nap" with one
// button and two coins: the only square on the board that asked for nothing.
function onPark() {
    const props = boardProps();
    if (props.length < 4) return endTurn();   // too small a board to build a round from

    let score = 0;
    let target = null;
    let locked = false;
    let timer = null;
    let fill, scoreEl, grid;
    const deadline = Date.now() + PARK_SECONDS * 1000;

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, '🌳 The Park'));
        m.appendChild(STORY.el('p', 'm-sub', 'Momo says a word. Tap the right picture!'));

        const bar = STORY.el('div', 'timer-bar');
        fill = STORY.el('div', 'timer-fill');
        bar.appendChild(fill);
        m.appendChild(bar);

        scoreEl = STORY.el('div', 'park-score', '🪙 0');
        m.appendChild(scoreEl);

        grid = STORY.el('div', 'm-options m-options-grid');
        m.appendChild(grid);

        const replay = STORY.el('button', 'btn ghost wide', '🔊 Again');
        replay.style.marginTop = '12px';
        replay.onclick = () => { if (target) window.SPEECH.speak(target.display); };
        m.appendChild(replay);
    });

    const round = () => {
        target = props[Math.floor(Math.random() * props.length)];
        const pool = props.filter(x => x.display !== target.display && x.emoji !== target.emoji);
        const options = shuffle([target].concat(shuffle(pool).slice(0, 3)));

        grid.innerHTML = '';
        locked = false;
        options.forEach(opt => {
            const b = STORY.el('button', 'opt-btn opt-emoji', opt.emoji);
            b.onclick = () => {
                if (locked) return;
                locked = true;
                const right = opt.display === target.display;
                b.classList.add(right ? 'right' : 'wrong');
                if (right) {
                    score += 1;
                    scoreEl.textContent = `🪙 ${score}`;
                } else {
                    Array.from(grid.children).forEach((node, i) => {
                        if (options[i].display === target.display) node.classList.add('right');
                    });
                }
                // A wrong tap lingers a little longer so the child sees where
                // the right answer was before the next word arrives.
                window.setTimeout(() => {
                    if (state && Date.now() < deadline) round();
                }, right ? 300 : 650);
            };
            grid.appendChild(b);
        });
        window.SPEECH.speak(target.display);
    };

    const tick = () => {
        // Quitting to the menu clears `state`; without this the timer would
        // fire the results modal over the menu screen.
        if (!state) return window.clearInterval(timer);
        const left = deadline - Date.now();
        if (left <= 0) {
            window.clearInterval(timer);
            return parkDone(score);
        }
        fill.style.width = (left / (PARK_SECONDS * 1000) * 100) + '%';
    };

    round();
    timer = window.setInterval(tick, 60);
}

function parkDone(score) {
    const p = current();
    const paid = Math.max(1, score);
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', score >= 6 ? '🏆' : '🌳'));
        m.appendChild(STORY.el('h3', null, score >= 6 ? 'Momo is amazed!' : 'Nice run!'));
        m.appendChild(STORY.el('p', 'm-sub', `${score} right in ${PARK_SECONDS} seconds.`));
        m.appendChild(STORY.el('div', 'coin-note', `+${paid} 🪙`));
        const ok = STORY.el('button', 'btn primary wide', 'Back to the board');
        ok.onclick = () => { p.coins += paid; STORY.closeModal(); repaint(); endTurn(); };
        m.appendChild(ok);
    });
}

function onShop() {
    const p = current();
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🛒'));
        m.appendChild(STORY.el('h3', null, "Momo's Shop"));
        m.appendChild(STORY.el('p', 'm-sub', `You have ${p.coins} 🪙`));

        const opts = STORY.el('div', 'm-options');

        const hint = STORY.el('button', 'opt-btn shop-item',
            `💡 Hint token — ${COST_HINT} 🪙`);
        hint.appendChild(STORY.el('span', 'shop-note', 'Shows the 中文 when you buy a word'));
        hint.disabled = p.coins < COST_HINT;
        hint.onclick = () => { pay(p, COST_HINT); p.hints += 1; STORY.closeModal(); repaint(); endTurn(); };
        opts.appendChild(hint);

        const warp = STORY.el('button', 'opt-btn shop-item',
            `🚀 Choose your move — ${COST_WARP} 🪙`);
        warp.appendChild(STORY.el('span', 'shop-note',
            p.warp ? 'Already yours — use it next turn' : 'Next turn, tap any square instead of rolling'));
        warp.disabled = p.coins < COST_WARP || p.warp;
        warp.onclick = () => { pay(p, COST_WARP); p.warp = true; STORY.closeModal(); repaint(); endTurn(); };
        opts.appendChild(warp);

        m.appendChild(opts);

        const leave = STORY.el('button', 'btn ghost wide', 'Just looking');
        leave.style.marginTop = '12px';
        leave.onclick = () => { STORY.closeModal(); endTurn(); };
        m.appendChild(leave);
    });
}

// ------------------------------------------------------------------ property

function onProperty(sq, dieValue) {
    if (sq.owner === null)             return offerBuy(sq, dieValue);
    if (sq.owner === state.turn)       return sq.level < 3 ? offerUpgrade(sq, dieValue) : onOwnFull(sq, dieValue);
    return chargeRent(sq, dieValue);
}

// Buying is the level-1 question: match the picture to the word. Getting it
// wrong costs nothing at all — the word simply stays free for another lap.
function offerBuy(sq, dieValue) {
    const p = current();
    const prop = sq.prop;
    const pool = state.squares
        .filter(s => s.type === 'property' && s.prop.display !== prop.display)
        .map(s => s.prop.display);
    const options = shuffle([prop.display].concat(shuffle(pool).slice(0, 2)));

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, `${prop.setName} — for sale!`));
        m.appendChild(STORY.el('p', 'm-sub', `Answer to build here · ${COST_BUY} 🪙`));
        m.appendChild(STORY.el('div', 'm-emoji', prop.emoji));

        // A hint is offered, not spent for you. The old code burned one on
        // every purchase the moment you owned one, so a child could buy a hint
        // and never once choose to use it.
        if (p.hints > 0) {
            const zh = STORY.el('div', 'm-zh', '');
            const use = STORY.el('button', 'btn ghost wide', `💡 Use a hint (${p.hints})`);
            use.onclick = () => {
                p.hints -= 1;
                zh.textContent = prop.hint;
                use.hidden = true;
                renderHUD();
            };
            m.appendChild(use);
            m.appendChild(zh);
        }

        const opts = STORY.el('div', 'm-options');
        // One tap is the answer, right or wrong. Locking every button on the
        // way out matters twice over: it is what stops guess-until-right, and
        // it stops a second tap queueing a second resolution for the same
        // square — which could land a purchase after the clock had already run
        // out and left the game with no way forward.
        let answered = false;
        for (const word of options) {
            const b = STORY.el('button', 'opt-btn', word);
            b.onclick = () => {
                if (answered) return;
                answered = true;
                const right = word === prop.display;
                b.classList.add(right ? 'right' : 'wrong');
                opts.querySelectorAll('button').forEach(x => x.disabled = true);

                if (right) {
                    window.SPEECH.speakWordThenSentence(prop.display, sentenceAt(prop, 2, dieValue));
                    window.setTimeout(() => { STORY.closeModal(); completeBuy(sq); }, 900);
                } else {
                    if (p.isChild) noteMissed(prop.display);
                    window.setTimeout(() => { STORY.closeModal(); wordRanAway(prop); }, 650);
                }
            };
            opts.appendChild(b);
        }
        m.appendChild(opts);
    });
}

function wordRanAway(prop) {
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '💨'));
        m.appendChild(STORY.el('h3', null, 'The word ran away!'));
        m.appendChild(STORY.el('p', 'm-sub',
            `It was "${prop.display}". Catch it next lap!`));
        m.appendChild(STORY.speakButton(prop.display));
        const ok = STORY.el('button', 'btn primary wide', 'OK');
        ok.onclick = () => { STORY.closeModal(); endTurn(); };
        m.appendChild(ok);
    });
    window.SPEECH.speak(prop.display);
}

function completeBuy(sq) {
    const p = current();
    pay(p, COST_BUY);
    sq.owner = state.turn;
    sq.level = 1;

    if (p.isChild) {
        noteLearned(sq.prop.display);
        state.stats.framesSaid += 1;
        window.WT_PROGRESS.recordBuilding(sq.prop.id, 1, state.week.week, sq.prop.themeId);
    }
    repaint();
    checkSetComplete(sq, () => endTurn());
}

// Upgrading is the same word at greater grammatical depth. Rent scales with
// depth, so the economy is what pays for grammar.
function offerUpgrade(sq, dieValue) {
    const p = current();
    const nextLevel = sq.level + 1;
    const sentence = sentenceAt(sq.prop, nextLevel, dieValue);

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, `Grow your ${window.BOARD.HOUSE[sq.level]}?`));
        m.appendChild(STORY.el('p', 'm-sub', `Say this to build ${window.BOARD.HOUSE[nextLevel]} · ${COST_UPGRADE} 🪙`));
        m.appendChild(STORY.el('div', 'm-emoji', sq.prop.emoji));
        m.appendChild(STORY.el('div', 'm-sentence', sentence));
        m.appendChild(STORY.speakButton(sentence));

        const row = STORY.el('div', 'm-buttons');
        const no = STORY.el('button', 'btn ghost', 'Not now');
        no.onclick = () => { STORY.closeModal(); endTurn(); };

        const yes = STORY.el('button', 'btn primary', '✓ Said it!');
        yes.disabled = p.coins < COST_UPGRADE;
        yes.onclick = () => { STORY.closeModal(); applyUpgrade(sq, false); };

        row.appendChild(no);
        row.appendChild(yes);
        m.appendChild(row);
    });
    window.SPEECH.speak(sentence, { rate: 0.8 });
}

function applyUpgrade(sq, free) {
    const p = current();
    if (!free) pay(p, COST_UPGRADE);
    sq.level = Math.min(3, sq.level + 1);

    if (p.isChild) {
        state.stats.framesSaid += 1;
        window.WT_PROGRESS.recordBuilding(sq.prop.id, sq.level, state.week.week, sq.prop.themeId);
    }
    repaint();
    checkSetComplete(sq, () => endTurn());
}

// A finished shop is the one square that could hand out coins for nothing. The
// child already owns this word at full depth, so the customers get to hear it:
// the cheapest rep on the board, and the only one that is pure reward.
function onOwnFull(sq, dieValue) {
    const p = current();
    const sentence = sentenceAt(sq.prop, 3, dieValue);

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🏘️'));
        m.appendChild(STORY.el('h3', null, 'Your shop is busy!'));
        m.appendChild(STORY.el('p', 'm-sub', 'Say it for your customers.'));
        m.appendChild(STORY.el('div', 'm-sentence', sentence));
        m.appendChild(STORY.el('div', 'coin-note', '+2 🪙'));

        const row = STORY.el('div', 'm-buttons');
        const again = STORY.el('button', 'btn ghost', '↻ Again');
        again.onclick = () => window.SPEECH.speak(sentence, { rate: 0.7 });
        const done = STORY.el('button', 'btn primary', '✓ Said it!');
        done.onclick = () => {
            p.coins += 2;
            if (p.isChild) state.stats.framesSaid += 1;
            STORY.closeModal();
            repaint();
            endTurn();
        };
        row.appendChild(again);
        row.appendChild(done);
        m.appendChild(row);
    });
    window.SPEECH.speak(sentence, { rate: 0.8 });
}

// Rent is the review engine: landing on someone else's word makes you say it.
// There is no failure state — ↻ just replays it and you pay either way.
function chargeRent(sq, dieValue) {
    const payer = current();
    const owner = state.players[sq.owner];
    const complete = window.BOARD.setComplete(state, sq.setIndex, sq.owner);
    const amount = RENT[sq.level] * (complete ? 2 : 1);
    const sentence = sentenceAt(sq.prop, sq.level, dieValue);

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, `${owner.token} ${owner.name}'s ${sq.prop.setName}`));
        m.appendChild(STORY.el('p', 'm-sub',
            complete ? 'Whole street owned — double rent!' : 'Say it to pay the rent.'));
        m.appendChild(STORY.el('div', 'm-emoji', sq.prop.emoji));
        m.appendChild(STORY.el('div', 'm-sentence', sentence));
        m.appendChild(STORY.el('div', 'coin-note', `Rent: ${amount} 🪙`));

        // "↻ Again" is the replay control here, so no separate 🔊 button —
        // two buttons that do the same thing is one too many to choose from.
        const row = STORY.el('div', 'm-buttons');
        const again = STORY.el('button', 'btn ghost', '↻ Again');
        again.onclick = () => window.SPEECH.speak(sentence, { rate: 0.7 });

        const done = STORY.el('button', 'btn primary', '✓ Said it!');
        done.onclick = () => {
            pay(payer, amount);
            owner.coins += amount;
            if (payer.isChild) state.stats.framesSaid += 1;
            STORY.closeModal();
            endTurn();
        };

        row.appendChild(again);
        row.appendChild(done);
        m.appendChild(row);
    });
    window.SPEECH.speak(sentence, { rate: 0.8 });
}

// ------------------------------------------------------------------ beats

// A completed colour set doubles rent and unlocks the next story beat, so the
// collection urge kids already have is what drives the story forward.
function checkSetComplete(sq, done) {
    const owner = sq.owner;
    if (owner === null || !window.BOARD.setComplete(state, sq.setIndex, owner)) return done();

    const setKey = state.week.sets[sq.setIndex].key;
    if (state.beatsFired[setKey]) return done();
    state.beatsFired[setKey] = true;

    const beat = state.week.beats.find(b => b.on === setKey);
    if (!beat) return done();
    STORY.showBeat(beat, done);
}

// ------------------------------------------------------------------ turns

function endTurn() {
    if (state.finished) return;

    state.turn = (state.turn + 1) % state.players.length;
    if (state.turn === 0) {
        state.roundsLeft -= 1;
        if (state.roundsLeft <= 0) return finish();
    }
    repaint();
    setRollEnabled(true);
}

function finish() {
    state.finished = true;
    repaint();

    const finale = state.week.beats.find(b => b.on === 'end');
    if (finale) STORY.showBeat(finale, showReport);
    else showReport();
}

// ------------------------------------------------------------------ stats

function noteLearned(word) {
    if (!state.stats.learned.includes(word)) state.stats.learned.push(word);
    const i = state.stats.missed.indexOf(word);
    if (i !== -1) state.stats.missed.splice(i, 1);   // got it in the end
}

function noteMissed(word) {
    if (state.stats.learned.includes(word)) return;
    if (!state.stats.missed.includes(word)) state.stats.missed.push(word);
}

// ------------------------------------------------------------------ report

function showReport() {
    const childBuildings = buildingsOf(0);
    const teacherBuildings = buildingsOf(1);

    window.WT_PROGRESS.recordWeekResult(state.week.week, {
        buildings: childBuildings,
        coins: state.players[0].coins,
        won: childBuildings > teacherBuildings,
    });

    STORY.buildReport($('report-card'), {
        week: state.week.week,
        district: state.week.district,
        emoji: state.week.emoji,
        blurb: state.week.blurb,
        childBuildings,
        teacherBuildings,
        winner: childBuildings > teacherBuildings ? 'child'
              : childBuildings < teacherBuildings ? 'teacher' : 'tie',
        learned: state.stats.learned,
        missed: state.stats.missed,
        framesSaid: state.stats.framesSaid,
        frameSample: state.week.frame.l2.replace('{word}', '___'),
        townSize: window.WT_PROGRESS.buildingCount(),
        nextWeek: window.CURRICULUM.getWeek(state.week.week + 1),
    });

    showScreen('screen-report');
}

// ------------------------------------------------------------------ town map

function renderTown() {
    const town = window.WT_PROGRESS.town();
    const words = Object.keys(town);
    const map = $('town-map');
    map.innerHTML = '';

    $('town-sub').textContent = words.length
        ? `${words.length} building${words.length === 1 ? '' : 's'} — tap one to hear it.`
        : '';

    if (!words.length) {
        map.appendChild(STORY.el('p', 'town-empty',
            'Your town is empty for now.\nPlay a lesson and Momo will start building!'));
        return;
    }

    // Resolve emoji from the bank so the map never stores its own copy.
    const lookup = new Map();
    for (const t of window.QUESTION_BANK.themes) {
        for (const w of t.words) if (!lookup.has(w.word)) lookup.set(w.word, w);
    }

    for (const word of words.sort()) {
        const info = town[word];
        const bankWord = lookup.get(word);
        const card = STORY.el('div', 'town-building');
        card.appendChild(STORY.el('div', 'tb-house', window.BOARD.HOUSE[info.level] || '🏠'));
        card.appendChild(STORY.el('div', 'tb-emoji', bankWord ? bankWord.emoji : '❓'));
        card.appendChild(STORY.el('div', 'tb-word', word));
        card.onclick = () => window.SPEECH.speak(word);
        map.appendChild(card);
    }
}

// ------------------------------------------------------------------ util

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function confirmQuit() {
    if (!state || state.finished) return true;
    return window.confirm('Leave the game? This lesson will not be saved.');
}

// ------------------------------------------------------------------ wiring

function init() {
    renderMenu();

    $('btn-to-frame').onclick = showFrameStep;
    $('btn-start-game').onclick = startGame;
    $('btn-roll').onclick = roll;

    $('teach-back').onclick = () => { window.SPEECH.stop(); showScreen('screen-menu'); renderMenu(); };
    $('board-back').onclick = () => {
        if (!confirmQuit()) return;
        window.SPEECH.stop();
        // Clearing state first is what stops the park timer; closing the modal
        // is what stops a half-finished square hanging over the menu.
        state = null;
        STORY.closeModal();
        STORY.resetBeats();
        showScreen('screen-menu');
        renderMenu();
    };

    $('btn-view-town').onclick = () => { renderTown(); showScreen('screen-town'); };
    $('btn-report-town').onclick = () => { renderTown(); showScreen('screen-town'); };
    $('town-back').onclick = () => { showScreen('screen-menu'); renderMenu(); };
    $('btn-report-menu').onclick = () => { state = null; showScreen('screen-menu'); renderMenu(); };

    $('unlock-all').onchange = ev => { unlockAll = ev.target.checked; renderMenu(); };

    const sound = $('sound-toggle');
    sound.onclick = () => {
        const on = !window.SPEECH.isEnabled();
        window.SPEECH.setEnabled(on);
        sound.textContent = on ? '🔊' : '🔇';
        sound.classList.toggle('off', !on);
    };

    if (!window.SPEECH.supported) {
        sound.textContent = '🔇';
        sound.classList.add('off');
        sound.disabled = true;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();
