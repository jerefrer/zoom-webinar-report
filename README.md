# Zoom Webinar Report

Free in-browser tool that turns Zoom attendee CSV reports into clean XLSX reports
with deduplicated rejoins, multi-day & multi-room support, country breakdowns,
and engagement insights.

**Your data never leaves your browser.** No upload, no database, no logging.
The optional share link contains only aggregated stats — no emails or names.

➡️ **Live**: https://jerefrer.github.io/zoom-webinar-report/

## Features

- Drag & drop one or more Zoom attendee CSVs
- Auto-deduplicates rejoins (sums real watch time)
- Auto-groups by event date, editable
- Generates a formatted XLSX (Summary / Countries / UbC / UbC_Nmin)
- Rich in-app dashboard: KPI cards, country breakdown, per-day chart,
  engagement histogram, retention curve, peak concurrent viewers
- Shareable URL with aggregated stats only (RGPD-clean)

## Development

```bash
npm install
npm run dev          # local dev server (Vite)
npm test             # Vitest
npm run build        # build to dist/
```

Tech: React 19 + TypeScript + Tailwind v4 + shadcn/ui + Recharts + SheetJS +
PapaParse + lz-string. Tests with Vitest + RTL.

## Deployment

`git push` to `main`. The GitHub Actions workflow at `.github/workflows/deploy.yml`
builds and publishes to the `gh-pages` branch. GitHub Pages serves from that
branch at the repo's Pages URL.

## RGPD posture

All Zoom CSV processing — parsing, deduplication, aggregation, XLSX generation —
runs in the user's browser. Only static assets (HTML, JS, CSS) are loaded from
GitHub Pages. The optional share link encodes only aggregated stats (country
counts, threshold counts, histogram buckets) in the URL hash fragment, which is
never transmitted to any server.

## License

MIT — see [LICENSE](./LICENSE).

## Disclaimer

Independent project. Not affiliated with or endorsed by Zoom Video
Communications, Inc. Zoom® is a trademark of Zoom Video Communications, Inc.
