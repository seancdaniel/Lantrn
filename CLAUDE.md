# Lantrn — working notes

A walking tracker that maps real steps onto an illustrated adventure route.
21 character encounters across 5 destinations, 1,550 miles end to end.

**The folder is still called `Milepost`.** The product was renamed to Lantrn;
the directory and the Vercel project name were left alone because renaming them
means re-pointing the deploy for no gain. Don't "fix" this.

| | |
| --- | --- |
| Live | https://lantrn.fit (apex is primary; `www` 308s to it) |
| Repo | https://github.com/seancdaniel/Lantrn |
| Local | `C:\Users\SeanDaniel\Desktop\Milepost` |
| Vercel | project `milepost`, also serves `milepost-theta.vercel.app` |
| Supabase | project ref `lzbfhxwcxxsplyrgipxq` |
| Spare | `lantrn.world` — bought, still parked at Namecheap, not wired up |

Stack: React 18, TypeScript (strict), Vite, React Router, Supabase. Hand-written
CSS with design tokens — no UI framework, no component library.

---

## Invariants — do not break these

**1. Progress is derived, never stored.** Distance is `steps ÷ stepsPerMile`
computed at read time. There is no `miles` column in Postgres. This is why
changing a stride recalculates all history for free and why no two figures in
the product can disagree. Thresholds, streaks, records and unlock dates are all
computed in `src/lib/progress.ts` by walking the activity log forward.

**2. `requiredMiles` is the length of one leg**, not a lifetime threshold.
Cumulative positions are derived.

**3. The code never draws artwork.** Character art and the brandmark are image
assets; the UI only frames them. An earlier version assembled figures out of
circles and rectangles in SVG and it looked machine-generated — that was torn
out deliberately. When art is missing, `CharacterImage` renders a typographic
plate. Do not reintroduce generated figures.

**4. Everything goes through the adapter seam.** `src/lib/db/types.ts` defines
`PersistenceAdapter`; `localAdapter.ts` and `supabaseAdapter.ts` implement it.
No page, component or selector knows which is in use. Adding a data operation
means adding it to the interface and both implementations.

**5. Calories are always `null`.** Manual entry cannot measure them. An invented
number is worse than an empty one.

---

## Gotchas that have already cost time

**Content lives in Postgres now.** Editing `src/data/characters.ts` changes
nothing on the live site by itself. Regenerate and run the SQL:

```bash
node scripts/generate-seed.mjs   # rewrites supabase/migrations/0002_seed_content.sql
```

Then paste the changed rows into the Supabase SQL editor. Every statement is an
upsert, so re-running the whole file is safe.

**Vite only exposes `VITE_`-prefixed env vars.** The Vercel–Supabase integration
injects `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_*`; none of those reach a
client bundle. The app needs `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`, set by hand in Vercel.

**curl against the Vercel deployment gets blocked.** Repeated automated requests
trip a "Vercel Security Checkpoint" and return 403 or 000. Real browsers are
unaffected. Verify through the browser tool, not curl.

**The auditor must assert the page rendered.** A DOM audit reports "clean" on a
blank page. Two sweeps were once reported as passing when the app had failed to
load. Always check node counts before trusting a pass.

**Test authorisation against real rows.** The profile-read policy leaked real
names to anonymous callers, and the check returned "0 rows — clean" while the
table was empty. An empty schema proves nothing.

**It is `lantrn`, no "e".** `lantern.fit` and `lantern.world` belong to domain
marketplaces. Typing the full word into a config field points the app at a
stranger's parked page with no error anywhere.

**Env vars apply at build time.** Adding one in Vercel does nothing until a
redeploy, and the build cache must be off or you get the same bundle back.

---

## Layout

```
src/
  lib/progress.ts        derivation engine — all progress logic lives here
  lib/db/                PersistenceAdapter + local and Supabase implementations
  lib/supabase/client.ts nullable client; app falls back to local when unset
  lib/fitness/           step-source abstraction; only manual entry is real
  data/                  seed content, artwork manifest
  state/                 store (adapter-backed), auth, theme, toast
  components/media/      ImageFrame, CharacterImage, Avatar — all images
  components/domain/     StatCard, ProgressRing, AdventureMap, ActivityChart…
  pages/                 one file per route
  styles/                tokens → base → layout → ui → features
supabase/migrations/     0001 schema+RLS, 0002 seed (generated), 0003 privacy fix
scripts/                 generate-seed.mjs, build-brand.py
```

## Commands

```bash
npm run dev               # localhost:5173
npm run build             # typecheck, then dist/
npm run build:standalone  # single inlined HTML
node scripts/generate-seed.mjs
python scripts/build-brand.py   # regenerates brand assets from the source PNG
```

Brand source art: `C:\Users\SeanDaniel\Pictures\Lantrn\lanternflame.png`.
The script crops it, squares it, and derives a dark-theme variant that lightens
the linework while leaving the flame alone.

---

## Data model

Content (`destinations`, `characters`, `milestones`, `announcements`) is
world-readable, admin-writable. Records (`profiles`, `activities`,
`encounters`) are owner-only — admins included, except for profiles.

The leaderboard is a **view**, not a table. `security_invoker = off`, so it
aggregates rows the caller cannot read and exposes only handles and totals, for
people who opted in via `profiles.leaderboard_visible`. Individual walks stay
private. Read the view; never query the tables behind it for other users.

Encounter photos go to a private storage bucket keyed by user id, read back
through short-lived signed URLs. Never base64 in a column.

Roles live in the database. `is_admin()` is `security definer` so the policies
calling it do not recurse. The client-side role check only decides what to
render; it protects nothing.

---

## Design

Fraunces (display) + Inter (UI). Ember `#BE5F2E`, dusk teal, moss, gold on warm
bone. Light is the origin palette; dark is separately tuned, not inverted —
tokens are declared three times (bare `:root`, `prefers-color-scheme`, and
`[data-theme]`) so the in-app toggle wins in both directions.

One spacing scale (4/8/12/16/24/32/48/64/96), four radii, one icon vocabulary.

Verified free of overflow, text collisions, clipping and sub-11px type at
1440 / 1280 / 1024 / 768 / 480 / 390 / 375, light and dark.

Every split layout declares a real content minimum. `minmax(0, 1fr)` beside a
fixed sibling once collapsed the hero's text column to 142px.

---

## Open work

- **Friends page is seeded fixtures.** `FriendsPage.tsx` renders
  `communityMembers`. Needs a `friendships` table with requests and acceptance.
  The leaderboard is already real.
- **`/admin` renders for anyone.** Writes are rejected server-side by
  `is_admin()`, so it is cosmetic — but worth an env flag before wider sharing.
- **No wide share image.** `twitter:card` is `summary` because the brandmark is
  square. A 1200×630 composition is needed before posting the link publicly.
- **`lantrn.world`** — parked; add in Vercel as a redirect, repoint DNS.
- **Fitness integrations** are registered and deliberately unimplemented. They
  reject rather than pretend. Keep it that way until one is genuinely wired.
- **Three IP dial-backs** the user chose to skip: The Lakekeeper stacks four
  distinctive traits from one source, The Rose Gardener's "under glass" is a
  1991 film invention rather than the fairy tale, The Sworn Companion's "water
  he cannot swim" is a specific scene. Raised, considered, declined. Do not
  re-raise unprompted.

## Character naming

The route deliberately evokes five well-known journeys: a hidden wizarding
school, the road to a green city, a frozen north, a cursed castle, and a walk to
a mountain of fire. Archetypes and situations only — no protected name, place or
line. The user is aware of the IP position and has decided it is fine for
personal use. Keep new characters at the same arm's length.
