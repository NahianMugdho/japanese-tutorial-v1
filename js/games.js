/* games page logic is in games.js */
/* =============================================================
   games.js — মনে রাখার গেম (Memory Games)
   Mem (দুর্বল/শক্তিশালী ট্র্যাকিং) ও Prog (XP/স্ট্রিক) app.js-এ আছে
   ============================================================= */
(function () {
    const $ = s => document.querySelector(s);
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const KINDS = { kana: 'অক্ষর', word: 'শব্দ', phrase: 'বাক্য', weak: '😅 দুর্বলগুলো' };
    const SKIP = new Set(['を', 'ヲ', 'ぢ', 'づ', 'ヂ', 'ヅ']);

    /* ---------- সব আইটেম ---------- */
    const ALL = [];
    ['hiragana', 'katakana'].forEach(t => ['basic', 'dak', 'yoon'].forEach(s => kanaTables[t][s].forEach(k => {
        if (k && !SKIP.has(k.jp)) ALL.push({ kind: 'kana', key: 'k:' + k.jp, jp: k.jp, rom: k.romaji, bn: k.bn, say: k.jp });
    })));
    fcAll.forEach(w => ALL.push({ kind: 'word', key: 'w:' + w.jp, jp: w.jp, rom: w.romaji, bn: w.bn, say: w.jp }));
    P.forEach(p => ALL.push({ kind: 'phrase', key: 'p:' + p.j, jp: p.j, rom: p.p, bn: p.m, say: p.j }));

    const itemsOf = p => p === 'weak' ? ALL.filter(i => Mem.isWeak(i.key)) : ALL.filter(i => i.kind === p);
    const labelBn = it => it.kind === 'kana' ? `${it.rom} (${it.bn})` : it.bn;
    const labelJp = it => it.jp;

    function wsample(arr, n) {
        const a = arr.slice(), out = [];
        while (out.length < n && a.length) {
            let t = a.reduce((s, x) => s + Mem.w(x.key), 0), r = Math.random() * t, i = 0;
            for (; i < a.length; i++) { r -= Mem.w(a[i].key); if (r <= 0) break; }
            out.push(a.splice(Math.min(i, a.length - 1), 1)[0]);
        }
        return out;
    }
    function optionsFor(it, labelFn, n = 4) {
        const seen = new Set([labelFn(it)]), ds = [];
        shuffle(ALL.filter(d => d.kind === it.kind && d.key !== it.key && (it.kind !== 'kana' || d.rom !== it.rom))).forEach(d => {
            const l = labelFn(d); if (ds.length < n - 1 && !seen.has(l)) { seen.add(l); ds.push(d); }
        });
        return shuffle([it, ...ds]);
    }

    /* ---------- অবস্থা ---------- */
    let pool = 'kana', curGame = null, cleanup = () => {}, roundBest = 0;
    const GAMES = [
        { id: 'match', icon: '🃏', name: 'মেমোরি ম্যাচ', desc: 'উল্টানো কার্ড মিলিয়ে জোড়া মেলান। চোখ ও কান দুটোই কাজে লাগে।', pools: true, start: startMatch },
        { id: 'listen', icon: '👂', name: 'শুনে চিনুন', desc: 'উচ্চারণ শুনে সঠিক অক্ষর বা অর্থ বেছে নিন।', pools: true, start: startListen },
        { id: 'rain', icon: '🌧️', name: 'কানা বৃষ্টি', desc: 'আকাশ থেকে পড়ছে অক্ষর! মাটিতে পড়ার আগে সঠিক উত্তর দিন।', pools: true, start: startRain },
        { id: 'speed', icon: '⚡', name: 'স্পিড রাউন্ড ৬০', desc: '৬০ সেকেন্ডে যত বেশি পারেন। টানা সঠিক হলে পয়েন্ট বাড়ে।', pools: true, start: startSpeed },
        { id: 'particle', icon: '🧩', name: 'কণা বসাও', desc: 'বাক্যের ফাঁকা জায়গায় সঠিক কণা (は, を, で…) বসান।', pools: false, start: startParticle },
        { id: 'review', icon: '🔁', name: 'দুর্বল রিভিউ', desc: 'যেগুলো ভুলে যান সেগুলো বারবার ফিরিয়ে এনে পাকা করুন।', pools: false, start: startReview }
    ];

    /* ---------- হাব ও স্ট্যাটাস ---------- */
    function renderStats() {
        const xp = Prog.xp, lv = Math.floor(xp / 100) + 1;
        $('#stXP').innerText = xp; $('#stLv').innerText = lv; $('#stStreak').innerText = Prog.streak;
        $('#stWeak').innerText = ALL.filter(i => Mem.isWeak(i.key)).length;
        $('#lvBar').style.width = (xp % 100) + '%'; $('#lvText').innerText = `${xp % 100}/১০০ XP পরের স্তরে`;
        GAMES.forEach(g => { const b = store.g('best_' + g.id, null); const el = $('#best-' + g.id); if (el) el.innerText = b == null ? '' : 'সেরা: ' + b; });
    }
    function renderHub() {
        $('#hub').innerHTML = GAMES.map(g => `
            <button onclick="Games.open('${g.id}')" class="glass-card text-left p-5 rounded-2xl border border-sakura-200 hover:border-sakura-400 hover:shadow-lg hover:-translate-y-0.5 transition space-y-2">
                <div class="flex items-center justify-between"><span class="text-4xl">${g.icon}</span><span id="best-${g.id}" class="text-xs font-bold text-sakura-600"></span></div>
                <h3 class="text-lg font-bold text-slate-800">${g.name}</h3>
                <p class="text-sm text-slate-600">${g.desc}</p>
            </button>`).join('');
        renderStats();
    }
    function renderPoolBar() {
        const g = GAMES.find(x => x.id === curGame);
        const bar = $('#poolBar');
        if (!g.pools) { bar.innerHTML = ''; return; }
        bar.innerHTML = Object.keys(KINDS).map(k => `<button onclick="Games.setPool('${k}')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${k === pool ? 'bg-sakura-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-sakura-50 border border-sakura-200'}">${KINDS[k]}${k === 'weak' ? ' (' + itemsOf('weak').length + ')' : ''}</button>`).join('');
    }
    function openGame(id) {
        stop(); curGame = id;
        const g = GAMES.find(x => x.id === id);
        $('#hub').classList.add('hidden'); $('#gameArea').classList.remove('hidden');
        $('#gameTitle').innerHTML = `${g.icon} ${g.name}`;
        renderPoolBar(); g.start(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function closeGame() { stop(); curGame = null; $('#gameArea').classList.add('hidden'); $('#hub').classList.remove('hidden'); renderStats(); }
    function stop() { try { cleanup(); } catch (e) {} cleanup = () => {}; }
    function setPool(p) { pool = p; renderPoolBar(); restart(); }
    function restart() { stop(); const g = GAMES.find(x => x.id === curGame); if (g) g.start(); }
    function body(html) { $('#gameBody').innerHTML = html; }
    function need(msg) { body(`<div class="glass-card p-8 rounded-2xl border border-sakura-200 text-center space-y-3"><div class="text-5xl">🌸</div><p class="text-slate-700 font-semibold">${msg}</p></div>`); }
    function say(t) { speakJapanese(t); }

    function summary(o) {
        const gain = Prog.add(o.xp);
        const bk = 'best_' + curGame, prev = store.g(bk, null);
        let bestNote = '';
        if (o.best != null && (prev == null || (o.lowerBetter ? o.best < prev : o.best > prev))) { store.s(bk, o.best); bestNote = '<p class="text-sm font-bold text-emerald-600">🎉 নতুন সেরা রেকর্ড!</p>'; }
        body(`<div class="glass-card p-6 sm:p-8 rounded-2xl border border-sakura-200 text-center space-y-4">
            <div class="text-5xl">${o.emoji || '🏆'}</div>
            <h3 class="text-2xl font-bold text-slate-800">${o.title}</h3>
            <p class="text-slate-600">${o.line}</p>${bestNote}
            <p class="text-sm font-bold text-sakura-600">+${gain} XP পেলেন ⭐</p>
            <div class="flex flex-wrap justify-center gap-2 pt-2">
                <button onclick="Games.restart()" class="px-6 py-3 rounded-xl bg-sakura-500 text-white font-bold shadow hover:bg-sakura-600 transition">আবার খেলুন</button>
                <button onclick="Games.close()" class="px-6 py-3 rounded-xl bg-white border border-sakura-300 text-slate-700 font-bold hover:bg-sakura-50 transition">সব গেম</button>
            </div></div>`);
        renderPoolBar();
    }

    /* ---------- সাধারণ MCQ রাউন্ড ইঞ্জিন ---------- */
    function mcRounds(qs, o) {
        let i = 0, score = 0, lock = false;
        function show() {
            const q = qs[i]; lock = false;
            body(`<div class="glass-card p-5 sm:p-8 rounded-2xl border border-sakura-200 space-y-5">
                <div class="flex justify-between items-center text-xs font-bold text-slate-400"><span>প্রশ্ন ${i + 1} / ${qs.length}</span><span>স্কোর: <b class="text-sakura-600 text-base">${score}</b></span></div>
                <div class="h-2 rounded-full bg-sakura-100 overflow-hidden"><div class="h-full bg-gradient-to-r from-sakura-500 to-sakura-300 transition-all" style="width:${i / qs.length * 100}%"></div></div>
                <div class="text-center">${q.prompt}</div>
                <div class="grid ${q.cols || 'grid-cols-1 sm:grid-cols-2'} gap-2.5" id="mcOpts">${q.opts.map((op, k) => `<button data-k="${k}" class="p-4 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-semibold text-slate-700 transition ${q.optCls || ''}">${op.h}</button>`).join('')}</div>
                <div id="mcFb" class="hidden p-3 rounded-xl border text-sm font-semibold"></div></div>`);
            document.querySelectorAll('#mcOpts button').forEach(b => b.onclick = () => pick(+b.dataset.k, b));
            if (q.say && q.autoSay) setTimeout(() => say(q.say), 250);
        }
        function pick(k, b) {
            if (lock) return; lock = true; const q = qs[i], ok = q.opts[k].ok;
            if (q.key) Mem.rec(q.key, ok);
            document.querySelectorAll('#mcOpts button').forEach((x, j) => { if (q.opts[j].ok) x.className = x.className.replace(/border-sakura-200|bg-white/g, '') + ' border-emerald-400 bg-emerald-50 text-emerald-800'; });
            if (!ok) { b.className += ' border-rose-300 bg-rose-50 text-rose-700 shk'; } else { score += 10; }
            const fb = $('#mcFb'); fb.classList.remove('hidden');
            fb.className = 'p-3 rounded-xl border text-sm font-semibold ' + (ok ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800');
            fb.innerHTML = (ok ? '✅ সঠিক! ' : '❌ ভুল। ') + (q.explain || '');
            if (q.sayAfter) say(q.sayAfter);
            setTimeout(() => { i++; if (i >= qs.length) o.done(score, qs.length); else show(); }, 1700);
        }
        show();
    }

    /* ---------- ১. মেমোরি ম্যাচ ---------- */
    function startMatch() {
        const src = itemsOf(pool);
        if (src.length < 2) return need('এই তালিকায় যথেষ্ট আইটেম নেই। অন্য গেম খেলে ভুল করলে এখানে দুর্বল আইটেম জমা হবে।');
        const n = Math.min(8, src.length), picks = wsample(src, n);
        let cards = []; picks.forEach(it => { cards.push({ it, t: 'a', up: false, done: false }); cards.push({ it, t: 'b', up: false, done: false }); });
        cards = shuffle(cards);
        let open = [], moves = 0, matched = 0, lock = false, secs = 0;
        const tm = setInterval(() => { secs++; const e = $('#mmTime'); if (e) e.innerText = secs + 's'; }, 1000);
        cleanup = () => clearInterval(tm);
        const small = picks[0].kind !== 'kana';
        function face(c) {
            if (c.t === 'a') return `<span class="font-japanese font-bold ${picks[0].kind === 'phrase' ? 'text-[11px] leading-tight' : 'text-2xl sm:text-3xl'}">${c.it.jp}</span>`;
            return c.it.kind === 'kana' ? `<span class="font-bold text-lg sm:text-xl">${c.it.rom}<br><span class="text-xs text-slate-500">${c.it.bn}</span></span>` : `<span class="font-semibold ${small ? 'text-[11px] sm:text-xs' : ''} leading-tight">${c.it.bn}</span>`;
        }
        function render() {
            body(`<div class="glass-card p-4 sm:p-6 rounded-2xl border border-sakura-200 space-y-4">
                <div class="flex justify-between text-sm font-bold text-slate-600"><span>চাল: <b id="mmMoves" class="text-sakura-600">${moves}</b></span><span>জোড়া: ${matched}/${n}</span><span>⏱ <b id="mmTime">${secs}s</b></span></div>
                <div class="grid grid-cols-4 gap-2 sm:gap-3">${cards.map((c, i) => `<button data-i="${i}" class="h-20 sm:h-24 rounded-xl border-2 flex items-center justify-center text-center p-1 transition-all ${c.done ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : c.up ? 'bg-white border-sakura-400 text-slate-800 shadow-md' : 'bg-gradient-to-br from-sakura-500 to-sakura-300 border-sakura-300 text-white text-2xl hover:scale-105'}">${c.up || c.done ? face(c) : '？'}</button>`).join('')}</div>
                <p class="text-xs text-slate-500 text-center">জাপানি কার্ডের সঙ্গে তার অর্থ/উচ্চারণ মেলান।</p></div>`);
            document.querySelectorAll('#gameBody [data-i]').forEach(b => b.onclick = () => flip(+b.dataset.i));
        }
        function flip(i) {
            const c = cards[i]; if (lock || c.up || c.done) return;
            c.up = true; open.push(c); if (c.t === 'a') say(c.it.say);
            if (open.length === 2) {
                moves++; lock = true; const [x, y] = open;
                if (x.it.key === y.it.key) {
                    x.done = y.done = true; Mem.rec(x.it.key, true); matched++; open = []; lock = false;
                    render();
                    if (matched === n) { clearInterval(tm); setTimeout(finish, 600); }
                } else {
                    Mem.rec(x.it.key, false); Mem.rec(y.it.key, false); render();
                    setTimeout(() => { x.up = y.up = false; open = []; lock = false; render(); }, 900);
                }
            } else render();
        }
        function finish() {
            const stars = moves <= n + 4 ? 3 : moves <= n * 2 + 2 ? 2 : 1;
            summary({ emoji: '⭐'.repeat(stars), title: 'সব জোড়া মিলেছে!', line: `${moves} চালে, ${secs} সেকেন্ডে শেষ। ${stars}/৩ তারা`, xp: stars * 8 + 4, best: moves, lowerBetter: true });
        }
        render();
    }

    /* ---------- ২. শুনে চিনুন ---------- */
    function startListen() {
        const src = itemsOf(pool); if (!src.length) return need('এই তালিকায় এখনো কোনো আইটেম নেই। আগে অন্য গেম খেলুন।');
        const qs = wsample(src, Math.min(10, src.length)).map(it => {
            const kana = it.kind === 'kana', lf = kana ? labelJp : labelBn;
            return { key: it.key, say: it.say, autoSay: true, cols: kana ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2', optCls: kana ? 'text-3xl font-japanese' : '',
                prompt: `<button onclick="speakJapanese('${esc(it.say).replace(/'/g, '')}')" class="w-24 h-24 rounded-full bg-gradient-to-br from-sakura-500 to-sakura-300 text-white text-4xl shadow-lg hover:scale-105 transition"><i class="fa-solid fa-volume-high"></i></button><p class="text-sm text-slate-500 mt-3">${kana ? 'কোন অক্ষরটি শুনলেন?' : 'এর বাংলা অর্থ কী?'} (আবার শুনতে ট্যাপ করুন)</p>`,
                opts: optionsFor(it, lf).map(d => ({ h: lf(d), ok: d.key === it.key })),
                explain: `${it.jp} = ${it.rom}${it.kind === 'kana' ? '' : ' – ' + it.bn}`, sayAfter: null };
        });
        mcRounds(qs, { done: (s, n) => summary({ title: 'শুনে চেনা শেষ!', line: `আপনার স্কোর <b>${s}/${n * 10}</b>`, xp: Math.round(s / 2) + 3, best: s }) });
    }

    /* ---------- ৩. কানা বৃষ্টি ---------- */
    function startRain() {
        const src = itemsOf(pool); if (!src.length) return need('এই তালিকায় এখনো কোনো আইটেম নেই। আগে অন্য গেম খেলুন।');
        let score = 0, lives = 3, answered = 0, dur = 9000, it = null, y = 0, raf = 0, last = 0, alive = true, opts = [];
        body(`<div class="glass-card p-4 sm:p-5 rounded-2xl border border-sakura-200 space-y-3">
            <div class="flex justify-between text-sm font-bold text-slate-600"><span id="rnLives">❤️❤️❤️</span><span>স্কোর: <b id="rnScore" class="text-sakura-600">0</b></span><span id="rnLevel">স্তর ১</span></div>
            <div id="rnField" style="height:16rem" class="relative h-64 rounded-xl bg-gradient-to-b from-sky-100/80 to-sakura-100/70 border border-sakura-200 overflow-hidden"><div id="rnItem" class="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-white shadow-lg border border-sakura-300 font-japanese font-bold text-slate-800 text-center max-w-[90%]"></div></div>
            <div id="rnOpts" class="grid grid-cols-2 gap-2.5"></div></div>`);
        cleanup = () => { alive = false; cancelAnimationFrame(raf); };
        const field = $('#rnField'), el = $('#rnItem');
        function nextItem() {
            it = wsample(src, 1)[0]; y = 0;
            const lf = labelBn; opts = optionsFor(it, lf);
            el.innerText = it.jp; el.style.fontSize = it.kind === 'phrase' ? '1rem' : '2.25rem';
            $('#rnOpts').innerHTML = opts.map((d, k) => `<button data-k="${k}" class="p-3 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-semibold text-slate-700 text-sm transition">${lf(d)}</button>`).join('');
            document.querySelectorAll('#rnOpts button').forEach(b => b.onclick = () => answer(+b.dataset.k, b));
            say(it.say);
        }
        function hearts() { $('#rnLives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives); }
        function lose(note) {
            Mem.rec(it.key, false); lives--; hearts();
            el.classList.add('shk'); setTimeout(() => el.classList.remove('shk'), 350);
            if (lives <= 0) return end();
            el.innerText = it.jp + ' = ' + labelBn(it); setTimeout(() => { if (alive) nextItem(); }, 1100); y = -9;
        }
        function answer(k, b) {
            if (y < 0) return;
            if (opts[k].key === it.key) {
                Mem.rec(it.key, true); score += 10 + Math.min(answered, 20); answered++; $('#rnScore').innerText = score;
                if (answered % 5 === 0) { dur = Math.max(3500, dur - 800); $('#rnLevel').innerText = 'স্তর ' + (Math.floor(answered / 5) + 1); }
                nextItem();
            } else { b.className += ' opacity-40 shk'; lose(); }
        }
        function end() { cancelAnimationFrame(raf); alive = false; summary({ emoji: '🌧️', title: 'খেলা শেষ!', line: `স্কোর <b>${score}</b> · ${answered}টি সঠিক`, xp: Math.round(score / 8) + 2, best: score }); }
        function loop(ts) {
            if (!alive) return; const dt = last ? ts - last : 0; last = ts;
            if (y >= 0) { y += dt / dur; if (y >= 1) { y = -9; lose(); } else { el.style.top = (y * (field.clientHeight - el.offsetHeight)) + 'px'; } }
            raf = requestAnimationFrame(loop);
        }
        hearts(); nextItem(); raf = requestAnimationFrame(loop);
    }

    /* ---------- ৪. স্পিড রাউন্ড ---------- */
    function startSpeed() {
        const src = itemsOf(pool); if (!src.length) return need('এই তালিকায় এখনো কোনো আইটেম নেই। আগে অন্য গেম খেলুন।');
        let t = 60, score = 0, combo = 0, right = 0, total = 0, it, opts, lock = false;
        body(`<div class="glass-card p-5 sm:p-6 rounded-2xl border border-sakura-200 space-y-4">
            <div class="flex justify-between items-center text-sm font-bold text-slate-600"><span>⏱ <b id="spT" class="text-xl text-sakura-600">60</b>s</span><span id="spCombo" class="text-amber-600"></span><span>স্কোর: <b id="spScore" class="text-sakura-600 text-xl">0</b></span></div>
            <div class="h-2 rounded-full bg-sakura-100 overflow-hidden"><div id="spBar" class="h-full bg-gradient-to-r from-sakura-500 to-sakura-300" style="width:100%"></div></div>
            <div id="spQ" class="text-center"></div><div id="spOpts" class="grid grid-cols-2 gap-2.5"></div></div>`);
        const tm = setInterval(() => { t--; $('#spT').innerText = t; $('#spBar').style.width = (t / 60 * 100) + '%'; if (t <= 0) { clearInterval(tm); end(); } }, 1000);
        cleanup = () => clearInterval(tm);
        function next() {
            it = wsample(src, 1)[0]; lock = false; opts = optionsFor(it, labelBn);
            $('#spQ').innerHTML = `<div class="font-japanese font-bold text-slate-800 ${it.kind === 'phrase' ? 'text-xl' : 'text-5xl'} py-2">${it.jp}</div>`;
            $('#spOpts').innerHTML = opts.map((d, k) => `<button data-k="${k}" class="p-3 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-semibold text-slate-700 text-sm transition">${labelBn(d)}</button>`).join('');
            document.querySelectorAll('#spOpts button').forEach(b => b.onclick = () => pick(+b.dataset.k, b));
        }
        function pick(k, b) {
            if (lock) return; lock = true; total++;
            if (opts[k].key === it.key) {
                Mem.rec(it.key, true); right++; score += 10 * (1 + Math.floor(combo / 5)); combo++; b.className += ' bg-emerald-100 border-emerald-400';
            } else { Mem.rec(it.key, false); combo = 0; b.className += ' bg-rose-100 border-rose-300 shk'; }
            $('#spScore').innerText = score; $('#spCombo').innerText = combo >= 3 ? `🔥 কম্বো ×${1 + Math.floor(combo / 5)} (${combo})` : '';
            setTimeout(() => { if (t > 0) next(); }, 280);
        }
        function end() { summary({ emoji: '⚡', title: 'সময় শেষ!', line: `স্কোর <b>${score}</b> · ${right}/${total} সঠিক`, xp: Math.round(score / 10) + 2, best: score }); }
        next();
    }

    /* ---------- ৫. কণা বসাও ---------- */
    const PT = [
        ['私＿学生です。', 'は', ['は', 'を', 'で', 'か'], 'আমি ছাত্র। (は = প্রসঙ্গ)'],
        ['水＿飲みます。', 'を', ['を', 'は', 'の', 'で'], 'পানি পান করি। (を = কর্ম)'],
        ['大学＿勉強します。', 'で', ['で', 'を', 'の', 'か'], 'বিশ্ববিদ্যালয়ে পড়ি। (で = কাজের স্থান)'],
        ['ベトナム＿来ました。', 'から', ['から', 'まで', 'に', 'を'], 'ভিয়েতনাম থেকে এসেছি। (から = থেকে)'],
        ['九時から五時＿です。', 'まで', ['まで', 'から', 'に', 'を'], '৯টা থেকে ৫টা পর্যন্ত। (まで = পর্যন্ত)'],
        ['これは何です＿。', 'か', ['か', 'を', 'の', 'で'], 'এটা কী? (か = প্রশ্ন)'],
        ['私＿本です。', 'の', ['の', 'を', 'で', 'から'], 'এটা আমার বই। (の = এর)'],
        ['北海道＿行きます。', 'に', ['に', 'を', 'の', 'まで'], 'হোক্কাইদোতে যাই। (に = দিকে)'],
        ['あなた＿学生ですか。', 'も', ['も', 'を', 'で', 'から'], 'আপনিও কি ছাত্র? (も = ও)'],
        ['猫＿います。', 'が', ['が', 'を', 'で', 'まで'], 'বিড়াল আছে। (が = কর্তা, います = আছে)'],
        ['毎日マンガ＿読みます。', 'を', ['を', 'で', 'に', 'の'], 'প্রতিদিন মাংগা পড়ি। (を = কর্ম)'],
        ['駅＿どこですか。', 'は', ['は', 'を', 'で', 'の'], 'স্টেশন কোথায়? (は = প্রসঙ্গ)'],
        ['学校＿本を読みます。', 'で', ['で', 'を', 'の', 'か'], 'স্কুলে বই পড়ি। (で = স্থান)'],
        ['友達＿会います。', 'に', ['に', 'を', 'の', 'まで'], 'বন্ধুর সঙ্গে দেখা করি। (に = কার সঙ্গে)'],
        ['先生＿本です。', 'の', ['の', 'を', 'で', 'か'], 'শিক্ষকের বই। (の = এর)']
    ];
    function startParticle() {
        const qs = shuffle(PT).slice(0, 10).map(([s, ans, opts, ex]) => {
            const full = s.replace('＿', ans);
            return { say: null, sayAfter: full, cols: 'grid-cols-2', optCls: 'text-2xl font-japanese',
                prompt: `<p class="text-xs text-slate-500 mb-2">ফাঁকা জায়গায় কোন কণা বসবে?</p><p class="text-2xl sm:text-3xl font-bold font-japanese text-slate-800">${s.replace('＿', '<span class="inline-block min-w-[2.2rem] mx-1 px-2 rounded-lg bg-sakura-100 text-sakura-600 border-b-4 border-sakura-400">？</span>')}</p>`,
                opts: shuffle(opts).map(o => ({ h: o, ok: o === ans })), explain: `${full} — ${ex}` };
        });
        mcRounds(qs, { done: (s, n) => summary({ emoji: '🧩', title: 'কণা অনুশীলন শেষ!', line: `স্কোর <b>${s}/${n * 10}</b>`, xp: Math.round(s / 2) + 3, best: s }) });
    }

    /* ---------- ৬. দুর্বল রিভিউ ---------- */
    function startReview() {
        const wk = ALL.filter(i => Mem.isWeak(i.key));
        if (!wk.length) return need('🎉 এখন কোনো দুর্বল আইটেম নেই! অন্য গেম খেলুন, ভুল করা অক্ষর-শব্দ এখানে জমা হবে।');
        const queue = wsample(wk, Math.min(10, wk.length)); let done = 0, total = queue.length, shown = false, requeued = new Set(), ok = 0;
        function show() {
            const it = queue[0]; shown = false;
            body(`<div class="glass-card p-5 sm:p-8 rounded-2xl border-2 border-sakura-300 text-center space-y-4">
                <div class="text-xs font-bold text-slate-400">বাকি: ${queue.length} · মনে ছিল: ${ok}</div>
                <div class="font-japanese font-bold text-slate-800 ${it.kind === 'phrase' ? 'text-2xl' : 'text-6xl'} py-3 break-words">${it.jp}</div>
                <button onclick="speakJapanese('${esc(it.say).replace(/'/g, '')}')" class="px-4 py-2 rounded-full bg-sakura-100 text-sakura-600 text-sm font-bold"><i class="fa-solid fa-volume-high mr-1"></i> শুনুন</button>
                <p class="text-sm text-slate-500">আগে মনে করার চেষ্টা করুন, তারপর উত্তর দেখুন।</p>
                <div id="rvAns" class="hidden space-y-1"><p class="text-lg text-slate-700 italic">${it.rom}</p><p class="text-xl font-bold text-sakura-600">${it.bn}</p></div>
                <div id="rvBtns"><button id="rvShow" class="px-6 py-3 rounded-xl bg-sakura-500 text-white font-bold shadow hover:bg-sakura-600 transition">উত্তর দেখুন</button></div></div>`);
            say(it.say);
            $('#rvShow').onclick = () => {
                $('#rvAns').classList.remove('hidden');
                $('#rvBtns').innerHTML = `<div class="grid grid-cols-2 gap-3"><button id="rvNo" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 font-bold">😅 ভুলে গিয়েছিলাম</button><button id="rvYes" class="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold">✅ মনে ছিল</button></div>`;
                $('#rvYes').onclick = () => rate(true); $('#rvNo').onclick = () => rate(false);
            };
        }
        function rate(good) {
            const it = queue.shift(); Mem.rec(it.key, good); if (good) ok++; else if (!requeued.has(it.key)) { requeued.add(it.key); queue.push(it); total++; }
            done++;
            if (!queue.length) summary({ emoji: '🔁', title: 'রিভিউ শেষ!', line: `${ok}টি মনে ছিল। যেগুলো ভুলেছেন সেগুলো আবার আসবে।`, xp: ok * 3 + 2, best: ok });
            else show();
        }
        show();
    }

    window.Games = { open: openGame, close: closeGame, setPool, restart };
    document.addEventListener('DOMContentLoaded', renderHub);
})();
