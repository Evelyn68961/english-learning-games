// ==================== THEME DATA ====================
// Themes are sourced from shared/question-bank.js (loaded via index.html before this script).
const THEMES = window.QUESTION_BANK.themes;

// ==================== PLANT TYPES ====================
// Cherry is a single-use bomb: a fuse counts down on placement, then it
// explodes in a 3x3 radius and is removed. Cost matches the classic PvZ.
const PLANT_TYPES = {
    sunflower:  { cost: 50,  icon: '🌻', hp: 4,  name: 'Sunflower',  produces: 'sun'   },
    peashooter: { cost: 100, icon: '🟢', hp: 4,  name: 'Peashooter', produces: 'peas'  },
    wallnut:    { cost: 50,  icon: '🌰', hp: 18, name: 'Wallnut',    produces: null    },
    chomper:    { cost: 50,  icon: '🌷', hp: 4,  name: 'Chomper',    produces: 'bite'  },
    cherry:     { cost: 150, icon: '🍒', hp: 1,  name: 'Cherry Bomb', produces: 'bomb' },
    pumpkin:    { cost: 50,  icon: '🎃', hp: 1,  name: 'Squash',     produces: 'leap'  },
};
const PLANT_ORDER = ['sunflower', 'peashooter', 'wallnut', 'chomper', 'cherry', 'pumpkin'];

const CHERRY_FUSE_FRAMES = 60;    // ~1s windup before detonation
const CHERRY_BLAST_RADIUS = 130;  // covers a 3x3 patch of cells
const PEASHOOTER_SHOTS = 120;     // peas the plant fires before wilting away
const PUMPKIN_LEAP_FRAMES = 30;   // ~0.5s leap animation
const PUMPKIN_TRIGGER_CELLS = 2;  // trigger when a zombie is within N cell-widths (either direction)
const PUMPKIN_SQUASH_RADIUS = 38; // landing kill zone (px)

// Wallnut rolls when tapped: a tap on the nut rolls it forward (right, into
// the horde). Only a tap clearly left of the nut's body — past
// WALLNUT_BODY_HALF_WIDTH but still within WALLNUT_TAP_RADIUS — rolls it
// backward, so a fingertip landing slightly off-centre never sends it the
// wrong way. It plows through zombies
// in its lane, crashing up to WALLNUT_ROLL_MAX_KILLS before it shatters.
const WALLNUT_ROLL_SPEED = 4.5;
const WALLNUT_ROLL_HIT_RADIUS = 26;
const WALLNUT_ROLL_MAX_KILLS = 3;
const WALLNUT_TAP_RADIUS = 30;
const WALLNUT_BODY_HALF_WIDTH = 18; // matches the drawn nut's x-radius
// Auto-trigger: once a wallnut has been chewed down to this fraction of its
// max HP, it goes out swinging — auto-rolls forward into the horde rather
// than dying uselessly. Manual tap still works at full HP.
const WALLNUT_AUTO_ROLL_HP_RATIO = 1 / 3;

// Chomper: bites a single zombie that wanders within range, then chews for a
// while during which it can't bite again — that gap is when it's vulnerable
// and serves as a temporary blocker. The bitten zombie is frozen in place
// until the bite snap completes (so the snap visibly catches its target).
const CHOMPER_BITE_RANGE_CELLS = 1.2;
const CHOMPER_BITE_FRAMES = 14;   // ~0.23s snap animation
const CHOMPER_CHEW_FRAMES = 130;  // ~2.2s digest before it can bite again

// Lawn trolleys: one per lane, parked just left of the playable lawn. They
// auto-fire when a zombie has broken past every defender in that lane and
// reaches the gate area, then drive right at speed and crash every zombie
// they touch. One-shot per lane — once it's fired, that lane has no more
// safety net.
const TROLLER_SPEED = 6;
const TROLLER_KILL_RADIUS = 30;
const TROLLER_TRIGGER_X_BUFFER = 25; // fire when zombie reaches LAWN_LEFT + this

// ==================== QUESTION PACING ====================
// Gap between automatic questions, measured in wall-clock ms from when the
// previous question closes. The battlefield freezes during a question, so a
// short gap adds no time pressure; it just leaves room to teach a level's
// content (a level teaches ~12 new items).
const QUESTION_INTERVAL_MS = 6000;

// Question reward shifts at this wave. Before: correct = +50 sun. From this
// wave on, sunflowers should be self-sufficient for sun, so correct answers
// instead grant an "upgrade token" — the player taps any unupgraded plant on
// the field to double its defense power (without changing its lifespan).
const UPGRADE_FROM_WAVE = 3;

// ==================== STAGED LEVELS ====================
// Levels are built per theme from the question bank. Each band teaches the
// difficulty range in BAND_PLAN; that content is sorted easiest-first and cut
// into levels of about NEW_WORDS_PER_LEVEL new words (plus a matching share of
// the grammar patterns), so every level teaches its OWN new items. Each level
// also reviews what came before it (earlier levels, plus easier content from
// the band below), and the band ends with a "Big Review" level that mixes
// everything. Difficulty scale (bank `difficulty`):
//   0 starter · 1 A1 · 2 A2 · 3 B1 · 4 B2-prep · 5-6 大考 L3-L4 · 7-8 L5-L6.
const BAND_PLAN = {
    elementary: { minStage: 0, maxStage: 2, grammarShare: 0.20, waves: [4, 6] },
    junior:     { minStage: 2, maxStage: 4, grammarShare: 0.35, waves: [5, 7] },
    senior:     { minStage: 4, maxStage: 8, grammarShare: 0.50, waves: [5, 8] },
};
const NEW_WORDS_PER_LEVEL = 6;
const REVIEW_SHARE = 0.3;  // share of questions that revisit earlier content
const STAGE_NAMES = ['Starter', 'Basic', 'Growing', 'Builder', 'Bridge', 'GSAT I', 'GSAT II', 'AST I', 'AST II'];
const STAGE_EMOJI = ['🌱', '🌿', '🌻', '🌳', '🏅', '📘', '📗', '🎓', '🏆'];

function itemDifficulty(x) { return x.difficulty ?? 1; }

function buildLevels(band, theme) {
    const plan = BAND_PLAN[band] || BAND_PLAN.elementary;
    const inBand = x => itemDifficulty(x) >= plan.minStage && itemDifficulty(x) <= plan.maxStage;
    const below = x => itemDifficulty(x) < plan.minStage;
    const byDiff = (a, b) => itemDifficulty(a) - itemDifficulty(b); // stable sort keeps bank order
    const uniqueGrammar = [];
    const seen = new Set();
    theme.grammar.forEach(g => { if (!seen.has(g.sentence)) { seen.add(g.sentence); uniqueGrammar.push(g); } });

    const words = theme.words.filter(inBand).sort(byDiff);
    const grammar = uniqueGrammar.filter(inBand).sort(byDiff);
    const warmWords = theme.words.filter(below);
    const warmGrammar = uniqueGrammar.filter(below);

    const n = Math.max(1, Math.round(words.length / NEW_WORDS_PER_LEVEL));
    const cut = (arr, i) => [Math.round(i * arr.length / n), Math.round((i + 1) * arr.length / n)];
    const levels = [];
    for (let i = 0; i < n; i++) {
        const [w0, w1] = cut(words, i);
        const [g0, g1] = cut(grammar, i);
        const newWords = words.slice(w0, w1);
        const newGrammar = grammar.slice(g0, g1);
        // Name the level after the difficulty most of its new words have.
        const counts = {};
        newWords.forEach(w => { counts[itemDifficulty(w)] = (counts[itemDifficulty(w)] || 0) + 1; });
        const common = Object.keys(counts).sort((x, y) => counts[y] - counts[x] || x - y)[0];
        const stage = common !== undefined ? Number(common) : plan.minStage;
        levels.push({
            id: i + 1,
            name: STAGE_NAMES[stage] || 'Level',
            emoji: STAGE_EMOJI[stage] || '🌱',
            stage,
            waves: plan.waves[0] + Math.round((plan.waves[1] - plan.waves[0]) * (n > 1 ? i / (n - 1) : 0)),
            newWords, newGrammar,
            reviewWords: warmWords.concat(words.slice(0, w0)),
            reviewGrammar: warmGrammar.concat(grammar.slice(0, g0)),
            isReview: false,
        });
    }
    // Several levels can share a stage: number them ("Builder 1", "Builder 2").
    const perName = {};
    levels.forEach(l => { perName[l.name] = (perName[l.name] || 0) + 1; });
    const counter = {};
    levels.forEach(l => { if (perName[l.name] > 1) l.name += ' ' + (counter[l.name] = (counter[l.name] || 0) + 1); });

    levels.push({
        id: n + 1, name: 'Big Review', emoji: '⭐', stage: plan.maxStage, waves: plan.waves[1],
        newWords: [], newGrammar: [], reviewWords: words, reviewGrammar: grammar, isReview: true,
    });
    return levels;
}

// Levels for a band, built from the band-filtered current theme (cached).
const levelCache = {};
function levelsFor(band) {
    if (!currentTheme) return [];
    const key = band + '|' + currentTheme.id;
    return levelCache[key] || (levelCache[key] = buildLevels(band, currentTheme));
}

// Zombie difficulty per learner band. Elementary is moderately gentler — it
// starts with fewer, slower zombies and ramps more slowly so kids have time to
// read and answer. `default` is the tougher junior/senior tuning.
const ZOMBIE_TUNING = {
    elementary: { zombiesPerWave: 4, zombieSpeed: 0.5, spawnInterval: 110, dZombies: 2, dSpeed: 0.08, dInterval: 8,  minInterval: 70 },
    default:    { zombiesPerWave: 6, zombieSpeed: 0.6, spawnInterval: 90,  dZombies: 3, dSpeed: 0.12, dInterval: 10, minInterval: 50 },
};
function tuningFor(band) { return band === 'elementary' ? ZOMBIE_TUNING.elementary : ZOMBIE_TUNING.default; }

// ==================== GAME STATE ====================
let currentTheme = null;
// Learner level — 'elementary' shows only easy/medium grammar (Grades 3-6 syllabus),
// 'junior' shows all difficulties (Grades 7-9). Default to junior to preserve prior behavior.
let selectedLevel = 'junior';
let gameState = {
    sun: 100,
    score: 0,
    lives: 3,
    wave: 1,
    totalWaves: 12,
    zombies: [],
    plants: [],
    projectiles: [],
    sunTokens: [],
    explosions: [],
    isPlaying: false,
    questionActive: false,
    currentQuestion: null,
    questionsAnswered: 0,
    correctAnswers: 0,
    zombiesPerWave: 6,
    zombieSpeed: 0.6,
    spawnTimer: 0,
    spawnInterval: 90,
    waveZombiesSpawned: 0,
    animFrame: null,
    nextQuestionAt: 0,
    triggerZombie: null,
    selectedPlant: null,
    sunTokenTimer: 0,
    damageCooldown: 0,
};

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H, GROUND_Y, LANE_H, LAWN_LEFT, CELL_W, GRID_COLS;

function resizeCanvas() {
    const old = (W === undefined) ? null : { GROUND_Y, LANE_H, LAWN_LEFT, CELL_W };
    // Prefer visualViewport: on iOS it excludes the dynamic URL bar / keyboard,
    // so the canvas matches what's actually visible instead of overflowing
    // under the toolbar.
    const vv = window.visualViewport;
    W = canvas.width = vv ? vv.width : window.innerWidth;
    H = canvas.height = vv ? vv.height : window.innerHeight;
    GROUND_Y = H * 0.55;
    LANE_H = (H - GROUND_Y - 80) / 3;
    LAWN_LEFT = 90;
    CELL_W = Math.min(95, Math.max(60, (W - LAWN_LEFT - 10) / 9));
    GRID_COLS = Math.max(4, Math.floor((W - LAWN_LEFT - 10) / CELL_W));
    if (old) remapBattlefield(old);

    // Pin the plant-cards bar directly under the HUD, regardless of HUD height.
    const hud = document.getElementById('hud');
    if (hud) {
        const hudH = hud.classList.contains('active') ? hud.offsetHeight : 0;
        document.documentElement.style.setProperty('--hud-h', hudH + 'px');
    }
}
// Everything on the lawn stores pixel positions, so when the lawn is resized
// (rotation, or the iOS URL bar showing/hiding) move every object to the same
// spot in the new geometry: x scales with the cell width from the lawn's left
// edge, y with the lane height from the top of the ground. A plant's cell
// centre therefore lands exactly on its new cell centre, and a zombie keeps
// the same distance (in cells) from the plant it is chewing.
function remapBattlefield(old) {
    const gs = gameState;
    if (!gs || !gs.plants) return;
    const kx = CELL_W / old.CELL_W;
    const ky = LANE_H / old.LANE_H;
    const mx = x => LAWN_LEFT + (x - old.LAWN_LEFT) * kx;
    const my = y => GROUND_Y + (y - old.GROUND_Y) * ky;
    gs.plants.forEach(p => {
        p.x = mx(p.x); p.y = my(p.y);
        if (p.leapStartX !== undefined) p.leapStartX = mx(p.leapStartX);
        if (p.leapTargetX !== undefined) p.leapTargetX = mx(p.leapTargetX);
    });
    gs.zombies.forEach(z => { z.x = mx(z.x); z.y = my(z.y); });
    gs.projectiles.forEach(pr => { pr.x = mx(pr.x); pr.y = my(pr.y); });
    gs.sunTokens.forEach(t => { t.x = mx(t.x); t.y = my(t.y); t.targetY = my(t.targetY); });
    gs.explosions.forEach(e => { e.x = mx(e.x); e.y = my(e.y); });
    (gs.trollers || []).forEach(tr => { tr.x = tr.fired ? mx(tr.x) : LAWN_LEFT - 28; });
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    // iOS sometimes reports stale dimensions until after the rotation animation;
    // re-measure on the next frame and again shortly after to catch both.
    requestAnimationFrame(resizeCanvas);
    setTimeout(resizeCanvas, 250);
});
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', resizeCanvas);
}
resizeCanvas();

// ==================== INPUT (tap-to-place) ====================
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const t = e.changedTouches ? e.changedTouches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function handleCanvasTap(e) {
    if (!gameState.isPlaying) return;
    const { x, y } = getCanvasCoords(e);

    // 1. Sun token collection — works even while a question is up
    for (let i = gameState.sunTokens.length - 1; i >= 0; i--) {
        const s = gameState.sunTokens[i];
        if (Math.hypot(x - s.x, y - s.y) < 28) {
            gameState.sun += s.value;
            gameState.sunTokens.splice(i, 1);
            updateHUD();
            updatePlantCards();
            playSound('plant');
            return;
        }
    }

    if (gameState.questionActive) return;

    // 1b. Shovel: dig up the plant closest to the tap (same lane, within half
    // a cell). No sun is refunded. The shovel puts itself away after one dig.
    if (gameState.shovelMode) {
        let target = null, best = CELL_W / 2;
        for (const p of gameState.plants) {
            const d = Math.hypot(x - p.x, y - p.y);
            if (d < best) { best = d; target = p; }
        }
        if (target) {
            // A chomper dug up mid-bite must let go of the zombies it froze.
            (target.chompTargets || []).forEach(z => { z.beingEaten = false; });
            gameState.plants = gameState.plants.filter(p => p !== target);
            playSound('plant');
            showFeedback('🪏 Dug up!');
        }
        setShovelMode(false);
        return;
    }

    // 2. Spend a pending upgrade token on a tapped plant. Has to come before
    // the wallnut-roll handler so a queued upgrade applies first; tap the
    // wallnut again afterward to roll it.
    if (gameState.upgradesPending > 0 && !gameState.selectedPlant) {
        for (const p of gameState.plants) {
            if (p.upgraded) continue;
            if (Math.hypot(x - p.x, y - p.y) < 30) {
                p.upgraded = true;
                gameState.upgradesPending--;
                playSound('correct');
                showFeedback('⬆️ Upgraded!');
                updateHUD();
                return;
            }
        }
    }

    // 3. Tap an idle wallnut (no card selected) to roll it. Any tap on the nut
    // rolls it forward into the horde; only a tap clearly left of its body
    // rolls it backward through plants that have already been overrun.
    if (!gameState.selectedPlant) {
        for (const p of gameState.plants) {
            if (p.type !== 'wallnut' || p.rolling) continue;
            if (Math.hypot(x - p.x, y - p.y) < WALLNUT_TAP_RADIUS) {
                p.rolling = true;
                p.rollDir = (x < p.x - WALLNUT_BODY_HALF_WIDTH) ? -1 : 1;
                p.rollKills = 0;
                p.rollHits = new Set();
                playSound('plant');
                return;
            }
        }
    }

    // 4. Plant placement (only if a card is selected)
    if (!gameState.selectedPlant) return;
    if (y < GROUND_Y) return;
    const lane = Math.floor((y - GROUND_Y) / LANE_H);
    if (lane < 0 || lane > 2) return;
    if (x < LAWN_LEFT) return;
    const col = Math.floor((x - LAWN_LEFT) / CELL_W);
    if (col < 0 || col >= GRID_COLS) return;

    const occupied = gameState.plants.some(p => p.col === col && p.lane === lane);
    if (occupied) return;

    const info = PLANT_TYPES[gameState.selectedPlant];
    if (gameState.sun < info.cost) return;

    placePlant(gameState.selectedPlant, col, lane);
}

canvas.addEventListener('click', handleCanvasTap);
canvas.addEventListener('touchend', e => {
    e.preventDefault();
    handleCanvasTap(e);
}, { passive: false });

function placePlant(type, col, lane) {
    const info = PLANT_TYPES[type];
    gameState.plants.push({
        type,
        col,
        lane,
        x: LAWN_LEFT + (col + 0.5) * CELL_W,
        y: GROUND_Y + lane * LANE_H + LANE_H / 2,
        hp: info.hp,
        maxHp: info.hp,
        shootTimer: 0,
        plantAnim: 0,
        fuse: type === 'cherry' ? CHERRY_FUSE_FRAMES : 0,
        shotsLeft: type === 'peashooter' ? PEASHOOTER_SHOTS : 0,
        squashState: type === 'pumpkin' ? 'idle' : null,
        leapAge: 0,
        rolling: false,
        rollDir: 0,
        rollKills: 0,
        rollAngle: 0,
        rollHits: null,
        chompState: type === 'chomper' ? 'idle' : null,
        chompTimer: 0,
        chompTargets: null,
        upgraded: false,
    });
    gameState.sun -= info.cost;
    gameState.selectedPlant = null;
    canvas.classList.remove('plant-mode');
    updatePlantCards();
    updateHUD();
    playSound('plant');
}

// ==================== PLANT CARDS UI ====================
function renderPlantCards() {
    const bar = document.getElementById('plant-cards');
    bar.innerHTML = PLANT_ORDER.map(type => {
        const info = PLANT_TYPES[type];
        return `<button class="plant-card" data-type="${type}" onclick="selectPlantType('${type}')">
            <div class="card-icon">${info.icon}</div>
            <div class="card-cost">☀️${info.cost}</div>
        </button>`;
    }).join('') + `<button class="plant-card shovel-card" onclick="toggleShovel()" aria-label="Shovel: dig up a plant">
            <div class="card-icon">🪏</div>
            <div class="card-cost">Dig</div>
        </button>`;
    updatePlantCards();
}

// Shovel: tap the card, then tap a plant to remove it. Picking a plant card
// puts the shovel away, and picking the shovel puts any plant card away.
function setShovelMode(on) {
    gameState.shovelMode = on;
    if (on) gameState.selectedPlant = null;
    canvas.classList.toggle('plant-mode', on || !!gameState.selectedPlant);
    updatePlantCards();
}

function toggleShovel() {
    if (!gameState.isPlaying) return;
    setShovelMode(!gameState.shovelMode);
}

function selectPlantType(type) {
    if (!gameState.isPlaying) return;
    if (gameState.sun < PLANT_TYPES[type].cost) return;
    gameState.selectedPlant = (gameState.selectedPlant === type) ? null : type;
    gameState.shovelMode = false;
    canvas.classList.toggle('plant-mode', !!gameState.selectedPlant);
    updatePlantCards();
}

function updatePlantCards() {
    const shovel = document.querySelector('.shovel-card');
    if (shovel) shovel.classList.toggle('selected', !!gameState.shovelMode);
    document.querySelectorAll('.plant-card[data-type]').forEach(card => {
        const type = card.dataset.type;
        const cost = PLANT_TYPES[type].cost;
        card.classList.toggle('disabled', gameState.sun < cost);
        card.classList.toggle('selected', gameState.selectedPlant === type);
    });
}

// ==================== AUDIO ====================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

        if (type === 'correct') {
            osc.frequency.setValueAtTime(523, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
            osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'shoot') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'zombieDie') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.3);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'plant') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        }
    } catch(e) {}
}

function speakWord(text) {
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.85;
        u.pitch = 1.1;
        u.lang = 'en-US';
        speechSynthesis.speak(u);
    }
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}

function showTitle() {
    stopGame();
    showScreen('title-screen');
}

function showThemes() {
    stopGame();
    renderThemes();
    showScreen('theme-screen');
}

// In-game back button: confirm before abandoning an active run so a stray tap
// during play doesn't wipe out progress. Returns to the theme's level picker.
function quitToThemes() {
    if (gameState.isPlaying && !confirm('Quit this game and go back?')) return;
    if (gameState.themeId) showLevelSelect(gameState.themeId);
    else showThemes();
}

function renderThemes() {
    const grid = document.getElementById('theme-grid');
    grid.innerHTML = THEMES.map(t => `
        <div class="theme-card ${t.unlocked ? '' : 'locked'}" onclick="${t.unlocked ? `selectTheme('${t.id}')` : ''}" style="border-color: ${t.unlocked ? t.color + '44' : ''}">
            ${t.unlocked ? '' : '<span class="lock-icon">🔒</span>'}
            <span class="theme-emoji">${t.emoji}</span>
            <div class="theme-name">${t.name}</div>
            <div class="theme-words">${t.words.slice(0,3).map(w=>w.word).join(', ')}...</div>
        </div>
    `).join('');
}

// ==================== QUESTION SCHEDULING ====================
// Each game keeps a small schedule over the level's items (spaced retrieval):
//  - a missed item comes back after two other questions;
//  - a new item answered right gets one quick re-check a few questions later;
//  - otherwise ~REVIEW_SHARE of questions revisit earlier content (favouring
//    items not yet learned) and the rest practise this level's new items
//    (favouring the ones practised least so far).
const MISSED_GAP = 3;    // asked again 3 questions later (two in between)
const RECHECK_GAP = 5;   // first-time-correct new item re-checked 5 questions later

function itemKey(kind, data) { return (kind === 'word' ? 'w:' : 'g:') + (kind === 'word' ? data.word : data.sentence); }

function makeSchedule(levelDef) {
    const mk = (kind, data, isNew, warm) => ({ kind, data, isNew, warm, key: itemKey(kind, data), correct: 0, dueAt: null });
    const warmWords = new Set(levelDef.reviewWords.filter(w => itemDifficulty(w) < (BAND_PLAN[gameState.band] || BAND_PLAN.elementary).minStage));
    const warmGrammar = new Set(levelDef.reviewGrammar.filter(g => itemDifficulty(g) < (BAND_PLAN[gameState.band] || BAND_PLAN.elementary).minStage));
    return {
        items: [
            ...levelDef.newWords.map(w => mk('word', w, true, false)),
            ...levelDef.newGrammar.map(g => mk('grammar', g, true, false)),
            ...levelDef.reviewWords.map(w => mk('word', w, false, warmWords.has(w))),
            ...levelDef.reviewGrammar.map(g => mk('grammar', g, false, warmGrammar.has(g))),
        ],
        qIndex: 0,
        lastKey: null,
    };
}

function weightedPick(list, weightOf) {
    const total = list.reduce((sum, x) => sum + weightOf(x), 0);
    let r = Math.random() * total;
    for (const x of list) { r -= weightOf(x); if (r <= 0) return x; }
    return list[list.length - 1];
}

function pickItem(sched) {
    // 0. Final quiz: only the new items not yet answered right.
    if (gameState.finalQuiz && gameState.learnGoal.size) {
        let left = sched.items.filter(it => gameState.learnGoal.has(it.key));
        if (left.length > 1) left = left.filter(it => it.key !== sched.lastKey);
        return left[Math.floor(Math.random() * left.length)];
    }
    // 1. Anything due (missed or re-check) comes first, oldest first.
    const due = sched.items.filter(it => it.dueAt !== null && it.dueAt <= sched.qIndex && it.key !== sched.lastKey)
        .sort((a, b) => a.dueAt - b.dueAt);
    if (due.length) return due[0];

    // 2. Pick grammar vs word by band, falling back if one kind is empty.
    const plan = BAND_PLAN[gameState.band] || BAND_PLAN.elementary;
    const ofKind = k => sched.items.filter(it => it.kind === k);
    let kind = Math.random() < plan.grammarShare ? 'grammar' : 'word';
    if (ofKind(kind).length === 0) kind = kind === 'word' ? 'grammar' : 'word';
    const pool = ofKind(kind);
    const fresh = pool.filter(it => it.isNew);
    const review = pool.filter(it => !it.isNew);

    // 3. New items vs review.
    const useReview = review.length > 0 && (fresh.length === 0 || Math.random() < REVIEW_SHARE);
    let choices = useReview ? review : fresh;
    if (choices.length > 1) choices = choices.filter(it => it.key !== sched.lastKey);
    const P = window.WGD_PROGRESS;
    return weightedPick(choices, it => {
        let w = 1 / (1 + 2 * it.correct);                       // practised less → more likely
        if (!it.isNew && !P.isItemMastered(gameState.band, gameState.themeId, it.key)) w *= 3;
        return w;
    });
}

// Update the schedule after an answer.
function scheduleAfterAnswer(sched, item, correct) {
    if (correct) {
        item.correct++;
        item.misses = 0;
        item.dueAt = (item.isNew && item.correct === 1) ? sched.qIndex + RECHECK_GAP : null;
    } else {
        // Each further miss in a row pushes the item a little further back
        // (3, 5, 7 questions), so one hard word can't crowd out the rest.
        item.correct = 0;
        item.misses = (item.misses || 0) + 1;
        item.dueAt = sched.qIndex + Math.min(MISSED_GAP + 2 * (item.misses - 1), 7);
    }
}

// ==================== QUESTION GENERATION ====================
function generateQuestion() {
    const sched = gameState.sched;
    sched.qIndex++;
    const item = pickItem(sched);
    sched.lastKey = item.key;
    const q = item.kind === 'grammar' ? grammarQuestion(item.data) : wordQuestion(item.data, chooseWordType(item.data));
    q.item = item;
    return q;
}

// Letters that are easy to mix up, so a wrong spelling option is a real
// choice rather than an obviously random letter.
const CONFUSABLE = {
    a: 'eou', e: 'aiy', i: 'eay', o: 'aeu', u: 'oai', y: 'ie',
    b: 'dp', d: 'bt', p: 'bq', q: 'pg', c: 'ks', k: 'cg', s: 'cz', z: 'sx',
    m: 'nw', n: 'mh', f: 'vph', v: 'wf', w: 'vu', g: 'jq', j: 'gy', l: 'ri',
    r: 'lw', t: 'df', h: 'nk', x: 'ks',
};

function isPlainWord(word) { return /^[a-z]+$/.test(word); }

// Which question to ask about a word. Build-the-word needs a short, plain
// lowercase word; spelling needs at least one plain lowercase letter.
function chooseWordType(w) {
    const r = Math.random();
    const canBuild = isPlainWord(w.word) && w.word.length >= 3 && w.word.length <= 9;
    const canSpell = /[a-z]/.test(w.word);
    let type;
    if (gameState.band === 'elementary') type = r < 0.5 ? 'vocab' : r < 0.75 ? 'spelling' : 'build';
    else if (gameState.band === 'junior') type = r < 0.35 ? 'vocab' : r < 0.65 ? 'spelling' : 'build';
    else type = r < 0.3 ? 'vocab' : r < 0.6 ? 'spelling' : 'build';
    if (type === 'build' && !canBuild) type = canSpell ? 'spelling' : 'vocab';
    if (type === 'spelling' && !canSpell) type = 'vocab';
    return type;
}

function wordQuestion(w, type) {
    const t = currentTheme;
    if (type === 'vocab') {
        const wrongs = shuffle(t.words.filter(x => x.word !== w.word && x.emoji !== w.emoji)).slice(0, 2).map(x => x.word);
        return { type: 'vocab', image: w.emoji, prompt: 'What is this?', hint: w.hint, answer: w.word, options: shuffle([w.word, ...wrongs]), speakText: w.word };
    }

    if (type === 'build') {
        // Tap the letter tiles in order to build the whole word.
        return { type: 'build', image: w.emoji, prompt: 'Build the word!', hint: w.hint, answer: w.word, tiles: shuffle([...w.word]), speakText: w.word };
    }

    // Spelling: blank one plain lowercase letter. A capital (Monday), space
    // (pencil case), hyphen (in-laws) or accent (résumé) would be unanswerable
    // or stand out next to the a-z wrong options.
    const slots = [...w.word].map((c, i) => /[a-z]/.test(c) ? i : -1).filter(i => i >= 0);
    const idx = slots[Math.floor(Math.random() * slots.length)];
    const correctLetter = w.word[idx];
    const blanked = w.word.slice(0, idx) + '_' + w.word.slice(idx + 1);
    const wrongs = [];
    for (const l of shuffle([...(CONFUSABLE[correctLetter] || '')])) {
        if (wrongs.length < 2 && l !== correctLetter) wrongs.push(l);
    }
    while (wrongs.length < 2) {
        const l = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
        if (l !== correctLetter && !wrongs.includes(l)) wrongs.push(l);
    }
    return { type: 'spelling', image: w.emoji, prompt: blanked, hint: w.hint, answer: correctLetter, options: shuffle([correctLetter, ...wrongs]), speakText: w.word };
}

function grammarQuestion(g) {
    return { type: 'grammar', image: '', prompt: g.sentence, hint: g.hint, answer: g.answer, options: shuffle([...g.options]), speakText: g.sentence.replace('___', g.answer) };
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ==================== QUESTION UI ====================
function showQuestion() {
    if (gameState.questionActive) return;
    gameState.questionActive = true;

    const q = generateQuestion();
    gameState.currentQuestion = q;

    // Teach a brand-new item before quizzing it: a teach card with the answer
    // revealed, then the quiz on the same item. Items met in an earlier game,
    // and easy review content from the band below, skip the card.
    const it = q.item;
    const P = window.WGD_PROGRESS;
    if (!it.warm && !gameState.taught.has(it.key) && !P.hasSeenItem(gameState.band, gameState.themeId, it.key)) {
        gameState.taught.add(it.key);
        showTeachCard(q);
        return;
    }

    renderQuestion(q);
}

function setPanelLabel(text) {
    document.querySelector('#question-panel .teach-label').textContent = text;
}

// Render the answerable question (options + tap handlers). Split out so the
// teach card can hand off to it after the learner taps "Got it".
function renderQuestion(q) {
    const panel = document.getElementById('question-panel');
    panel.classList.remove('teach-mode');

    document.getElementById('q-image').textContent = q.image;
    document.getElementById('q-prompt').textContent = q.prompt;
    document.getElementById('q-hint').textContent = q.hint ? `💡 ${q.hint}` : '';

    const optDiv = document.getElementById('q-options');
    if (q.type === 'build') {
        q.built = [];
        renderBuild(q);
    } else {
        // Buttons pass the option's index, not its text: an option like "don't"
        // would otherwise close the quoted string and break the inline handler.
        optDiv.innerHTML = q.options.map((o, i) => `<button class="q-btn" onclick="answerOption(${i})">${escapeHtml(o)}</button>`).join('');
    }

    panel.classList.add('active');
    updateAskBtn();

    // Build-the-word is a listen-and-spell task, so say the word.
    if (q.type === 'vocab' || q.type === 'build') speakWord(q.answer);
}

// Build-the-word: slots show the letters placed so far; tiles are tapped in
// order; ⌫ takes the last letter back. The answer is checked once every tile
// is placed.
function renderBuild(q) {
    const slots = [...q.answer].map((_, i) => {
        const tileIdx = q.built[i];
        return `<span class="build-slot">${tileIdx === undefined ? '' : escapeHtml(q.tiles[tileIdx])}</span>`;
    }).join('');
    document.getElementById('q-prompt').innerHTML = `<div class="build-slots">${slots}</div>`;
    const tiles = q.tiles.map((l, i) =>
        `<button class="q-btn build-tile" ${q.built.includes(i) ? 'disabled' : ''} onclick="tapTile(${i})">${escapeHtml(l)}</button>`).join('');
    document.getElementById('q-options').innerHTML = tiles +
        `<button class="q-btn build-tile build-undo" ${q.built.length ? '' : 'disabled'} onclick="undoTile()" aria-label="Undo">⌫</button>`;
}

function tapTile(i) {
    const q = gameState.currentQuestion;
    if (!q || q.type !== 'build' || !gameState.questionActive || q.answered || q.built.includes(i)) return;
    q.built.push(i);
    renderBuild(q);
    if (q.built.length === q.tiles.length) answerQuestion(q.built.map(k => q.tiles[k]).join(''));
}

function undoTile() {
    const q = gameState.currentQuestion;
    if (!q || q.type !== 'build' || q.answered || !q.built.length) return;
    q.built.pop();
    renderBuild(q);
}

// Teaching card: reveals the answer with audio, then a single "Got it" button
// leads into the actual question for the same item.
function showTeachCard(q) {
    const panel = document.getElementById('question-panel');
    panel.classList.add('teach-mode');
    setPanelLabel('📘 Learn this!');

    document.getElementById('q-image').textContent = q.image || '📘';
    document.getElementById('q-prompt').textContent = fullAnswerText(q);
    document.getElementById('q-hint').textContent = q.hint ? `💡 ${q.hint}` : '';
    document.getElementById('q-options').innerHTML =
        `<button class="q-btn teach-got-it" onclick="dismissTeach()">我會了 Got it! 👍</button>`;

    panel.classList.add('active');
    updateAskBtn();
    speakWord(q.speakText);
}

// The complete correct form: the word itself, or the sentence with the gap
// filled in.
function fullAnswerText(q) {
    return q.type === 'grammar' ? q.prompt.replace('___', q.answer) : q.speakText;
}

function dismissTeach() {
    renderQuestion(gameState.currentQuestion);
}

// Manual question request — lets the player earn extra sun on demand.
// No-op while a question is already up; resets the auto-question timer
// so the next automatic question is paced from this one.
function requestManualQuestion() {
    if (!gameState.isPlaying) return;
    if (gameState.questionActive) return;
    showQuestion();
}

function updateAskBtn() {
    const btn = document.getElementById('ask-btn');
    if (!btn) return;
    btn.classList.toggle('disabled', !gameState.isPlaying || gameState.questionActive);
    const label = btn.querySelector('.ask-btn-label');
    if (!label) return;
    if (gameState.wave >= UPGRADE_FROM_WAVE) {
        const n = gameState.upgradesPending || 0;
        label.textContent = n > 0 ? `⬆️ x${n}` : '⬆️ Upgrade';
    } else {
        label.textContent = '+50 ☀️';
    }
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function answerOption(i) {
    const q = gameState.currentQuestion;
    if (q && q.options) answerQuestion(q.options[i]);
}

function answerQuestion(selected) {
    if (!gameState.questionActive) return;
    const q = gameState.currentQuestion;
    if (!q || q.answered) return;
    q.answered = true;
    const isCorrect = selected === q.answer;
    gameState.questionsAnswered++;

    if (q.type === 'build') {
        document.querySelectorAll('.build-slots').forEach(el => el.classList.add(isCorrect ? 'correct' : 'wrong'));
        document.querySelectorAll('.build-tile').forEach(btn => { btn.disabled = true; });
    } else {
        document.querySelectorAll('.q-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.textContent === q.answer) btn.classList.add('correct');
            else if (btn.textContent === selected && !isCorrect) btn.classList.add('wrong');
        });
    }

    // Spaced-retrieval bookkeeping: this game's schedule, plus the learner's
    // long-term memory of the item (learned after right answers in 2 games).
    scheduleAfterAnswer(gameState.sched, q.item, isCorrect);
    const P = window.WGD_PROGRESS;
    const { learnedNow } = P.recordAnswer(gameState.band, gameState.themeId, q.item.key, isCorrect, gameState.runId);
    if (isCorrect) { gameState.rightThisGame.add(q.item.key); gameState.learnGoal.delete(q.item.key); }

    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += 10;
        if (gameState.finalQuiz) {
            // No zombies left, so sun or upgrades would be useless here.
            playSound('correct');
            showFeedback(learnedNow ? '🎓 Learned!' : '✅');
        } else if (gameState.wave >= UPGRADE_FROM_WAVE) {
            gameState.upgradesPending++;
            playSound('correct');
            showFeedback(learnedNow ? '🎓 Learned! ⬆️' : '⬆️ Tap a plant to upgrade!');
        } else {
            gameState.sun += 50;
            playSound('correct');
            showFeedback(learnedNow ? '🎓 Learned! +50 ☀️' : '✅ +50 ☀️');
        }
        speakWord(q.speakText);
        updateHUD();
        updatePlantCards();
        setTimeout(() => { if (gameState.currentQuestion === q) closeQuestion(); }, 1000);
    } else {
        playSound('wrong');
        updateHUD();
        // Explain instead of flashing the answer: after a moment to see which
        // option was right, show the full correct form, its meaning, and say
        // it aloud. The battlefield stays frozen until the learner taps OK.
        setTimeout(() => showExplainCard(q, selected), 700);
    }
}

function showExplainCard(q, selected) {
    if (!gameState.isPlaying || gameState.currentQuestion !== q) return;
    const panel = document.getElementById('question-panel');
    panel.classList.add('teach-mode', 'explain-mode');
    setPanelLabel("💪 Let's learn it!");
    document.getElementById('q-image').textContent = q.image || '📘';
    document.getElementById('q-prompt').textContent = fullAnswerText(q);
    document.getElementById('q-hint').textContent = q.hint ? `💡 ${q.hint}` : '';
    const yours = q.type === 'grammar' ? q.prompt.replace('___', selected)
        : q.type === 'spelling' ? q.prompt.replace('_', selected) : selected;
    document.getElementById('q-options').innerHTML =
        `<div class="explain-yours">❌ ${escapeHtml(yours)}</div>` +
        `<button class="q-btn teach-got-it" onclick="closeQuestion()">OK 👍</button>`;
    speakWord(q.speakText);
}

function closeQuestion() {
    if (!gameState.questionActive) return;
    const panel = document.getElementById('question-panel');
    panel.classList.remove('active', 'teach-mode', 'explain-mode');
    gameState.questionActive = false;
    gameState.nextQuestionAt = performance.now() + (gameState.finalQuiz ? 600 : QUESTION_INTERVAL_MS);
    gameState.triggerZombie = null;
    updateAskBtn();
}

function showFeedback(text) {
    const el = document.getElementById('feedback');
    el.textContent = text;
    el.style.display = 'block';
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'feedbackPop 1s forwards';
    setTimeout(() => el.style.display = 'none', 1000);
}

// ==================== HUD ====================
function updateHUD() {
    document.getElementById('hud-sun').textContent = gameState.sun;
    document.getElementById('hud-score').textContent = gameState.score;
    document.getElementById('hud-wave').textContent = gameState.wave;
    const learn = document.getElementById('hud-learn');
    if (learn) {
        const total = gameState.learnGoalTotal || 0;
        learn.parentElement.style.display = total ? '' : 'none';
        learn.textContent = `${total - (gameState.learnGoal ? gameState.learnGoal.size : 0)}/${total}`;
    }
    document.getElementById('hud-total-waves').textContent = gameState.totalWaves;
    document.getElementById('hud-lives').innerHTML = '❤️'.repeat(Math.max(0, gameState.lives)) + '🖤'.repeat(Math.max(0, 3 - gameState.lives));
    updateAskBtn();
}

// ==================== GAME LOOP ====================
function setLevel(level) {
    if (!['elementary', 'junior', 'senior'].includes(level)) return;
    selectedLevel = level;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.level === level);
    });
}

function selectTheme(id) {
    initAudio();
    // Every band uses the staged, unlockable level flow — pick a level first.
    showLevelSelect(id);
}

// ==================== LEVEL SELECT ====================
let pendingThemeId = null; // theme awaiting a level choice

function showLevelSelect(themeId) {
    stopGame();
    pendingThemeId = themeId;
    // currentTheme drives question generation + the words-learned total, so set
    // it to the band-filtered theme here too.
    currentTheme = window.QUESTION_BANK.forLevel(selectedLevel).find(t => t.id === themeId);
    // Reveal the screen BEFORE filling the bars: a width transition only plays
    // when the element is visible, so the order has to be show-then-fill.
    showScreen('level-screen');
    renderLevelSelect();
}

// Animate a progress-fill bar from 0 to `pct`. Resetting to 0 and forcing a
// reflow before setting the target gives the CSS width transition a start frame
// to animate from, so the bar visibly grows on each (re)render.
function animateFill(el, pct) {
    el.style.width = '0%';
    void el.offsetWidth; // force reflow so the next change is a transition
    el.style.width = pct + '%';
}

// Per-band subtitle under the theme title on the level-select screen.
const BAND_LABELS = {
    elementary: '國小 Elementary',
    junior: '國中 Junior High',
    senior: '高中 Senior High',
};

function renderLevelSelect() {
    const P = window.WGD_PROGRESS;
    const band = selectedLevel;
    const themeId = pendingThemeId;
    document.getElementById('level-theme-title').textContent =
        `${currentTheme.emoji} ${currentTheme.name} · ${BAND_LABELS[band] || ''}`;

    const total = currentTheme.words.length;          // words available in this band
    const mastered = P.wordsMasteredCount(band, themeId);
    document.getElementById('level-progress-label').textContent = `Words learned: ${mastered} / ${total} (right in ${P.MASTERY_RUNS} games)`;
    animateFill(document.getElementById('level-progress-fill'), total ? Math.round(mastered / total * 100) : 0);

    // Parallel grammar meter — distinct sentence patterns answered correctly.
    const gTotal = currentTheme.grammar.length;       // patterns available in this band
    const gMastered = P.grammarMasteredCount(band, themeId);
    document.getElementById('level-grammar-label').textContent = `Patterns learned: ${gMastered} / ${gTotal}`;
    animateFill(document.getElementById('level-grammar-fill'), gTotal ? Math.round(gMastered / gTotal * 100) : 0);

    document.getElementById('level-grid').innerHTML = levelsFor(band).map(lv => {
        const unlocked = P.isLevelUnlocked(band, themeId, lv.id);
        const info = P.levelInfo(band, themeId, lv.id);
        const stars = info ? info.stars : 0;
        const starStr = info ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '';
        return `<div class="level-card ${unlocked ? '' : 'locked'}" ${unlocked ? `onclick="playLevel(${lv.id})"` : ''}>
            ${unlocked ? '' : '<span class="lock-icon">🔒</span>'}
            <span class="level-emoji">${lv.emoji}</span>
            <div class="level-name">Level ${lv.id}</div>
            <div class="level-sub">${lv.name}</div>
            <div class="level-teaches">${lv.isReview ? 'Mix of everything' : `${lv.newWords.length} words · ${lv.newGrammar.length} patterns`}</div>
            <div class="level-stars">${starStr}</div>
        </div>`;
    }).join('');
}

function playLevel(levelId) {
    if (!window.WGD_PROGRESS.isLevelUnlocked(selectedLevel, pendingThemeId, levelId)) return;
    startGame(levelsFor(selectedLevel).find(l => l.id === levelId));
}

function startGame(levelDef) {
    showScreen('');
    canvas.style.display = 'block';

    // Every band runs a short per-stage session driven by the chosen level.
    // Elementary uses gentler zombie tuning; junior/senior use the tougher
    // default. Wave count comes from the level definition.
    const tune = tuningFor(selectedLevel);
    gameState = {
        sun: 100, score: 0, lives: 3, wave: 1, totalWaves: levelDef.waves,
        zombies: [], plants: [], projectiles: [], sunTokens: [], explosions: [],
        trollers: [],
        upgradesPending: 0,
        isPlaying: true, questionActive: false, currentQuestion: null,
        questionsAnswered: 0, correctAnswers: 0,
        zombiesPerWave: tune.zombiesPerWave, zombieSpeed: tune.zombieSpeed,
        spawnTimer: 0, spawnInterval: tune.spawnInterval, waveZombiesSpawned: 0,
        animFrame: null, nextQuestionAt: performance.now() + QUESTION_INTERVAL_MS,
        triggerZombie: null,
        selectedPlant: null,
        shovelMode: false,
        sunTokenTimer: 0,
        damageCooldown: 0,
        // Level content, in-game teaching, and progress tracking.
        // `taught` holds item keys already shown on a teach card this game;
        // `runId` identifies this game for the learned-in-2-games rule.
        band: selectedLevel,
        levelDef,
        themeId: pendingThemeId,
        tuning: tune,
        taught: new Set(),
        rightThisGame: new Set(),
        runId: Date.now(),
    };
    gameState.sched = makeSchedule(levelDef);
    // Learning goal: every new item of the level answered right once.
    gameState.learnGoal = new Set(gameState.sched.items.filter(it => it.isNew).map(it => it.key));
    gameState.learnGoalTotal = gameState.learnGoal.size;
    gameState.finalQuiz = false;

    document.getElementById('hud').classList.add('active');
    document.getElementById('plant-cards').classList.add('active');
    renderPlantCards();
    updateAskBtn();
    updateHUD();
    resizeCanvas();
    initTrollers();
    showFeedback(`${levelDef.emoji} Level ${levelDef.id}: ${levelDef.name}`);
    gameLoop();
}

function stopGame() {
    gameState.isPlaying = false;
    if (gameState.animFrame) cancelAnimationFrame(gameState.animFrame);
    document.getElementById('hud').classList.remove('active');
    document.getElementById('plant-cards').classList.remove('active');
    document.getElementById('question-panel').classList.remove('active');
    canvas.classList.remove('plant-mode');
    canvas.style.display = 'none';
}

// All gameplay tuning (speeds, timers, fuses) is in "ticks" of 1/60 s. The
// loop runs update() a whole number of ticks per real elapsed time, so the
// game plays at the same speed on 60 Hz, 120 Hz and 144 Hz screens. Drawing
// still happens once per screen refresh.
const TICK_MS = 1000 / 60;
const MAX_TICKS_PER_FRAME = 5; // after a stall (e.g. tab hidden), don't fast-forward

function gameLoop(now) {
    if (!gameState.isPlaying) return;
    if (now === undefined) now = performance.now();
    if (gameState.lastFrameTime === undefined) gameState.lastFrameTime = now - TICK_MS;
    gameState.tickAccumulator = (gameState.tickAccumulator || 0) + (now - gameState.lastFrameTime);
    gameState.lastFrameTime = now;
    let ticks = 0;
    while (gameState.tickAccumulator >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) {
        update();
        gameState.tickAccumulator -= TICK_MS;
        ticks++;
        if (!gameState.isPlaying) return; // level ended inside this tick
    }
    if (ticks === MAX_TICKS_PER_FRAME) gameState.tickAccumulator = 0;
    draw();
    gameState.animFrame = requestAnimationFrame(gameLoop);
}

function update() {
    const gs = gameState;

    // Spawn zombies — paused during a question along with the rest of the
    // battlefield, otherwise they stack up off-screen and arrive as a clump.
    if (!gs.questionActive) gs.spawnTimer++;
    if (!gs.questionActive && gs.spawnTimer >= gs.spawnInterval && gs.waveZombiesSpawned < gs.zombiesPerWave) {
        spawnZombie();
        gs.waveZombiesSpawned++;
        gs.spawnTimer = 0;
    }

    // Question pacing: strict 15s gap, gated by wall-clock time. Schedule the
    // NEXT question only once dismissal completes (see answerQuestion), so two
    // questions can never appear within 15s of each other regardless of fps.
    if (!gs.finalQuiz && !gs.questionActive && performance.now() >= gs.nextQuestionAt) {
        gs.nextQuestionAt = Infinity; // disarm until dismissal reschedules
        showQuestion();
    }

    if (gs.damageCooldown > 0) gs.damageCooldown--;

    // Periodic sky sun (every ~10s of play; paused during a question)
    if (!gs.questionActive) gs.sunTokenTimer++;
    if (gs.sunTokenTimer > 600) {
        spawnSkySun();
        gs.sunTokenTimer = 0;
    }

    // Move zombies (or eat plant in path). Frozen while a question is up so
    // the player can answer without losing ground.
    if (!gs.questionActive) gs.zombies.forEach(z => {
        if (z.dead) return;
        // A chomper has clamped this zombie mid-snap — freeze it so the bite
        // visibly catches its target instead of the zombie walking away.
        if (z.beingEaten) return;
        z.walkFrame = (z.walkFrame || 0) + 0.05;

        // Plant directly in front of zombie? A rolling wallnut isn't a blocker
        // — it plows through, so zombies don't pause to chew on it.
        const blocker = gs.plants.find(p => p.lane === z.lane && !(p.type === 'wallnut' && p.rolling) && p.x < z.x + 6 && p.x > z.x - 26);
        if (blocker) {
            z.eating = true;
            z.eatTimer = (z.eatTimer || 0) + 1;
            if (z.eatTimer >= 30) {
                blocker.hp--;
                z.eatTimer = 0;
                if (blocker.hp <= 0) {
                    // A chomper eaten mid-bite must let go of its targets,
                    // or they stay frozen in place forever.
                    (blocker.chompTargets || []).forEach(t => { t.beingEaten = false; });
                    gs.plants = gs.plants.filter(p => p !== blocker);
                }
            }
        } else {
            z.eating = false;
            z.eatTimer = 0;
            z.x -= gs.zombieSpeed;
        }

        // Zombie reached the left edge. Cooldown prevents a clump of zombies
        // from draining every heart in a single frame — at most one heart per ~1.5s.
        if (z.x < 30) {
            z.dead = true;
            if (gs.damageCooldown <= 0) {
                gs.lives--;
                gs.damageCooldown = 90;
                updateHUD();
                playSound('wrong');
                if (gs.lives <= 0) endGame();
            }
        }
    });

    // Plants — also frozen during a question so the battlefield is fully paused.
    if (!gs.questionActive) gs.plants.forEach(p => {
        p.shootTimer++;
        p.plantAnim += 0.08;
        if (p.type === 'peashooter' && p.shootTimer > 45) {
            const hasTarget = gs.zombies.some(z => !z.dead && z.lane === p.lane && z.x > p.x);
            if (hasTarget) {
                // Upgraded peashooter fires two peas per shot (offset on Y) for
                // 2x DPS. shotsLeft still decrements once, so total ammo lifespan
                // is unchanged — just the damage delivered in that lifespan doubles.
                if (p.upgraded) {
                    gs.projectiles.push({ x: p.x + 30, y: p.y - 5, lane: p.lane, speed: 8 });
                    gs.projectiles.push({ x: p.x + 30, y: p.y + 5, lane: p.lane, speed: 8 });
                } else {
                    gs.projectiles.push({ x: p.x + 30, y: p.y, lane: p.lane, speed: 8 });
                }
                p.shootTimer = 0;
                p.shotsLeft--;
                playSound('shoot');
                if (p.shotsLeft <= 0) p.spent = true;
            }
        }
        // Sunflower drops a collectible sun token every ~5s. Upgraded variant
        // drops two tokens per cycle; production interval stays the same.
        if (p.type === 'sunflower' && p.shootTimer > 300) {
            spawnSunflowerSun(p);
            if (p.upgraded) spawnSunflowerSun(p);
            p.shootTimer = 0;
        }
        // Cherry fuse — explode when timer hits zero, then mark for removal
        if (p.type === 'cherry' && !p.exploded) {
            p.fuse--;
            if (p.fuse <= 0) {
                explodeCherry(p);
                p.exploded = true;
            }
        }
        // Squash — leap onto nearest zombie in same lane (either direction).
        // Final-defense plant: idle until a zombie comes close, then jumps,
        // squashes on land, single-use.
        if (p.type === 'pumpkin') updatePumpkin(p, gs);
        // Chomper: scan for a zombie just ahead in the same lane, snap to bite
        // it, then chew. The chew gap is the vulnerability window during which
        // the chomper holds the line as a temporary block but can't bite.
        if (p.type === 'chomper') updateChomper(p, gs);
        // Wallnut: auto-launch a roll once it's been chewed down past the HP
        // threshold (forward into the horde — zombies attack from the right),
        // then plow through up to 3 zombies. Manual tap-to-roll still applies
        // earlier in handleCanvasTap.
        if (p.type === 'wallnut') {
            if (!p.rolling && p.hp <= p.maxHp * WALLNUT_AUTO_ROLL_HP_RATIO) {
                p.rolling = true;
                // Always roll forward (right): the zombie chewing the nut is
                // on that side. Zombies that already slipped past are left to
                // the lawn trolley.
                p.rollDir = 1;
                p.rollKills = 0;
                p.rollHits = new Set();
                playSound('plant');
            }
            if (p.rolling) updateWallnutRoll(p, gs);
        }
    });
    gs.plants = gs.plants.filter(p => !p.exploded && !p.spent);

    // Lawn trolleys — auto-fire safety net for breached lanes. Paused with
    // the rest of the battlefield while a question is up.
    if (!gs.questionActive) updateTrollers(gs);

    // Tick explosion animations
    gs.explosions.forEach(e => e.age++);
    gs.explosions = gs.explosions.filter(e => e.age < 25);

    // Update falling sun tokens. Their 10s lifetime doesn't count down while a
    // question is up, so a child answering never loses sun they had earned.
    if (!gs.questionActive) gs.sunTokens.forEach(s => {
        if (s.y < s.targetY) s.y += s.fallSpeed;
        s.age++;
    });
    gs.sunTokens = gs.sunTokens.filter(s => s.age < 600); // 10s before disappearing

    // Move projectiles and resolve hits (paused during a question). Each pea
    // damages only the single closest zombie it touches, then disappears.
    if (!gs.questionActive) {
        gs.projectiles.forEach(proj => {
            proj.x += proj.speed;
        });

        gs.projectiles = gs.projectiles.filter(proj => {
            let target = null, best = 25;
            for (const z of gs.zombies) {
                if (z.dead || z.lane !== proj.lane) continue;
                const d = Math.abs(z.x - proj.x);
                if (d < best) { best = d; target = z; }
            }
            if (target) {
                target.hp--;
                if (target.hp <= 0) {
                    target.dead = true;
                    gs.score += 5;
                    playSound('zombieDie');
                    updateHUD();
                }
                return false;
            }
            return proj.x < W + 20;
        });
    }

    // Clean dead zombies (nothing draws or targets them once dead)
    gs.zombies = gs.zombies.filter(z => !z.dead);

    // Wave complete check
    if (gs.waveZombiesSpawned >= gs.zombiesPerWave && gs.zombies.filter(z => !z.dead).length === 0) {
        const tune = gs.tuning;
        if (gs.wave < gs.totalWaves) {
            gs.wave++;
            gs.waveZombiesSpawned = 0;
            gs.zombiesPerWave += tune.dZombies;
            gs.zombieSpeed += tune.dSpeed;
            gs.spawnInterval = Math.max(tune.minInterval, gs.spawnInterval - tune.dInterval);
            updateHUD();
            showFeedback(`🌊 Wave ${gs.wave}!`);
        } else if (gs.learnGoal.size === 0) {
            finishLevel();
        } else if (!gs.finalQuiz) {
            // Waves are done but some new items haven't been answered right
            // yet: no more zombies, just a short quiz on what's left.
            gs.finalQuiz = true;
            gs.nextQuestionAt = performance.now() + 1500;
            showFeedback('📘 Finish learning!');
        }
    }

    // Final quiz: questions back to back until every new item is learned once.
    if (gs.finalQuiz && !gs.questionActive) {
        if (gs.learnGoal.size === 0) finishLevel();
        else if (performance.now() >= gs.nextQuestionAt) { gs.nextQuestionAt = Infinity; showQuestion(); }
    }
}

function updatePumpkin(p, gs) {
    if (p.squashState === 'idle') {
        // Pick the closest zombie in the same lane within trigger range,
        // searching both directions so the squash works as a final defense
        // even after a zombie has already passed it on the left.
        const range = CELL_W * PUMPKIN_TRIGGER_CELLS;
        let target = null;
        let best = Infinity;
        for (const z of gs.zombies) {
            if (z.dead || z.lane !== p.lane) continue;
            const d = Math.abs(z.x - p.x);
            if (d <= range && d < best) {
                best = d;
                target = z;
            }
        }
        if (target) {
            p.squashState = 'leap';
            p.leapAge = 0;
            p.leapStartX = p.x;
            p.leapTargetX = target.x;
            // Upgraded squash bounces a second time onto another zombie.
            p.bouncesLeft = p.upgraded ? 2 : 1;
        }
    } else if (p.squashState === 'leap') {
        p.leapAge++;
        if (p.leapAge >= PUMPKIN_LEAP_FRAMES) {
            // Land — squash zombies inside the kill zone at the landing spot.
            for (const z of gs.zombies) {
                if (z.dead || z.lane !== p.lane) continue;
                if (Math.abs(z.x - p.leapTargetX) <= PUMPKIN_SQUASH_RADIUS) {
                    z.dead = true;
                    gs.score += 5;
                }
            }
            playSound('zombieDie');
            updateHUD();
            p.bouncesLeft--;

            if (p.bouncesLeft > 0) {
                // Find the closest remaining zombie in the lane and bounce
                // toward it. No range limit — the second bounce reaches across
                // the whole lane so the upgrade reliably claims a second kill.
                let next = null;
                let best = Infinity;
                for (const z of gs.zombies) {
                    if (z.dead || z.lane !== p.lane) continue;
                    const d = Math.abs(z.x - p.leapTargetX);
                    if (d < best) {
                        best = d;
                        next = z;
                    }
                }
                if (next) {
                    p.leapStartX = p.leapTargetX;
                    p.leapTargetX = next.x;
                    p.leapAge = 0;
                    return;
                }
            }
            p.spent = true;
        }
    }
}

function updateChomper(p, gs) {
    if (p.chompState === 'idle') {
        const range = CELL_W * CHOMPER_BITE_RANGE_CELLS;
        // Forward bites only — zombies that have already passed us aren't
        // candidates (the chomper faces right toward the spawn side).
        const candidates = [];
        for (const z of gs.zombies) {
            if (z.dead || z.beingEaten || z.lane !== p.lane) continue;
            const dx = z.x - p.x;
            if (dx >= 0 && dx <= range) candidates.push({ z, dx });
        }
        candidates.sort((a, b) => a.dx - b.dx);
        // Upgraded chomper grabs the two closest at once; otherwise just one.
        const biteCount = p.upgraded ? 2 : 1;
        const targets = candidates.slice(0, biteCount).map(c => c.z);
        if (targets.length > 0) {
            p.chompState = 'biting';
            p.chompTimer = 0;
            p.chompTargets = targets;
            targets.forEach(z => { z.beingEaten = true; });
        }
    } else if (p.chompState === 'biting') {
        p.chompTimer++;
        if (p.chompTimer >= CHOMPER_BITE_FRAMES) {
            (p.chompTargets || []).forEach(z => {
                if (!z.dead) {
                    z.dead = true;
                    z.beingEaten = false;
                    gs.score += 5;
                }
            });
            playSound('zombieDie');
            updateHUD();
            p.chompTargets = null;
            p.chompState = 'chewing';
            p.chompTimer = 0;
        }
    } else if (p.chompState === 'chewing') {
        p.chompTimer++;
        if (p.chompTimer >= CHOMPER_CHEW_FRAMES) {
            p.chompState = 'idle';
            p.chompTimer = 0;
        }
    }
}

function initTrollers() {
    gameState.trollers = [0, 1, 2].map(lane => ({
        lane,
        x: LAWN_LEFT - 28,
        y: 0,                  // computed during draw from current LANE_H
        fired: false,
        alive: true,
        wheelRot: 0,
    }));
}

function updateTrollers(gs) {
    const triggerX = LAWN_LEFT + TROLLER_TRIGGER_X_BUFFER;
    gs.trollers.forEach(tr => {
        if (!tr.alive) return;
        if (!tr.fired) {
            // Fire when a zombie has reached the gate area on this lane and
            // there's nothing alive between it and the gate to stop it. The
            // forward-plant check is what makes this a "no defenders" trigger
            // rather than a blanket lawnmower — if a wallnut is still standing
            // ahead of the zombie, give that defender a chance.
            for (const z of gs.zombies) {
                if (z.dead || z.lane !== tr.lane) continue;
                if (z.x > triggerX) continue;
                const blocking = gs.plants.some(p => p.lane === tr.lane && p.x < z.x);
                if (!blocking) {
                    tr.fired = true;
                    playSound('shoot');
                    break;
                }
            }
            return;
        }
        // Fired: roll right, crash through every zombie in the lane
        tr.x += TROLLER_SPEED;
        tr.wheelRot += TROLLER_SPEED / 7;
        for (const z of gs.zombies) {
            if (z.dead || z.lane !== tr.lane) continue;
            if (Math.abs(z.x - tr.x) < TROLLER_KILL_RADIUS) {
                z.dead = true;
                z.beingEaten = false;
                gs.score += 5;
                playSound('zombieDie');
                updateHUD();
            }
        }
        if (tr.x > W + 40) tr.alive = false;
    });
}

function updateWallnutRoll(p, gs) {
    p.x += WALLNUT_ROLL_SPEED * p.rollDir;
    // Rotate proportional to travel — 2*PI per ~circumference (~110px) gives a
    // believable rolling cadence for an 18x22 nut.
    p.rollAngle += p.rollDir * (WALLNUT_ROLL_SPEED / 18);

    for (const z of gs.zombies) {
        if (z.dead || z.lane !== p.lane) continue;
        if (p.rollHits.has(z)) continue;
        if (Math.abs(z.x - p.x) <= WALLNUT_ROLL_HIT_RADIUS) {
            z.dead = true;
            p.rollHits.add(z);
            p.rollKills++;
            gs.score += 5;
            playSound('zombieDie');
            updateHUD();
            const maxKills = p.upgraded ? WALLNUT_ROLL_MAX_KILLS * 2 : WALLNUT_ROLL_MAX_KILLS;
            if (p.rollKills >= maxKills) {
                p.spent = true;
                return;
            }
        }
    }

    if (p.x < -30 || p.x > W + 30) p.spent = true;
}

function explodeCherry(plant) {
    // Upgraded cherry doubles its blast radius — fuse length unchanged.
    const r = plant.upgraded ? CHERRY_BLAST_RADIUS * 2 : CHERRY_BLAST_RADIUS;
    gameState.explosions.push({ x: plant.x, y: plant.y, age: 0, radius: r });
    gameState.zombies.forEach(z => {
        if (z.dead) return;
        const dx = z.x - plant.x;
        const dy = z.y - plant.y;
        if (dx * dx + dy * dy <= r * r) {
            z.dead = true;
            gameState.score += 5;
        }
    });
    playSound('zombieDie');
    updateHUD();
}

function spawnSkySun() {
    const x = LAWN_LEFT + Math.random() * (W - LAWN_LEFT - 60);
    const targetY = GROUND_Y + 30 + Math.random() * (H - GROUND_Y - 100);
    gameState.sunTokens.push({
        x, y: -30, targetY,
        fallSpeed: 1.2,
        value: 25,
        age: 0,
    });
}

function spawnSunflowerSun(plant) {
    const x = plant.x + (Math.random() * 40 - 20);
    const y = plant.y - 20;
    gameState.sunTokens.push({
        x, y, targetY: y + 10,
        fallSpeed: 0.5,
        value: 25,
        age: 0,
    });
}

function spawnZombie() {
    const lane = Math.floor(Math.random() * 3);
    // Difficulty tiers up every 3 waves: waves 1-3 = tier 0, 4-6 = tier 1, 7-9 = tier 2...
    // Normal zombie: 3 shots at tier 0, +2 shots per tier. Cone (hat) zombie: 2x HP.
    const tier = Math.floor((gameState.wave - 1) / 3);
    const baseHp = 3 + tier * 2;
    const isCone = Math.random() > 0.7;
    const hp = isCone ? baseHp * 2 : baseHp;
    gameState.zombies.push({
        x: W + 20,
        lane: lane,
        y: GROUND_Y + lane * LANE_H + LANE_H / 2,
        hp,
        maxHp: hp,
        dead: false,
        triggered: false,
        walkFrame: Math.random() * Math.PI * 2,
        type: isCone ? 'cone' : 'normal',
    });
}

const MIN_ANSWERS_FOR_STARS = 5;

function accuracyPct() {
    return gameState.questionsAnswered > 0
        ? Math.round(gameState.correctAnswers / gameState.questionsAnswered * 100) : 0;
}

// Lives ran out — show the level result as a loss (a win flows through
// finishLevel).
function endGame() {
    gameState.isPlaying = false;
    stopGame();
    showLevelResult(false, 0);
}

// Level cleared: rate the run, persist the result (unlocks the next
// level), and show the level result screen.
function finishLevel() {
    gameState.isPlaying = false;
    stopGame();
    const gs = gameState;
    const accuracy = accuracyPct();
    // Stars reward learning: they come from answer accuracy, and need at
    // least MIN_ANSWERS_FOR_STARS answers so skipping questions can't earn them.
    const enough = gs.questionsAnswered >= MIN_ANSWERS_FOR_STARS;
    let stars = 1;
    if (enough && accuracy >= 85) stars = 3;
    else if (enough && accuracy >= 65) stars = 2;
    window.WGD_PROGRESS.recordLevelResult(gs.band, gs.themeId, gs.levelDef.id, { stars, score: gs.score });
    showLevelResult(true, stars);
}

function showLevelResult(won, stars) {
    const gs = gameState;
    document.getElementById('feedback').style.display = 'none'; // don't cover the results
    const P = window.WGD_PROGRESS;
    const lv = gs.levelDef;
    const accuracy = accuracyPct();

    document.getElementById('result-icon').textContent = won ? '🏆' : '💀';
    document.getElementById('result-title').textContent = won ? `Level ${lv.id} Clear!` : 'Try Again!';
    document.getElementById('result-stars').textContent = won ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '';

    const mastered = P.wordsMasteredCount(gs.band, gs.themeId);
    const total = currentTheme.words.length;
    const gMastered = P.grammarMasteredCount(gs.band, gs.themeId);
    const gTotal = currentTheme.grammar.length;
    document.getElementById('result-stats').innerHTML = `
        Score: ${gs.score}<br>
        Correct: ${gs.correctAnswers}/${gs.questionsAnswered} (${accuracy}%)<br>
        Got right this game: ${gs.rightThisGame.size} words &amp; patterns<br>
        Words learned: ${mastered} / ${total}<br>
        Patterns learned: ${gMastered} / ${gTotal}
    `;

    const btns = [];
    const next = levelsFor(gs.band).find(l => l.id === lv.id + 1);
    if (won && next) btns.push(`<button class="game-btn btn-play" onclick="playLevel(${next.id})">Next Level →</button>`);
    btns.push(`<button class="game-btn btn-play" onclick="playLevel(${lv.id})">${won ? 'Replay' : 'Retry'}</button>`);
    btns.push(`<button class="game-btn btn-home" onclick="showLevelSelect('${gs.themeId}')">Levels</button>`);
    btns.push(`<button class="game-btn btn-home" onclick="showTitle()">Home</button>`);
    document.getElementById('result-btns').innerHTML = btns.join('');

    showScreen('result-screen');
}

// ==================== DRAWING ====================
function draw() {
    ctx.clearRect(0, 0, W, H);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#B5E8F7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, GROUND_Y);

    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(W - 70, 80, 35, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(100, 60, 0.8);
    drawCloud(W * 0.5, 40, 1);
    drawCloud(W * 0.75, 90, 0.6);

    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    groundGrad.addColorStop(0, '#7BC950');
    groundGrad.addColorStop(0.3, '#5AA83A');
    groundGrad.addColorStop(1, '#3D7A28');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
        const ly = GROUND_Y + i * LANE_H;
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(W, ly);
        ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
        const fy = GROUND_Y + i * LANE_H + LANE_H / 2;
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(10, fy - 20, 8, 40);
        ctx.fillRect(22, fy - 25, 8, 50);
        ctx.fillRect(10, fy - 5, 20, 6);
    }

    // Lawn grid overlay (when placing)
    if (gameState.selectedPlant) {
        const cost = PLANT_TYPES[gameState.selectedPlant].cost;
        const canAfford = gameState.sun >= cost;
        for (let lane = 0; lane < 3; lane++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const cx = LAWN_LEFT + col * CELL_W;
                const cy = GROUND_Y + lane * LANE_H;
                const occupied = gameState.plants.some(p => p.col === col && p.lane === lane);
                ctx.strokeStyle = occupied ? 'rgba(255,80,80,0.35)' : (canAfford ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)');
                ctx.lineWidth = 1.5;
                ctx.strokeRect(cx + 2, cy + 2, CELL_W - 4, LANE_H - 4);
            }
        }
    }

    gameState.plants.forEach(p => drawPlant(p));
    if (gameState.shovelMode) {
        ctx.strokeStyle = 'rgba(255,80,80,0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        gameState.plants.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y - 8, 26, 0, Math.PI * 2);
            ctx.stroke();
        });
        ctx.setLineDash([]);
    }

    gameState.projectiles.forEach(proj => {
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#388E3C';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    gameState.zombies.forEach(z => { if (!z.dead) drawZombie(z); });

    // Lawn trolleys — drawn after zombies so a firing trolley visibly mows
    // over them. Idle trolleys sit just left of LAWN_LEFT.
    gameState.trollers.forEach(tr => { if (tr.alive) drawTroller(tr); });

    // Sun tokens (collectible)
    gameState.sunTokens.forEach(s => drawSunToken(s));

    // Cherry-bomb explosions
    gameState.explosions.forEach(e => drawExplosion(e));
}

function drawExplosion(e) {
    const t = e.age / 25;            // 0 → 1 over the explosion's life
    const r = e.radius * (0.4 + t * 1.0);
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Outer shockwave
    const grad = ctx.createRadialGradient(e.x, e.y, r * 0.2, e.x, e.y, r);
    grad.addColorStop(0, 'rgba(255,240,150,0.9)');
    grad.addColorStop(0.5, 'rgba(255,120,40,0.7)');
    grad.addColorStop(1, 'rgba(180,30,30,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Bright core (only early in the animation)
    if (t < 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,' + (1 - t * 2) + ')';
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function drawTroller(tr) {
    const y = GROUND_Y + tr.lane * LANE_H + LANE_H / 2;
    const x = tr.x;

    // Subtle shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cart body — red with yellow trim, looks like a little lawn cart
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.roundRect(x - 16, y - 8, 32, 16, 4);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x - 16, y - 8, 32, 3);

    // Engine block / hood
    ctx.fillStyle = '#444';
    ctx.fillRect(x - 7, y - 14, 14, 7);
    ctx.fillStyle = '#888';
    ctx.fillRect(x - 5, y - 12, 10, 3);

    // Tiny green sprout on the hood — keeps the garden theme
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(x - 1, y - 18, 2, 4);
    ctx.fillStyle = '#7BC950';
    ctx.beginPath();
    ctx.ellipse(x - 3, y - 18, 3, 2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(x + 3, y - 18, 3, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Wheels (rotate while moving)
    for (const wx of [-10, 10]) {
        ctx.save();
        ctx.translate(x + wx, y + 8);
        ctx.rotate(tr.wheelRot);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(0, -6); ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
    }

    // Speed lines while firing
    if (tr.fired) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const dx = -22 - i * 6;
            ctx.beginPath();
            ctx.moveTo(x + dx, y - 4 + i * 4);
            ctx.lineTo(x + dx - 8, y - 4 + i * 4);
            ctx.stroke();
        }
    }
}

function drawSunToken(s) {
    const flicker = Math.sin(s.age * 0.1) * 2;
    const fadeNear = Math.max(0, 600 - s.age) / 120; // fade in last 2s
    const alpha = Math.min(1, fadeNear);
    ctx.save();
    ctx.globalAlpha = alpha;
    // Glow
    const grad = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, 28);
    grad.addColorStop(0, 'rgba(255,215,0,0.9)');
    grad.addColorStop(1, 'rgba(255,215,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 26 + flicker, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.arc(x + 45 * scale, y, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlant(p) {
    const x = p.x, y = p.y;
    const bob = Math.sin(p.plantAnim) * 3;

    // Upgraded plants: pulsing gold halo behind the body + a small star above.
    if (p.upgraded) {
        const r = 22 + Math.sin(p.plantAnim * 2) * 2;
        const grad = ctx.createRadialGradient(x, y - 8, 4, x, y - 8, r + 6);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 8, r + 6, 0, Math.PI * 2);
        ctx.fill();
    }

    // HP bar (only when damaged)
    if (p.hp < p.maxHp) {
        const barW = 28;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x - barW/2, y - 32, barW, 4);
        const ratio = p.hp / p.maxHp;
        ctx.fillStyle = ratio > 0.5 ? '#2ECC71' : '#E74C3C';
        ctx.fillRect(x - barW/2, y - 32, barW * ratio, 4);
    }

    // Ammo bar for peashooter (gold → red as shots run out). Rendered just
    // below the HP slot so both can show at once if damaged + low ammo.
    if (p.type === 'peashooter') {
        const barW = 28;
        const ratio = Math.max(0, p.shotsLeft) / PEASHOOTER_SHOTS;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x - barW/2, y - 26, barW, 3);
        ctx.fillStyle = ratio > 0.4 ? '#FFD700' : '#E74C3C';
        ctx.fillRect(x - barW/2, y - 26, barW * ratio, 3);
    }

    if (p.type === 'pumpkin') {
        // During leap, the pumpkin slides from its cell to the target zombie's
        // x along a parabolic arc and tumbles. Otherwise it crouches in place
        // with a subtle bob, ready to pounce.
        let cx = x, cy = y - 8 + bob * 0.5, rot = 0;
        if (p.squashState === 'leap') {
            const t = Math.min(1, p.leapAge / PUMPKIN_LEAP_FRAMES);
            cx = p.leapStartX + (p.leapTargetX - p.leapStartX) * t;
            cy = y - 8 - Math.sin(t * Math.PI) * 70; // arc peak ~70px high
            const dir = p.leapTargetX >= p.leapStartX ? 1 : -1;
            rot = t * Math.PI * 2 * dir; // one full tumble during the leap
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        // Body — green pumpkin with vertical ridges
        const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 22);
        grad.addColorStop(0, '#A8D86B');
        grad.addColorStop(1, '#3D7A28');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(45, 90, 39, 0.55)';
        ctx.lineWidth = 1.5;
        for (const off of [-12, -4, 4, 12]) {
            ctx.beginPath();
            ctx.ellipse(off, 0, 3, 16, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Stem
        ctx.fillStyle = '#5C3D2E';
        ctx.fillRect(-2, -19, 4, 6);
        ctx.fillStyle = '#2D5A27';
        ctx.beginPath();
        ctx.ellipse(4, -18, 4, 2, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Eyes — angry brow when leaping, normal when idle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-5, -2, 3, 0, Math.PI * 2);
        ctx.arc(5, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        if (p.squashState === 'leap') {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-9, -7); ctx.lineTo(-2, -5);
            ctx.moveTo(9, -7);  ctx.lineTo(2, -5);
            ctx.stroke();
        }
        ctx.restore();
        return;
    }

    if (p.type === 'cherry') {
        // Pulse faster + bigger as the fuse runs out, hinting at imminent boom
        const fuseRatio = Math.max(0, p.fuse) / CHERRY_FUSE_FRAMES;
        const pulse = Math.sin(p.plantAnim * (4 + (1 - fuseRatio) * 8)) * (2 + (1 - fuseRatio) * 4);
        const cy = y - 10 + bob * 0.4;
        // Stem
        ctx.strokeStyle = '#3D7A28';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 4, cy - 14);
        ctx.quadraticCurveTo(x, cy - 22, x + 6, cy - 18);
        ctx.stroke();
        // Two cherries
        const drawBerry = (cx, cb) => {
            const grad = ctx.createRadialGradient(cx - 3, cb - 3, 1, cx, cb, 11 + pulse);
            grad.addColorStop(0, '#FF6B6B');
            grad.addColorStop(1, '#B22222');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cb, 11 + pulse, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.beginPath();
            ctx.arc(cx - 3, cb - 4, 3, 0, Math.PI * 2);
            ctx.fill();
        };
        drawBerry(x - 6, cy - 2);
        drawBerry(x + 6, cy + 2);
        // Eyes (just on the front cherry)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + 3, cy, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 9, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x + 3, cy, 1.3, 0, Math.PI * 2);
        ctx.arc(x + 9, cy, 1.3, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (p.type === 'wallnut') {
        const cy = y - 8 + bob * 0.5;
        ctx.save();
        ctx.translate(x, cy);
        if (p.rolling) ctx.rotate(p.rollAngle);
        // Body (rounded brown nut)
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-6, 0, 5, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-5, -2, 4, 0, Math.PI * 2);
        ctx.arc(5, -2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(6, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        // Mouth — open in a determined "O" while rolling, gentle smile when idle
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (p.rolling) ctx.arc(0, 5, 3, 0, Math.PI * 2);
        else ctx.arc(0, 4, 3, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
        return;
    }

    if (p.type === 'chomper') {
        // Mouth opens, lunges forward, snaps shut during 'biting'. Pulses
        // shut while 'chewing'. Idle = slightly ajar with a hungry look.
        let mouth = 4;       // half-height of the open mouth
        let lunge = 0;       // forward lurch (px) toward zombies
        let chewBulge = 0;   // belly bulge while digesting
        if (p.chompState === 'biting') {
            const t = p.chompTimer / CHOMPER_BITE_FRAMES;
            // Open wide in the first half, snap closed in the second
            mouth = t < 0.5 ? 4 + t * 28 : 18 - (t - 0.5) * 36;
            lunge = Math.sin(t * Math.PI) * 16;
        } else if (p.chompState === 'chewing') {
            mouth = 3 + Math.abs(Math.sin(p.chompTimer * 0.35)) * 1.5;
            chewBulge = 2 + Math.sin(p.chompTimer * 0.3) * 1.5;
        }

        // Stem
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(x - 3, y - 5, 6, 25);
        // Side leaves
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.ellipse(x - 10, y + 6, 8, 4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + 10, y + 6, 8, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        const cx = x + lunge;
        const cy = y - 12 + bob * 0.5;
        // Head — purple flytrap dome, slight bulge while chewing
        const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 18);
        grad.addColorStop(0, '#B57EDC');
        grad.addColorStop(1, '#5B2C7A');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 16 + chewBulge, 0, Math.PI * 2);
        ctx.fill();

        // Pink interior of the mouth (vertical opening)
        ctx.fillStyle = '#FF1744';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, 11, mouth, 0, 0, Math.PI * 2);
        ctx.fill();

        // Triangular teeth, top + bottom rows, closing on the mouth
        ctx.fillStyle = '#fff';
        for (const ox of [-8, -3, 2, 7]) {
            // Top row points down toward the mouth
            ctx.beginPath();
            ctx.moveTo(cx + ox, cy + 3 - mouth);
            ctx.lineTo(cx + ox - 2, cy + 3 - mouth + 4);
            ctx.lineTo(cx + ox + 2, cy + 3 - mouth + 4);
            ctx.closePath();
            ctx.fill();
            // Bottom row points up
            ctx.beginPath();
            ctx.moveTo(cx + ox, cy + 3 + mouth);
            ctx.lineTo(cx + ox - 2, cy + 3 + mouth - 4);
            ctx.lineTo(cx + ox + 2, cy + 3 + mouth - 4);
            ctx.closePath();
            ctx.fill();
        }

        // Eyes on top of head
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 9, 3.5, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 9, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 9, 1.7, 0, Math.PI * 2);
        ctx.arc(cx + 7, cy - 9, 1.7, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    if (p.type === 'peashooter') {
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(x - 3, y - 5, 6, 25);
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(x, y - 10 + bob, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 13 + bob, 5, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 13 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - 4, y - 13 + bob, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 6, y - 13 + bob, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(x + 10, y - 8 + bob, 12, 6);
        ctx.beginPath();
        ctx.arc(x + 22, y - 5 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(x - 3, y - 5, 6, 25);
        const petals = 8;
        for (let i = 0; i < petals; i++) {
            const angle = (i / petals) * Math.PI * 2 + p.plantAnim * 0.3;
            const px = x + Math.cos(angle) * 14;
            const py = (y - 12 + bob) + Math.sin(angle) * 14;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(px, py, 8, 5, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x, y - 12 + bob, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - 3, y - 14 + bob, 2, 0, Math.PI * 2);
        ctx.arc(x + 3, y - 14 + bob, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y - 10 + bob, 4, 0, Math.PI);
        ctx.stroke();
    }
}

function drawZombie(z) {
    const x = z.x, y = z.y;
    const wobble = Math.sin(z.walkFrame * 3) * 3;
    const legOffset = Math.sin(z.walkFrame * 6) * 5;

    ctx.fillStyle = '#555';
    ctx.fillRect(x - 8, y + 8, 7, 18 + legOffset);
    ctx.fillRect(x + 2, y + 8, 7, 18 - legOffset);

    ctx.fillStyle = '#6B4226';
    ctx.fillRect(x - 10, y - 12 + wobble, 22, 22);
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x - 1, y - 10 + wobble, 4, 15);

    ctx.fillStyle = '#7B9A6D';
    ctx.save();
    ctx.translate(x - 12, y - 5 + wobble);
    ctx.rotate(-0.5 + Math.sin(z.walkFrame * 4) * 0.15);
    ctx.fillRect(0, 0, -22, 7);
    ctx.restore();
    ctx.save();
    ctx.translate(x + 12, y - 5 + wobble);
    ctx.rotate(0.5 - Math.sin(z.walkFrame * 4) * 0.15);
    ctx.fillRect(0, 0, 22, 7);
    ctx.restore();

    ctx.fillStyle = '#7B9A6D';
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 32 + wobble, 26, 22, 6);
    ctx.fill();

    if (z.type === 'cone') {
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 30 + wobble);
        ctx.lineTo(x + 1, y - 52 + wobble);
        ctx.lineTo(x + 10, y - 30 + wobble);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#E67E22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 35 + wobble);
        ctx.lineTo(x + 8, y - 35 + wobble);
        ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 24 + wobble, 5, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 24 + wobble, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#C0392B';
    ctx.beginPath();
    ctx.arc(x - 3, y - 24 + wobble, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 7, y - 24 + wobble, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 16 + wobble);
    ctx.lineTo(x + 6, y - 17 + wobble);
    ctx.stroke();

    const hpW = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - hpW/2, y - 38 + wobble, hpW, 4);
    ctx.fillStyle = z.hp > z.maxHp * 0.5 ? '#2ECC71' : '#E74C3C';
    ctx.fillRect(x - hpW/2, y - 38 + wobble, hpW * (z.hp / z.maxHp), 4);
}

// ==================== INIT ====================
renderThemes();
