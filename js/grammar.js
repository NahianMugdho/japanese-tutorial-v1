/* grammar.js */
let currentSentenceTaskIdx = 0;
let assembledWords = [];
/* -------------------------------------------------------------
           3. GRAMMAR MODULE & SENTENCE BUILDER
           ------------------------------------------------------------- */
        function renderGrammarParticles() {
            const grid = document.getElementById('particleGrid');
            grid.innerHTML = '';
            grammarParticles.forEach(p => {
                const card = document.createElement('div');
                card.className = "glass-card p-4 rounded-2xl border border-sakura-200 hover:shadow-md transition";
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-bold font-japanese text-sakura-600 bg-sakura-100 px-3 py-1 rounded-xl">${p.particle}</span>
                        <button data-t="${esc(p.example)}" onclick="speakJapanese(this.dataset.t)" class="text-sakura-500 hover:text-sakura-600 text-xs p-1">
                            <i class="fa-solid fa-volume-high text-base"></i>
                        </button>
                    </div>
                    <p class="text-xs text-slate-600 font-semibold mt-2">${p.usage}</p>
                    <div class="mt-3 pt-2 border-t border-slate-200/60 text-xs space-y-0.5">
                        <p class="font-japanese font-bold text-slate-800">${p.example}</p>
                        <p class="text-slate-500">${p.translation}</p>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function loadSentenceBuilderTask(idx) {
            currentSentenceTaskIdx = idx;
            assembledWords = [];
            const task = sentenceTasks[idx];
            document.getElementById('builderTaskNum').innerText = `টাস্ক ${idx + 1}/${sentenceTasks.length}`;
            document.getElementById('builderTargetBengali').innerHTML = `লক্ষ্য বাক্য (বাংলা): <span class="font-bold text-sakura-600">"${task.targetBn}"</span>`;
            document.getElementById('builderFeedback').innerText = '';
            renderSentenceBlocks();
        }

        function renderSentenceBlocks() {
            const task = sentenceTasks[currentSentenceTaskIdx];
            const assembledArea = document.getElementById('assembledSentence');
            const blocksArea = document.getElementById('wordBlocks');

            assembledArea.innerHTML = '';
            if (assembledWords.length === 0) {
                assembledArea.innerHTML = `<span class="text-slate-400 text-sm italic">নিচের ব্লকগুলোতে ক্লিক করে সঠিক ক্রমে সাজান...</span>`;
            } else {
                assembledWords.forEach((word, i) => {
                    const block = document.createElement('button');
                    block.className = "px-3 py-1.5 bg-sakura-500 text-white font-japanese font-bold text-sm rounded-lg shadow-sm hover:bg-sakura-600 transition flex items-center gap-1.5";
                    block.innerHTML = `${word} <i class="fa-solid fa-xmark text-xs"></i>`;
                    block.onclick = () => removeWordBlock(i);
                    assembledArea.appendChild(block);
                });
            }

            blocksArea.innerHTML = '';
            task.words.forEach((word) => {
                const countInAssembled = assembledWords.filter(w => w === word).length;
                const countInTask = task.words.filter(w => w === word).length;
                if (countInAssembled < countInTask) {
                    const block = document.createElement('button');
                    block.className = "px-4 py-2 bg-white border border-sakura-300 hover:border-sakura-500 text-slate-800 font-japanese font-bold text-sm rounded-xl shadow-sm hover:bg-sakura-50 transition";
                    block.innerText = word;
                    block.onclick = () => addWordBlock(word);
                    blocksArea.appendChild(block);
                }
            });
        }

        function addWordBlock(word) { assembledWords.push(word); renderSentenceBlocks(); speakJapanese(word); }
        function removeWordBlock(index) { assembledWords.splice(index, 1); renderSentenceBlocks(); }
        function resetSentenceBuilder() { assembledWords = []; document.getElementById('builderFeedback').innerText = ''; renderSentenceBlocks(); }

        function checkBuiltSentence() {
            const task = sentenceTasks[currentSentenceTaskIdx];
            const feedback = document.getElementById('builderFeedback');

            if (assembledWords.length !== task.correctOrder.length) {
                feedback.className = "text-sm font-semibold text-amber-600";
                feedback.innerText = "⚠️ সবকটি প্রয়োজনীয় শব্দ ব্লক যুক্ত করুন।";
                return;
            }
            let isCorrect = true;
            for (let i = 0; i < task.correctOrder.length; i++) {
                if (assembledWords[i] !== task.correctOrder[i]) { isCorrect = false; break; }
            }
            if (isCorrect) {
                feedback.className = "text-sm font-bold text-emerald-600";
                feedback.innerText = "🎉 চমৎকার! আপনার বাক্যটি একদম সঠিক হয়েছে।";
                speakJapanese(assembledWords.join('')); Prog.add(8);
                setTimeout(() => {
                    const nextIdx = (currentSentenceTaskIdx + 1) % sentenceTasks.length;
                    loadSentenceBuilderTask(nextIdx);
                }, 2000);
            } else {
                feedback.className = "text-sm font-bold text-rose-600";
                feedback.innerText = "❌ বাক্যরীতি সঠিক হয়নি। আবার চেষ্টা করুন!";
            }
        }

        
document.addEventListener('DOMContentLoaded', () => {
        renderGrammarParticles();
        loadSentenceBuilderTask(0);
});
