/* kana.js */
let currentKanaType = 'hiragana';
let currentKanaSet = 'basic';
let selectedKana = null;
/* -------------------------------------------------------------
           1. KANA GRID MODULE
           ------------------------------------------------------------- */
        const segOn = 'bg-white text-sakura-600 shadow-sm', segOff = 'text-slate-600 hover:text-sakura-600';
        function setKanaType(type) {
            currentKanaType = type;
            const base = (id, on, extra) => { document.getElementById(id).className = extra + ' ' + (on ? segOn : segOff); };
            base('btn-hiragana', type === 'hiragana', 'flex-1 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all');
            base('btn-katakana', type === 'katakana', 'flex-1 px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all');
            selectKanaIdx = null;
            renderKanaGrid();
        }
        function setKanaSet(set) {
            currentKanaSet = set;
            ['basic', 'dak', 'yoon'].forEach(s => {
                document.getElementById('set-' + s).className = 'flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ' + (s === set ? segOn : segOff);
            });
            renderKanaGrid();
        }
        var selectKanaIdx = null;

        function currentKanaItems() { return kanaTables[currentKanaType][currentKanaSet]; }

        function renderKanaGrid() {
            const grid = document.getElementById('kanaGrid');
            grid.innerHTML = '';
            grid.className = currentKanaSet === 'yoon'
                ? 'grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2.5 sm:gap-3'
                : 'grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2.5 sm:gap-3';

            currentKanaItems().forEach((item) => {
                if (!item) { const g = document.createElement('div'); g.className = 'invisible'; grid.appendChild(g); return; }
                const card = document.createElement('div');
                card.className = "glass-card hover:bg-sakura-100/80 p-2 sm:p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer border border-sakura-200 hover:border-sakura-400 hover:scale-105 transition-all group";
                card.onclick = () => showKanaDetail(item);
                card.innerHTML = `
                    <span class="text-2xl sm:text-3xl font-bold font-japanese text-slate-800 group-hover:text-sakura-600 transition">${item.jp}</span>
                    <span class="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 text-center leading-tight">${item.romaji} (${item.bn})</span>
                `;
                grid.appendChild(card);
            });
        }

        function showKanaDetail(item) {
            selectedKana = item;
            const card = document.getElementById('kanaDetailCard');
            card.classList.remove('hidden');
            document.getElementById('modalChar').innerText = item.jp;
            document.getElementById('modalKanaType').innerText = currentKanaType.toUpperCase();
            document.getElementById('modalRomaji').innerText = `${item.romaji.toUpperCase()} (${item.bn})`;
            document.getElementById('modalBengali').innerHTML = `বাংলা ধ্বনি: <b>"${item.bn}"</b>`;
            document.getElementById('modalExample').innerHTML = item.ex ? `উদাহরণ শব্দ: <b>${item.ex}</b>` : '';
            document.getElementById('modalAudioBtn').onclick = () => speakJapanese(item.jp);
            document.getElementById('ghostChar').innerText = item.jp;
            clearKanaCanvas();
            speakJapanese(item.jp);
        }

        function closeKanaDetail() {
            document.getElementById('kanaDetailCard').classList.add('hidden');
        }

        // Handwriting canvas
        let kctx, kdrawing = false;
        function initKanaCanvas() {
            const cv = document.getElementById('kcv');
            kctx = cv.getContext('2d');
            kctx.lineWidth = 14; kctx.lineCap = 'round'; kctx.lineJoin = 'round'; kctx.strokeStyle = '#e64980';
            const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 280 / r.width, (e.clientY - r.top) * 280 / r.height]; };
            cv.onpointerdown = e => { kdrawing = true; kctx.beginPath(); kctx.moveTo(...pos(e)); cv.setPointerCapture(e.pointerId); };
            cv.onpointermove = e => { if (kdrawing) { kctx.lineTo(...pos(e)); kctx.stroke(); } };
            cv.onpointerup = cv.onpointercancel = () => kdrawing = false;
        }
        function clearKanaCanvas() { if (kctx) kctx.clearRect(0, 0, 280, 280); }
        function toggleGuide() {
            const g = document.getElementById('ghostChar'), b = document.getElementById('guideBtn');
            const hide = g.style.visibility !== 'hidden';
            g.style.visibility = hide ? 'hidden' : 'visible';
            b.innerHTML = hide ? '<i class="fa-solid fa-eye mr-1"></i> গাইড দেখান' : '<i class="fa-solid fa-eye-slash mr-1"></i> গাইড লুকান';
        }
        function speakSelectedKana() { if (selectedKana) speakJapanese(selectedKana.jp); else speakJapanese(document.getElementById('ghostChar').innerText); }

        // Kana quiz
        let kqStreak = 0, kqBest = store.g('kanaBest', 0), kqAns = null, kqLock = false;
        function startKanaQuiz() { kqStreak = 0; nextKanaQ(); }
        function nextKanaQ() {
            const pool = currentKanaItems().filter(Boolean);
            const pick = () => pool[Math.random() * pool.length | 0];
            const ans = pick(); const opts = [ans];
            let guard = 0;
            while (opts.length < 4 && guard++ < 200) { const o = pick(); if (!opts.some(x => x.romaji === o.romaji)) opts.push(o); }
            opts.sort(() => Math.random() - .5);
            kqAns = ans; kqLock = false;
            document.getElementById('kanaQuiz').innerHTML = `
                <div id="kqChar" class="text-center text-6xl sm:text-7xl font-bold font-japanese text-slate-800 py-2">${ans.jp}</div>
                <div class="grid grid-cols-2 gap-2.5">${opts.map((o, i) => `<button data-i="${i}" class="kq-opt p-3 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-semibold text-slate-700 transition text-sm">${o.romaji} (${o.bn})</button>`).join('')}</div>
                <p class="text-center text-xs text-slate-500 font-semibold mt-2">টানা সঠিক: ${kqStreak}</p>`;
            document.querySelectorAll('.kq-opt').forEach((b, i) => b.onclick = () => {
                if (kqLock) return;
                if (opts[i].romaji === ans.romaji) {
                    kqLock = true; kqStreak++; Mem.rec('k:' + ans.jp, true);
                    if (kqStreak > kqBest) { kqBest = kqStreak; store.s('kanaBest', kqBest); }
                    document.getElementById('kqBest').innerText = 'সেরা টানা সঠিক: ' + kqBest;
                    b.className = 'kq-opt p-3 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold text-sm';
                    speakJapanese(ans.jp); setTimeout(nextKanaQ, 700);
                } else {
                    kqStreak = 0; Mem.rec('k:' + ans.jp, false);
                    b.className = 'kq-opt p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 font-semibold text-sm opacity-60 shk';
                }
            });
        }

        
document.addEventListener('DOMContentLoaded', () => {
        renderKanaGrid();
        initKanaCanvas();
        document.getElementById('kqBest').innerText = 'সেরা টানা সঠিক: ' + kqBest;
});
