# DS Exam Trainer 🧠 — מאמן למבחן מבני נתונים

A tiny, offline-capable web app for drilling **Data Structures** exam questions.
Multiple-choice (American-style) questions; after you answer, you get a **full
explanation of _why_**. Works on your phone and your laptop from the same code.

Built as a learning project — both the CS content **and** a clean, real
git workflow. Everything is heavily commented so you can read the code and
understand how it fits together.

---

## 1. What's inside — the code structure

```
ds-exam-trainer/
├── index.html          ← the ONE page. Defines 3 screens: home, quiz, results.
├── css/
│   └── style.css       ← all styling. Colors live in variables at the top.
├── js/
│   ├── quiz.js         ← the "brain": the Quiz class + helpers. No screen code.
│   └── app.js          ← the "hands": loads data, draws screens, handles clicks.
├── data/
│   ├── topics.json     ← master list of topics (the app reads this first).
│   ├── time-complexity.json
│   ├── linked-lists.json
│   ├── trees.json
│   ├── sorting.json
│   └── hashing.json    ← each file = one topic's questions.
├── manifest.json       ← PWA config (icon, name) for "Add to Home Screen".
├── sw.js               ← service worker: caches files so the app works OFFLINE.
├── icons/              ← app icons.
└── README.md           ← you are here.
```

**The one big idea to notice:** `quiz.js` (logic) is kept separate from
`app.js` (screen). The logic doesn't know anything about buttons or HTML —
it just answers questions like *"was that correct?"*. This separation is a
core software-design habit and makes code easy to change and test.

**Content is separate from code.** Questions live in `/data/*.json`, not in
the JavaScript. To add a question you edit a data file — you never touch the
engine. (Format of a question is shown in section 5.)

---

## 2. Run it locally

⚠️ **You cannot just double-click `index.html`.** The app loads the `/data`
JSON files with `fetch()`, which browsers block for `file://` pages. You must
serve the folder over a tiny local web server. Pick whichever you have:

```bash
# Python (already on most machines)
python3 -m http.server 8000

# …or Node
npx serve .
```

Then open **http://localhost:8000** in your browser. On your phone, use your
laptop's IP instead of localhost (same Wi-Fi), or just deploy to GitHub Pages
(section 4) and open the public URL anywhere.

---

## 3. Learning git — step by step

This repo already has git initialized with a first commit. Here is the full
workflow, explained. Run these from inside the `ds-exam-trainer/` folder.

### The mental model
- **Working directory** = your actual files.
- **Staging area** = the files you've *marked* to go in the next snapshot (`git add`).
- **Commit** = a saved snapshot with a message (`git commit`).
- **Remote (GitHub)** = a copy in the cloud you push to (`git push`).

### Everyday cycle (memorize this loop)
```bash
git status                 # what changed? (run this constantly)
git add .                  # stage ALL changes for the next commit
git commit -m "message"    # save a snapshot with a clear message
git push                   # send commits up to GitHub
```

### Connect this repo to a new GitHub repository (one time)
1. On GitHub, click **New repository**. Name it `ds-exam-trainer`.
   **Do not** add a README/`.gitignore` there (this repo already has them).
2. Copy the commands GitHub shows under *"…or push an existing repository"*.
   They look like this:
```bash
git remote add origin https://github.com/<your-username>/ds-exam-trainer.git
git branch -M main
git push -u origin main
```
That `-u origin main` sets the default, so from then on you just type `git push`.

### Pull it onto your other machine (laptop ⇄ phone/other laptop)
```bash
git clone https://github.com/<your-username>/ds-exam-trainer.git
```
Then, to get the latest changes any time:
```bash
git pull
```

### Good commit habits (worth building now)
- Commit **small and often**, one logical change per commit.
- Write messages in the imperative: `"Add heap questions"`, not `"added stuff"`.
- Run `git status` before every commit so you know exactly what you're saving.

---

## 4. Deploy free with GitHub Pages (open it from any phone)

Once the repo is on GitHub:

1. Go to your repo → **Settings** → **Pages**.
2. Under *Build and deployment* → *Source*, choose **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)**. Save.
4. Wait ~1 minute. Your app is live at:
   `https://<your-username>.github.io/ds-exam-trainer/`

Open that URL on your phone → browser menu → **Add to Home Screen**. Now it's
an icon like any app, and thanks to the service worker it **works offline**.

**To update the live app later:** just `git push`. Pages redeploys automatically.
(If you changed app files, also bump `CACHE_VERSION` in `sw.js` so phones
refresh their offline cache instead of showing the old version.)

---

## 5. Add your own questions

Open the relevant file in `/data`, copy an existing question object, and edit
it. The shape:

```json
{
  "id": "tc-13",
  "difficulty": "medium",
  "question": "Your question text. Ask about the זמן ריצה here if you like.",
  "code": "int x = 0;            // OPTIONAL — remove this line if no code",
  "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
  "answer": 1,
  "explanation": "The wide explanation shown after answering. Explain WHY."
}
```

- `answer` is the **index** of the correct option (0 = first, 1 = second, …).
- `code` is optional — delete the line entirely for a text-only question.
- To add a whole new **topic**: create `data/my-topic.json` in the same shape,
  then add one line to `data/topics.json`. Done.

---

## 6. Later: the OOP exam

When Data Structures is behind you, this same app switches to OOP with two
small edits:
1. In `js/app.js`, change `EXAM_NAME` and `EXAM_DATE` (the OOP final is
   **2026-10-01**).
2. Add OOP topic files under `/data` and list them in `data/topics.json`.

Ping me and I'll generate the OOP question bank the same way.

---

_Study sources referenced while building the question bank: CLRS (Introduction
to Algorithms, 3rd ed.), Cracking the Coding Interview, and standard
GeeksforGeeks / visualization material on the topics above._
