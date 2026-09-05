/* =========================================================================
   learn.js — THE LEARN JOURNEY MODE.
   -------------------------------------------------------------------------
   A guided, ordered path through Data Structures. Each lesson shows:
     • an easy explanation of the concept,
     • the relevant animation embedded (reusing the Visualize engine),
     • the time complexity explained,
     • key points to remember.
   Progress (which lessons you finished) is saved in localStorage.

   Content comes from js/learn-content.js (window.LEARN_LESSONS).
   The animation is drawn with Viz.renderFrame() — the same renderer the
   Visualize tab uses, so lessons and animations never drift apart.
   ========================================================================= */

const Learn = (function () {
  const LESSONS = window.LEARN_LESSONS || [];
  const DONE_KEY = 'ds-trainer-learn';

  // mini-player state (the embedded animation inside a lesson)
  let frames = [], idx = 0, curLesson = 0;

  /* ---------- completed-lessons storage ---------- */
  function loadDone() {
    try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function markDone(id) {
    try { const s = loadDone(); s.add(id); localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(s))); }
    catch (e) { /* ignore */ }
  }

  function init() {
    renderList();
    $('lp-prev').addEventListener('click', () => lpStep(-1));
    $('lp-next').addEventListener('click', () => lpStep(1));
    $('lesson-back').addEventListener('click', backToList);
    $('lesson-complete').addEventListener('click', completeAndNext);
  }

  /* ---------- the journey list ---------- */
  function renderProgress() {
    const done = loadDone();
    const n = LESSONS.filter((l) => done.has(l.id)).length;
    const box = $('learn-progress');
    box.textContent = '';
    box.appendChild(el('div', 'lp-count', n + ' מתוך ' + LESSONS.length + ' שיעורים הושלמו'));
    const track = el('div', 'progress-track');
    const fill = el('div', 'progress-fill');
    fill.style.width = (LESSONS.length ? (n / LESSONS.length * 100) : 0) + '%';
    track.appendChild(fill);
    box.appendChild(track);
  }

  function renderList() {
    renderProgress();
    const list = $('learn-list');
    list.textContent = '';
    const done = loadDone();
    LESSONS.forEach((lesson, i) => {
      const card = el('button', 'lesson-card');
      if (done.has(lesson.id)) card.classList.add('done');
      const check = el('span', 'lesson-check', done.has(lesson.id) ? '✓' : String(i + 1));
      const title = el('span', 'lesson-card-title', lesson.title);
      card.appendChild(check);
      card.appendChild(title);
      card.addEventListener('click', () => open(i));
      list.appendChild(card);
    });
  }

  /* ---------- open one lesson ---------- */
  function open(i) {
    curLesson = i;
    const lesson = LESSONS[i];
    $('lesson-num').textContent = 'שיעור ' + (i + 1) + ' / ' + LESSONS.length;
    $('lesson-title').textContent = lesson.title;

    fillParas($('lesson-concept'), lesson.concept);
    fillParas($('lesson-complexity'), lesson.complexity);

    const kp = $('lesson-keypoints');
    kp.textContent = '';
    (lesson.keyPoints || []).forEach((p) => kp.appendChild(el('li', null, bidi(p))));

    setupAnim(lesson.vizIds || []);

    const isLast = i === LESSONS.length - 1;
    $('lesson-complete').textContent = isLast ? 'סמן כהושלם וסיים ✓' : 'סמן כהושלם והמשך →';

    $('learn-list').classList.add('hidden');
    $('learn-progress').classList.add('hidden');
    $('learn-lesson').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  /* fill a container with one <p> per paragraph (bidi-safe for Hebrew+math) */
  function fillParas(box, paras) {
    box.textContent = '';
    (paras || []).forEach((p) => box.appendChild(el('p', 'lesson-p', bidi(p))));
  }

  /* ---------- embedded animation ---------- */
  function setupAnim(vizIds) {
    const wrap = $('lesson-anim');
    const ops = vizIds.map((id) => (window.Viz ? Viz.byId(id) : null)).filter(Boolean);
    if (ops.length === 0) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');

    // tabs (only when the lesson has more than one animation)
    const tabs = $('lp-tabs');
    tabs.textContent = '';
    if (ops.length > 1) {
      tabs.classList.remove('hidden');
      ops.forEach((op, k) => {
        const b = el('button', 'lp-tab', op.title);
        b.addEventListener('click', () => loadOp(ops, k));
        tabs.appendChild(b);
      });
    } else {
      tabs.classList.add('hidden');
    }
    loadOp(ops, 0);
  }

  function loadOp(ops, k) {
    frames = ops[k].frames; idx = 0;
    // highlight the active tab
    const tabButtons = $('lp-tabs').querySelectorAll('.lp-tab');
    tabButtons.forEach((b, j) => b.classList.toggle('active', j === k));
    drawLP();
  }

  function drawLP() {
    const f = frames[idx];
    $('lp-stage').innerHTML = Viz.renderFrame(f);   // SVG from trusted numeric data
    $('lp-caption').textContent = bidi(f.caption);
    $('lp-step').textContent = (idx + 1) + ' / ' + frames.length;
    $('lp-prev').disabled = idx === 0;
    $('lp-next').disabled = idx === frames.length - 1;
  }

  function lpStep(d) {
    idx = Math.min(frames.length - 1, Math.max(0, idx + d));
    drawLP();
  }

  /* ---------- complete / navigate ---------- */
  function completeAndNext() {
    markDone(LESSONS[curLesson].id);
    if (curLesson < LESSONS.length - 1) open(curLesson + 1);
    else backToList();
  }

  function backToList() {
    $('learn-lesson').classList.add('hidden');
    $('learn-list').classList.remove('hidden');
    $('learn-progress').classList.remove('hidden');
    renderList();   // refresh checkmarks + progress
    window.scrollTo(0, 0);
  }

  return { init: init };
})();

window.Learn = Learn;
