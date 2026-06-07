// ==================== LEARNING PROGRESS (elementary) ====================
// Persists per-theme progress for the elementary level-based mode to
// localStorage so a learner keeps their unlocked levels, stars, mastered
// words, and best score across sessions. All access goes through these
// helpers; every read/write is wrapped so a blocked or unavailable
// localStorage (private mode, file://) degrades to an in-memory no-op
// instead of throwing.
//
// Shape of the stored object (key: STORAGE_KEY):
//   { elementary: { <themeId>: {
//       levels:  { "1": { cleared: true, stars: 3 }, ... },
//       bestScore: 0,
//       mastered: ["cat", "dog", ...]   // distinct words answered correctly
//   } } }

(function () {
    const STORAGE_KEY = 'wgd-progress-v1';
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

    function emptyProgress() {
        return { elementary: {} };
    }

    function loadProgress() {
        if (!HAS_STORAGE) return memoryFallback || (memoryFallback = emptyProgress());
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return emptyProgress();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return emptyProgress();
            if (!parsed.elementary) parsed.elementary = {};
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

    // Return (creating if needed) the progress record for one elementary theme.
    function getThemeProgress(themeId) {
        const data = loadProgress();
        const t = data.elementary[themeId] || (data.elementary[themeId] = {});
        if (!t.levels) t.levels = {};
        if (typeof t.bestScore !== 'number') t.bestScore = 0;
        if (!Array.isArray(t.mastered)) t.mastered = [];
        return { data, theme: t };
    }

    // Level 1 is always unlocked; level N unlocks once level N-1 is cleared.
    function isLevelUnlocked(themeId, levelId) {
        if (levelId <= 1) return true;
        const { theme } = getThemeProgress(themeId);
        const prev = theme.levels[levelId - 1];
        return !!(prev && prev.cleared);
    }

    // Record a finished level run. Keeps the BEST star rating earned and marks
    // the level cleared (so unlocks never regress on a worse replay).
    function recordLevelResult(themeId, levelId, { stars, score }) {
        const { data, theme } = getThemeProgress(themeId);
        const existing = theme.levels[levelId] || {};
        theme.levels[levelId] = {
            cleared: true,
            stars: Math.max(existing.stars || 0, stars || 0),
        };
        if (typeof score === 'number' && score > theme.bestScore) theme.bestScore = score;
        saveProgress(data);
    }

    // Mark a word as mastered (first correct answer). Idempotent.
    function recordWordMastered(themeId, word) {
        if (!word) return;
        const { data, theme } = getThemeProgress(themeId);
        if (!theme.mastered.includes(word)) {
            theme.mastered.push(word);
            saveProgress(data);
        }
    }

    function wordsMasteredCount(themeId) {
        return getThemeProgress(themeId).theme.mastered.length;
    }

    function bestScore(themeId) {
        return getThemeProgress(themeId).theme.bestScore;
    }

    function levelInfo(themeId, levelId) {
        return getThemeProgress(themeId).theme.levels[levelId] || null;
    }

    window.WGD_PROGRESS = {
        loadProgress,
        saveProgress,
        getThemeProgress,
        isLevelUnlocked,
        recordLevelResult,
        recordWordMastered,
        wordsMasteredCount,
        bestScore,
        levelInfo,
    };
})();
