// ==================== THEME DATA ====================
// Each grammar question has a `difficulty` (1=easy, 2=medium, 3=hard); generateQuestion
// caps difficulty by wave tier so harder grammar only unlocks in later waves.
const THEMES = [
    {
        id: 'animals', name: 'Animals', emoji: '🐾', color: '#8B4513',
        unlocked: true,
        words: [
            { word: 'cat', emoji: '🐱', hint: '貓' },
            { word: 'dog', emoji: '🐶', hint: '狗' },
            { word: 'fish', emoji: '🐟', hint: '魚' },
            { word: 'bird', emoji: '🐦', hint: '鳥' },
            { word: 'bear', emoji: '🐻', hint: '熊' },
            { word: 'frog', emoji: '🐸', hint: '青蛙' },
            { word: 'duck', emoji: '🦆', hint: '鴨子' },
            { word: 'pig', emoji: '🐷', hint: '豬' },
            { word: 'cow', emoji: '🐮', hint: '牛' },
            { word: 'rabbit', emoji: '🐰', hint: '兔子' },
            { word: 'tiger', emoji: '🐯', hint: '老虎' },
            { word: 'horse', emoji: '🐴', hint: '馬' },
            { word: 'sheep', emoji: '🐑', hint: '羊' },
            { word: 'mouse', emoji: '🐭', hint: '老鼠' },
            { word: 'snake', emoji: '🐍', hint: '蛇' },
            { word: 'lion', emoji: '🦁', hint: '獅子' },
            { word: 'monkey', emoji: '🐵', hint: '猴子' },
            { word: 'panda', emoji: '🐼', hint: '熊貓' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'A cat ___ small.', answer: 'is', options: ['is', 'are', 'am'], hint: '貓很小' },
            { difficulty: 1, sentence: 'Dogs ___ friendly.', answer: 'are', options: ['is', 'are', 'am'], hint: '狗很友善' },
            { difficulty: 1, sentence: 'I ___ a bird.', answer: 'see', options: ['see', 'sees', 'saw'], hint: '我看到一隻鳥' },
            { difficulty: 1, sentence: 'The fish ___ in water.', answer: 'swims', options: ['swim', 'swims', 'swimming'], hint: '魚在水裡游' },
            { difficulty: 1, sentence: 'The frog ___ jump.', answer: 'can', options: ['can', 'is', 'are'], hint: '青蛙會跳' },
            { difficulty: 2, sentence: 'The dog is ___.', answer: 'running', options: ['run', 'runs', 'running'], hint: '狗在跑' },
            { difficulty: 2, sentence: 'There ___ many cows.', answer: 'are', options: ['is', 'are', 'am'], hint: '有很多牛' },
            { difficulty: 2, sentence: 'I have ___ pet rabbit.', answer: 'a', options: ['a', 'an', 'the'], hint: '我有一隻寵物兔' },
            { difficulty: 2, sentence: 'Look at ___ tiger!', answer: 'that', options: ['this', 'those', 'that'], hint: '看那隻老虎' },
            { difficulty: 3, sentence: 'A lion is ___ than a cat.', answer: 'bigger', options: ['big', 'bigger', 'biggest'], hint: '獅子比貓大' },
            { difficulty: 3, sentence: 'Yesterday I ___ a panda.', answer: 'saw', options: ['see', 'saw', 'seen'], hint: '昨天我看到熊貓' },
            { difficulty: 3, sentence: 'Monkeys ___ in trees.', answer: 'live', options: ['live', 'lives', 'living'], hint: '猴子住在樹上' },
        ],
    },
    {
        id: 'food', name: 'Food', emoji: '🍎', color: '#E74C3C',
        unlocked: true,
        words: [
            { word: 'apple', emoji: '🍎', hint: '蘋果' },
            { word: 'rice', emoji: '🍚', hint: '飯' },
            { word: 'milk', emoji: '🥛', hint: '牛奶' },
            { word: 'egg', emoji: '🥚', hint: '蛋' },
            { word: 'bread', emoji: '🍞', hint: '麵包' },
            { word: 'cake', emoji: '🎂', hint: '蛋糕' },
            { word: 'candy', emoji: '🍬', hint: '糖果' },
            { word: 'water', emoji: '💧', hint: '水' },
            { word: 'juice', emoji: '🧃', hint: '果汁' },
            { word: 'pizza', emoji: '🍕', hint: '披薩' },
            { word: 'banana', emoji: '🍌', hint: '香蕉' },
            { word: 'orange', emoji: '🍊', hint: '橘子' },
            { word: 'cookie', emoji: '🍪', hint: '餅乾' },
            { word: 'soup', emoji: '🍲', hint: '湯' },
            { word: 'meat', emoji: '🍖', hint: '肉' },
            { word: 'cheese', emoji: '🧀', hint: '起司' },
            { word: 'noodle', emoji: '🍜', hint: '麵' },
            { word: 'salad', emoji: '🥗', hint: '沙拉' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'I like ___.', answer: 'apples', options: ['apple', 'apples', 'an apple'], hint: '我喜歡蘋果' },
            { difficulty: 1, sentence: 'She ___ rice.', answer: 'eats', options: ['eat', 'eats', 'eating'], hint: '她吃飯' },
            { difficulty: 1, sentence: 'I want ___ milk.', answer: 'some', options: ['a', 'some', 'many'], hint: '我想要一些牛奶' },
            { difficulty: 1, sentence: 'The cake ___ sweet.', answer: 'is', options: ['is', 'are', 'am'], hint: '蛋糕很甜' },
            { difficulty: 1, sentence: 'Do you like ___?', answer: 'pizza', options: ['pizza', 'pizzas', 'a pizza'], hint: '你喜歡披薩嗎？' },
            { difficulty: 2, sentence: 'There ___ apples on the table.', answer: 'are', options: ['is', 'are', 'am'], hint: '桌上有蘋果' },
            { difficulty: 2, sentence: 'She has ___ orange.', answer: 'an', options: ['a', 'an', 'the'], hint: '她有一顆橘子' },
            { difficulty: 2, sentence: 'We are ___ pizza now.', answer: 'eating', options: ['eat', 'eating', 'ate'], hint: '我們正在吃披薩' },
            { difficulty: 2, sentence: 'I drink ___ juice.', answer: 'some', options: ['a', 'some', 'many'], hint: '我喝一些果汁' },
            { difficulty: 3, sentence: 'This cake is ___ than that one.', answer: 'sweeter', options: ['sweet', 'sweeter', 'sweetest'], hint: '這蛋糕比那個甜' },
            { difficulty: 3, sentence: 'I ___ many cookies yesterday.', answer: 'ate', options: ['eat', 'eats', 'ate'], hint: '我昨天吃很多餅乾' },
            { difficulty: 3, sentence: 'How ___ apples do you have?', answer: 'many', options: ['much', 'many', 'lots'], hint: '你有多少蘋果？' },
        ],
    },
    {
        id: 'colors', name: 'Colors', emoji: '🌈', color: '#9B59B6',
        unlocked: true,
        words: [
            { word: 'red', emoji: '🔴', hint: '紅色' },
            { word: 'blue', emoji: '🔵', hint: '藍色' },
            { word: 'green', emoji: '🟢', hint: '綠色' },
            { word: 'yellow', emoji: '🟡', hint: '黃色' },
            { word: 'pink', emoji: '🩷', hint: '粉紅色' },
            { word: 'black', emoji: '⚫', hint: '黑色' },
            { word: 'white', emoji: '⚪', hint: '白色' },
            { word: 'orange', emoji: '🟠', hint: '橘色' },
            { word: 'purple', emoji: '🟣', hint: '紫色' },
            { word: 'brown', emoji: '🟤', hint: '棕色' },
            { word: 'gold', emoji: '🥇', hint: '金色' },
            { word: 'silver', emoji: '🥈', hint: '銀色' },
            { word: 'rainbow', emoji: '🌈', hint: '彩虹' },
            { word: 'gray', emoji: '🌫️', hint: '灰色' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'The sky ___ blue.', answer: 'is', options: ['is', 'are', 'am'], hint: '天空是藍色的' },
            { difficulty: 1, sentence: 'Apples ___ red.', answer: 'are', options: ['is', 'are', 'am'], hint: '蘋果是紅色的' },
            { difficulty: 1, sentence: 'I like ___ color.', answer: 'this', options: ['this', 'these', 'those'], hint: '我喜歡這個顏色' },
            { difficulty: 1, sentence: 'What color ___ it?', answer: 'is', options: ['is', 'are', 'do'], hint: '它是什麼顏色？' },
            { difficulty: 1, sentence: 'My bag is ___.', answer: 'black', options: ['a black', 'black', 'blacks'], hint: '我的包是黑色的' },
            { difficulty: 2, sentence: 'The grass is ___.', answer: 'green', options: ['red', 'green', 'yellow'], hint: '草是綠色的' },
            { difficulty: 2, sentence: 'Bananas ___ yellow.', answer: 'are', options: ['is', 'are', 'am'], hint: '香蕉是黃色的' },
            { difficulty: 2, sentence: 'I have ___ orange shirt.', answer: 'an', options: ['a', 'an', 'the'], hint: '我有一件橘色襯衫' },
            { difficulty: 2, sentence: 'Snow is ___.', answer: 'white', options: ['white', 'whites', 'a white'], hint: '雪是白色的' },
            { difficulty: 3, sentence: 'Red is ___ than pink.', answer: 'darker', options: ['dark', 'darker', 'darkest'], hint: '紅色比粉紅色深' },
            { difficulty: 3, sentence: 'The rainbow ___ many colors.', answer: 'has', options: ['have', 'has', 'having'], hint: '彩虹有很多顏色' },
            { difficulty: 3, sentence: 'I ___ a purple flower.', answer: 'saw', options: ['see', 'saw', 'seen'], hint: '我看到一朵紫色的花' },
        ],
    },
    {
        id: 'family', name: 'Family', emoji: '👨‍👩‍👦', color: '#3498DB',
        unlocked: true,
        words: [
            { word: 'mom', emoji: '👩', hint: '媽媽' },
            { word: 'dad', emoji: '👨', hint: '爸爸' },
            { word: 'sister', emoji: '👧', hint: '姊妹' },
            { word: 'brother', emoji: '👦', hint: '兄弟' },
            { word: 'baby', emoji: '👶', hint: '寶寶' },
            { word: 'grandma', emoji: '👵', hint: '奶奶' },
            { word: 'grandpa', emoji: '👴', hint: '爺爺' },
            { word: 'family', emoji: '👨‍👩‍👧‍👦', hint: '家人' },
            { word: 'friend', emoji: '🤝', hint: '朋友' },
            { word: 'teacher', emoji: '👩‍🏫', hint: '老師' },
            { word: 'son', emoji: '🧒', hint: '兒子' },
            { word: 'daughter', emoji: '👧', hint: '女兒' },
            { word: 'uncle', emoji: '🧔', hint: '叔叔' },
            { word: 'aunt', emoji: '👩‍🦱', hint: '阿姨' },
            { word: 'cousin', emoji: '🧑', hint: '表親' },
            { word: 'doctor', emoji: '👨‍⚕️', hint: '醫生' },
            { word: 'student', emoji: '🧑‍🎓', hint: '學生' },
            { word: 'parent', emoji: '👫', hint: '父母' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'She ___ my mom.', answer: 'is', options: ['is', 'are', 'am'], hint: '她是我媽媽' },
            { difficulty: 1, sentence: 'I love ___ dad.', answer: 'my', options: ['my', 'me', 'I'], hint: '我愛我爸爸' },
            { difficulty: 1, sentence: 'My brother ___ tall.', answer: 'is', options: ['is', 'are', 'am'], hint: '我弟弟很高' },
            { difficulty: 1, sentence: '___ is your friend?', answer: 'Who', options: ['Who', 'What', 'Where'], hint: '誰是你的朋友？' },
            { difficulty: 1, sentence: 'They ___ my family.', answer: 'are', options: ['is', 'are', 'am'], hint: '他們是我的家人' },
            { difficulty: 2, sentence: 'My sister and I ___ students.', answer: 'are', options: ['is', 'are', 'am'], hint: '我和姊姊是學生' },
            { difficulty: 2, sentence: 'My uncle ___ a doctor.', answer: 'is', options: ['is', 'are', 'am'], hint: '我叔叔是醫生' },
            { difficulty: 2, sentence: '___ are my parents.', answer: 'These', options: ['This', 'These', 'That'], hint: '這些是我的父母' },
            { difficulty: 2, sentence: 'My baby brother ___ crying.', answer: 'is', options: ['is', 'are', 'am'], hint: '我的小弟在哭' },
            { difficulty: 3, sentence: 'Grandma is ___ than mom.', answer: 'older', options: ['old', 'older', 'oldest'], hint: '奶奶比媽媽老' },
            { difficulty: 3, sentence: 'I ___ my cousin yesterday.', answer: 'met', options: ['meet', 'met', 'meets'], hint: '我昨天遇到表親' },
            { difficulty: 3, sentence: 'My family ___ in Taipei.', answer: 'lives', options: ['live', 'lives', 'living'], hint: '我家住在台北' },
        ],
    },
    {
        id: 'school', name: 'School', emoji: '🏫', color: '#2ECC71',
        unlocked: true,
        words: [
            { word: 'book', emoji: '📖', hint: '書' },
            { word: 'pen', emoji: '🖊️', hint: '筆' },
            { word: 'desk', emoji: '🪑', hint: '書桌' },
            { word: 'bag', emoji: '🎒', hint: '書包' },
            { word: 'ruler', emoji: '📏', hint: '尺' },
            { word: 'eraser', emoji: '🧽', hint: '橡皮擦' },
            { word: 'paper', emoji: '📄', hint: '紙' },
            { word: 'pencil', emoji: '✏️', hint: '鉛筆' },
            { word: 'clock', emoji: '🕐', hint: '時鐘' },
            { word: 'map', emoji: '🗺️', hint: '地圖' },
            { word: 'chair', emoji: '💺', hint: '椅子' },
            { word: 'crayon', emoji: '🖍️', hint: '蠟筆' },
            { word: 'notebook', emoji: '📓', hint: '筆記本' },
            { word: 'scissors', emoji: '✂️', hint: '剪刀' },
            { word: 'school', emoji: '🏫', hint: '學校' },
            { word: 'globe', emoji: '🌍', hint: '地球儀' },
            { word: 'art', emoji: '🎨', hint: '美術' },
            { word: 'music', emoji: '🎵', hint: '音樂' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'This ___ a book.', answer: 'is', options: ['is', 'are', 'am'], hint: '這是一本書' },
            { difficulty: 1, sentence: 'I have ___ pen.', answer: 'a', options: ['a', 'an', 'the'], hint: '我有一支筆' },
            { difficulty: 1, sentence: '___ is my bag.', answer: 'That', options: ['That', 'Those', 'These'], hint: '那是我的書包' },
            { difficulty: 1, sentence: 'There ___ two desks.', answer: 'are', options: ['is', 'are', 'am'], hint: '有兩張桌子' },
            { difficulty: 1, sentence: 'I ___ a student.', answer: 'am', options: ['is', 'are', 'am'], hint: '我是學生' },
            { difficulty: 2, sentence: 'The clock ___ on the wall.', answer: 'is', options: ['is', 'are', 'am'], hint: '時鐘在牆上' },
            { difficulty: 2, sentence: 'I need ___ eraser.', answer: 'an', options: ['a', 'an', 'the'], hint: '我需要一個橡皮擦' },
            { difficulty: 2, sentence: 'There ___ many books.', answer: 'are', options: ['is', 'are', 'am'], hint: '有很多書' },
            { difficulty: 2, sentence: 'We are ___ in class.', answer: 'reading', options: ['read', 'reads', 'reading'], hint: '我們在課堂上閱讀' },
            { difficulty: 3, sentence: 'The map is ___ than the book.', answer: 'bigger', options: ['big', 'bigger', 'biggest'], hint: '地圖比書大' },
            { difficulty: 3, sentence: 'I ___ my pencil yesterday.', answer: 'lost', options: ['lose', 'lost', 'losing'], hint: '我昨天弄丟鉛筆' },
            { difficulty: 3, sentence: '___ books are on the desk.', answer: 'Those', options: ['That', 'This', 'Those'], hint: '那些書在桌上' },
        ],
    },
    {
        id: 'feelings', name: 'Feelings', emoji: '😊', color: '#F39C12',
        unlocked: true,
        words: [
            { word: 'happy', emoji: '😊', hint: '開心' },
            { word: 'sad', emoji: '😢', hint: '傷心' },
            { word: 'angry', emoji: '😠', hint: '生氣' },
            { word: 'tired', emoji: '😴', hint: '累' },
            { word: 'hungry', emoji: '🤤', hint: '餓' },
            { word: 'scared', emoji: '😨', hint: '害怕' },
            { word: 'brave', emoji: '💪', hint: '勇敢' },
            { word: 'hot', emoji: '🥵', hint: '熱' },
            { word: 'cold', emoji: '🥶', hint: '冷' },
            { word: 'sleepy', emoji: '😪', hint: '想睡' },
            { word: 'excited', emoji: '🤩', hint: '興奮' },
            { word: 'bored', emoji: '😑', hint: '無聊' },
            { word: 'sick', emoji: '🤒', hint: '生病' },
            { word: 'worried', emoji: '😟', hint: '擔心' },
            { word: 'sorry', emoji: '🙏', hint: '抱歉' },
            { word: 'proud', emoji: '😎', hint: '驕傲' },
            { word: 'surprised', emoji: '😲', hint: '驚訝' },
            { word: 'calm', emoji: '😌', hint: '平靜' },
        ],
        grammar: [
            { difficulty: 1, sentence: 'I ___ happy.', answer: 'am', options: ['is', 'are', 'am'], hint: '我很開心' },
            { difficulty: 1, sentence: 'She ___ tired.', answer: 'is', options: ['is', 'are', 'am'], hint: '她很累' },
            { difficulty: 1, sentence: 'Are you ___?', answer: 'hungry', options: ['hunger', 'hungry', 'hungries'], hint: '你餓了嗎？' },
            { difficulty: 1, sentence: 'We ___ not scared.', answer: 'are', options: ['is', 'are', 'am'], hint: '我們不害怕' },
            { difficulty: 1, sentence: 'He feels ___.', answer: 'cold', options: ['cold', 'colds', 'coldy'], hint: '他覺得冷' },
            { difficulty: 2, sentence: 'The kids ___ excited.', answer: 'are', options: ['is', 'are', 'am'], hint: '孩子們很興奮' },
            { difficulty: 2, sentence: 'I am very ___ today.', answer: 'happy', options: ['happy', 'happily', 'happiness'], hint: '我今天很開心' },
            { difficulty: 2, sentence: 'He ___ feeling sick.', answer: 'is', options: ['is', 'are', 'am'], hint: '他覺得不舒服' },
            { difficulty: 2, sentence: 'They look ___.', answer: 'bored', options: ['bore', 'bored', 'boring'], hint: '他們看起來很無聊' },
            { difficulty: 3, sentence: 'I am ___ than yesterday.', answer: 'happier', options: ['happy', 'happier', 'happiest'], hint: '我比昨天更開心' },
            { difficulty: 3, sentence: 'She ___ sad last night.', answer: 'was', options: ['is', 'was', 'were'], hint: '她昨晚很傷心' },
            { difficulty: 3, sentence: 'Why ___ you worried?', answer: 'are', options: ['is', 'are', 'am'], hint: '你為什麼擔心？' },
        ],
    }
];

// ==================== PLANT TYPES ====================
const PLANT_TYPES = {
    sunflower:  { cost: 50,  icon: '🌻', hp: 4,  name: 'Sunflower',  produces: 'sun' },
    peashooter: { cost: 100, icon: '🟢', hp: 4,  name: 'Peashooter', produces: 'peas' },
    wallnut:    { cost: 50,  icon: '🌰', hp: 18, name: 'Wallnut',    produces: null  },
};
const PLANT_ORDER = ['sunflower', 'peashooter', 'wallnut'];

// ==================== QUESTION PACING ====================
// Strict 15-second gap between questions, measured in wall-clock ms (NOT frames),
// so the cadence is identical on 60 Hz and 144 Hz displays. Reset on dismissal
// so two questions can never appear closer than 15s apart.
const QUESTION_INTERVAL_MS = 15000;
const MIN_QUESTIONS_PER_SESSION = 15;

// ==================== GAME STATE ====================
let currentTheme = null;
let gameState = {
    sun: 100,
    score: 0,
    lives: 3,
    wave: 1,
    totalWaves: 9,
    zombies: [],
    plants: [],
    projectiles: [],
    sunTokens: [],
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

    // 2. Plant placement (only if a card is selected and no question is active)
    if (gameState.questionActive) return;
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
//   - Spelling pulls from longer words at higher tiers.
//   - Grammar pool is capped at difficulty <= tier+1, so hard sentences only
//     unlock at tier 2 (waves 7+).
function generateQuestion(theme, wave) {
    const t = theme;
    const tier = Math.floor((wave - 1) / 3);
    const maxDifficulty = Math.min(3, tier + 1);

    const r = Math.random();
    let type;
    if (tier === 0)      type = r < 0.55 ? 'vocab' : r < 0.85 ? 'spelling' : 'grammar';
    else if (tier === 1) type = r < 0.30 ? 'vocab' : r < 0.65 ? 'spelling' : 'grammar';
    else                 type = r < 0.20 ? 'vocab' : r < 0.45 ? 'spelling' : 'grammar';

    if (type === 'grammar' && t.grammar.length === 0) type = 'vocab';

    if (type === 'vocab') {
        const w = t.words[Math.floor(Math.random() * t.words.length)];
        const wrongs = t.words.filter(x => x.word !== w.word)
            .sort(() => Math.random() - 0.5).slice(0, 2).map(x => x.word);
        const options = shuffle([w.word, ...wrongs]);
        return { type: 'vocab', image: w.emoji, prompt: 'What is this?', hint: w.hint, answer: w.word, options, speakText: w.word };
    }

    if (type === 'spelling') {
        const minLen = tier === 0 ? 0 : tier === 1 ? 4 : 5;
        const longEnough = t.words.filter(w => w.word.length >= minLen);
        const pool = longEnough.length > 0 ? longEnough : t.words;
        const w = pool[Math.floor(Math.random() * pool.length)];
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

    if (q.type === 'vocab') speakWord(q.answer);
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
function selectTheme(id) {
    initAudio();
    currentTheme = THEMES.find(t => t.id === id);
    startGame();
}

function startGame() {
    showScreen('');
    canvas.style.display = 'block';

    gameState = {
        sun: 100, score: 0, lives: 3, wave: 1, totalWaves: 9,
        zombies: [], plants: [], projectiles: [], sunTokens: [],
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

        // Plant directly in front of zombie?
        const blocker = gs.plants.find(p => p.lane === z.lane && p.x < z.x + 6 && p.x > z.x - 26);
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
                playSound('shoot');
            }
        }
        // Sunflower drops a collectible sun token every ~5s
        if (p.type === 'sunflower' && p.shootTimer > 300) {
            spawnSunflowerSun(p);
            p.shootTimer = 0;
        }
    });

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

    if (p.type === 'wallnut') {
        // Body (rounded brown nut)
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(x, y - 8 + bob * 0.5, 18, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x - 6, y - 8 + bob * 0.5, 5, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 10 + bob * 0.5, 4, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 10 + bob * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - 4, y - 10 + bob * 0.5, 2, 0, Math.PI * 2);
        ctx.arc(x + 6, y - 10 + bob * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y - 4 + bob * 0.5, 3, 0, Math.PI);
        ctx.stroke();
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
