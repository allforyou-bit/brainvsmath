# Brain vs Math 🧠⚡

**[Play it live →](https://allforyou-bit.github.io/brainvsmath/)**

A free daily math playground:

- **Daily Target** — six numbers, one target, five tiers (Warm-up → Expert). Everyone in the world gets the same puzzle; a new one drops at local midnight.
- **Math Sprint** — 60-second adaptive mental math speed round.
- **Times Tables** — interactive 12×12 chart + quick-fire quiz.
- **Worksheet Generator** — free printable math worksheets with answer keys (seeded & shareable).
- **Percentage Calculator** — three percent tools with the formulas explained.

## How the "zero-maintenance daily puzzle" works

There is no server and no cron job. Each day's puzzles are generated **deterministically from the date** with a seeded PRNG (xmur3 + mulberry32), and solvability is guaranteed by construction — the generator builds the target by actually applying random valid operations to the six numbers, so a solution path always exists. Same date → same puzzle for every visitor on Earth.

## Stack

Zero-dependency static HTML/CSS/JS. No build step, no frameworks, no external requests (fonts are system stack). Fast on a school Chromebook, installable as a PWA.

## Develop locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes the repo root to GitHub Pages.

## Configuration

All monetization/analytics is gated behind [`config.js`](config.js) — empty values mean nothing loads. See file comments.

## License

[MIT](LICENSE) — content and worksheets are free for personal, classroom and tutoring use.
