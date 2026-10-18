# AuctionHub Brasil

First local prototype of a Brazilian vehicle-auction analysis dashboard. Based on
the supplied reference PNG. All six lots, observations, sources, and reference
prices are **synthetic**; there is no live scraping or FIPE integration yet.

Requires Node.js 20 or newer. No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:5173. Use `npm.cmd start` if PowerShell blocks npm scripts.
Stop with Ctrl+C. Optionally set `PORT` to change the listening port.

```sh
npm test
```

Search/filter/sort lots, bookmark filters via URL, save favorites in this browser,
and select **Analisar** to see sample history and prefill the calculator. All
calculator assumptions remain editable. Favorites are browser-local, not synced.

The calculator uses commission and a manual tax assumption on the bid plus fixed
acquisition costs. Selling expenses are subtracted when calculating profit and ROI.
The maximum bid solves for the requested ROI on acquisition cost and rounds down
to cents. Tax is a manual scenario input; no jurisdiction-specific liability is
determined. Reference values are not predicted resale proceeds.

This first slice uses browser-native JavaScript and a loopback-only Node static
server. It has no persistence beyond favorites, API, authentication, collection,
or production database. Production monetary arithmetic will use Decimal in the
planned FastAPI backend; the prototype uses JavaScript numbers.

See [PLAN.md](PLAN.md) for milestone acceptance criteria and the target
React/TypeScript, FastAPI, PostgreSQL architecture. The original planning discussion
is preserved in [docs/original-planning-notes.md](docs/original-planning-notes.md).
