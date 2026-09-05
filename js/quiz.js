/* =========================================================================
   quiz.js — THE QUIZ ENGINE (pure logic, no DOM/UI here).
   -------------------------------------------------------------------------
   NOTE ON STRUCTURE: we keep the "brain" (this file) separate from the
   "hands" (app.js, which touches the screen). This separation is a core
   software-design idea: logic that could be tested on its own, with no
   browser involved. app.js asks this engine questions like
   "what's the current question?" and "was that answer right?".

   A Quiz is created with an array of question objects (loaded from the
   /data/*.json files). It tracks where you are and your score.
   ========================================================================= */

class Quiz {
  /* constructor runs when you write `new Quiz(questions)`.
     `questions` is an array of objects, each shaped like the JSON entries. */
  constructor(questions) {
    this.questions = questions;   // all questions in this quiz
    this.index = 0;               // which question we're on (0-based)
    this.score = 0;               // how many answered correctly
    this.answered = false;        // guard: prevents scoring the same Q twice
  }

  /* how many questions total */
  get total() {
    return this.questions.length;
  }

  /* the question object we're currently showing */
  current() {
    return this.questions[this.index];
  }

  /* human-friendly progress, e.g. "3 / 10" */
  progressLabel() {
    return (this.index + 1) + ' / ' + this.total;
  }

  /* fraction 0..1 for the progress bar width */
  progressFraction() {
    return this.total === 0 ? 0 : this.index / this.total;
  }

  /* Called when the user taps an option.
     `choiceIndex` is which option (0..3) they picked.
     Returns an object telling app.js what to display. */
  answer(choiceIndex) {
    // guard: ignore extra taps once this question is already answered
    if (this.answered) return null;
    this.answered = true;

    const q = this.current();
    const isCorrect = choiceIndex === q.answer;
    if (isCorrect) this.score++;

    return {
      isCorrect: isCorrect,
      correctIndex: q.answer,     // so the UI can highlight the right one
      chosenIndex: choiceIndex,
      explanation: q.explanation
    };
  }

  /* Move to the next question. Returns false if the quiz is finished. */
  next() {
    this.index++;
    this.answered = false;        // reset the guard for the new question
    return this.index < this.total;
  }

  /* final score as a percentage (0..100), rounded */
  percent() {
    return this.total === 0 ? 0 : Math.round((this.score / this.total) * 100);
  }
}

/* -------------------------------------------------------------------------
   Small helper functions (also pure logic, so they live here).
   ------------------------------------------------------------------------- */

/* Fisher–Yates shuffle: returns a NEW shuffled copy of an array.
   NOTE: used for the "Mixed quiz" and to vary question order each run,
   so you don't just memorize the sequence. */
function shuffle(array) {
  const copy = array.slice();               // copy so we don't mutate the original
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]; // swap
  }
  return copy;
}

/* NOTE: `export`-free on purpose — this project uses plain <script> tags,
   not ES modules, so Quiz and shuffle become available globally to app.js.
   This keeps the setup simple with zero build tools. */
