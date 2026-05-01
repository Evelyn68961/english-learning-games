// Game Configuration
const LEVELS = [
    { letters: ['A', 'B', 'C', 'D', 'E', 'F'], name: 'Level 1', minScore: 0 },
    { letters: ['G', 'H', 'I', 'J', 'K', 'L'], name: 'Level 2', minScore: 50 },
    { letters: ['M', 'N', 'O', 'P', 'Q', 'R'], name: 'Level 3', minScore: 120 },
    { letters: ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'], name: 'Level 4', minScore: 200 }
];

// Vocab levels derived from the shared question bank (shared/question-bank.js).
// Letter-mole only needs word+emoji, so we strip the hint/grammar fields and
// take the first 6 words from each shared theme as that level's mole pool.
const VOCAB_LEVELS = window.QUESTION_BANK.themes.map(theme => ({
    category: theme.name,
    items: theme.words.slice(0, 6).map(w => ({ word: w.word, emoji: w.emoji })),
    minScore: 0,
}));

const ENCOURAGEMENTS = {
    correct: ['Awesome!', 'Great!', 'Wow!', 'Super!', 'Yes!', 'Perfect!', '🌟', '🎉'],
    wrong: ['Try again!', 'Almost!', 'Keep going!', 'You can do it!', 'Next time!'],
    end: {
        high: ["Amazing! You're a letter champion!", "Incredible job! You know your letters!", "Superstar performance!"],
        medium: ["Great work! Keep practicing!", "Good job! You're getting better!", "Nice try! Practice makes perfect!"],
        low: ["Good effort! Let's try again!", "Keep practicing, you'll get it!", "Every try makes you better!"]
    }
};

// Learning Flow State
const flashcardState = { seen: new Set(), levelData: null };
const memoryState = { cards: [], revealed: [], matched: 0, locked: false };

// Game State
let gameState = {
    score: 0,
    level: 0,
    targetLetter: '',
    targetItem: null,
    timeLeft: 60,
    isPlaying: false,
    moleSpeed: 2000,
    unlockedLevels: 1,
    vocabUnlockedLevels: 1,
    selectedMode: 'letters',
    selectedCategory: 0,
    currentLetters: [],
    currentItems: [],
    timerInterval: null,
    moleInterval: null,
    activeMoles: new Set()
};

// Audio Context for sounds
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch(type) {
        case 'correct':
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialDecayTo = 0.01;
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        case 'wrong':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'pop':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'levelup':
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3);
                osc.start(audioContext.currentTime + i * 0.15);
                osc.stop(audioContext.currentTime + i * 0.15 + 0.3);
            });
            break;
        case 'gameover':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.4);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
            break;
    }
}

// Initialize game board
function createGameBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        hole.innerHTML = `
            <div class="hole-back"></div>
            <div class="mole" id="mole-${i}" onclick="hitMole(${i})">
                <div class="mole-body">
                    <div class="mole-face">
                        <div class="mini-eyes">
                            <div class="mini-eye"></div>
                            <div class="mini-eye"></div>
                        </div>
                    </div>
                    <span class="mole-letter" id="letter-${i}">a</span>
                </div>
            </div>
            <div class="hole-front"></div>
        `;
        board.appendChild(hole);
    }
}

function selectMode(mode) {
    gameState.selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
    updateLevelBadges();
}

// Update level badges on start screen
function updateLevelBadges() {
    const container = document.getElementById('level-badges');
    if (gameState.selectedMode === 'vocab') {
        container.innerHTML = VOCAB_LEVELS.map(level => {
            const preview = level.items.slice(0, 3).map(it => it.emoji).join(' ');
            return `<span class="level-badge">${level.category}: ${preview}</span>`;
        }).join('');
    } else {
        container.innerHTML = LEVELS.map((level, i) => {
            const isUnlocked = i < gameState.unlockedLevels;
            const letters = level.letters.slice(0, 2).join('-') + '...' + level.letters.slice(-1);
            return `<span class="level-badge ${isUnlocked ? '' : 'locked'}">${level.name}: ${letters}</span>`;
        }).join('');
    }
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

function goToStart() {
    stopGame();
    updateLevelBadges();
    showScreen('start-screen');
}

// Game functions
function startGame() {
    initAudio();
    gameState = {
        ...gameState,
        score: 0,
        level: 0,
        timeLeft: 60,
        isPlaying: false,
        moleSpeed: 2000,
        activeMoles: new Set(),
        targetItem: null
    };

    if (gameState.selectedMode === 'vocab') {
        showCategorySelect();
    } else {
        beginMoleGame();
    }
}

function beginMoleGame() {
    gameState.isPlaying = true;
    updateCurrentLetters();
    createGameBoard();
    updateDisplay();
    showScreen('game-screen');
    pickNewTarget();
    startTimer();
    startMoleLoop();
}

// ── Category Selection ──
function showCategorySelect() {
    showScreen('category-screen');
}

function selectCategory(index) {
    gameState.selectedCategory = index;
    showFlashcards(true);
}

// ── Flashcard Learning Screen ──
function showFlashcards(resetSeen = true) {
    const levelData = VOCAB_LEVELS[gameState.selectedCategory];
    flashcardState.levelData = levelData;
    if (resetSeen) flashcardState.seen = new Set();

    document.getElementById('fc-category-name').textContent = levelData.category;
    document.getElementById('fc-progress').textContent = 'Tap each card to see the word!';
    document.getElementById('fc-next-btn').disabled = true;

    const grid = document.getElementById('flashcard-grid');
    grid.innerHTML = '';
    levelData.items.forEach((item, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flashcard-wrapper';
        wrapper.id = `fcw-${i}`;
        wrapper.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front" id="fcfront-${i}">
                    <div class="fc-emoji">${item.emoji}</div>
                    <div class="fc-tap-hint">tap!</div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div class="fc-emoji">${item.emoji}</div>
                    <div class="fc-word">${item.word}</div>
                </div>
            </div>`;
        if (flashcardState.seen.has(i)) {
            wrapper.classList.add('flipped');
            wrapper.querySelector('.flashcard-front').classList.add('seen');
        }
        wrapper.addEventListener('click', () => flipFlashcard(i));
        grid.appendChild(wrapper);
    });

    const seen = flashcardState.seen.size;
    const total = levelData.items.length;
    if (seen >= total) {
        document.getElementById('fc-progress').textContent = `All ${total} words seen! Great job! 🌟`;
        document.getElementById('fc-next-btn').disabled = false;
    } else if (seen > 0) {
        document.getElementById('fc-progress').textContent = `${seen} of ${total} seen — keep going!`;
        document.getElementById('fc-next-btn').disabled = false;
    }

    showScreen('flashcard-screen');
}

function flipFlashcard(index) {
    const wrapper = document.getElementById(`fcw-${index}`);
    const front = document.getElementById(`fcfront-${index}`);
    const isFlipped = wrapper.classList.toggle('flipped');
    if (isFlipped) {
        flashcardState.seen.add(index);
        front.classList.add('seen');
    }
    const total = flashcardState.levelData.items.length;
    const seen = flashcardState.seen.size;
    if (seen >= total) {
        document.getElementById('fc-progress').textContent = `All ${total} words seen! Great job! 🌟`;
        document.getElementById('fc-next-btn').disabled = false;
    } else {
        document.getElementById('fc-progress').textContent = `${seen} of ${total} seen — keep going!`;
        if (seen > 0) document.getElementById('fc-next-btn').disabled = false;
    }
}

// ── Memory Match Screen ──
function goToMemoryMatch() {
    const levelData = flashcardState.levelData;
    document.getElementById('mem-category-name').textContent = levelData.category;
    document.getElementById('total-pairs').textContent = levelData.items.length;
    document.getElementById('pairs-found').textContent = '0';
    document.getElementById('memory-win').style.display = 'none';

    const cards = [];
    levelData.items.forEach((item, i) => {
        cards.push({ type: 'emoji', display: item.emoji, pairId: i });
        cards.push({ type: 'word',  display: item.word,  pairId: i });
    });
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    memoryState.cards = cards;
    memoryState.revealed = [];
    memoryState.matched = 0;
    memoryState.locked = false;

    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    cards.forEach((card, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'memory-card-wrap';
        wrap.id = `mcw-${i}`;
        const inner = card.type === 'emoji'
            ? `<div class="fc-emoji">${card.display}</div>`
            : `<div class="mem-word">${card.display}</div>`;
        wrap.innerHTML = `
            <div class="memory-card">
                <div class="memory-face memory-card-back-face">🌱</div>
                <div class="memory-face memory-card-front-face">${inner}</div>
            </div>`;
        wrap.addEventListener('click', () => flipMemoryCard(i));
        grid.appendChild(wrap);
    });

    showScreen('memory-screen');
}

function flipMemoryCard(index) {
    if (memoryState.locked) return;
    const wrap = document.getElementById(`mcw-${index}`);
    if (wrap.classList.contains('revealed') || wrap.classList.contains('matched')) return;
    wrap.classList.add('revealed');
    memoryState.revealed.push(index);
    if (memoryState.revealed.length === 2) {
        memoryState.locked = true;
        setTimeout(checkMemoryPair, 600);
    }
}

function checkMemoryPair() {
    const [a, b] = memoryState.revealed;
    const ca = memoryState.cards[a];
    const cb = memoryState.cards[b];
    const isMatch = ca.pairId === cb.pairId && ca.type !== cb.type;

    const wrapA = document.getElementById(`mcw-${a}`);
    const wrapB = document.getElementById(`mcw-${b}`);

    if (isMatch) {
        wrapA.classList.replace('revealed', 'matched');
        wrapB.classList.replace('revealed', 'matched');
        memoryState.matched++;
        document.getElementById('pairs-found').textContent = memoryState.matched;
        playSound('correct');
        if (memoryState.matched === memoryState.cards.length / 2) {
            setTimeout(() => {
                document.getElementById('memory-win').style.display = 'block';
                playSound('levelup');
                createConfetti();
            }, 400);
        }
    } else {
        wrapA.classList.add('shake');
        wrapB.classList.add('shake');
        playSound('wrong');
        setTimeout(() => {
            wrapA.classList.remove('revealed', 'shake');
            wrapB.classList.remove('revealed', 'shake');
        }, 700);
    }
    memoryState.revealed = [];
    memoryState.locked = false;
}

function confirmBackToStart() {
    if (gameState.isPlaying) {
        if (!confirm('Leave the game? Your progress will be lost.')) return;
    }
    goToStart();
}

function stopGame() {
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);
    clearInterval(gameState.moleInterval);
    gameState.activeMoles.forEach(id => {
        const mole = document.getElementById(`mole-${id}`);
        if (mole) mole.classList.remove('active');
    });
    gameState.activeMoles.clear();
}

function updateCurrentLetters() {
    if (gameState.selectedMode === 'vocab') {
        gameState.currentItems = [...VOCAB_LEVELS[gameState.selectedCategory].items];
    } else {
        gameState.currentLetters = [];
        for (let i = 0; i <= gameState.level && i < LEVELS.length; i++) {
            gameState.currentLetters = [...gameState.currentLetters, ...LEVELS[i].letters];
        }
    }
}

function pickNewTarget() {
    const labelEl = document.getElementById('target-label');
    const letterEl = document.getElementById('target-letter');
    const hintEl = document.getElementById('target-word-hint');

    if (gameState.selectedMode === 'vocab') {
        const available = gameState.currentItems;
        gameState.targetItem = available[Math.floor(Math.random() * available.length)];
        labelEl.textContent = 'Find the word for:';
        letterEl.textContent = gameState.targetItem.emoji;
        letterEl.style.fontSize = 'clamp(3rem, 12vw, 5rem)';
        hintEl.style.display = 'none';
    } else {
        const available = gameState.currentLetters;
        gameState.targetLetter = available[Math.floor(Math.random() * available.length)];
        labelEl.textContent = 'Find the letter:';
        letterEl.textContent = gameState.targetLetter;
        letterEl.style.fontSize = '';
        hintEl.style.display = 'none';
    }
}

function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timer').textContent = `⏱️ ${gameState.timeLeft}`;

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function startMoleLoop() {
    spawnMole();

    gameState.moleInterval = setInterval(() => {
        if (gameState.isPlaying && gameState.activeMoles.size < 4) {
            spawnMole();
        }
    }, gameState.moleSpeed / 2);
}

function spawnMole() {
    if (!gameState.isPlaying) return;

    const availableHoles = [];
    for (let i = 0; i < 9; i++) {
        if (!gameState.activeMoles.has(i)) {
            availableHoles.push(i);
        }
    }

    if (availableHoles.length === 0) return;

    const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    const mole = document.getElementById(`mole-${holeIndex}`);
    const letterEl = document.getElementById(`letter-${holeIndex}`);

    if (gameState.selectedMode === 'vocab') {
        let item;
        if (Math.random() < 0.4) {
            item = gameState.targetItem;
        } else {
            const others = gameState.currentItems.filter(it => it.word !== gameState.targetItem.word);
            item = others[Math.floor(Math.random() * others.length)];
        }
        const wlen = item.word.length;
        letterEl.style.fontSize = wlen <= 3 ? 'clamp(1.8rem, 6vw, 2.5rem)'
                                : wlen <= 5 ? 'clamp(1.3rem, 4.5vw, 2rem)'
                                : 'clamp(1rem, 3.5vw, 1.6rem)';
        letterEl.textContent = item.word;
        mole.dataset.word = item.word;
        delete mole.dataset.letter;
    } else {
        let letter;
        if (Math.random() < 0.4) {
            letter = gameState.targetLetter.toLowerCase();
        } else {
            const otherLetters = gameState.currentLetters.filter(l => l !== gameState.targetLetter);
            letter = otherLetters[Math.floor(Math.random() * otherLetters.length)].toLowerCase();
        }
        letterEl.style.fontSize = '';
        letterEl.textContent = letter;
        mole.dataset.letter = letter;
        delete mole.dataset.word;
    }
    mole.classList.add('active');
    mole.classList.remove('hit', 'wrong');
    gameState.activeMoles.add(holeIndex);

    playSound('pop');

    setTimeout(() => {
        if (gameState.activeMoles.has(holeIndex)) {
            mole.classList.remove('active');
            gameState.activeMoles.delete(holeIndex);
        }
    }, gameState.moleSpeed);
}

function hitMole(index) {
    if (!gameState.isPlaying) return;

    const mole = document.getElementById(`mole-${index}`);
    if (!mole.classList.contains('active')) return;

    const isCorrect = gameState.selectedMode === 'vocab'
        ? mole.dataset.word === gameState.targetItem.word
        : mole.dataset.letter.toUpperCase() === gameState.targetLetter;

    if (isCorrect) {
        gameState.score += 10;
        mole.classList.add('hit');
        playSound('correct');
        showFeedback(true);
        createStars(event);

        checkLevelUp();

        gameState.moleSpeed = Math.max(800, gameState.moleSpeed - 30);

        setTimeout(() => {
            pickNewTarget();
        }, 300);
    } else {
        mole.classList.add('wrong');
        playSound('wrong');
        showFeedback(false);
        gameState.score = Math.max(0, gameState.score - 2);
    }

    updateDisplay();

    setTimeout(() => {
        mole.classList.remove('active', 'hit', 'wrong');
        gameState.activeMoles.delete(index);
    }, 300);
}

function showFeedback(isCorrect) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;

    if (isCorrect) {
        feedback.textContent = ENCOURAGEMENTS.correct[Math.floor(Math.random() * ENCOURAGEMENTS.correct.length)];
    } else {
        feedback.textContent = ENCOURAGEMENTS.wrong[Math.floor(Math.random() * ENCOURAGEMENTS.wrong.length)];
    }

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 800);
}

function createStars(e) {
    const container = document.getElementById('stars-container');
    const stars = ['⭐', '🌟', '✨', '💫'];

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = stars[Math.floor(Math.random() * stars.length)];
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 30 + 20}%`;
        star.style.animationDelay = `${Math.random() * 0.3}s`;
        container.appendChild(star);

        setTimeout(() => star.remove(), 1000);
    }
}

function checkLevelUp() {
    if (gameState.selectedMode === 'vocab') return;
    const nextLevel = gameState.level + 1;
    if (nextLevel < LEVELS.length && gameState.score >= LEVELS[nextLevel].minScore) {
        gameState.level = nextLevel;
        if (nextLevel >= gameState.unlockedLevels) {
            gameState.unlockedLevels = nextLevel + 1;
            localStorage.setItem('letterMoleUnlocked', gameState.unlockedLevels);
        }
        updateCurrentLetters();
        showLevelUpModal(nextLevel);
    }
}

function showLevelUpModal(level) {
    gameState.isPlaying = false;
    clearInterval(gameState.moleInterval);
    document.getElementById('new-items-label').textContent = 'New letters unlocked:';
    document.getElementById('new-letters').textContent = LEVELS[level].letters.join(' ');
    document.getElementById('level-modal').classList.add('active');

    playSound('levelup');
    createConfetti();
}

function closeLevelModal() {
    document.getElementById('level-modal').classList.remove('active');
    gameState.isPlaying = true;
    updateDisplay();
    startMoleLoop();
}

function createConfetti() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 3000);
    }
}

function updateDisplay() {
    document.getElementById('score').textContent = gameState.score;
    if (gameState.selectedMode === 'vocab') {
        document.getElementById('level-indicator').textContent =
            VOCAB_LEVELS[gameState.selectedCategory].category;
    } else {
        document.getElementById('level-indicator').textContent = LEVELS[gameState.level].name;
    }
}

function endGame() {
    stopGame();
    playSound('gameover');

    document.getElementById('final-score').textContent = gameState.score;

    let stars = '';
    let trophy = '🏆';
    let title = 'Great Job!';
    let encouragement = '';

    if (gameState.score >= 150) {
        stars = '⭐⭐⭐';
        trophy = '🏆';
        title = 'Amazing!';
        encouragement = ENCOURAGEMENTS.end.high[Math.floor(Math.random() * ENCOURAGEMENTS.end.high.length)];
    } else if (gameState.score >= 80) {
        stars = '⭐⭐';
        trophy = '🥈';
        title = 'Great Job!';
        encouragement = ENCOURAGEMENTS.end.medium[Math.floor(Math.random() * ENCOURAGEMENTS.end.medium.length)];
    } else {
        stars = '⭐';
        trophy = '🎯';
        title = 'Good Try!';
        encouragement = ENCOURAGEMENTS.end.low[Math.floor(Math.random() * ENCOURAGEMENTS.end.low.length)];
    }

    document.getElementById('stars-earned').textContent = stars;
    document.getElementById('trophy').textContent = trophy;
    document.getElementById('end-title').textContent = title;
    document.getElementById('encouragement').textContent = encouragement;

    if (gameState.selectedMode === 'vocab') {
        const playAgain = document.getElementById('play-again-btn');
        const second = document.getElementById('second-btn');
        playAgain.textContent = 'Play Again';
        playAgain.onclick = () => showFlashcards(true);
        second.textContent = 'Choose Topic';
        second.onclick = showCategorySelect;
    } else {
        document.getElementById('play-again-btn').textContent = 'Play Again';
        document.getElementById('play-again-btn').onclick = startGame;
        document.getElementById('second-btn').textContent = 'Home';
        document.getElementById('second-btn').onclick = goToStart;
    }

    showScreen('end-screen');
    createConfetti();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedLevel = localStorage.getItem('letterMoleUnlocked');
    if (savedLevel) {
        gameState.unlockedLevels = parseInt(savedLevel);
    }
    updateLevelBadges();
    createGameBoard();
});
