// ==================== LEARNING PROGRESS ====================
// Shared by every game in the repo. Two independent records live here:
//
//   WGD_PROGRESS  staged-level progress, keyed 'wgd-progress-v1'
//   WT_PROGRESS   Word Town's town map,  keyed 'wt-progress-v1'
//
// They are deliberately separate keys. Word Town needs a different shape
// (buildings, weeks) and mixing it into the existing object would risk a
// migration on saves that already exist in the wild. Word Town still writes
// every learned word through recordWordMastered(), so the two records agree on
// what the learner actually knows.
//
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
//       mastered: ["cat", "dog", ...]        // words the learner has learned
//       masteredGrammar: ["He ___ tall.", ...] // grammar patterns learned (by sentence)
//       stats: { "w:cat": { runs: 1, lastRun: 1732... }, "g:He ___ tall.": {...} }
//   } } }            band ∈ { elementary, junior, senior }
//
// `stats` is Word Garden Defense's per-item memory. An item counts as learned
// only once it has been answered correctly in MASTERY_RUNS different games
// (one correct answer can be a lucky guess or short-term memory). Entries
// already in `mastered` / `masteredGrammar` from older saves stay learned.

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
        if (!t.stats || typeof t.stats !== 'object') t.stats = {};
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

    // ---- Per-item memory (Word Garden Defense) ----
    // key is 'w:<word>' or 'g:<sentence>'; runId identifies one game.
    const MASTERY_RUNS = 2;

    function isMasteredKey(theme, key) {
        const body = key.slice(2);
        return key[0] === 'w' ? theme.mastered.includes(body) : theme.masteredGrammar.includes(body);
    }

    // Record one answer. A correct answer earns at most one credit per game;
    // a wrong answer takes one credit away. Reaching MASTERY_RUNS credits
    // marks the item learned (and learned items are never un-learned, so the
    // progress meters never go backwards). Returns { learnedNow }.
    function recordAnswer(band, themeId, key, correct, runId) {
        if (!key) return { learnedNow: false };
        const { data, theme } = getThemeProgress(band, themeId);
        const st = theme.stats[key] || (theme.stats[key] = { runs: 0, lastRun: null });
        let learnedNow = false;
        if (correct) {
            if (st.lastRun !== runId) { st.runs++; st.lastRun = runId; }
            if (st.runs >= MASTERY_RUNS && !isMasteredKey(theme, key)) {
                (key[0] === 'w' ? theme.mastered : theme.masteredGrammar).push(key.slice(2));
                learnedNow = true;
            }
        } else {
            st.runs = Math.max(0, st.runs - 1);
            st.lastRun = runId;
        }
        saveProgress(data);
        return { learnedNow };
    }

    function isItemMastered(band, themeId, key) {
        return isMasteredKey(getThemeProgress(band, themeId).theme, key);
    }

    // Has the learner met this item in an earlier game (answered it, or it is
    // already learned)? Used to skip the teach card for familiar items.
    function hasSeenItem(band, themeId, key) {
        const { theme } = getThemeProgress(band, themeId);
        return !!theme.stats[key] || isMasteredKey(theme, key);
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
        recordAnswer,
        isItemMastered,
        hasSeenItem,
        MASTERY_RUNS,
        bestScore,
        levelInfo,
    };

    // ==================== WORD TOWN ====================
    // The town map is the season's motivator: every property a learner masters
    // stays built, so by week 8 they can see a town they made out of ~68 words.
    // It is also the review pool that Memory Lane draws from.
    //
    // Shape (key: WT_KEY):
    //   { weeks: { "1": { cleared: true, buildings: 7, coins: 21, won: true } },
    //     town:  { "cow": { level: 2, week: 1, themeId: "animals" } } }
    //
    // `level` is the building tier: 1 hut, 2 house, 3 shop. It only ever grows —
    // replaying a week can improve a building but never demolish one, so a bad
    // second run cannot take away something the learner already earned.
    const WT_KEY = 'wt-progress-v1';
    let wtMemoryFallback = null;

    function wtEmpty() { return { weeks: {}, town: {} }; }

    function wtLoad() {
        if (!HAS_STORAGE) return wtMemoryFallback || (wtMemoryFallback = wtEmpty());
        try {
            const raw = window.localStorage.getItem(WT_KEY);
            if (!raw) return wtEmpty();
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return wtEmpty();
            if (!parsed.weeks || typeof parsed.weeks !== 'object') parsed.weeks = {};
            if (!parsed.town  || typeof parsed.town  !== 'object') parsed.town  = {};
            return parsed;
        } catch (e) {
            return wtEmpty();
        }
    }

    function wtSave(data) {
        if (!HAS_STORAGE) { wtMemoryFallback = data; return; }
        try {
            window.localStorage.setItem(WT_KEY, JSON.stringify(data));
        } catch (e) {
            wtMemoryFallback = data;
        }
    }

    // Record a building. Also mirrors the word into the shared mastery record so
    // the other games count it too. Never lowers an existing building's level.
    function wtRecordBuilding(word, level, week, themeId) {
        if (!word) return;
        const data = wtLoad();
        const existing = data.town[word];
        data.town[word] = {
            level: Math.max(existing ? existing.level : 0, level || 1),
            week: existing ? existing.week : week,
            themeId: themeId || (existing && existing.themeId) || null,
        };
        wtSave(data);
        if (themeId) recordWordMastered('elementary', themeId, word);
    }

    function wtRecordWeekResult(week, result) {
        const data = wtLoad();
        const prev = data.weeks[week] || {};
        data.weeks[week] = {
            cleared: true,
            buildings: Math.max(prev.buildings || 0, (result && result.buildings) || 0),
            coins: Math.max(prev.coins || 0, (result && result.coins) || 0),
            won: !!(prev.won || (result && result.won)),
        };
        wtSave(data);
    }

    // Week 1 is always open; week N opens once week N-1 has been played. The
    // teacher can override this in the menu — they know the child, we don't.
    function wtIsWeekUnlocked(week) {
        if (week <= 1) return true;
        const data = wtLoad();
        return !!(data.weeks[week - 1] && data.weeks[week - 1].cleared);
    }

    function wtTown() { return wtLoad().town; }
    function wtWeeks() { return wtLoad().weeks; }
    function wtBuildingCount() { return Object.keys(wtLoad().town).length; }

    // Words available for Memory Lane: everything already built, minus whatever
    // this week is teaching fresh.
    function wtReviewPool(excludeWords) {
        const skip = new Set(excludeWords || []);
        return Object.keys(wtLoad().town).filter(w => !skip.has(w));
    }

    function wtReset() {
        if (HAS_STORAGE) {
            try { window.localStorage.removeItem(WT_KEY); } catch (e) { /* ignore */ }
        }
        wtMemoryFallback = wtEmpty();
    }

    window.WT_PROGRESS = {
        recordBuilding: wtRecordBuilding,
        recordWeekResult: wtRecordWeekResult,
        isWeekUnlocked: wtIsWeekUnlocked,
        town: wtTown,
        weeks: wtWeeks,
        buildingCount: wtBuildingCount,
        reviewPool: wtReviewPool,
        reset: wtReset,
    };
})();
