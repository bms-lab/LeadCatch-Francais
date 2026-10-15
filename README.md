# LeadCatch

A small, free web app for independent service pros (cleaners, painters, plumbers, electricians, tilers, gardeners, handymen…) to stop losing jobs:

- keep every customer inquiry in one list,
- build and print/save professional quotes,
- follow up on **WhatsApp** (or email) with ready-made messages in **Français, Darija or English**.

The interface is in **French** (built for artisans in Morocco); follow-up messages and printed quotes can be switched between Français, Darija and English.

Everything runs in the browser. There is **no server, no database, no account and no API key**. Data is stored in the visitor's own browser (`localStorage`) and can be exported/imported as a JSON backup.

---

## What it does

| Area | Details |
|---|---|
| **Tableau de bord** | Pipeline value vs. won revenue, new inquiries, quotes awaiting an answer, overdue / due-today follow-ups. |
| **Prospects** | Add / edit / delete, search (name, phone digits, email, notes), filter by status and source, WhatsApp + call shortcuts. Cards on phones, table on desktop. |
| **Devis** | Itemised quotes (fractional quantities OK), discount %, tax %, automatic numbering `LC-YYYY-NNN` (numbers are never reused), status tracking, **Print / Save as PDF** layout in English or French. Accepting a quote marks the lead as won with the quote total. |
| **Relances** (follow-up assistant) | 5 scenarios × 3 languages. Copy, open WhatsApp (`wa.me`) or email with the text pre-filled. Nothing is ever sent automatically. |
| **Statistiques** | Win rate, conversion, revenue by service and by source; All time / 30 / 90 days / 12 months. |
| **Paramètres & données** | Business profile (name, phone, currency — MAD/DH by default —, default country code, message language), JSON export / import (replace or merge), reset to example records. |
| **Offline / installable** | PWA: open once online, then it works offline and can be added to the phone home screen. |

First visit shows **sample data** (clearly labelled) so the app can be explored; "Start with my own data" clears it.

### Phone numbers & WhatsApp
Numbers are normalised with the *default country code* from Settings (default `212`, Morocco). `06 12 34 56 78`, `+212 6…`, `00212 6…` and `612345678` all open the right chat. Other countries: change the country code in Settings.

---

## Run locally

```bash
npm install        # or: bun install
npm run dev        # http://localhost:3000
npm run build      # production build in ./dist
npm run lint       # TypeScript check
```

No environment variables are needed.

## Deploy (free)

The repo is ready for **Vercel** (`vercel.json` contains the SPA rewrite, security headers and a no-cache header for the service worker). Import the GitHub repo in Vercel → framework "Vite" → Deploy. Netlify / Cloudflare Pages work the same way (build command `npm run build`, output `dist`, SPA fallback to `index.html`).

---

## Tech

React 19 · Vite · Tailwind CSS v4 · lucide-react · TypeScript. No backend.

```
src/
  App.tsx                 state, persistence, navigation
  components/             views and modals
  utils/formatters.ts     dates (local time), money, phone → wa.me, quote numbers
  utils/storage.ts        load / validate / export / import (tolerates corrupt data)
  utils/templates.ts      follow-up messages (en / fr / darija)
  utils/demoData.ts       sample + blank data
public/                   icons, manifest.webmanifest, sw.js (offline)
```

## Data & privacy

All records stay on the device. Clearing the browser's site data deletes them — **use Settings → Export Data (JSON) regularly**. The app does not track users and makes no network requests other than loading its own files and Google Fonts.
