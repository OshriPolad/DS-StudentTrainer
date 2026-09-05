/* =========================================================================
   app.js — THE UI CONTROLLER (connects the Quiz engine to the screen).
   -------------------------------------------------------------------------
   NOTE: This file does all the DOM work — reading data files, building
   buttons, switching screens, reacting to clicks. It uses the Quiz class
   from quiz.js as its "brain". Read this top-to-bottom:
     1. CONFIG          — things you might edit (exam date).
     2. STATE           — variables the app remembers while running.
     3. init()          — startup: load data, draw the home screen.
     4. Screen helpers  — showScreen(), and one function per screen.
     5. Quiz flow        — start → render question → answer → feedback → next → results.
     6. Progress storage — save/read best scores in the browser (localStorage).
   ========================================================================= */

/* ---------- 1. CONFIG ---------------------------------------------------- */
/* NOTE: change these two lines when you move on to the OOP exam. */
const EXAM_NAME = 'Data Structures';
const EXAM_DATE = new Date('2026-09-17T09:00:00');  // מבני נתונים final

/* ---------- 2. STATE ----------------------------------------------------- */
let topicsData = [];   // array of { id, title, titleHe, questions:[...] }
let quiz = null;       // the currently active Quiz object (or null on home)

/* tiny helper: document.getElementById, shortened */
const $ = (id) => document.getElementById(id);

/* ---------- 3. STARTUP --------------------------------------------------- */
/* NOTE: async because we fetch JSON files, which takes a moment. */
async function init() {
  startCountdown();

  try {
    // Step 1: load the master topic list.
    const topicsFile = await fetch('data/topics.json').then((r) => r.json());

    // Step 2: load every topic's question file (in parallel with Promise.all).
    topicsData = await Promise.all(
      topicsFile.topics.map(async (t) => {
        const data = await fetch(t.file).then((r) => r.json());
        return { id: t.id, title: t.title, titleHe: t.titleHe, questions: data.questions };
      })
    );
  } catch (err) {
    // NOTE: fetch() of local files fails if you open index.html directly
    // as a file:// URL. You must serve the folder over http (see README).
    $('topic-list').innerHTML =
      '<p style="color:#ef4444">Could not load questions. Are you running a local server? See README.md.</p>';
    console.error(err);
    return;
  }

  // Step 3: draw the home screen.
  renderHome();
  renderProgress();

  // footer question count
  const totalQ = topicsData.reduce((sum, t) => sum + t.questions.length, 0);
  $('q-count').textContent = totalQ;

  // wire up the static buttons that always exist
  $('mixed-btn').addEventListener('click', startMixedQuiz);
  $('next-btn').addEventListener('click', goNext);
  $('quit-btn').addEventListener('click', goHome);
  $('retry-btn').addEventListener('click', () => startQuiz(quiz.questions, quiz.label));
  $('home-btn').addEventListener('click', goHome);
}

/* ---------- 4. SCREEN HELPERS ------------------------------------------- */
/* Only one <section class="screen"> is visible at a time. */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function goHome() {
  quiz = null;
  renderProgress();
  showScreen('home');
}

/* Build one card per topic on the home screen. */
function renderHome() {
  const list = $('topic-list');
  list.innerHTML = '';
  topicsData.forEach((topic) => {
    const card = document.createElement('button');
    card.className = 'topic-card';
    card.innerHTML =
      '<div class="t-title">' + topic.title + '</div>' +
      '<div class="t-title-he">' + topic.titleHe + '</div>' +
      '<div class="t-count">' + topic.questions.length + ' questions</div>';
    // NOTE: clicking a card starts a quiz of just that topic.
    card.addEventListener('click', () => startQuiz(shuffle(topic.questions), topic.title));
    list.appendChild(card);
  });
}

/* Countdown ribbon in the header. Recomputes every hour is overkill; once is fine. */
function startCountdown() {
  const ms = EXAM_DATE - new Date();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  const el = $('countdown');
  if (days > 1)      el.textContent = '📅 ' + days + ' days to ' + EXAM_NAME;
  else if (days === 1) el.textContent = '📅 Tomorrow: ' + EXAM_NAME;
  else if (days === 0) el.textContent = '📅 Exam is today — good luck!';
  else                 el.textContent = '✅ ' + EXAM_NAME + ' done';
}

/* ---------- 5. QUIZ FLOW ------------------------------------------------- */
function startMixedQuiz() {
  // flatten every topic's questions into one big pool, then shuffle.
  const all = topicsData.flatMap((t) => t.questions);
  startQuiz(shuffle(all), 'Mixed');
}

/* Create a new Quiz and show the first question.
   `questions` = array of question objects, `label` = what to call this run. */
function startQuiz(questions, label) {
  quiz = new Quiz(questions);
  quiz.label = label;           // remember for the "Try again" button
  renderQuestion();
  showScreen('quiz');
}

/* Draw the current question, its (optional) code, and the four options. */
function renderQuestion() {
  const q = quiz.current();

  $('q-progress').textContent = quiz.progressLabel();
  $('q-score').textContent = 'Score: ' + quiz.score;
  $('progress-fill').style.width = (quiz.progressFraction() * 100) + '%';
  $('q-topic').textContent = q.topic || quiz.label;
  $('q-text').textContent = q.question;

  // code block: show only if this question has a code snippet
  const codeBox = $('q-code');
  if (q.code) {
    codeBox.querySelector('code').textContent = q.code;
    codeBox.classList.remove('hidden');
  } else {
    codeBox.classList.add('hidden');
  }

  // build the answer buttons fresh each time
  const optionsBox = $('q-options');
  optionsBox.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.innerHTML = '<span class="letter">' + letters[i] + '</span><span>' + text + '</span>';
    btn.addEventListener('click', () => handleAnswer(i));
    optionsBox.appendChild(btn);
  });

  // hide last question's feedback
  $('feedback').classList.add('hidden');
}

/* Runs when the user picks an option. */
function handleAnswer(choiceIndex) {
  const result = quiz.answer(choiceIndex);
  if (!result) return;   // already answered — ignore

  const optionButtons = $('q-options').querySelectorAll('.option');
  optionButtons.forEach((btn, i) => {
    btn.disabled = true;                                  // lock all options
    if (i === result.correctIndex) btn.classList.add('correct');   // always mark the right one
    if (i === result.chosenIndex && !result.isCorrect) btn.classList.add('wrong');
  });

  // running score update
  $('q-score').textContent = 'Score: ' + quiz.score;

  // show the wide explanation
  const verdict = $('feedback-verdict');
  verdict.textContent = result.isCorrect ? '✓ Correct!' : '✗ Not quite';
  verdict.className = 'feedback-verdict ' + (result.isCorrect ? 'ok' : 'no');
  $('feedback-explanation').textContent = result.explanation;
  $('feedback').classList.remove('hidden');
}

/* "Next →" button: advance, or finish. */
function goNext() {
  const hasMore = quiz.next();
  if (hasMore) {
    renderQuestion();
  } else {
    showResults();
  }
}

/* Final screen with the score. */
function showResults() {
  const pct = quiz.percent();
  $('results-score').textContent = quiz.score + ' / ' + quiz.total + '  (' + pct + '%)';

  let msg;
  if (pct === 100)      msg = 'Perfect run. You know this cold. 💪';
  else if (pct >= 80)   msg = 'Strong. Review the ones you missed and you are exam-ready.';
  else if (pct >= 60)   msg = 'Good base. Redo this topic tomorrow to lock it in.';
  else                  msg = 'Early days — read the explanations, then run it again.';
  $('results-message').textContent = msg;

  saveProgress(quiz.label, pct);
  showScreen('results');
}

/* ---------- 6. PROGRESS STORAGE (localStorage) --------------------------- */
/* NOTE: localStorage keeps small data in the browser between visits.
   Everything is wrapped in try/catch because some browsers/modes block it —
   the app must still work if storage is unavailable. */
const STORAGE_KEY = 'ds-trainer-best';

function saveProgress(label, pct) {
  try {
    const best = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // keep only the HIGHEST score seen for each quiz label
    if (!best[label] || pct > best[label]) {
      best[label] = pct;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
    }
  } catch (e) {
    console.log('localStorage unavailable — progress not saved.');
  }
}

function renderProgress() {
  const box = $('progress-summary');
  let best = {};
  try {
    best = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) { /* ignore */ }

  const labels = Object.keys(best);
  if (labels.length === 0) { box.innerHTML = ''; return; }

  let html = '<strong>Your best scores</strong>';
  labels.forEach((label) => {
    html += '<div class="row"><span>' + label + '</span><span>' + best[label] + '%</span></div>';
  });
  box.innerHTML = html;
}

/* ---------- GO! ---------------------------------------------------------- */
init();
