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

/* BIDI HELPER: Hebrew is right-to-left, but embedded code / math / Big-O
   (e.g. "5 < 15", "O(n log n)", "i ≤ √n") is left-to-right. Without help, the
   bidi algorithm mirrors '<' '>' and reorders numbers, so "5 < 15" can show as
   "5 > 15". This wraps each run of non-Hebrew characters that contains a
   letter/digit in Unicode isolate marks (U+2066 … U+2069), forcing it LTR.
   Used everywhere we display Hebrew prose that may contain code or math. */
function bidi(s) {
  if (typeof s !== 'string') return s;
  // ֐-׿ = Hebrew block. Wrap non-Hebrew runs that contain a letter/digit.
  return s.replace(/[^֐-׿\n]+/g, function (run) {
    return /[A-Za-z0-9]/.test(run) ? '⁦' + run + '⁩' : run;  // LRI … PDI
  });
}

/* ---------- STATE ------------------------------------------------------- */
let topicsData = [];
let quiz = null;
let TOPIC_HE = {};   // maps a question's English "topic" to the Hebrew label for display
let QUESTIONS_BY_ID = {};   // id -> question object, for the "mistakes only" mode

/* ---------- NAVIGATION between the three modes -------------------------- */
/* Each mode has one "landing" screen id. */
const MODE_LANDING = { home: 'home', viz: 'viz', complexity: 'complexity', cheatsheet: 'cheatsheet' };

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

  // boot the other two modes (defined in their own files)
  if (window.Viz) Viz.init();
  if (window.Complexity) Complexity.init();
}

/* ---------- QUIZ MODE --------------------------------------------------- */
function renderHome() {
  const list = $('topic-list');
  list.textContent = '';
  topicsData.forEach((topic) => {
    const card = el('button', 'topic-card');
    card.appendChild(el('div', 't-title', topic.title));
    card.appendChild(el('div', 't-title-he', topic.titleHe));
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
  q.options.forEach((text, i) => {
    const btn = el('button', 'option');
    btn.appendChild(el('span', 'letter', letters[i]));
    btn.appendChild(el('span', null, bidi(text)));
    btn.addEventListener('click', () => handleAnswer(i));
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
  optionButtons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === result.correctIndex) btn.classList.add('correct');
    if (i === result.chosenIndex && !result.isCorrect) btn.classList.add('wrong');
  });
  $('q-score').textContent = 'ניקוד: ' + quiz.score;
  const verdict = $('feedback-verdict');
  verdict.textContent = result.isCorrect ? '✓ נכון!' : '✗ לא מדויק';
  verdict.className = 'feedback-verdict ' + (result.isCorrect ? 'ok' : 'no');
  $('feedback-explanation').textContent = bidi(result.explanation);
  $('feedback').classList.remove('hidden');
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
