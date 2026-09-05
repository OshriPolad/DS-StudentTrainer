# Security & Privacy

This is a small, client-side study app. It is designed to be safe by default.

## What it does *not* do

- **No secrets, no keys, no backend.** The app is 100% static (HTML/CSS/JS).
  There is nothing to leak — no API keys, tokens, or credentials anywhere in
  the repository or its git history.
- **No external requests.** It loads only its own local files. There are no
  third-party scripts, CDNs, trackers, or analytics. Everything runs in your
  browser, even offline.
- **No personal data collected.** The only thing stored is your best quiz
  scores, kept in your browser's `localStorage` on your own device. It never
  leaves your machine and is never sent anywhere.

## How it stays safe

- All dynamic content is rendered with `textContent`, never `innerHTML`, so
  question text can never be interpreted as executable HTML/JavaScript (XSS-safe).
- The service worker only caches the app's own files.

## If you extend it

If you later add a backend or any API integration:

- Put keys in a `.env` file — it is already git-ignored. Never hardcode a
  secret in source or commit it.
- If a secret is ever committed by accident, rotate (regenerate) it
  immediately — deleting the file is **not** enough, because git keeps history.

## Reporting

Found an issue? Open an issue on the GitHub repository.
