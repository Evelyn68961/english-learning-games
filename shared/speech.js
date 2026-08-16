// Thin wrapper over the Web Speech API.
//
// For a beginner, hearing the word is half the learning, so Word Town speaks
// every word and every sentence. Browser TTS is free and offline-capable, but
// it is also inconsistent: voices load asynchronously, some platforms have no
// English voice at all, and file:// pages sometimes block it outright. Every
// call here is safe to make regardless — when speech is unavailable the calls
// are silent no-ops rather than throwing.

(function () {

const SUPPORTED = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';

let preferredVoice = null;
let enabled = true;

// Voices populate asynchronously in most browsers, so pick again whenever the
// list changes rather than caching one lookup at load.
function pickVoice() {
    if (!SUPPORTED) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;

    const en = voices.filter(v => /^en(-|_|$)/i.test(v.lang || ''));
    if (!en.length) return null;

    // Prefer a natural-sounding en-US/en-GB voice; fall back to any English.
    const byName = en.find(v => /natural|premium|enhanced|google|samantha|aria/i.test(v.name));
    const byLang = en.find(v => /^en-(US|GB)/i.test(v.lang));
    return byName || byLang || en[0];
}

if (SUPPORTED) {
    preferredVoice = pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        preferredVoice = pickVoice();
    });
}

// Speak `text`. Cancels anything still speaking so rapid taps don't queue up a
// backlog the child has to sit through. `rate` defaults slow — these are
// beginners, and the default rate is too fast to imitate.
function speak(text, opts) {
    if (!SUPPORTED || !enabled || !text) return;
    const o = opts || {};
    try {
        window.speechSynthesis.cancel();
        const u = new window.SpeechSynthesisUtterance(String(text));
        if (preferredVoice) u.voice = preferredVoice;
        u.lang = (preferredVoice && preferredVoice.lang) || 'en-US';
        u.rate = o.rate != null ? o.rate : 0.85;
        u.pitch = o.pitch != null ? o.pitch : 1.05;
        u.volume = o.volume != null ? o.volume : 1;
        window.speechSynthesis.speak(u);
    } catch (e) {
        // A blocked or broken synthesiser must never interrupt the game.
    }
}

// Say a word, pause, then say it again inside its sentence. Used when a child
// meets a property for the first time.
function speakWordThenSentence(word, sentence) {
    if (!SUPPORTED || !enabled) return;
    speak(word);
    if (!sentence || sentence === word) return;
    window.setTimeout(() => {
        // Only chain if nothing else has since taken over the channel.
        if (enabled) speak(sentence, { rate: 0.8 });
    }, Math.max(700, word.length * 110));
}

function stop() {
    if (!SUPPORTED) return;
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
}

function setEnabled(on) {
    enabled = !!on;
    if (!enabled) stop();
}

window.SPEECH = {
    supported: SUPPORTED,
    speak,
    speakWordThenSentence,
    stop,
    setEnabled,
    isEnabled: () => enabled,
};

})();
