// Word Town — presentation layer: modals, Momo's story beats, and the report
// card. Kept apart from game.js so the turn logic stays readable and the
// wording a child sees all lives in one place.

(function () {

const modalLayer = () => document.getElementById('modal-layer');
const beatLayer  = () => document.getElementById('beat-layer');

// ---------------------------------------------------------------- modal

// Show a modal. `build` receives the modal element so callers can wire their
// own buttons; nothing here closes automatically, because every modal in this
// game is a decision point the child must actually act on.
function showModal(build) {
    const layer = modalLayer();
    const modal = document.getElementById('modal');
    modal.innerHTML = '';
    build(modal);
    layer.hidden = false;
}

function closeModal() {
    modalLayer().hidden = true;
    document.getElementById('modal').innerHTML = '';
}

function isModalOpen() { return !modalLayer().hidden; }

// Small builder helpers — these three patterns cover every modal in the game.
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function speakButton(text) {
    const b = el('button', 'speak-btn', '🔊');
    b.setAttribute('aria-label', 'Say it again');
    b.onclick = () => window.SPEECH.speak(text);
    return b;
}

// ---------------------------------------------------------------- questions

// A tap-to-answer question, used by Practice Corner, the Park game and the
// quiz mystery cards. `q` is:
//   prompt       the heading
//   sub          a line under it, optional
//   face         what the child looks at — an emoji, or 🔊 for listening
//   speak        spoken on open, and again whenever `face` is tapped
//   options      [{ label, value }] — labels are words, or emoji when `emoji`
//   answer       the winning `value`
//   emoji        true to lay the options out as a picture grid
// Calls `done(correct)` once, after a beat long enough for the child to see
// which button was right. A wrong tap always reveals the answer: a question
// that ends without showing the truth has taught nothing.
function showQuiz(q, done) {
    let answered = false;

    showModal(m => {
        m.appendChild(el('h3', null, q.prompt));
        if (q.sub) m.appendChild(el('p', 'm-sub', q.sub));

        if (q.face) {
            const face = el('div', 'm-emoji', q.face);
            if (q.speak) {
                face.classList.add('m-emoji-tap');
                face.setAttribute('role', 'button');
                face.setAttribute('aria-label', 'Say it again');
                face.onclick = () => window.SPEECH.speak(q.speak);
            }
            m.appendChild(face);
        }

        const opts = el('div', 'm-options' + (q.emoji ? ' m-options-grid' : ''));
        q.options.forEach(opt => {
            const b = el('button', 'opt-btn' + (q.emoji ? ' opt-emoji' : ''), opt.label);
            b.onclick = () => {
                if (answered) return;
                answered = true;
                const right = opt.value === q.answer;
                b.classList.add(right ? 'right' : 'wrong');

                const buttons = opts.querySelectorAll('button');
                buttons.forEach((node, i) => {
                    node.disabled = true;
                    if (!right && q.options[i].value === q.answer) node.classList.add('right');
                });

                if (q.answerSpeak) window.SPEECH.speak(q.answerSpeak);
                window.setTimeout(() => { closeModal(); done(right); }, right ? 700 : 1300);
            };
            opts.appendChild(b);
        });
        m.appendChild(opts);
    });

    if (q.speak) window.SPEECH.speak(q.speak);
}

// A physical-action card: one tap per rep, the action spoken on every tap, and
// no way to finish early. The pips are the whole point — a child can see how
// many jumps are left, and the button only appears once they are done.
function showTapCard(card, done) {
    let taps = 0;

    showModal(m => {
        m.appendChild(el('div', 'm-emoji', '❓'));
        m.appendChild(el('h3', null, card.text));
        m.appendChild(el('div', 'm-zh', card.zh));

        const pips = el('div', 'pip-row');
        for (let i = 0; i < card.taps; i++) pips.appendChild(el('span', 'pip'));
        m.appendChild(pips);

        const finish = el('button', 'btn primary wide', `+${card.coins} 🪙 Done!`);
        finish.hidden = true;
        finish.onclick = () => { closeModal(); done(); };

        const tap = el('button', 'btn coral wide tap-target', card.label || 'Tap!');
        tap.onclick = () => {
            if (taps >= card.taps) return;
            taps += 1;
            pips.children[taps - 1].classList.add('on');
            // Counting cards say the number; action cards say the action. Both
            // give the child English on every single tap.
            window.SPEECH.speak(card.count
                ? window.CURRICULUM.numberWords[taps]
                : card.word);
            if (taps >= card.taps) {
                tap.hidden = true;
                finish.hidden = false;
            }
        };

        m.appendChild(tap);
        m.appendChild(finish);
    });
}

// ---------------------------------------------------------------- beats

// Momo's story beat. Fires on completing a colour set, and once at the end of
// the lesson regardless of progress — the child never misses the ending.
//
// Beats queue rather than replace each other. Each one carries the callback
// that resumes the turn, and there is exactly one OK button: showing a second
// beat on top of a live one used to overwrite that callback, dropping the
// first beat's continuation and leaving the game with no way to move on.
let beatQueue = [];
let beatOpen = false;

function showBeat(beat, done) {
    beatQueue.push({ beat, done });
    if (!beatOpen) nextBeat();
}

function nextBeat() {
    const item = beatQueue.shift();
    if (!item) { beatOpen = false; return; }
    beatOpen = true;

    const layer = beatLayer();
    document.getElementById('beat-text').textContent = item.beat.text;
    document.getElementById('beat-zh').textContent = item.beat.zh || '';
    layer.hidden = false;
    window.SPEECH.speak(item.beat.text, { rate: 0.9 });

    const ok = document.getElementById('beat-ok');
    ok.onclick = () => {
        layer.hidden = true;
        window.SPEECH.stop();
        beatOpen = false;
        // The continuation runs first and may queue the finale itself, so only
        // fall through to the queue if it has not already taken over.
        if (item.done) item.done();
        if (!beatOpen && beatQueue.length) nextBeat();
    };
}

// Drop anything still queued — a new lesson must not inherit the last one's
// beats, and neither must a lesson the child quit halfway through.
function resetBeats() {
    beatQueue = [];
    beatOpen = false;
    beatLayer().hidden = true;
}

// ---------------------------------------------------------------- report

function plural(n, one, many) { return n === 1 ? one : many; }

// Build the end-of-lesson report card. Deliberately shaped to be screenshotted
// and sent to a parent: what was learned, what still needs work, and a hook for
// next week.
function buildReport(container, summary) {
    container.innerHTML = '';

    container.appendChild(el('h2', null, `${summary.emoji} Week ${summary.week}: ${summary.district}`));
    container.appendChild(el('p', 'rc-sub', summary.blurb));

    const built = summary.childBuildings;
    const winnerLine = summary.winner === 'child'
        ? `🏆 You win! ${built} ${plural(built, 'building', 'buildings')} to ${summary.teacherBuildings}.`
        : summary.winner === 'tie'
            ? `🤝 A tie! ${built} ${plural(built, 'building', 'buildings')} each.`
            : `Momo's town grew by ${built + summary.teacherBuildings} ${plural(built + summary.teacherBuildings, 'building', 'buildings')} today!`;
    container.appendChild(el('div', 'rc-winner', winnerLine));

    const rows = [
        { icon: '✅', label: 'You learned', words: summary.learned,
          empty: 'Nothing new yet — try this week again!' },
        { icon: '🔁', label: 'Practice again', words: summary.missed,
          empty: 'Nothing missed. Perfect!' },
    ];

    for (const row of rows) {
        const r = el('div', 'rc-row');
        r.appendChild(el('div', 'rc-icon', row.icon));
        const body = el('div', 'rc-body');
        body.appendChild(el('div', 'rc-label', row.label));
        body.appendChild(el('div', 'rc-words',
            row.words.length ? row.words.join(' · ') : row.empty));
        r.appendChild(body);
        container.appendChild(r);
    }

    const say = el('div', 'rc-row');
    say.appendChild(el('div', 'rc-icon', '💬'));
    const sayBody = el('div', 'rc-body');
    sayBody.appendChild(el('div', 'rc-label', 'Sentences said'));
    sayBody.appendChild(el('div', 'rc-words',
        `"${summary.frameSample}" × ${summary.framesSaid}`));
    say.appendChild(sayBody);
    container.appendChild(say);

    const town = el('div', 'rc-row');
    town.appendChild(el('div', 'rc-icon', '🏘️'));
    const townBody = el('div', 'rc-body');
    townBody.appendChild(el('div', 'rc-label', 'Your town'));
    townBody.appendChild(el('div', 'rc-words',
        `${summary.townSize} ${plural(summary.townSize, 'building', 'buildings')} in total`));
    town.appendChild(townBody);
    container.appendChild(town);

    if (summary.nextWeek) {
        container.appendChild(el('div', 'rc-next',
            `⭐ Next week: ${summary.nextWeek.blurb}`));
    } else {
        container.appendChild(el('div', 'rc-next',
            '🎊 That was the last lesson of Season 1. Momo says thank you!'));
    }
}

window.STORY = {
    showModal,
    closeModal,
    isModalOpen,
    showQuiz,
    showTapCard,
    showBeat,
    resetBeats,
    buildReport,
    el,
    speakButton,
};

})();
