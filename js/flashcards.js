/* flashcards.js */
let currentFlashcardIdx = 0;
let isFlashcardFlipped = false;
let fcCat = 'সব';
/* -------------------------------------------------------------
           4. FLASHCARDS MODULE
           ------------------------------------------------------------- */
        function renderFcChips() {
            const cats = ['সব', ...new Set(fcAll.map(c => c.cat))];
            document.getElementById('fcChips').innerHTML = cats.map(c => `<button onclick="setFcCat('${c}')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${c === fcCat ? 'bg-sakura-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-sakura-50 border border-sakura-200'}">${c}</button>`).join('');
        }
        function setFcCat(c) {
            fcCat = c;
            flashcardsData.length = 0;
            fcAll.filter(x => c === 'সব' || x.cat === c).forEach(x => flashcardsData.push(x));
            currentFlashcardIdx = 0;
            renderFcChips();
            updateFlashcardUI();
        }
        function shuffleFlashcards() {
            flashcardsData.sort(() => Math.random() - 0.5);
            currentFlashcardIdx = 0;
            updateFlashcardUI();
        }
        function updateFlashcardUI() {
            const item = flashcardsData[currentFlashcardIdx];
            document.getElementById('flashcardIndex').innerText = `${currentFlashcardIdx + 1} / ${flashcardsData.length}`;
            isFlashcardFlipped = false;
            document.getElementById('flashcardInner').classList.remove('rotate-y-180');
            setTimeout(() => {
                document.getElementById('fcJapanese').innerText = item.jp;
                document.getElementById('fcRomaji').innerText = item.romaji;
                document.getElementById('fcBengali').innerText = item.bn;
                document.getElementById('fcCategory').innerText = item.cat;
            }, 120);
        }
        function flipFlashcard() {
            isFlashcardFlipped = !isFlashcardFlipped;
            document.getElementById('flashcardInner').classList.toggle('rotate-y-180', isFlashcardFlipped);
        }
        function prevFlashcard() { currentFlashcardIdx = (currentFlashcardIdx - 1 + flashcardsData.length) % flashcardsData.length; updateFlashcardUI(); }
        function nextFlashcard() { currentFlashcardIdx = (currentFlashcardIdx + 1) % flashcardsData.length; updateFlashcardUI(); }
        function playCurrentFlashcardAudio() { speakJapanese(flashcardsData[currentFlashcardIdx].jp); }
        (function () { let sx = 0; document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
            document.getElementById('tab-flashcards').addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 70) { d < 0 ? nextFlashcard() : prevFlashcard(); } }); })();

        
        function markCard(ok) {
            const it = flashcardsData[currentFlashcardIdx]; if (!it) return;
            Mem.rec('w:' + it.jp, ok);
            const st = document.getElementById('fcStatus');
            st.innerText = ok ? '✅ দারুণ! মনে আছে।' : '😅 ঠিক আছে, কঠিন শব্দ হিসেবে রাখা হলো — গেমে এটি বেশি করে আসবে।';
            updateHardCount(); setTimeout(() => { st.innerText = ''; nextFlashcard(); }, 700);
        }
        function updateHardCount() {
            const n = fcAll.filter(x => Mem.isWeak('w:' + x.jp)).length;
            document.getElementById('hardCount').innerText = n ? `😅 কঠিন শব্দ: ${n}টি (গেম পেজে "দুর্বল রিভিউ" খেলুন)` : '';
        }

document.addEventListener('DOMContentLoaded', () => {
        renderFcChips();
        updateFlashcardUI();
        updateHardCount();
});
