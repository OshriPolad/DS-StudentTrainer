<div align="center">

# 🧠 DS Exam Trainer

### מאמן למבחן מבני נתונים · Data Structures exam practice for CS students

Multiple-choice questions **in Hebrew** with a **full explanation after every
answer**, step-by-step animations, and a per-line time-complexity trainer.
Runs on your phone and laptop, online or offline.

![Made with](https://img.shields.io/badge/made%20with-HTML%20%2B%20CSS%20%2B%20JS-6366f1)
![No dependencies](https://img.shields.io/badge/dependencies-none-22c55e)
![PWA](https://img.shields.io/badge/PWA-installable%20%26%20offline-7c3aed)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## ✨ Overview

**DS Exam Trainer** is a lightweight web app for drilling Data Structures exam
questions — time complexity (זמן ריצה), linked lists, trees & heaps, sorting,
and hashing. Every question is multiple-choice; after you answer you get a
**detailed explanation of _why_** the answer is right, so you learn from every
attempt.

It was built as a learning project on two fronts: the CS content itself, and a
clean, professional **git + deployment workflow**. All code is commented so you
can read it and understand how each piece fits together.

> **בקצרה:** אפליקציה קלה לתרגול מבחן מבני נתונים — שאלות אמריקאיות עם הסבר מלא
> אחרי כל תשובה. עובדת בטלפון ובמחשב, גם ללא אינטרנט. הקוד מתועד כדי ללמוד ממנו.

## 🚀 Features

Three study modes, all in Hebrew (for Israeli CS students), with C++ code samples:

- **📝 Quiz** — **86 questions across 5 topics** (time complexity, linked lists,
  trees & heaps, sorting, hashing). Multiple-choice; every question ends with a
  detailed explanation of *why*, including the common traps.
- **🎬 Visualize** — **8 step-by-step animations** (stack, linked-list insert &
  traverse, BST insert & search, min-heap insert & extract, bubble sort). Step
  through each stage with an explanation of what's happening and why.
- **⏱️ Complexity trainer** — read a C++ snippet and pick the running time of
  **each line**; then a line-by-line review marks each ✓ / ✗ with a full
  explanation and the overall complexity.
- **Hebrew, done right (RTL)** — questions, options, and explanations are in
  Hebrew and render right-to-left, while C++ code and Big-O notation stay
  left-to-right (handled with Unicode bidi isolates).
- **Works on phone & laptop**, responsive from a single codebase.
- **Installable & offline (PWA)** — "Add to Home Screen" for studying anywhere.
- **Progress tracking** — your best score per topic, saved locally.
- **Zero dependencies** — no frameworks, no build step, no external services.

## 🧩 Tech stack — and why

| Choice | Why it was chosen |
| --- | --- |
| **Vanilla HTML / CSS / JS** | No build step means clean, readable git diffs — ideal for learning git. Runs in every browser with nothing to install. |
| **JSON question bank** | Content is separated from logic. Adding a question is a data edit, never a code change. |
| **PWA (manifest + service worker)** | Home-screen install and full offline use, with no app store. |
| **GitHub Pages** | Free hosting where `git push` *is* the deploy. |
| **C++ code samples** | Matches the course, which is taught in C++. |

## 📦 Project structure

```
ds-exam-trainer/
├── index.html          # single page; 3 modes: Quiz, Visualize, Complexity
├── css/
│   └── style.css       # all styling; theme colors are variables at the top
├── js/
│   ├── quiz.js         # the Quiz class — pure logic, no DOM (the "brain")
│   ├── app.js          # controller + router; the bidi() Hebrew/RTL helper
│   ├── viz.js          # animation engine + SVG renderers (the player)
│   ├── viz-ops.js      # animation CONTENT — the frames for each structure
│   └── complexity.js   # the per-line time-complexity trainer
├── data/
│   ├── topics.json     # master topic list (loaded first)
│   ├── <topic>.json    # one question file per topic (Hebrew content)
│   └── complexity.json # per-line complexity problems
├── manifest.json       # PWA metadata
├── sw.js               # service worker (offline cache)
├── icons/              # app icons
├── SECURITY.md         # security & privacy notes
└── LICENSE             # MIT
```

**Design idea to notice:** `quiz.js` (logic) is deliberately separate from
`app.js` (screen). The logic knows nothing about buttons or HTML — a habit that
keeps code testable and easy to change.

## 🛠️ Run it locally

> ⚠️ Don't open `index.html` directly — the app loads its JSON with `fetch()`,
> which browsers block on `file://` pages. Serve the folder over a tiny server:

```bash
# Python (already installed on most machines)
python3 -m http.server 8000

# …or Node
npx serve .
```

Then open **http://localhost:8000**.

## 🌿 Git workflow (built to learn from)

The mental model:

- **Working directory** → your files.
- **Staging area** → what you've marked for the next snapshot (`git add`).
- **Commit** → a saved snapshot with a message (`git commit`).
- **Remote (GitHub)** → the cloud copy you push to (`git push`).

The everyday loop:

```bash
git status                 # what changed? (run this often)
git add .                  # stage all changes
git commit -m "message"    # save a snapshot, imperative message
git push                   # send commits to GitHub
```

Connect this repo to a fresh **empty** GitHub repository (one time):

```bash
git remote add origin https://github.com/<your-username>/ds-exam-trainer.git
git branch -M main
git push -u origin main
```

Get it on another machine, and stay up to date:

```bash
git clone https://github.com/<your-username>/ds-exam-trainer.git
git pull
```

## 🌐 Deploy free with GitHub Pages

1. Repo → **Settings** → **Pages**.
2. *Source*: **Deploy from a branch** → branch **main** → folder **/ (root)** → **Save**.
3. After ~1 minute the app is live at
   `https://<your-username>.github.io/ds-exam-trainer/`.

Open that URL on your phone → **Add to Home Screen**. To update the live app
later, just `git push` (and bump `CACHE_VERSION` in `sw.js` when you change app
files, so phones refresh their offline cache).

## ➕ Add your own questions

Copy an existing object in the relevant `data/*.json` file and edit it:

```json
{
  "id": "tc-13",
  "difficulty": "medium",
  "question": "Ask about the זמן ריצה here.",
  "code": "int x = 0;   // OPTIONAL — remove this key if there is no code",
  "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
  "answer": 1,
  "explanation": "Explain WHY. This is shown after answering."
}
```

- `answer` is the **index** of the correct option (0 = first).
- To add a whole topic: create `data/my-topic.json`, then add one line to
  `data/topics.json`. No code changes needed.

## 🗺️ Roadmap

- [x] Data Structures question bank (exam: **17 Sep 2026**)
- [ ] OOP question bank (exam: **1 Oct 2026**) — switch `EXAM_NAME` / `EXAM_DATE`
  in `js/app.js` and add OOP topic files.
- [ ] Optional: "review only the ones I got wrong" mode.

## 🔒 Security & privacy

No secrets, no backend, no tracking, no external requests. Your scores stay in
your browser. Details in [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE) © 2026 Oshri Polad — free to use, learn from, and build on.

---

<div align="center">
<sub>Built for revision, and for learning git the right way. בהצלחה במבחן! 🎓</sub>

<sub>Question material references: CLRS (Introduction to Algorithms, 3rd ed.),
Cracking the Coding Interview, and standard GeeksforGeeks / algorithm-visualization resources.</sub>
</div>
