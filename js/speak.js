/* speak.js */

/* -------------------------------------------------------------
           6. SPEAK MODULE (daily phrases)
           ------------------------------------------------------------- */
        const PH = P; let phCat = 'সব', hideMeaning = false;
        const phCats = ['সব', ...new Set(PH.map(p => p.c))];
        function renderPhrases() {
            document.getElementById('phraseChips').innerHTML = phCats.map(c => `<button onclick="setPhCat('${c}')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${c === phCat ? 'bg-sakura-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-sakura-50 border border-sakura-200'}">${c}</button>`).join('');
            document.getElementById('phraseGrid').innerHTML = PH.map((p, i) => ({ p, i })).filter(o => phCat === 'সব' || o.p.c === phCat).map(({ p, i }) => `
                <div class="glass-card p-4 rounded-2xl border border-sakura-200 space-y-1 hover:shadow-md transition">
                    <p class="text-lg sm:text-xl font-bold font-japanese text-slate-800 break-words">${p.j}</p>
                    <p class="text-xs text-slate-400 italic">${p.p}</p>
                    <p class="text-sm text-slate-700 ${hideMeaning ? 'blur-m' : ''}" onclick="this.classList.remove('blur-m')">${p.m}</p>
                    <div class="flex flex-wrap items-center gap-2 pt-2">
                        <button onclick="speakJapanese(PH[${i}].j)" class="px-3 py-1.5 rounded-lg bg-sakura-100 text-sakura-600 hover:bg-sakura-200 text-xs font-bold transition"><i class="fa-solid fa-volume-high mr-1"></i> শুনুন</button>
                        <button onclick="micCheck(${i}, this.nextElementSibling)" class="px-3 py-1.5 rounded-lg bg-white border border-sakura-300 text-slate-700 hover:bg-sakura-50 text-xs font-bold transition"><i class="fa-solid fa-microphone mr-1"></i> বলুন</button>
                        <span class="text-xs text-slate-500 w-full sm:w-auto"></span>
                    </div>
                </div>`).join('');
        }
        function setPhCat(c) { phCat = c; renderPhrases(); }
        function toggleHideMeaning() {
            hideMeaning = !hideMeaning;
            document.getElementById('hideMeaningBtn').innerHTML = hideMeaning ? '<i class="fa-solid fa-eye mr-1"></i> অর্থ দেখান' : '<i class="fa-solid fa-eye-slash mr-1"></i> অর্থ লুকান';
            renderPhrases();
        }
        function micCheck(i, el) {
            const R = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!R) { el.textContent = 'এই ব্রাউজারে মাইক নেই, Chrome ব্যবহার করুন'; return; }
            const r = new R(); r.lang = 'ja-JP';
            const n = s => s.replace(/[\s、。？！?]/g, '');
            r.onresult = e => { const t = e.results[0][0].transcript; el.textContent = (n(t) === n(PH[i].j) ? '✅ ' : '🔁 আবার চেষ্টা করুন: ') + 'আপনি বলেছেন: ' + t; };
            r.onerror = () => el.textContent = 'মাইক চালু হয়নি';
            r.start(); el.textContent = '🎤 শুনছি...';
        }
        function startMiniQuiz() {
            const a = PH[Math.random() * PH.length | 0], o = [a];
            while (o.length < 4) { const b = PH[Math.random() * PH.length | 0]; if (!o.includes(b)) o.push(b); }
            o.sort(() => Math.random() - .5);
            const box = document.getElementById('miniQuiz');
            box.innerHTML = `<div class="glass-card p-5 sm:p-6 rounded-2xl border-2 border-sakura-300 space-y-3">
                <h3 id="mqTitle" class="text-base sm:text-lg font-bold text-slate-800">"${a.m}" জাপানিতে কী বলে?</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">${o.map((b, i) => `<button data-i="${i}" class="mq-opt p-3 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-bold font-japanese text-slate-700 transition text-left">${b.j}</button>`).join('')}</div></div>`;
            let lock = false;
            box.querySelectorAll('.mq-opt').forEach((b, i) => b.onclick = () => {
                if (lock) return;
                if (o[i] === a) { lock = true; Mem.rec('p:' + a.j, true); speakJapanese(a.j); document.getElementById('mqTitle').innerHTML = '✅ ' + a.p; b.className = 'mq-opt p-3 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-800 font-bold font-japanese text-left'; setTimeout(startMiniQuiz, 1500); }
                else { Mem.rec('p:' + a.j, false); b.classList.add('opacity-40', 'shk'); }
            });
        }

        
document.addEventListener('DOMContentLoaded', () => {
        renderPhrases();
});
