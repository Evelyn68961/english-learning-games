#!/usr/bin/env node
// Structural check for shared/question-bank.js. Run with:  node shared/validate-bank.js
//
// Catches the classes of problem that silently produce bad lessons:
//   - a grammar item whose answer is missing from its own options
//   - the same word listed twice inside one theme
//   - a level/difficulty pair that contradicts the mapping in
//     shared/MOE-curriculum-reference.md
//   - a tier with too few items for a game to draw a round from
//
// Exits non-zero when any error is found so it can gate a commit.

const path = require('path');

global.window = {};
require(path.join(__dirname, 'question-bank.js'));
const BANK = global.window.QUESTION_BANK;

// difficulty -> the only level tag allowed at that difficulty
const LEVEL_FOR_DIFF = {
    0: 'elementary', 1: 'elementary', 2: 'elementary',
    3: 'junior', 4: 'junior',
    5: 'senior-G10', 6: 'senior-G11', 7: 'senior-G12', 8: 'senior-AST',
};
const MIN_PER_TIER = 3;   // a game needs at least this many to build a round

const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

if (!Array.isArray(BANK.themes) || !BANK.themes.length) {
    err('themes is missing or empty');
}

const themeIds = new Set();
for (const theme of BANK.themes) {
    const id = theme.id || '(no id)';

    for (const field of ['id', 'name', 'emoji', 'color']) {
        if (!theme[field]) err(`${id}: missing "${field}"`);
    }
    if (themeIds.has(theme.id)) err(`duplicate theme id: ${theme.id}`);
    themeIds.add(theme.id);

    if (!Array.isArray(theme.words) || !Array.isArray(theme.grammar)) {
        err(`${id}: words and grammar must both be arrays`);
        continue;
    }

    // ---- words -------------------------------------------------------------
    const seenWords = new Map();
    for (const w of theme.words) {
        const at = `${id}/${w.word}`;
        for (const field of ['word', 'emoji', 'hint']) {
            if (!w[field]) err(`${at}: missing "${field}"`);
        }
        if (typeof w.difficulty !== 'number') {
            err(`${at}: difficulty must be a number`);
        } else if (LEVEL_FOR_DIFF[w.difficulty] === undefined) {
            err(`${at}: difficulty ${w.difficulty} is outside 0-8`);
        } else if (w.level !== LEVEL_FOR_DIFF[w.difficulty]) {
            err(`${at}: level "${w.level}" does not match difficulty ${w.difficulty} ` +
                `(expected "${LEVEL_FOR_DIFF[w.difficulty]}")`);
        }
        if (seenWords.has(w.word)) {
            err(`${at}: duplicated (d${seenWords.get(w.word)} and d${w.difficulty})`);
        } else {
            seenWords.set(w.word, w.difficulty);
        }
    }

    // ---- grammar -----------------------------------------------------------
    const seenSentences = new Set();
    for (const g of theme.grammar) {
        const at = `${id}/"${g.sentence}"`;
        for (const field of ['sentence', 'answer', 'hint']) {
            if (!g[field]) err(`${at}: missing "${field}"`);
        }
        if (g.sentence && !g.sentence.includes('___')) {
            err(`${at}: sentence has no ___ gap`);
        }
        if (!Array.isArray(g.options) || g.options.length < 2) {
            err(`${at}: needs at least 2 options`);
        } else {
            if (!g.options.includes(g.answer)) {
                err(`${at}: answer "${g.answer}" is not among its options`);
            }
            if (new Set(g.options).size !== g.options.length) {
                err(`${at}: options contain a duplicate`);
            }
        }
        if (LEVEL_FOR_DIFF[g.difficulty] === undefined) {
            err(`${at}: difficulty ${g.difficulty} is outside 0-8`);
        } else if (g.level !== LEVEL_FOR_DIFF[g.difficulty]) {
            err(`${at}: level "${g.level}" does not match difficulty ${g.difficulty} ` +
                `(expected "${LEVEL_FOR_DIFF[g.difficulty]}")`);
        }
        // The same frame with a different answer ("It is a ___." -> dog / pig)
        // is intentional, so only an identical sentence AND answer is a dupe.
        const key = g.difficulty + '|' + g.sentence + '|' + g.answer;
        if (seenSentences.has(key)) warn(`${at}: identical item repeated at d${g.difficulty}`);
        seenSentences.add(key);
    }

    // ---- per-tier coverage -------------------------------------------------
    for (let d = 0; d <= 8; d++) {
        const nw = theme.words.filter(w => w.difficulty === d).length;
        const ng = theme.grammar.filter(g => g.difficulty === d).length;
        if (nw < MIN_PER_TIER) warn(`${id}: only ${nw} word(s) at d${d}`);
        if (ng < MIN_PER_TIER) warn(`${id}: only ${ng} grammar item(s) at d${d}`);
    }
}

// ---- forLevel() behaves --------------------------------------------------
for (const [level, maxDiff] of [['elementary', 2], ['junior', 4], ['senior', 8]]) {
    for (const t of BANK.forLevel(level)) {
        const over = [...t.words, ...t.grammar].filter(x => x.difficulty > maxDiff);
        if (over.length) err(`forLevel('${level}') leaked ${over.length} item(s) from ${t.id}`);
        if (!t.words.length) err(`forLevel('${level}') left ${t.id} with no words`);
    }
}

// ---- report ----------------------------------------------------------------
const words = BANK.themes.reduce((a, t) => a + t.words.length, 0);
const grammar = BANK.themes.reduce((a, t) => a + t.grammar.length, 0);
console.log(`${BANK.themes.length} themes · ${words} words · ${grammar} grammar items`);

if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach(w => console.log('  ! ' + w));
}
if (errors.length) {
    console.log(`\n${errors.length} error(s):`);
    errors.forEach(e => console.log('  x ' + e));
    process.exit(1);
}
console.log('\nOK — no errors.');
