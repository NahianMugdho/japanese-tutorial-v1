/* lessons.js */
let currentLessonIdx = 0;
let doneLessons = store.g('doneLessons', []);
/* -------------------------------------------------------------
           2. NHK LESSONS MODULE
           ------------------------------------------------------------- */
        function renderLessons() {
            const pillsContainer = document.getElementById('lessonPills');
            pillsContainer.innerHTML = '';
            lessonsAll.forEach((lesson, index) => {
                const btn = document.createElement('button');
                btn.onclick = () => selectLesson(index);
                const done = doneLessons.includes(lesson.id);
                btn.className = `px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                    index === currentLessonIdx
                    ? 'bg-sakura-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-sakura-50 border border-sakura-200'
                }`;
                btn.innerText = `${done ? '✓ ' : ''}পাঠ ${lesson.id}`;
                pillsContainer.appendChild(btn);
            });
            const active = pillsContainer.children[currentLessonIdx];
            if (active && active.scrollIntoView) { pillsContainer.scrollTo({ left: active.offsetLeft - 16, behavior: 'smooth' }); }
            document.getElementById('lessonProgText').innerText = `${doneLessons.length}/${lessonsAll.length} পাঠ শেষ`;
            document.getElementById('lessonProgBar').style.width = (doneLessons.length / lessonsAll.length * 100) + '%';
            renderLessonContent();
        }

        function selectLesson(idx) {
            currentLessonIdx = idx;
            renderLessons();
        }

        function toggleLessonDone() {
            const id = lessonsAll[currentLessonIdx].id;
            const was = doneLessons.includes(id); doneLessons = was ? doneLessons.filter(x => x !== id) : [...doneLessons, id]; if (!was) Prog.add(10);
            store.s('doneLessons', doneLessons);
            renderLessons();
        }

        function renderLessonContent() {
            const lesson = lessonsAll[currentLessonIdx];
            const container = document.getElementById('lessonContent');
            const done = doneLessons.includes(lesson.id);

            let dialoguesHtml = lesson.dialogues.map(d => `
                <div class="flex items-start gap-3 sm:gap-4 bg-white/80 p-3 sm:p-4 rounded-xl border border-sakura-100 shadow-sm">
                    <div class="text-3xl sm:text-4xl p-2 rounded-xl bg-sakura-50 flex-shrink-0">${d.avatar}</div>
                    <div class="flex-grow space-y-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-bold text-sakura-600 uppercase">${d.speaker}</span>
                            <button data-t="${esc(d.jp)}" onclick="speakJapanese(this.dataset.t)" class="text-sakura-500 hover:text-sakura-600 text-xs flex items-center gap-1 font-semibold flex-shrink-0">
                                <i class="fa-solid fa-volume-high"></i> শুনুন
                            </button>
                        </div>
                        <p class="text-base sm:text-lg font-bold font-japanese text-slate-800 break-words">${d.jp}</p>
                        <p class="text-xs text-slate-400 italic">${d.romaji}</p>
                        <p class="text-sm text-slate-700 mt-1">${d.bn}</p>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div>
                    <h3 class="text-lg sm:text-xl font-bold text-slate-800">${lesson.title} (${lesson.titleBn})</h3>
                    <p class="text-sm text-slate-500 mt-1">প্রেক্ষাপট: ${lesson.situation}</p>
                </div>

                <div class="space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">কথোপকথন (Dialogue Player)</h4>
                    ${dialoguesHtml}
                </div>

                <div class="p-4 rounded-xl bg-sakura-100/70 border border-sakura-300">
                    <h5 class="text-xs font-bold text-sakura-600 uppercase flex items-center gap-1">
                        <i class="fa-solid fa-lightbulb"></i> পাঠের মূল ব্যাকরণ নোট
                    </h5>
                    <p class="text-sm text-slate-800 mt-1">${lesson.keyPoint}</p>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3">
                    <button onclick="toggleLessonDone()" class="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition ${done ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border border-sakura-300 text-slate-700 hover:bg-sakura-50'}">
                        <i class="fa-solid ${done ? 'fa-circle-check' : 'fa-circle'} mr-1"></i> ${done ? 'পাঠ শেষ হয়েছে' : 'পাঠ শেষ করলাম'}
                    </button>
                    <div class="flex gap-2">
                        <button onclick="selectLesson(Math.max(0, currentLessonIdx - 1))" class="p-3 rounded-xl bg-white shadow-sm border border-sakura-200 text-slate-700 hover:bg-sakura-50"><i class="fa-solid fa-chevron-left"></i></button>
                        <button onclick="selectLesson(Math.min(lessonsAll.length - 1, currentLessonIdx + 1))" class="p-3 rounded-xl bg-white shadow-sm border border-sakura-200 text-slate-700 hover:bg-sakura-50"><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            `;
        }

        
document.addEventListener('DOMContentLoaded', () => {
        const q = new URLSearchParams(location.search).get('p'); if (q) currentLessonIdx = Math.max(0, Math.min(lessonsAll.length - 1, +q - 1));
        renderLessons();
});
