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
    cherry:     { cost: 150, icon: '🍒', hp: 1,  name: 'Cherry Bomb', produces: 'bomb' },
    pumpkin:    { cost: 50,  icon: '🎃', hp: 1,  name: 'Squash',     produces: 'leap'  },
};
const PLANT_ORDER = ['sunflower', 'peashooter', 'wallnut', 'cherry', 'pumpkin'];

const CHERRY_FUSE_FRAMES = 60;    // ~1s windup before detonation
const CHERRY_BLAST_RADIUS = 130;  // covers a 3x3 patch of cells
const PEASHOOTER_SHOTS = 120;     // peas the plant fires before wilting away
const PUMPKIN_LEAP_FRAMES = 30;   // ~0.5s leap animation
const PUMPKIN_TRIGGER_CELLS = 2;  // trigger when a zombie is within N cell-widths (either direction)
const PUMPKIN_SQUASH_RADIUS = 38; // landing kill zone (px)

// Wallnut rolls when tapped: direction is set by tap position relative to the
// nut (tap right → roll right, tap left → roll left). It plows through zombies
// in its lane, crashing up to WALLNUT_ROLL_MAX_KILLS before it shatters.
const WALLNUT_ROLL_SPEED = 4.5;
const WALLNUT_ROLL_HIT_RADIUS = 26;
const WALLNUT_ROLL_MAX_KILLS = 3;
const WALLNUT_TAP_RADIUS = 30;
// Auto-trigger: once a wallnut has been chewed down to this fraction of its
// max HP, it goes out swinging — auto-rolls forward into the horde rather
// than dying uselessly. Manual tap still works at full HP.
const WALLNUT_AUTO_ROLL_HP_RATIO = 1 / 3;

// ==================== QUESTION PACING ====================
// Strict 15-second gap between questions, measured in wall-clock ms (NOT frames),
// so the cadence is identical on 60 Hz and 144 Hz displays. Reset on dismissal
// so two questions can never appear closer than 15s apart.
const QUESTION_INTERVAL_MS = 15000;
const MIN_QUESTIONS_PER_SESSION = 15;

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
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    GROUND_Y = H * 0.55;
    LANE_H = (H - GROUND_Y - 80) / 3;
    LAWN_LEFT = 90;
    CELL_W = Math.min(95, Math.max(60, (W - LAWN_LEFT - 10) / 9));
    GRID_COLS = Math.max(4, Math.floor((W - LAWN_LEFT - 10) / CELL_W));
}
window.addEventListener('resize', resizeCanvas);
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

    // 2. Tap an idle wallnut (no card selected) to roll it. Tap side of the nut
    // picks direction: right of it rolls forward into the horde, left of it
    // rolls backward through plants that have already been overrun.
    if (!gameState.selectedPlant) {
        for (const p of gameState.plants) {
            if (p.type !== 'wallnut' || p.rolling) continue;
            if (Math.hypot(x - p.x, y - p.y) < WALLNUT_TAP_RADIUS) {
                p.rolling = true;
                p.rollDir = (x >= p.x) ? 1 : -1;
                p.rollKills = 0;
                p.rollHits = new Set();
                playSound('plant');
                return;
            }
        }
    }

    // 3. Plant placement (only if a card is selected)
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
    }).join('');
    updatePlantCards();
}

function selectPlantType(type) {
    if (!gameState.isPlaying) return;
    if (gameState.sun < PLANT_TYPES[type].cost) return;
    gameState.selectedPlant = (gameState.selectedPlant === type) ? null : type;
    canvas.classList.toggle('plant-mode', !!gameState.selectedPlant);
    updatePlantCards();
}

function updatePlantCards() {
    document.querySelectorAll('.plant-card').forEach(card => {
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

// ==================== QUESTION GENERATION ====================
// Difficulty rises with wave tier (every 3 waves):
//   - Question-type mix shifts from vocab-heavy → spelling/grammar-heavy.
//   - Word + grammar pools cap at difficulty <= tier+1:
//       tier 0 (waves 1-3) -> diff 1, tier 1 (waves 4-6) -> diff 2,
//       tier 2 (waves 7-9) -> diff 3, tier 3 (waves 10-12) -> diff 4.
function generateQuestion(theme, wave) {
    const t = theme;
    const tier = Math.floor((wave - 1) / 3);
    const maxDifficulty = Math.min(4, tier + 1);

    const r = Math.random();
    let type;
    if (tier === 0)      type = r < 0.55 ? 'vocab' : r < 0.85 ? 'spelling' : 'grammar';
    else if (tier === 1) type = r < 0.30 ? 'vocab' : r < 0.65 ? 'spelling' : 'grammar';
    else                 type = r < 0.20 ? 'vocab' : r < 0.45 ? 'spelling' : 'grammar';

    if (type === 'grammar' && t.grammar.length === 0) type = 'vocab';

    // Cap word difficulty at the same tier as grammar so a tier-0 wave never pulls
    // a B1 word like 'submarine' or 'photographer' out of the bank.
    const wordsForTier = t.words.filter(w => (w.difficulty || 1) <= maxDifficulty);
    const wordPool = wordsForTier.length > 0 ? wordsForTier : t.words;

    if (type === 'vocab') {
        const w = wordPool[Math.floor(Math.random() * wordPool.length)];
        const wrongs = t.words.filter(x => x.word !== w.word)
            .sort(() => Math.random() - 0.5).slice(0, 2).map(x => x.word);
        const options = shuffle([w.word, ...wrongs]);
        return { type: 'vocab', image: w.emoji, prompt: 'What is this?', hint: w.hint, answer: w.word, options, speakText: w.word };
    }

    if (type === 'spelling') {
        const w = wordPool[Math.floor(Math.random() * wordPool.length)];
        const idx = Math.floor(Math.random() * w.word.length);
        const blanked = w.word.slice(0, idx) + '_' + w.word.slice(idx + 1);
        const correctLetter = w.word[idx];
        const allLetters = 'abcdefghijklmnopqrstuvwxyz';
        const wrongs = [];
        while (wrongs.length < 2) {
            const l = allLetters[Math.floor(Math.random() * 26)];
            if (l !== correctLetter && !wrongs.includes(l)) wrongs.push(l);
        }
        const options = shuffle([correctLetter, ...wrongs]);
        return { type: 'spelling', image: w.emoji, prompt: blanked, hint: w.hint, answer: correctLetter, options, speakText: w.word };
    }

    const eligible = t.grammar.filter(g => (g.difficulty || 1) <= maxDifficulty);
    const pool = eligible.length > 0 ? eligible : t.grammar;
    const g = pool[Math.floor(Math.random() * pool.length)];
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

    const q = generateQuestion(currentTheme, gameState.wave);
    gameState.currentQuestion = q;

    document.getElementById('q-image').textContent = q.image;
    document.getElementById('q-prompt').textContent = q.prompt;
    document.getElementById('q-hint').textContent = q.hint ? `💡 ${q.hint}` : '';

    const optDiv = document.getElementById('q-options');
    optDiv.innerHTML = q.options.map(o => `<button class="q-btn" onclick="answerQuestion('${o}')">${o}</button>`).join('');

    document.getElementById('question-panel').classList.add('active');
    updateAskBtn();

    if (q.type === 'vocab') speakWord(q.answer);
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
}

function answerQuestion(selected) {
    if (!gameState.questionActive) return;
    const q = gameState.currentQuestion;
    const isCorrect = selected === q.answer;
    gameState.questionsAnswered++;

    document.querySelectorAll('.q-btn').forEach(btn => {
        btn.style.pointerEvents = 'none';
        if (btn.textContent === q.answer) btn.classList.add('correct');
        else if (btn.textContent === selected && !isCorrect) btn.classList.add('wrong');
    });

    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.score += 10;
        gameState.sun += 50;
        playSound('correct');
        showFeedback('✅ +50 ☀️');
        speakWord(q.speakText);
    } else {
        playSound('wrong');
        showFeedback('❌ ' + q.answer);
    }

    updateHUD();
    updatePlantCards();

    setTimeout(() => {
        document.getElementById('question-panel').classList.remove('active');
        gameState.questionActive = false;
        gameState.nextQuestionAt = performance.now() + QUESTION_INTERVAL_MS;
        gameState.triggerZombie = null;
        updateAskBtn();
    }, 1000);
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
    document.getElementById('hud-total-waves').textContent = gameState.totalWaves;
    document.getElementById('hud-lives').innerHTML = '❤️'.repeat(Math.max(0, gameState.lives)) + '🖤'.repeat(Math.max(0, 3 - gameState.lives));
}

// ==================== GAME LOOP ====================
function setLevel(level) {
    if (level !== 'elementary' && level !== 'junior') return;
    selectedLevel = level;
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.level === level);
    });
}

function selectTheme(id) {
    initAudio();
    // Filter the chosen theme's grammar by selected learner level so elementary
    // sessions never see junior-high sentences (past tense, comparatives, etc.).
    const themesForLevel = window.QUESTION_BANK.forLevel(selectedLevel);
    currentTheme = themesForLevel.find(t => t.id === id);
    startGame();
}

function startGame() {
    showScreen('');
    canvas.style.display = 'block';

    gameState = {
        sun: 100, score: 0, lives: 3, wave: 1, totalWaves: 12,
        zombies: [], plants: [], projectiles: [], sunTokens: [], explosions: [],
        isPlaying: true, questionActive: false, currentQuestion: null,
        questionsAnswered: 0, correctAnswers: 0,
        zombiesPerWave: 6, zombieSpeed: 0.6,
        spawnTimer: 0, spawnInterval: 90, waveZombiesSpawned: 0,
        animFrame: null, nextQuestionAt: performance.now() + QUESTION_INTERVAL_MS,
        triggerZombie: null,
        selectedPlant: null,
        sunTokenTimer: 0,
        damageCooldown: 0,
    };

    document.getElementById('hud').classList.add('active');
    document.getElementById('plant-cards').classList.add('active');
    renderPlantCards();
    updateAskBtn();
    updateHUD();
    resizeCanvas();
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

function restartGame() {
    stopGame();
    startGame();
}

function gameLoop() {
    if (!gameState.isPlaying) return;
    update();
    draw();
    gameState.animFrame = requestAnimationFrame(gameLoop);
}

function update() {
    const gs = gameState;

    // Spawn zombies
    gs.spawnTimer++;
    if (gs.spawnTimer >= gs.spawnInterval && gs.waveZombiesSpawned < gs.zombiesPerWave) {
        spawnZombie();
        gs.waveZombiesSpawned++;
        gs.spawnTimer = 0;
    }

    // Question pacing: strict 15s gap, gated by wall-clock time. Schedule the
    // NEXT question only once dismissal completes (see answerQuestion), so two
    // questions can never appear within 15s of each other regardless of fps.
    if (!gs.questionActive && performance.now() >= gs.nextQuestionAt) {
        gs.nextQuestionAt = Infinity; // disarm until dismissal reschedules
        showQuestion();
    }

    if (gs.damageCooldown > 0) gs.damageCooldown--;

    // Periodic sky sun (every ~10s while playing)
    gs.sunTokenTimer++;
    if (gs.sunTokenTimer > 600) {
        spawnSkySun();
        gs.sunTokenTimer = 0;
    }

    // Move zombies (or eat plant in path)
    gs.zombies.forEach(z => {
        if (z.dead) return;
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
                if (gs.lives <= 0) endGame(false);
            }
        }
    });

    // Plants
    gs.plants.forEach(p => {
        p.shootTimer++;
        p.plantAnim += 0.08;
        if (p.type === 'peashooter' && p.shootTimer > 45) {
            const hasTarget = gs.zombies.some(z => !z.dead && z.lane === p.lane && z.x > p.x);
            if (hasTarget) {
                gs.projectiles.push({ x: p.x + 30, y: p.y, lane: p.lane, speed: 8 });
                p.shootTimer = 0;
                p.shotsLeft--;
                playSound('shoot');
                if (p.shotsLeft <= 0) p.spent = true;
            }
        }
        // Sunflower drops a collectible sun token every ~5s
        if (p.type === 'sunflower' && p.shootTimer > 300) {
            spawnSunflowerSun(p);
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
        // Wallnut: auto-launch a roll once it's been chewed down past the HP
        // threshold (forward into the horde — zombies attack from the right),
        // then plow through up to 3 zombies. Manual tap-to-roll still applies
        // earlier in handleCanvasTap.
        if (p.type === 'wallnut') {
            if (!p.rolling && p.hp <= p.maxHp * WALLNUT_AUTO_ROLL_HP_RATIO) {
                p.rolling = true;
                p.rollDir = 1;
                p.rollKills = 0;
                p.rollHits = new Set();
                playSound('plant');
            }
            if (p.rolling) updateWallnutRoll(p, gs);
        }
    });
    gs.plants = gs.plants.filter(p => !p.exploded && !p.spent);

    // Tick explosion animations
    gs.explosions.forEach(e => e.age++);
    gs.explosions = gs.explosions.filter(e => e.age < 25);

    // Update falling sun tokens
    gs.sunTokens.forEach(s => {
        if (s.y < s.targetY) s.y += s.fallSpeed;
        s.age++;
    });
    gs.sunTokens = gs.sunTokens.filter(s => s.age < 600); // 10s before disappearing

    // Move projectiles
    gs.projectiles.forEach(proj => {
        proj.x += proj.speed;
    });

    // Collision: projectile vs zombie
    gs.projectiles = gs.projectiles.filter(proj => {
        let hit = false;
        gs.zombies.forEach(z => {
            if (!z.dead && z.lane === proj.lane && Math.abs(z.x - proj.x) < 25) {
                z.hp--;
                hit = true;
                if (z.hp <= 0) {
                    z.dead = true;
                    gs.score += 5;
                    playSound('zombieDie');
                    updateHUD();
                }
            }
        });
        return !hit && proj.x < W + 20;
    });

    // Clean dead zombies
    gs.zombies = gs.zombies.filter(z => !z.dead || z.x > -50);

    // Wave complete check
    if (gs.waveZombiesSpawned >= gs.zombiesPerWave && gs.zombies.filter(z => !z.dead).length === 0) {
        if (gs.wave < gs.totalWaves) {
            gs.wave++;
            gs.waveZombiesSpawned = 0;
            gs.zombiesPerWave += 3;
            gs.zombieSpeed += 0.12;
            gs.spawnInterval = Math.max(50, gs.spawnInterval - 10);
            updateHUD();
            showFeedback(`🌊 Wave ${gs.wave}!`);
        } else if (gs.questionsAnswered < MIN_QUESTIONS_PER_SESSION) {
            // Final wave done but session needs more questions — extend with a bonus wave at stable difficulty.
            gs.waveZombiesSpawned = 0;
            gs.zombiesPerWave = 6;
            showFeedback(`🎯 Bonus Round! (${gs.questionsAnswered}/${MIN_QUESTIONS_PER_SESSION})`);
        } else {
            endGame(true);
        }
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
        }
    } else if (p.squashState === 'leap') {
        p.leapAge++;
        if (p.leapAge >= PUMPKIN_LEAP_FRAMES) {
            // Land — squash zombies inside the kill zone at the landing spot
            for (const z of gs.zombies) {
                if (z.dead || z.lane !== p.lane) continue;
                if (Math.abs(z.x - p.leapTargetX) <= PUMPKIN_SQUASH_RADIUS) {
                    z.dead = true;
                    gs.score += 5;
                }
            }
            playSound('zombieDie');
            updateHUD();
            p.spent = true;
        }
    }
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
            if (p.rollKills >= WALLNUT_ROLL_MAX_KILLS) {
                p.spent = true;
                return;
            }
        }
    }

    if (p.x < -30 || p.x > W + 30) p.spent = true;
}

function explodeCherry(plant) {
    const r = CHERRY_BLAST_RADIUS;
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

function endGame(won) {
    gameState.isPlaying = false;
    stopGame();

    const accuracy = gameState.questionsAnswered > 0 ? Math.round(gameState.correctAnswers / gameState.questionsAnswered * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 60 ? 2 : 1;

    document.getElementById('result-icon').textContent = won ? '🏆' : '💀';
    document.getElementById('result-title').textContent = won ? 'Garden Saved!' : 'Zombies Won!';
    document.getElementById('result-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('result-stats').innerHTML = `
        Score: ${gameState.score}<br>
        Correct: ${gameState.correctAnswers}/${gameState.questionsAnswered} (${accuracy}%)<br>
        Wave: ${gameState.wave}/${gameState.totalWaves}
    `;
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
