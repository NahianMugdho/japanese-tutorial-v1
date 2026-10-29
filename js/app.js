/* app.js — সব পেজের কমন কোড: হেডার, ফুটার, সাকুরা, অডিও, স্টোরেজ, XP/স্ট্রিক, দুর্বল-ট্র্যাকিং */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const store = {
    g(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    s(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- অডিও ---------- */
let audioEnabled = store.g('audio', true);
function speakJapanese(text) {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
}
function audioIcon() { return audioEnabled ? '<i class="fa-solid fa-volume-high text-lg"></i>' : '<i class="fa-solid fa-volume-xmark text-lg text-slate-400"></i>'; }
function toggleAudio() {
    audioEnabled = !audioEnabled; store.s('audio', audioEnabled);
    document.getElementById('ttsToggleBtn').innerHTML = audioIcon();
    if (!audioEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
function toggleMobileMenu() { document.getElementById('mobileMenu').classList.toggle('hidden'); }

/* ---------- মনে রাখার ট্র্যাকিং: কোনটা দুর্বল? ---------- */
const Mem = {
    d: store.g('mem', {}),
    rec(k, ok) { const a = this.d[k] || [0, 0]; ok ? a[0]++ : a[1]++; this.d[k] = a; store.s('mem', this.d); },
    isWeak(k) { const a = this.d[k]; return !!a && a[1] > a[0]; },
    w(k) { const a = this.d[k] || [0, 0]; return Math.max(0.4, 1 + 2.5 * a[1] - 0.5 * Math.min(a[0], 4)); }
};
/* ---------- XP, স্তর, দৈনিক স্ট্রিক ---------- */
const Prog = {
    get xp() { return store.g('xp', 0); },
    get streak() { const last = store.g('lastDay', ''); const t = this.day(0), y = this.day(-1); return (last === t || last === y) ? store.g('streak', 0) : 0; },
    day(off) { const d = new Date(); d.setDate(d.getDate() + off); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); },
    add(n) {
        n = Math.max(0, Math.round(n)); store.s('xp', this.xp + n);
        const t = this.day(0), last = store.g('lastDay', '');
        if (last !== t) { store.s('streak', last === this.day(-1) ? store.g('streak', 0) + 1 : 1); store.s('lastDay', t); }
        return n;
    }
};

/* ---------- হেডার ও ফুটার ---------- */
const TABS = [["index.html", "home", "fa-house", "হোম", " (Home)"], ["kana.html", "kana", "あ", "বর্ণমালা", " (Kana)"], ["lessons.html", "lessons", "fa-book-open", "NHK পাঠ", " (Lessons)"], ["grammar.html", "grammar", "fa-shapes", "ব্যাকরণ", " (Grammar)"], ["flashcards.html", "flashcards", "fa-clone", "কার্ড", " (Cards)"], ["quiz.html", "quiz", "fa-clipboard-question", "কুইজ", " (Quiz)"], ["speak.html", "speak", "fa-comments", "কথা", " (Speak)"], ["games.html", "games", "fa-gamepad", "গেম", " (Games)"]];
function buildChrome() {
    const page = document.body.dataset.page, wrap = document.getElementById('pageWrap'), main = wrap.querySelector('main');
    const ic = t => t[2] === 'あ' ? '<i class="fa-solid font-japanese text-sm">あ</i>' : `<i class="fa-solid ${t[2]} text-sm"></i>`;
    const nav = TABS.map(t => `<a href="${t[0]}" class="nav-btn px-2.5 xl:px-3 py-2 rounded-xl text-[13px] xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${t[1] === page ? 'bg-sakura-500 text-white shadow-sm' : 'text-slate-600 hover:text-sakura-600 hover:bg-sakura-50'}">
        <span class="hidden xl:inline">${ic(t)}</span> ${t[3]}<span class="hidden 2xl:inline">${t[4]}</span></a>`).join('');
    const mob = TABS.map(t => `<a href="${t[0]}" class="block w-full text-left px-3 py-2.5 rounded-lg font-medium ${t[1] === page ? 'bg-sakura-100 text-sakura-600' : 'text-slate-700 hover:bg-sakura-50'}">${t[3]}${t[4]}</a>`).join('');
    const h = document.createElement('header');
    h.className = 'glass-card sticky top-0 z-50 border-b border-sakura-200 shadow-sm';
    h.innerHTML = `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <a href="index.html" class="flex items-center space-x-3 min-w-0">
            <div class="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-sakura-500 to-sakura-300 flex items-center justify-center text-white text-xl font-bold font-japanese shadow-md">あ</div>
            <div class="min-w-0"><h1 class="text-lg sm:text-xl font-bold text-slate-800 leading-none truncate">সহজে জাপানি ভাষা</h1>
            <p class="text-[11px] sm:text-xs text-sakura-600 font-medium truncate">সহজ ও আনন্দদায়ক জাপানি শেখা</p></div></a>
        <nav class="hidden lg:flex space-x-0.5 xl:space-x-1">${nav}</nav>
        <div class="flex items-center space-x-2 flex-shrink-0">
            <button id="ttsToggleBtn" onclick="toggleAudio()" class="p-2.5 w-10 h-10 rounded-full bg-white shadow-sm border border-sakura-200 text-sakura-600 hover:bg-sakura-50 transition" title="অডিও সক্রিয়/নিষ্ক্রিয় করুন">${audioIcon()}</button>
            <div class="lg:hidden"><button onclick="toggleMobileMenu()" class="p-2 w-10 h-10 rounded-lg text-slate-600 hover:bg-sakura-100"><i class="fa-solid fa-bars text-xl"></i></button></div>
        </div></div>
        <div id="mobileMenu" class="hidden lg:hidden px-4 pt-2 pb-4 space-y-1 border-t border-sakura-100 bg-white/95">${mob}</div>`;
    wrap.insertBefore(h, main);
    wrap.insertAdjacentHTML('beforeend', `<footer class="mt-auto py-6 border-t border-sakura-200 bg-white/60 backdrop-blur">
            <div class="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                <p>© 2026 সহজে জাপানি ভাষা (Learn Japanese in Bengali) | NHK World-Japan কারিকুলাম ভিত্তিক</p>
            </div>
        </footer>`);
}
/* ---------- সাকুরা ব্যাকগ্রাউন্ড ---------- */
function initSakuraPetals() {
    const container = document.getElementById('sakuraContainer');
    const n = window.innerWidth < 640 ? 10 : 18;
    for (let i = 0; i < n; i++) {
        const p = document.createElement('div'); p.className = 'petal';
        const size = Math.random() * 12 + 10;
        p.style.width = size + 'px'; p.style.height = (size + 5) + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 8 + 7) + 's';
        p.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(p);
    }
}
document.addEventListener('DOMContentLoaded', () => { buildChrome(); initSakuraPetals(); });
