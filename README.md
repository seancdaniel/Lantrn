# Milepost

**Every mile brings you closer.**

A walking tracker that maps real-world steps and distance onto an illustrated adventure
route. Twenty character encounters across five destinations; each one sits at the end of a
measured stretch of walking, and the artwork reveals itself as the miles accumulate.

React 18 · TypeScript (strict) · Vite · React Router · hand-written CSS design tokens.
No UI framework, no component library, no runtime CSS-in-JS.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # typecheck, then dist/
npm run preview      # serve the production build
```

`npm run build:standalone` emits `dist-standalone/index.html` — the entire app inlined into
one file, for hosting anywhere that can serve a static page.

---

## How the numbers work

Three anchors drive every figure in the interface, and everything else is derived from them.
Nothing is stored twice, so no two screens can disagree.

| Anchor | Value | Where it lives |
| --- | --- | --- |
| Lifetime steps | 2,493,842 | `src/data/activity.ts` |
| Stride | 2,000.5 steps per mile | `user.stepsPerMile` |
| Route | 20 legs totalling 1,450 miles | `src/data/characters.ts` |

Distance is always a *view* of steps (`steps ÷ stepsPerMile`), never a stored quantity.
Changing the stride in Settings recalculates the entire history rather than only future days.

`requiredMiles` on a character is the length of **that leg**, not a lifetime threshold.
Cumulative thresholds, unlock dates, streaks and personal records are all computed in
`src/lib/progress.ts` by walking the activity log forward — which is why an encounter's
"date unlocked" is a real date the walking record supports.

Calories are `null` everywhere. Manual entry cannot measure them, and an invented number
would be worse than an empty one.

---

## Architecture

```
src/
  types/          Domain model — User, Activity, Character, Encounter, Milestone…
  data/           Seed content: route, destinations, milestones, artwork manifest
  lib/
    progress.ts   The progression engine. All derivation lives here.
    format.ts     Number, date and duration formatting
    svg.ts        Route geometry (Catmull-Rom → bezier)
    fitness/      Step-source abstraction (see below)
  state/          store (persistence + mutations), theme, toast
  hooks/          count-up, in-view, media query, reduced motion, local storage
  components/
    media/        ImageFrame, CharacterImage, Avatar — every image goes through here
    ui/           Button, Card, Modal, Icon, form primitives, states
    domain/       StatCard, ProgressRing, CharacterCard, AdventureMap, ActivityChart…
    layout/       AppShell, navigation, PageHeader, ErrorBoundary
  pages/          One file per route
  styles/         tokens → base → layout → ui → features
```

State lives in one store (`src/state/store.tsx`) and persists to `localStorage`. Every
screen reads derived values through the `useJourney()` selector, so no page recomputes
progress on its own.

### Routes

`/` · `/activity` · `/history` · `/characters` · `/characters/:id` · `/map` ·
`/milestones` · `/profile` · `/leaderboard` · `/friends` · `/settings` · `/admin`

Clean URLs in the hosted build, backed by the SPA rewrite in `vercel.json`.
The standalone bundle switches to hash routing automatically, because it is served
from a single opaque path with nothing to rewrite against (`src/App.tsx`).

---

## Character artwork

**The code does not draw characters.** Artwork is an image asset; the interface only
provides the box it sits in.

Every image in the product goes through one container (`src/components/media/ImageFrame.tsx`)
which owns the aspect ratio, the crop, the radius, lazy loading and the failure case. A
missing or broken asset renders a designed plate in exactly the same box, so a row of cards
keeps its rhythm whether the illustration exists or not.

To add real artwork:

1. Drop the file in `public/artwork/characters/` — WebP, 1000 × 1250, 4:5.
2. Register one line in `src/data/artwork.ts`.

Nothing else changes. Where a character has artwork, a locked encounter renders that same
asset as a true silhouette via a CSS filter — never a second drawing that can fall out of
register with the first. Where it does not, the plate carries the character's monogram over
a field tinted from its destination palette.

The plate is typographic on purpose. Assembling a figure out of circles and rectangles is
what made earlier drafts of this look machine-generated, and no amount of polish fixes it.

---

## Fitness integrations

`src/lib/fitness/` defines a `FitnessProvider` interface. Manual entry is the only
implementation. Apple Health, Google Health Connect, Fitbit and Garmin are registered with
their real capabilities and blockers, and **reject rather than pretend**:

```ts
connect: async () => { throw new ProviderUnavailableError(name); }
```

Adding a real source means implementing the interface and registering it. No page,
component or store touches a vendor SDK directly.

---

## Accessibility

- Semantic landmarks, skip link, visible focus rings on every interactive element
- Modals trap focus, restore it on close, and close on `Escape`
- Charts ship a visually-hidden data table alongside the SVG
- Map nodes are keyboard-operable buttons
- `prefers-reduced-motion` is honoured, plus an in-app override in Settings
- Progress bars and rings expose `role="progressbar"` / `role="img"` with live values

## Theming

Light is the origin palette; dark is separately tuned rather than inverted. Tokens are
declared three times — bare `:root`, `prefers-color-scheme: dark` guarded against an
explicit light choice, and `[data-theme="dark"]` — so the in-app toggle wins in both
directions and the un-stamped system default still resolves correctly.

---

## Deploying

Vercel auto-detects the Vite setup; `vercel.json` pins the build and adds the SPA
rewrite so a refresh on `/characters` does not 404.

```bash
npm run build     # dist/
```

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

No environment variables are required today — the app is entirely client-side and
persists to `localStorage`, which makes it a working single-user app on any static
host. Accounts and cross-device sync need the backend described below.

## Not built

Stated plainly so nothing here is mistaken for finished:

- **Authentication.** There is a `role` field and the admin area checks it, but there is no
  identity provider, no session, and no server. The demo account is seeded locally.
  **The admin check is client-side only** — it decides what to render, and protects
  nothing. Anything real has to enforce the role server-side.
- **Backend.** Everything is `localStorage`. The data model is shaped for a relational
  store, but no API exists. Persistence is isolated to `load()` and one effect in
  `src/state/store.tsx`, so swapping in a real database does not touch any page or
  component — every screen reads through the `useJourney()` selector.
- **Friends and leaderboard** are seeded fixtures, not a real social graph.
- **PWA** ships a manifest and icons; there is no service worker or offline cache.
