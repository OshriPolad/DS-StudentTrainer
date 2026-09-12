/* =========================================================================
   assemble.js — THE "ASSEMBLE THE ALGORITHM" MODE (Parsons-style).
   -------------------------------------------------------------------------
   THE FLOW (exactly as designed):
     BUILD PHASE — put the algorithm together by hand:
       • The correct C++ lines are shown SHUFFLED in a pool below.
       • You TAP lines, one by one, in the order you think is right.
       • Each tapped line moves up into your numbered "solution", and leaves
         the pool. Tap a placed line to send it back to the pool.
       • When every line is placed, "בדיקה" (Check) becomes active.
     REVIEW PHASE — the "why":
       • We show the CORRECT order, line by line.
       • Each line is marked ✓ if you had that exact line in that position,
         or ✗ if not — with a short Hebrew explanation of WHY the line
         belongs there.
       • An overall score and a summary of the algorithm + its complexity.

   Data comes from data/assemble.json (all code is C++, all prose Hebrew).
   Uses the shared helpers $, el and bidi from app.js.
   ========================================================================= */

const Assemble = (function () {
  let problems = [];
  let P = null;              // current problem
  let shuffled = [];         // the line objects in their shuffled pool order
  let solution = [];         // the line objects the user has placed, in order
  const DIFF = { easy: 'קל', medium: 'בינוני', hard: 'קשה' };

  /* local shuffle so this module has no ordering dependency on other files */
  function shuffleArr(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function init() {
    try {
      const data = await fetch('data/assemble.json').then((r) => r.json());
      // same easy → medium → hard ordering as the complexity trainer
      const rank = { easy: 0, medium: 1, hard: 2 };
      problems = data.problems.slice().sort((a, b) => (rank[a.difficulty] ?? 9) - (rank[b.difficulty] ?? 9));
    } catch (e) {
      $('as-list').textContent = 'לא ניתן לטעון את התרגילים (הריצו שרת מקומי — ראו README).';
      return;
    }
    renderPicker();
    $('as-back').addEventListener('click', backToList);
    $('as-check').addEventListener('click', check);
  }

  /* ---- the picker of problems ---- */
  function renderPicker() {
    const list = $('as-list');
    list.textContent = '';
    problems.forEach((p, i) => {
      const card = el('button', 'topic-card');
      card.appendChild(el('div', 't-title', p.title));
      card.appendChild(el('div', 't-count',
        p.lines.length + (p.lines.length === 1 ? ' שורה · ' : ' שורות · ') + (DIFF[p.difficulty] || p.difficulty)));
      card.addEventListener('click', () => open(i));
      list.appendChild(card);
    });
  }

  /* ---- open a problem ---- */
  function open(i) {
    P = problems[i];
    // keep each line's correct index so we can compare after building
    shuffled = shuffleArr(P.lines.map((line, idx) => ({ code: line.code, why: line.why, idx: idx })));
    solution = [];
    $('as-title').textContent = P.title;
    $('as-desc').textContent = bidi(P.description || '');
    $('as-list').classList.add('hidden');
    $('as-trainer').classList.remove('hidden');
    $('as-build').classList.remove('hidden');
    $('as-review').classList.add('hidden');
    renderBuild();
  }

  /* ======================= BUILD PHASE ======================= */
  function renderBuild() {
    // progress
    $('as-progress').textContent = solution.length + ' / ' + P.lines.length + ' שורות';

    // the solution (ordered, numbered). Tap a row to remove it.
    const sol = $('as-solution');
    sol.textContent = '';
    if (solution.length === 0) {
      sol.appendChild(el('div', 'as-empty', 'הקישו על השורות למטה כדי לבנות כאן את האלגוריתם לפי הסדר.'));
    }
    solution.forEach((item, pos) => {
      const row = el('button', 'as-sol-row');
      row.appendChild(el('span', 'as-num', String(pos + 1)));
      row.appendChild(el('code', 'as-code', item.code));
      row.appendChild(el('span', 'as-remove', '✕'));
      row.addEventListener('click', () => { removeAt(pos); });
      sol.appendChild(row);
    });

    // the pool (lines not yet placed), in the shuffled order. Tap to place.
    const pool = $('as-pool');
    pool.textContent = '';
    const remaining = shuffled.filter((it) => solution.indexOf(it) === -1);
    if (remaining.length === 0) {
      pool.appendChild(el('div', 'as-empty', 'כל השורות שובצו. לחצו "בדיקה".'));
    }
    remaining.forEach((item) => {
      const btn = el('button', 'as-pool-item');
      btn.appendChild(el('code', 'as-code', item.code));
      btn.addEventListener('click', () => { place(item); });
      pool.appendChild(btn);
    });

    // enable Check only when everything is placed
    $('as-check').disabled = solution.length !== P.lines.length;
  }

  function place(item) {
    if (solution.indexOf(item) === -1) solution.push(item);
    renderBuild();
  }
  function removeAt(pos) {
    solution.splice(pos, 1);
    renderBuild();
  }

  /* ======================= REVIEW PHASE ======================= */
  function check() {
    $('as-build').classList.add('hidden');
    const review = $('as-review');
    review.classList.remove('hidden');
    review.textContent = '';

    // score: a position is correct if the placed line's CODE matches the
    // correct line's code (so identical lines like "}" are interchangeable).
    let right = 0;
    P.lines.forEach((line, pos) => {
      if (solution[pos] && solution[pos].code === line.code) right++;
    });
    const allRight = right === P.lines.length;

    // overall banner
    const banner = el('div', 'as-overall');
    banner.appendChild(el('div', 'as-overall-big ' + (allRight ? 'ok' : 'no'),
      allRight ? '✓ מצוין! הסדר נכון' : 'שורות נכונות במקומן: ' + right + ' / ' + P.lines.length));
    banner.appendChild(el('div', 'as-overall-line', bidi(P.overall || '')));
    review.appendChild(banner);

    review.appendChild(el('div', 'as-label', 'הסדר הנכון — שורה אחר שורה:'));

    // the correct order, each line with ✓/✗ vs. what the user placed + the why
    P.lines.forEach((line, pos) => {
      const ok = solution[pos] && solution[pos].code === line.code;
      const card = el('div', 'as-rev-card ' + (ok ? 'ok' : 'no'));

      const head = el('div', 'as-rev-head');
      head.appendChild(el('span', 'as-num', String(pos + 1)));
      head.appendChild(el('span', 'as-mark ' + (ok ? 'ok' : 'no'), ok ? '✓' : '✗'));
      head.appendChild(el('code', 'as-code', line.code));
      card.appendChild(head);

      // if the user placed a DIFFERENT line here, show what they had
      if (!ok && solution[pos]) {
        const yours = el('div', 'as-yours');
        yours.appendChild(el('span', null, 'שיבצת כאן: '));
        yours.appendChild(el('code', 'as-code', solution[pos].code));
        card.appendChild(yours);
      }

      card.appendChild(el('div', 'as-why', bidi(line.why)));
      review.appendChild(card);
    });

    // action buttons
    const retry = el('button', 'btn btn-primary btn-block', 'נסה שוב');
    retry.addEventListener('click', () => { reopenSame(); });
    review.appendChild(retry);

    window.scrollTo(0, 0);
  }

  function reopenSame() {
    // re-open the SAME problem with a fresh shuffle
    const i = problems.indexOf(P);
    open(i);
  }

  function backToList() {
    $('as-trainer').classList.add('hidden');
    $('as-list').classList.remove('hidden');
  }

  return { init: init };
})();

window.Assemble = Assemble;
