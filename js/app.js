/* =========================================================================
   app.js — THE APP CONTROLLER + ROUTER.
   -------------------------------------------------------------------------
   Responsibilities:
     1. Top navigation between the three modes (Quiz / Visualize / Complexity).
     2. The Quiz mode itself (home, question flow, results).
     3. Booting the Visualize and Complexity modules (defined in viz.js and
        complexity.js) once at startup.

   Shared helpers ($, el) live here and are used by the other modules too.
   ========================================================================= */

/* ---------- SHARED HELPERS (used across app.js, viz.js, complexity.js) --- */
const $ = (id) => document.getElementById(id);

/* SECURITY NOTE: build elements with textContent, never innerHTML, so data
   can never be interpreted as HTML/JS (XSS-safe). */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* BIDI HELPER (v3): Hebrew is right-to-left, but embedded code / math / Big-O
   (e.g. "5 < 15", "k mod m = h(k)", "מקדם עומס ≥ 1") is left-to-right. Without
   help, the bidi algorithm reorders numbers and mirrors symbols.
   -------------------------------------------------------------------------
   v1 wrapped whole non-Hebrew runs -> swept up Hebrew-clause punctuation.
   v2 isolated tight single tokens -> a multi-part formula like "k mod m =
   h(k)" split into SEPARATE isolates, which then reordered relative to each
   other (adjacent isolates in an RTL paragraph get reordered too).
   v3 (this one) isolates a whole COHERENT LTR run — letters, digits, and
   math/comparison operators, optionally spanning internal spaces — as ONE
   isolate, so a whole formula stays a single unit. It also keeps a lone
   UNBALANCED bracket (its partner sits far away in the Hebrew clause)
   OUTSIDE the isolate, so Unicode's automatic bracket-mirroring — which
   only kicks in for characters resolved in the surrounding RTL context —
   still pairs it correctly with its Hebrew-side partner.
   ⁦…⁩ = LRI…PDI (Unicode isolate marks, U+2066 … U+2069). */
function bidi(s) {
  if (typeof s !== 'string') return s;

  // Every character that can be part of an LTR formula/code run: letters,
  // digits, comparison/math operators & arrows, Greek used in complexity
  // notation, brackets, and code punctuation. Commas are deliberately
  // EXCLUDED (Hebrew clause punctuation, e.g. "≥ 1, וה...") so they never
  // get swallowed into a formula.
  var SYM = 'A-Za-z0-9' +
    '±×÷≠≤≥→←↔⇒⇐≈−' + // ± × ÷ ≠ ≤ ≥ → ← ↔ ⇒ ⇐ ≈ −
    '=<>+\\-*/^!%°√∞' +                                                 // = < > + - * / ^ ! % ° √ ∞
    'ΘΩΣΔαβθπ' +                               // Θ Ω Σ Δ α β θ π
    '._:;()\\[\\]{}\'"~@#&|\\\\' +
    '²³⁰-₟';                                                       // ² ³ + sub/superscript block

  // "Real content" -- a match containing at least one of these is worth
  // isolating; a lone punctuation fragment (e.g. a stray '-' used as a
  // Hebrew dash) is left alone in the RTL flow.
  var CONTENT_RE = /[A-Za-z0-9±×÷≠≤≥→←↔⇒⇐≈−ΘΩΣΔαβθπ²³⁰-₟]/;

  // A run always starts and ends on a SYM char (never a bare space); spaces
  // may appear INSIDE it, so a multi-word formula ("k mod m = h(k)") stays
  // ONE isolate instead of fragmenting into several that then reorder.
  var RUN_RE = new RegExp('[' + SYM + '](?:[' + SYM + ' ]*[' + SYM + '])?', 'g');

  var OPEN = '([{', CLOSE = ')]}';
  var PAIR = { '(': ')', '[': ']', '{': '}', ')': '(', ']': '[', '}': '{' };
  var SOFT_TRAIL = { '.': 1, ':': 1, ';': 1 };  // NOT '!' -- that's often factorial (n!)

  function count(ch, str, a, b) {
    var n = 0;
    for (var i = a; i < b; i++) if (str[i] === ch) n++;
    return n;
  }

  // Peel any EDGE bracket (opening or closing) whose partner is missing
  // from the current span -- it belongs to the Hebrew clause, not this
  // formula -- plus sentence-final . : ; and any space exposed by that.
  function trimEdges(str) {
    var start = 0, end = str.length, changed = true;
    while (changed && end > start) {
      changed = false;
      var lastCh = str[end - 1];
      if (OPEN.indexOf(lastCh) !== -1 || CLOSE.indexOf(lastCh) !== -1) {
        if (count(lastCh, str, start, end) > count(PAIR[lastCh], str, start, end)) { end--; changed = true; continue; }
      } else if (SOFT_TRAIL[lastCh] || lastCh === ' ') {
        end--; changed = true; continue;
      }
      var firstCh = str[start];
      if (OPEN.indexOf(firstCh) !== -1 || CLOSE.indexOf(firstCh) !== -1) {
        if (count(firstCh, str, start, end) > count(PAIR[firstCh], str, start, end)) { start++; changed = true; continue; }
      } else if (firstCh === ' ') {
        start++; changed = true; continue;
      }
    }
    return { lead: str.slice(0, start), core: str.slice(start, end), trail: str.slice(end) };
  }

  return s.replace(RUN_RE, function (m) {
    if (!CONTENT_RE.test(m)) return m;
    var t = trimEdges(m);
    if (!t.core) return m;
    return t.lead + '⁦' + t.core + '⁩' + t.trail;
  });
}

/* ---------- STATE ------------------------------------------------------- */
let topicsData = [];
let quiz = null;
let TOPIC_HE = {};   // maps a question's English "topic" to the Hebrew label for display
let QUESTIONS_BY_ID = {};   // id -> question object, for the "mistakes only" mode

/* ---------- NAVIGATION between the three modes -------------------------- */
/* Each mode has one "landing" screen id. */
const MODE_LANDING = { learn: 'learn', home: 'home', viz: 'viz', complexity: 'complexity', assemble: 'assemble', cheatsheet: 'cheatsheet' };

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function switchMode(mode) {
  showScreen(MODE_LANDING[mode]);
  document.querySelectorAll('.nav-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.mode === mode)
  );
  // refresh the home widgets whenever we land back on the quiz home
  if (mode === 'home') { renderProgress(); renderMistakesButton(); }
}

/* ---------- STARTUP ----------------------------------------------------- */
async function init() {
  // wire the top nav
  document.querySelectorAll('.nav-btn').forEach((btn) =>
    btn.addEventListener('click', () => switchMode(btn.dataset.mode))
  );

  // load quiz data
  try {
    const topicsFile = await fetch('data/topics.json').then((r) => r.json());
    topicsData = await Promise.all(
      topicsFile.topics.map(async (t) => {
        const data = await fetch(t.file).then((r) => r.json());
        return { id: t.id, title: t.title, titleHe: t.titleHe, questions: data.questions };
      })
    );
  } catch (err) {
    $('topic-list').textContent =
      'לא ניתן לטעון את השאלות. האם השרת המקומי רץ? ראו README.md.';
    console.error(err);
  }

  // build the English-topic → Hebrew-label map for the small topic tag,
  // and an id → question map used by the "mistakes only" review mode.
  topicsData.forEach((t) => {
    if (t.questions[0] && t.questions[0].topic) TOPIC_HE[t.questions[0].topic] = t.titleHe;
    t.questions.forEach((q) => { QUESTIONS_BY_ID[q.id] = q; });
  });

  renderHome();
  renderProgress();
  renderMistakesButton();
  const totalQ = topicsData.reduce((sum, t) => sum + t.questions.length, 0);
  $('q-count').textContent = totalQ;

  // static quiz buttons
  $('mixed-btn').addEventListener('click', startMixedQuiz);
  $('mistakes-btn').addEventListener('click', startMistakesQuiz);
  $('next-btn').addEventListener('click', goNext);
  $('quit-btn').addEventListener('click', () => switchMode('home'));
  $('retry-btn').addEventListener('click', () => startQuiz(quiz.questions, quiz.label));
  $('home-btn').addEventListener('click', () => switchMode('home'));

  // boot the other modes (defined in their own files)
  if (window.Viz) Viz.init();
  if (window.Complexity) Complexity.init();
  if (window.Assemble) Assemble.init();
  if (window.Learn) Learn.init();
}

/* ---------- QUIZ MODE --------------------------------------------------- */
function renderHome() {
  const list = $('topic-list');
  list.textContent = '';
  topicsData.forEach((topic) => {
    const card = el('button', 'topic-card');
    card.appendChild(el('div', 't-title', bidi(topic.title)));
    card.appendChild(el('div', 't-title-he', bidi(topic.titleHe)));
    card.appendChild(el('div', 't-count', topic.questions.length + ' שאלות'));
    card.addEventListener('click', () => startQuiz(shuffle(topic.questions), topic.title));
    list.appendChild(card);
  });
}

function startMixedQuiz() {
  const all = topicsData.flatMap((t) => t.questions);
  startQuiz(shuffle(all), 'מעורב');
}

function startQuiz(questions, label) {
  quiz = new Quiz(questions);
  quiz.label = label;
  renderQuestion();
  showScreen('quiz');
}

function renderQuestion() {
  const q = quiz.current();
  $('q-progress').textContent = quiz.progressLabel();
  $('q-score').textContent = 'ניקוד: ' + quiz.score;
  $('progress-fill').style.width = (quiz.progressFraction() * 100) + '%';
  $('q-topic').textContent = TOPIC_HE[q.topic] || quiz.label;
  $('q-text').textContent = bidi(q.question);

  const codeBox = $('q-code');
  if (q.code) {
    codeBox.querySelector('code').textContent = q.code;
    codeBox.classList.remove('hidden');
  } else {
    codeBox.classList.add('hidden');
  }

  const optionsBox = $('q-options');
  optionsBox.textContent = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  // Shuffle the DISPLAY order of the options so the correct answer isn't
  // always in the same position (the source data often lists it first).
  // quiz.displayOrder maps a display slot -> the option's ORIGINAL index,
  // which is what quiz.answer / correctIndex are expressed in.
  quiz.displayOrder = shuffle(q.options.map((_, i) => i));
  quiz.displayOrder.forEach((origIndex, pos) => {
    const btn = el('button', 'option');
    btn.appendChild(el('span', 'letter', letters[pos]));
    btn.appendChild(el('span', null, bidi(q.options[origIndex])));
    btn.addEventListener('click', () => handleAnswer(origIndex));  // pass the ORIGINAL index
    optionsBox.appendChild(btn);
  });

  $('feedback').classList.add('hidden');
}

function handleAnswer(choiceIndex) {
  const qId = quiz.current().id;
  const result = quiz.answer(choiceIndex);
  if (!result) return;
  // Track mistakes: add on a wrong answer, clear once answered correctly.
  if (result.isCorrect) clearMistake(qId); else addMistake(qId);
  const optionButtons = $('q-options').querySelectorAll('.option');
  optionButtons.forEach((btn, pos) => {
    // btn is in DISPLAY order; map back to the original index to compare.
    const orig = quiz.displayOrder[pos];
    btn.disabled = true;
    if (orig === result.correctIndex) btn.classList.add('correct');
    if (orig === result.chosenIndex && !result.isCorrect) btn.classList.add('wrong');
  });
  $('q-score').textContent = 'ניקוד: ' + quiz.score;
  const verdict = $('feedback-verdict');
  verdict.textContent = result.isCorrect ? '✓ נכון!' : '✗ לא מדויק';
  verdict.className = 'feedback-verdict ' + (result.isCorrect ? 'ok' : 'no');
  $('feedback-explanation').textContent = bidi(result.explanation);
  const feedbackBox = $('feedback');
  feedbackBox.className = 'feedback ' + (result.isCorrect ? 'ok' : 'no');
  feedbackBox.classList.remove('hidden');
}

function goNext() {
  if (quiz.next()) renderQuestion();
  else showResults();
}

function showResults() {
  const pct = quiz.percent();
  $('results-score').textContent = quiz.score + ' / ' + quiz.total + '  (' + pct + '%)';
  let msg;
  if (pct === 100)    msg = 'ריצה מושלמת. אתה שולט בזה. 💪';
  else if (pct >= 80) msg = 'חזק. עבור על מה שפספסת ואתה מוכן למבחן.';
  else if (pct >= 60) msg = 'בסיס טוב. חזור על הנושא מחר כדי לקבע אותו.';
  else                msg = 'ההתחלה — קרא את ההסברים, ואז נסה שוב.';
  $('results-message').textContent = msg;
  saveProgress(quiz.label, pct);
  showScreen('results');
}

/* ---------- PROGRESS STORAGE (localStorage) ----------------------------- */
const STORAGE_KEY = 'ds-trainer-best';

function saveProgress(label, pct) {
  try {
    const best = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!best[label] || pct > best[label]) {
      best[label] = pct;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
    }
  } catch (e) { console.log('localStorage unavailable — progress not saved.'); }
}

function renderProgress() {
  const box = $('progress-summary');
  let best = {};
  try { best = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { /* ignore */ }
  const labels = Object.keys(best);
  box.textContent = '';
  if (labels.length === 0) return;
  box.appendChild(el('strong', null, 'התוצאות הטובות ביותר שלך'));
  labels.forEach((label) => {
    const row = el('div', 'row');
    row.appendChild(el('span', null, label));
    row.appendChild(el('span', null, best[label] + '%'));
    box.appendChild(row);
  });
}

/* ---------- MISTAKES-ONLY REVIEW MODE ----------------------------------- */
/* We remember the ids of questions answered incorrectly (in localStorage).
   The "review mistakes" quiz replays exactly those, and a question is REMOVED
   from the set the moment it is answered correctly — so the list shrinks as you
   master things, making your limited study time compound. */
const MISTAKES_KEY = 'ds-trainer-mistakes';

function loadMistakes() {
  try { return new Set(JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]')); }
  catch (e) { return new Set(); }
}
function saveMistakes(set) {
  try { localStorage.setItem(MISTAKES_KEY, JSON.stringify(Array.from(set))); } catch (e) { /* ignore */ }
}
function addMistake(id) { const s = loadMistakes(); s.add(id); saveMistakes(s); }
function clearMistake(id) { const s = loadMistakes(); if (s.delete(id)) saveMistakes(s); }

/* current mistake ids that still map to a real question */
function currentMistakeIds() {
  return Array.from(loadMistakes()).filter((id) => QUESTIONS_BY_ID[id]);
}

function renderMistakesButton() {
  const btn = $('mistakes-btn');
  const ids = currentMistakeIds();
  if (ids.length === 0) { btn.hidden = true; return; }
  btn.hidden = false;
  btn.textContent = '🔁 תרגול טעויות (' + ids.length + ')';
}

function startMistakesQuiz() {
  const qs = currentMistakeIds().map((id) => QUESTIONS_BY_ID[id]);
  if (qs.length === 0) return;
  startQuiz(shuffle(qs), 'טעויות');
}

/* ---------- GO! --------------------------------------------------------- */
init();
