// ==================== LEARNING PROGRESS ====================
// Persists per-theme progress for the staged level-based mode to localStorage
// so a learner keeps their unlocked levels, stars, mastered words, and best
// score across sessions. Progress is kept separately per school band
// (elementary / junior / senior) so a learner's three tracks never collide.
// All access goes through these helpers; every read/write is wrapped so a
// blocked or unavailable localStorage (private mode, file://) degrades to an
// in-memory no-op instead of throwing.
//
// Shape of the stored object (key: STORAGE_KEY):
//   { <band>: { <themeId>: {
//       levels:  { "1": { cleared: true, stars: 3 }, ... },
//       bestScore: 0,
//       mastered: ["cat", "dog", ...]        // distinct words answered correctly
//       masteredGrammar: ["He ___ tall.", ...] // distinct grammar patterns (by sentence)
//   } } }            band ∈ { elementary, junior, senior }

(function () {
    const STORAGE_KEY = 'wgd-progress-v1';
    const BANDS = ['elementary', 'junior', 'senior'];
    let memoryFallback = null; // used when localStorage is unavailable

    function storageAvailable() {
        try {
            const k = '__wgd_test__';
            window.localStorage.setItem(k, '1');
            window.localStorage.removeItem(k);
            return true;
        } catch (e) {
            return false;
        }
    }
    const HAS_STORAGE = storageAvailable();

    // Normalize an arbitrary band to a known one so a typo can never write into
    // a stray top-level key.
    function normBand(band) {
        return BANDS.includes(band) ? band : 'elementary';
    }

    function emptyProgress() {
        return { elementary: {}, junior: {}, senior: {} };
    }

    function loadProgress() {
        if (!HAS_STORAGE) return memoryFallback || (memoryFallback = emptyProgress());
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return emptyProgress();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return emptyProgress();
            // Backfill any missing band so older saves (elementary-only) load.
            BANDS.forEach(b => { if (!parsed[b]) parsed[b] = {}; });
            return parsed;
        } catch (e) {
            return emptyProgress();
        }
    }

    function saveProgress(data) {
        if (!HAS_STORAGE) { memoryFallback = data; return; }
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            // Quota or serialization failure — keep an in-memory copy so the
            // current session still reflects the latest state.
            memoryFallback = data;
        }
    }

    // Return (creating if needed) the progress record for one theme within a band.
    function getThemeProgress(band, themeId) {
        const data = loadProgress();
        const bucket = data[normBand(band)];
        const t = bucket[themeId] || (bucket[themeId] = {});
        if (!t.levels) t.levels = {};
        if (typeof t.bestScore !== 'number') t.bestScore = 0;
        if (!Array.isArray(t.mastered)) t.mastered = [];
        if (!Array.isArray(t.masteredGrammar)) t.masteredGrammar = [];
        return { data, theme: t };
    }

    // Level 1 is always unlocked; level N unlocks once level N-1 is cleared.
    function isLevelUnlocked(band, themeId, levelId) {
        if (levelId <= 1) return true;
        const { theme } = getThemeProgress(band, themeId);
        const prev = theme.levels[levelId - 1];
        return !!(prev && prev.cleared);
    }

    // Record a finished level run. Keeps the BEST star rating earned and marks
    // the level cleared (so unlocks never regress on a worse replay).
    function recordLevelResult(band, themeId, levelId, { stars, score }) {
        const { data, theme } = getThemeProgress(band, themeId);
        const existing = theme.levels[levelId] || {};
        theme.levels[levelId] = {
            cleared: true,
            stars: Math.max(existing.stars || 0, stars || 0),
        };
        if (typeof score === 'number' && score > theme.bestScore) theme.bestScore = score;
        saveProgress(data);
    }

    // Mark a word as mastered (first correct answer). Idempotent.
    function recordWordMastered(band, themeId, word) {
        if (!word) return;
        const { data, theme } = getThemeProgress(band, themeId);
        if (!theme.mastered.includes(word)) {
            theme.mastered.push(word);
            saveProgress(data);
        }
    }

    function wordsMasteredCount(band, themeId) {
        return getThemeProgress(band, themeId).theme.mastered.length;
    }

    // Mark a grammar pattern as mastered (first correct answer), keyed by its
    // sentence so each distinct pattern is counted once. Idempotent.
    function recordGrammarMastered(band, themeId, key) {
        if (!key) return;
        const { data, theme } = getThemeProgress(band, themeId);
        if (!theme.masteredGrammar.includes(key)) {
            theme.masteredGrammar.push(key);
            saveProgress(data);
        }
    }

    function grammarMasteredCount(band, themeId) {
        return getThemeProgress(band, themeId).theme.masteredGrammar.length;
    }

    function bestScore(band, themeId) {
        return getThemeProgress(band, themeId).theme.bestScore;
    }

    function levelInfo(band, themeId, levelId) {
        return getThemeProgress(band, themeId).theme.levels[levelId] || null;
    }

    window.WGD_PROGRESS = {
        loadProgress,
        saveProgress,
        getThemeProgress,
        isLevelUnlocked,
        recordLevelResult,
        recordWordMastered,
        wordsMasteredCount,
        recordGrammarMastered,
        grammarMasteredCount,
        bestScore,
        levelInfo,
    };
})();
