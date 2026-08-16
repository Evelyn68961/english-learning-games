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

// ---------------------------------------------------------------- beats

// Momo's story beat. Fires on completing a colour set, and once at the end of
// the lesson regardless of progress — the child never misses the ending.
function showBeat(beat, done) {
    const layer = beatLayer();
    document.getElementById('beat-text').textContent = beat.text;
    document.getElementById('beat-zh').textContent = beat.zh || '';
    layer.hidden = false;
    window.SPEECH.speak(beat.text, { rate: 0.9 });

    const ok = document.getElementById('beat-ok');
    ok.onclick = () => {
        layer.hidden = true;
        window.SPEECH.stop();
        if (done) done();
    };
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
    showBeat,
    buildReport,
    el,
    speakButton,
};

})();
