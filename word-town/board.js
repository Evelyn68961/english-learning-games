// Word Town — board construction and rendering.
//
// 20 squares laid out around the rim of a 6x6 CSS grid (6 + 4 + 6 + 4 = 20),
// walked clockwise from the top-left corner. One die, so the average roll of
// 3.5 gives ~6 turns per lap: slow enough that properties get revisited, which
// is the whole point — a revisit is a review.

(function () {

// Square plan. Twelve properties in four sets of three, spaced by specials so
// a player never crosses more than three properties without a breather.
//   0 start · 1-3 setA · 4 ? · 5-7 setB · 8 practice · 9 ?
//   10-12 setC · 13 park · 14 ? · 15-17 setD · 18 shop · 19 ?
const LAYOUT = [
    { type: 'start' },
    { type: 'property', set: 0, slot: 0 },
    { type: 'property', set: 0, slot: 1 },
    { type: 'property', set: 0, slot: 2 },
    { type: 'mystery' },
    { type: 'property', set: 1, slot: 0 },
    { type: 'property', set: 1, slot: 1 },
    { type: 'property', set: 1, slot: 2 },
    { type: 'practice' },
    { type: 'mystery' },
    { type: 'property', set: 2, slot: 0 },
    { type: 'property', set: 2, slot: 1 },
    { type: 'property', set: 2, slot: 2 },
    { type: 'park' },
    { type: 'mystery' },
    { type: 'property', set: 3, slot: 0 },
    { type: 'property', set: 3, slot: 1 },
    { type: 'property', set: 3, slot: 2 },
    { type: 'shop' },
    { type: 'mystery' },
];

const SPECIAL_FACE = {
    start:    { emoji: '🏠', label: 'START' },
    mystery:  { emoji: '❓', label: 'Mystery' },
    practice: { emoji: '📚', label: 'Practice' },
    park:     { emoji: '🌳', label: 'Park' },
    shop:     { emoji: '🛒', label: 'Shop' },
};

// Map a square index to its cell in the 6x6 grid, clockwise from top-left.
//   0-5 across the top, 6-9 down the right, 10-15 back along the bottom,
//   16-19 up the left side.
function gridPos(i) {
    if (i <= 5)  return { row: 1,      col: i + 1 };
    if (i <= 9)  return { row: i - 4,  col: 6 };
    if (i <= 15) return { row: 6,      col: 16 - i };
    return           { row: 21 - i,    col: 1 };
}

// Build the 20 runtime squares for a week, joining LAYOUT to the week's
// resolved properties. Each property square carries its own ownership state.
function buildSquares(week) {
    const props = window.CURRICULUM.propertiesFor(week);
    const bySet = week.sets.map((s, i) => props.filter(p => p.setKey === s.key));

    return LAYOUT.map((entry, index) => {
        if (entry.type !== 'property') {
            return Object.assign({ index }, entry, SPECIAL_FACE[entry.type]);
        }
        const prop = (bySet[entry.set] || [])[entry.slot];
        if (!prop) return Object.assign({ index, type: 'park' }, SPECIAL_FACE.park);
        return {
            index,
            type: 'property',
            setIndex: entry.set,
            prop,
            owner: null,     // player index, or null while unowned
            level: 0,        // 0 none · 1 hut · 2 house · 3 shop
        };
    });
}

const HOUSE = ['', '🏠', '🏡', '🏘️'];

// Full board repaint. Cheap enough at 20 squares to redraw on every change,
// which keeps ownership, buildings and tokens from drifting out of sync.
function render(boardEl, state) {
    boardEl.innerHTML = '';

    for (const sq of state.squares) {
        const pos = gridPos(sq.index);
        const el = document.createElement('div');
        el.className = 'square' + (sq.type === 'property' ? '' : ' special');
        el.style.gridRow = pos.row;
        el.style.gridColumn = pos.col;
        el.dataset.index = String(sq.index);

        if (sq.type === 'property') {
            if (sq.prop.review) el.classList.add('review');

            const band = document.createElement('div');
            band.className = 'sq-band';
            band.style.background = sq.prop.color;
            el.appendChild(band);

            const emoji = document.createElement('div');
            emoji.className = 'sq-emoji';
            emoji.textContent = sq.level > 0 ? HOUSE[sq.level] : sq.prop.emoji;
            el.appendChild(emoji);

            const word = document.createElement('div');
            word.className = 'sq-word';
            word.textContent = sq.prop.display;
            el.appendChild(word);

            if (sq.owner !== null) {
                const owner = document.createElement('div');
                owner.className = 'sq-owner';
                owner.textContent = state.players[sq.owner].token;
                el.appendChild(owner);
            }
        } else {
            const emoji = document.createElement('div');
            emoji.className = 'sq-emoji';
            emoji.textContent = sq.emoji;
            el.appendChild(emoji);

            const label = document.createElement('div');
            label.className = 'sq-word';
            label.textContent = sq.label;
            el.appendChild(label);
        }

        // Player tokens sit on top of whatever the square shows.
        const here = state.players.filter(p => p.pos === sq.index);
        if (here.length) {
            const tokens = document.createElement('div');
            tokens.className = 'tokens';
            for (const p of here) {
                const t = document.createElement('span');
                t.className = 'token';
                t.textContent = p.token;
                tokens.appendChild(t);
            }
            el.appendChild(tokens);
        }

        boardEl.appendChild(el);
    }
}

// Briefly ring a square — used when a player lands, so the child's eye follows
// the token instead of hunting for what just changed.
function highlight(boardEl, index) {
    const el = boardEl.querySelector('.square[data-index="' + index + '"]');
    if (!el) return;
    el.classList.add('highlight');
    window.setTimeout(() => el.classList.remove('highlight'), 900);
}

// True once every property in a set has the same owner.
function setComplete(state, setIndex, playerIndex) {
    const inSet = state.squares.filter(s => s.type === 'property' && s.setIndex === setIndex);
    return inSet.length > 0 && inSet.every(s => s.owner === playerIndex);
}

window.BOARD = {
    LAYOUT,
    HOUSE,
    gridPos,
    buildSquares,
    render,
    highlight,
    setComplete,
    size: LAYOUT.length,
};

})();
