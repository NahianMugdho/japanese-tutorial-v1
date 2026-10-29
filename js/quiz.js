/* quiz.js */
let quizCurrentIdx = 0;
let quizScore = 0;
/* -------------------------------------------------------------
           5. QUIZ GAME MODULE
           ------------------------------------------------------------- */
        function renderQuizQuestion() {
            const container = document.getElementById('quizContainer');
            if (quizCurrentIdx >= quizQuestions.length) {
                const best = Math.max(store.g('quizBest', 0), quizScore); store.s('quizBest', best); Prog.add(Math.round(quizScore / 2));
                container.innerHTML = `
                    <div class="text-center py-8 space-y-4">
                        <div class="w-20 h-20 bg-sakura-100 rounded-full flex items-center justify-center mx-auto text-sakura-600 text-4xl">🏆</div>
                        <h3 class="text-2xl font-bold text-slate-800">কুইজ সম্পন্ন হয়েছে!</h3>
                        <p class="text-slate-600">আপনার মোট অর্জিত স্কোর: <span class="font-extrabold text-sakura-600 text-xl">${quizScore} / ${quizQuestions.length * 10}</span></p>
                        <p class="text-xs text-slate-400 font-semibold">সেরা স্কোর: ${best}</p>
                        <p class="text-sm text-slate-500">${quizScore === quizQuestions.length * 10 ? 'অসাধারণ! আপনি সবগুলো প্রশ্নের সঠিক উত্তর দিয়েছেন! 👏' : 'খুব ভালো চেষ্টা করেছেন! আরও অনুশীলন করে নিখুঁত স্কোর অর্জন করুন।'}</p>
                        <button onclick="restartQuiz()" class="px-6 py-3 bg-sakura-500 text-white font-bold rounded-xl shadow hover:bg-sakura-600 transition">পুনরায় কুইজ খেলুন</button>
                    </div>`;
                return;
            }
            const q = quizQuestions[quizCurrentIdx];
            quizAnswered = false;
            let optionsHtml = q.options.map((opt, i) => `
                <button onclick="submitQuizAnswer(${i})" class="w-full text-left p-4 rounded-xl border border-sakura-200 hover:border-sakura-400 bg-white hover:bg-sakura-50 font-semibold text-slate-700 transition flex items-center justify-between group">
                    <span>${opt}</span>
                    <i class="fa-solid fa-chevron-right text-xs text-sakura-300 group-hover:text-sakura-500"></i>
                </button>`).join('');
            container.innerHTML = `
                <div class="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>প্রশ্ন ${quizCurrentIdx + 1} / ${quizQuestions.length}</span>
                    <span>প্রতি প্রশ্ন: ১০ পয়েন্ট</span>
                </div>
                <h3 class="text-lg font-bold text-slate-800">${q.question}</h3>
                <div class="space-y-2.5">${optionsHtml}</div>
                <div id="quizAnswerFeedback" class="hidden p-4 rounded-xl border text-sm"></div>`;
        }
        var quizAnswered = false;
        function submitQuizAnswer(selectedIdx) {
            if (quizAnswered) return; quizAnswered = true;
            const q = quizQuestions[quizCurrentIdx];
            const feedback = document.getElementById('quizAnswerFeedback');
            feedback.classList.remove('hidden');
            if (selectedIdx === q.correct) {
                quizScore += 10;
                document.getElementById('quizScore').innerText = quizScore;
                feedback.className = "p-4 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-800 text-sm font-semibold";
                feedback.innerHTML = `✅ <b>সঠিক উত্তর!</b> ${q.explanation}`;
            } else {
                feedback.className = "p-4 rounded-xl border bg-rose-50 border-rose-300 text-rose-800 text-sm font-semibold";
                feedback.innerHTML = `❌ <b>ভুল উত্তর।</b> সঠিক উত্তর: <b>${q.options[q.correct]}</b>। ${q.explanation}`;
            }
            setTimeout(() => { quizCurrentIdx++; renderQuizQuestion(); }, 2500);
        }
        function restartQuiz() { quizCurrentIdx = 0; quizScore = 0; document.getElementById('quizScore').innerText = 0; renderQuizQuestion(); }

        
document.addEventListener('DOMContentLoaded', () => {
        renderQuizQuestion();
});
