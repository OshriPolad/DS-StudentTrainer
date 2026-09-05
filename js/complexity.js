/* =========================================================================
   complexity.js — THE COMPLEXITY TRAINER MODE.
   -------------------------------------------------------------------------
   THE FLOW (exactly as designed):
     PHASE 1 — ANSWER, line by line:
       • The C++ code is shown with an empty slot to the LEFT of each line.
       • For the current line, 4 options appear. You pick one; your choice is
         written into that line's left slot, and it advances to the next line.
       • This repeats until every line has an answer.
     PHASE 2 — REVIEW, line by line:
       • Starting at the first line: if your answer is right, a ✓ appears next
         to it; if wrong, the correct complexity is shown instead.
       • An explanation of why appears where the options were.
       • "Next line →" walks through each line, then shows the OVERALL complexity.

   Data comes from data/complexity.json (all code is C++).
   ========================================================================= */

const Complexity = (function () {
  let problems = [];
  let P = null;              // current problem
  let answers = [];          // user's chosen option index per line
  let phase = 'answer';      // 'answer' | 'review'
  let cur = 0;               // current line (answer phase) or review index
  let rowSlots = [];         // references to each line's left slot element
  let rowEls = [];           // references to each line's row element
  const DIFF = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };  // difficulty labels in Hebrew

  async function init() {
    try {
      const data = await fetch('data/complexity.json').then((r) => r.json());
      problems = data.problems;
    } catch (e) {
      $('cx-list').textContent = 'לא ניתן לטעון את התרגילים (הריצו שרת מקומי — ראו README).';
      return;
    }
    renderPicker();
    $('cx-back').addEventListener('click', backToList);
    $('cx-retry').addEventListener('click', backToList);
  }

  /* ---- the picker of problems ---- */
  function renderPicker() {
    const list = $('cx-list');
    list.textContent = '';
    problems.forEach((p, i) => {
      const card = el('button', 'topic-card');
      card.appendChild(el('div', 't-title', p.title));
      card.appendChild(el('div', 't-count', p.lines.length + (p.lines.length === 1 ? ' שורה · ' : ' שורות · ') + (DIFF[p.difficulty] || p.difficulty)));
      card.addEventListener('click', () => open(i));
      list.appendChild(card);
    });
  }

  /* ---- open a problem ---- */
  function open(i) {
    P = problems[i];
    answers = new Array(P.lines.length).fill(null);
    phase = 'answer';
    cur = 0;
    $('cx-title').textContent = P.title;
    $('cx-list').classList.add('hidden');
    $('cx-trainer').classList.remove('hidden');
    $('cx-review').classList.add('hidden');
    buildCodeRows();
    renderAnswerLine();
  }

  /* ---- build the code, one row per line, each with a left slot ---- */
  function buildCodeRows() {
    const box = $('cx-code');
    box.textContent = '';
    rowSlots = [];
    rowEls = [];
    P.lines.forEach((line, i) => {
      const row = el('div', 'cx-row');
      const slot = el('span', 'cx-slot');          // left slot (holds the answer)
      const code = el('code', 'cx-line', line.code);
      row.appendChild(slot);
      row.appendChild(code);
      box.appendChild(row);
      rowSlots.push(slot);
      rowEls.push(row);
    });
  }

  /* ======================= PHASE 1: ANSWER ======================= */
  function renderAnswerLine() {
    // highlight the current row
    rowEls.forEach((r, i) => r.classList.toggle('current', i === cur));
    $('cx-progress').textContent = 'שורה ' + (cur + 1) + ' / ' + P.lines.length;

    const line = P.lines[cur];
    const box = $('cx-options');
    box.textContent = '';
    const prompt = el('div', 'cx-prompt', 'מהו זמן הריצה (זמן ריצה) של השורה הזו?');
    box.appendChild(prompt);

    line.options.forEach((opt, oi) => {
      const btn = el('button', 'option', opt);
      btn.addEventListener('click', () => chooseAnswer(oi));
      box.appendChild(btn);
    });
  }

  function chooseAnswer(optIdx) {
    answers[cur] = optIdx;
    // write the chosen complexity into this line's left slot
    rowSlots[cur].textContent = P.lines[cur].options[optIdx];
    rowSlots[cur].classList.add('filled');
    rowEls[cur].classList.remove('current');

    cur++;
    if (cur < P.lines.length) {
      renderAnswerLine();          // next line
    } else {
      startReview();               // all lines answered → review
    }
  }

  /* ======================= PHASE 2: REVIEW ======================= */
  function startReview() {
    phase = 'review';
    cur = 0;
    reviewLine();
  }

  function reviewLine() {
    rowEls.forEach((r, i) => r.classList.toggle('current', i === cur));
    $('cx-progress').textContent = 'סקירה ' + (cur + 1) + ' / ' + P.lines.length;

    const line = P.lines[cur];
    const correct = answers[cur] === line.answer;
    const slot = rowSlots[cur];
    const correctLabel = line.options[line.answer];

    // update the left slot with the verdict
    slot.classList.remove('filled');
    if (correct) {
      slot.textContent = '✓ ' + correctLabel;
      slot.className = 'cx-slot verdict ok';
      rowEls[cur].classList.add('correct');
    } else {
      slot.textContent = '✗ ' + correctLabel;     // show the RIGHT answer
      slot.className = 'cx-slot verdict no';
      rowEls[cur].classList.add('wrong');
    }

    // explanation where the options were
    const box = $('cx-options');
    box.textContent = '';
    const verdict = el('div', 'cx-verdict ' + (correct ? 'ok' : 'no'),
      correct ? '✓ נכון' : '✗ לא מדויק');
    box.appendChild(verdict);

    if (!correct) {
      box.appendChild(el('div', 'cx-your',
        bidi('בחרת ' + line.options[answers[cur]] + ' · התשובה הנכונה: ' + correctLabel)));
    }
    box.appendChild(el('div', 'cx-explain', bidi(line.explanation)));

    const nextBtn = el('button', 'btn btn-primary btn-block',
      cur < P.lines.length - 1 ? 'לשורה הבאה →' : 'לסיבוכיות הכוללת →');
    nextBtn.addEventListener('click', () => {
      cur++;
      if (cur < P.lines.length) reviewLine();
      else finishReview();
    });
    box.appendChild(nextBtn);
  }

  function finishReview() {
    rowEls.forEach((r) => r.classList.remove('current'));
    $('cx-progress').textContent = 'סיום';
    $('cx-options').textContent = '';

    // score line by line
    const right = answers.reduce((n, a, i) => n + (a === P.lines[i].answer ? 1 : 0), 0);

    const rev = $('cx-review');
    rev.classList.remove('hidden');
    const overall = $('cx-overall');
    overall.textContent = '';
    overall.appendChild(el('div', 'cx-overall-line', bidi('שורות נכונות: ' + right + ' / ' + P.lines.length)));
    overall.appendChild(el('div', 'cx-overall-big', bidi('זמן ריצה כולל: ' + P.overall)));
    overall.appendChild(el('div', 'cx-explain', bidi(P.overallExplanation)));
  }

  function backToList() {
    $('cx-trainer').classList.add('hidden');
    $('cx-review').classList.add('hidden');
    $('cx-list').classList.remove('hidden');
  }

  return { init: init };
})();

window.Complexity = Complexity;
