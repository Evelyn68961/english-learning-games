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

// Cards for the teach phase: this week's properties, plus any words the week
// teaches without putting on the board (week 5's number words).
function teachCards(week) {
    const cards = window.CURRICULUM.propertiesFor(week)
        .filter(p => !p.review)
        .map(p => ({ word: p.display, emoji: p.emoji, hint: p.hint }));

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
    return cards;
}

function startWeek(week) {
    state = newState(week);
    teachSeen = new Set();

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
    const props = window.CURRICULUM.propertiesFor(week).filter(p => !p.review);
    const picks = props.slice(0, 3);

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
        box.appendChild(STORY.el('span', 'hp-stats', `🪙${p.coins} 🏠${buildingsOf(i)}`));
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

// "Choose your move" from the shop: one purchasable choice per lap so the dice
// don't make the child a passenger.
function armWarp() {
    const board = $('board');
    const handler = ev => {
        const sq = ev.target.closest('.square');
        if (!sq) return;
        board.removeEventListener('click', handler);
        const p = current();
        p.warp = false;
        const target = Number(sq.dataset.index);
        const steps = (target - p.pos + window.BOARD.size) % window.BOARD.size || window.BOARD.size;
        $('btn-roll').textContent = 'Roll!';
        walk(steps, 0);
    };
    board.addEventListener('click', handler);
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

// ------------------------------------------------------------------ squares

function onStart() {
    const p = current();
    // The +5 for landing is on top of the pass-through bonus already given.
    const owned = state.squares.filter(s => s.type === 'property' && s.owner !== null);
    const word = owned.length ? owned[Math.floor(Math.random() * owned.length)].prop.display : null;
    if (word) window.SPEECH.speak(word);

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🏠'));
        m.appendChild(STORY.el('h3', null, 'Home again!'));
        m.appendChild(STORY.el('p', 'm-sub', word ? `Momo says: "${word}"` : 'Momo waves hello.'));
        m.appendChild(STORY.el('div', 'coin-note', `+${PASS_START} 🪙`));
        const ok = STORY.el('button', 'btn primary wide', 'Thanks, Momo!');
        ok.onclick = () => { STORY.closeModal(); endTurn(); };
        m.appendChild(ok);
    });
}

function onMystery() {
    const p = current();
    const cards = window.CURRICULUM.mysteryCards;
    const card = cards[Math.floor(Math.random() * cards.length)];

    if (card.speakOwned) {
        const owned = state.squares.filter(s => s.type === 'property' && s.owner !== null);
        if (owned.length) {
            window.SPEECH.speak(owned[Math.floor(Math.random() * owned.length)].prop.display);
        }
    }

    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '❓'));
        m.appendChild(STORY.el('h3', null, 'Mystery Card'));
        m.appendChild(STORY.el('div', 'm-sentence', card.text));
        m.appendChild(STORY.el('div', 'm-zh', card.zh));
        if (card.coins) m.appendChild(STORY.el('div', 'coin-note', `+${card.coins} 🪙`));

        const ok = STORY.el('button', 'btn primary wide', 'Done!');
        ok.onclick = () => {
            p.coins += card.coins || 0;
            STORY.closeModal();
            if (card.freeUpgrade) return offerFreeUpgrade();
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
// feel like a rest, not a punishment.
function onPractice() {
    const props = state.squares.filter(s => s.type === 'property').map(s => s.prop);
    const picks = shuffle(props.slice()).slice(0, 3);
    let i = 0;

    const next = () => {
        if (i >= picks.length) { STORY.closeModal(); return endTurn(); }
        const p = picks[i++];
        STORY.showModal(m => {
            m.appendChild(STORY.el('h3', null, '📚 Practice Corner'));
            m.appendChild(STORY.el('p', 'm-sub', `Card ${i} of ${picks.length} — free practice!`));
            m.appendChild(STORY.el('div', 'm-emoji', p.emoji));
            m.appendChild(STORY.el('div', 'm-sentence', p.display));
            m.appendChild(STORY.el('div', 'm-zh', p.hint));
            m.appendChild(STORY.speakButton(p.display));
            const ok = STORY.el('button', 'btn primary wide', i < picks.length ? 'Next card' : 'Done');
            ok.onclick = next;
            m.appendChild(ok);
        });
        window.SPEECH.speak(p.display);
    };
    next();
}

function onPark() {
    const p = current();
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🌳'));
        m.appendChild(STORY.el('h3', null, 'The Park'));
        m.appendChild(STORY.el('p', 'm-sub', 'Momo takes a little nap under the tree.'));
        m.appendChild(STORY.el('div', 'coin-note', '+2 🪙'));
        const ok = STORY.el('button', 'btn primary wide', 'Wake up!');
        ok.onclick = () => { p.coins += 2; STORY.closeModal(); endTurn(); };
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

        const hint = STORY.el('button', 'opt-btn', `💡 Hint token — ${COST_HINT} 🪙`);
        hint.disabled = p.coins < COST_HINT;
        hint.onclick = () => { pay(p, COST_HINT); p.hints += 1; STORY.closeModal(); endTurn(); };
        opts.appendChild(hint);

        const warp = STORY.el('button', 'opt-btn', `🚀 Choose your move — ${COST_WARP} 🪙`);
        warp.disabled = p.coins < COST_WARP || p.warp;
        warp.onclick = () => { pay(p, COST_WARP); p.warp = true; STORY.closeModal(); endTurn(); };
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
    if (sq.owner === state.turn)       return sq.level < 3 ? offerUpgrade(sq, dieValue) : onOwnFull(sq);
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
    const useHint = p.hints > 0;

    STORY.showModal(m => {
        m.appendChild(STORY.el('h3', null, `${prop.setName} — for sale!`));
        m.appendChild(STORY.el('p', 'm-sub', `Answer to build here · ${COST_BUY} 🪙`));
        m.appendChild(STORY.el('div', 'm-emoji', prop.emoji));
        if (useHint) {
            m.appendChild(STORY.el('div', 'm-zh', prop.hint));
            p.hints -= 1;
        }

        const opts = STORY.el('div', 'm-options');
        for (const word of options) {
            const b = STORY.el('button', 'opt-btn', word);
            b.onclick = () => {
                if (b.disabled) return;
                if (word === prop.display) {
                    b.classList.add('right');
                    opts.querySelectorAll('button').forEach(x => x.disabled = true);
                    window.SPEECH.speakWordThenSentence(prop.display, sentenceAt(prop, 2, dieValue));
                    window.setTimeout(() => { STORY.closeModal(); completeBuy(sq); }, 900);
                } else {
                    b.classList.add('wrong');
                    b.disabled = true;
                    if (p.isChild) noteMissed(prop.display);
                    // One wrong tap ends the attempt: no penalty, but no
                    // guess-until-right either, or the answer means nothing.
                    window.setTimeout(() => {
                        STORY.closeModal();
                        wordRanAway(prop);
                    }, 650);
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

function onOwnFull(sq) {
    const p = current();
    STORY.showModal(m => {
        m.appendChild(STORY.el('div', 'm-emoji', '🏘️'));
        m.appendChild(STORY.el('h3', null, 'Your shop is full!'));
        m.appendChild(STORY.el('p', 'm-sub', `"${sq.prop.display}" is all built up.`));
        m.appendChild(STORY.el('div', 'coin-note', '+1 🪙'));
        const ok = STORY.el('button', 'btn primary wide', 'Nice!');
        ok.onclick = () => { p.coins += 1; STORY.closeModal(); endTurn(); };
        m.appendChild(ok);
    });
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
        state = null;
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
