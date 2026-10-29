/* index.js */

/* -------------------------------------------------------------
           7. ROUTINE (12-week plan)
           ------------------------------------------------------------- */
        const WEEKS = ["হিরাগানা あ–そ (১৫টি) + হাতে লেখা + পাঠ ১", "বাকি হিরাগানা ও ゛゜ + পাঠ ২–৩", "কাতাকানা ৪৬টি + পাঠ ৪–৫", "きゃ-জাতীয় যুক্ত ধ্বনি + পাঠ ৬–৭ + মাসিক রিভিউ", "পাঠ ৮–৯ (て-রূপ)", "পাঠ ১০–১১", "পাঠ ১২–১৩ + প্রতি সপ্তাহে ৩০ শব্দ", "পাঠ ১৪–১৫ + মাসিক রিভিউ", "পাঠ ১৬–১৭ + পথ ও দোকানের কথা", "পাঠ ১৮–১৯", "পাঠ ২০–২২", "পাঠ ২৩–২৫ + ১ মিনিটে নিজের পরিচয় বলা"];
        let doneWeeks = store.g('weeks', []);
        function renderWeeks() {
            document.getElementById('weekList').innerHTML = WEEKS.map((t, i) => `
                <label class="flex items-start gap-3 p-2.5 rounded-xl hover:bg-sakura-50 cursor-pointer text-sm text-slate-700">
                    <input type="checkbox" class="mt-1 w-4 h-4 accent-pink-500 flex-shrink-0" ${doneWeeks.includes(i) ? 'checked' : ''} onchange="toggleWeek(${i}, this.checked)">
                    <span><b class="text-sakura-600">সপ্তাহ ${i + 1}:</b> ${t}</span>
                </label>`).join('');
            document.getElementById('weekBar').style.width = (doneWeeks.length / 12 * 100) + '%';
            document.getElementById('weekCount').innerText = doneWeeks.length + '/১২ সপ্তাহ শেষ';
        }
        function toggleWeek(i, on) { doneWeeks = on ? [...doneWeeks, i] : doneWeeks.filter(x => x !== i); store.s('weeks', doneWeeks); renderWeeks(); }

document.addEventListener('DOMContentLoaded', () => {
        renderWeeks();
});
