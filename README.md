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

With no environment variables the app still runs: it falls back to a seeded local
account in the browser, so a deploy is never broken by a backend that has not been
wired up yet.

---

## Supabase

Accounts, cross-device sync and real persistence. Two variables switch it on;
without them the local fallback above stays in charge.

### 1. Run the migrations

Paste each file into the Supabase SQL editor, in order:

| File | What it does |
| --- | --- |
| `supabase/migrations/0001_schema.sql` | Tables, row level security, the leaderboard view, the photo bucket, and the trigger that gives every new sign-up a profile |
| `supabase/migrations/0002_seed_content.sql` | The route itself — 5 destinations, 20 encounters, 9 milestones |

The seed file is generated, never hand-written:

```bash
node scripts/generate-seed.mjs
```

It reads `src/data/*.ts` and emits upserts, so the route in the database cannot
drift from the route in the code. Re-run it after editing the cast.

### 2. Set the variables

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Locally in `.env.local`; on Vercel under Settings → Environment Variables, then
redeploy.

**Vite only exposes variables prefixed `VITE_`.** The Vercel–Supabase integration
injects `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_*`, none of which reach a client
bundle. These two have to be added by hand.

The anon key belongs in the browser — it is public by design and carries no
authority of its own. Row level security is what protects the data. **The service
role key must never appear in this project.**

### 3. Make yourself an admin

Roles live in the database, not the client:

```sql
update public.profiles set role = 'admin' where handle = 'your-handle';
```

### How the data is governed

Content (destinations, characters, milestones) is readable by everyone and
writable only by admins. Records (profiles, activities, encounters) are readable
only by their owner — there is no exception, including for admins.

The one deliberate crossing is the leaderboard, which is a view rather than a
table. It exposes per-person totals for people who switched visibility on, and
runs as its owner precisely so it can aggregate rows the caller cannot read.
Individual walks stay private.

Encounter photos go to a private bucket keyed by user id and are read back
through short-lived signed URLs, rather than sitting in a column as base64.

### Swapping the backend

`src/lib/db/types.ts` defines a `PersistenceAdapter`. There are two
implementations — `localAdapter.ts` and `supabaseAdapter.ts` — and `App.tsx`
picks one. Nothing above that seam knows which is in use: no page, no component,
no selector changed when Postgres was added.

## Not built

Stated plainly so nothing here is mistaken for finished:

- **Friends** is a seeded fixture, not a real social graph. There is no request,
  acceptance or friendship table yet — the Supabase leaderboard view is real, the
  friend list above it is not.
- **Email confirmation** is whatever the Supabase project is configured to do.
  The sign-up screen assumes confirmation is on and tells people to check their inbox.
- **Fitness integrations.** Registered, deliberately unimplemented; see above.
- **PWA** ships a manifest and icons; there is no service worker or offline cache.
