# Admin UI — Phase A buildlog (Editorial subsystem)

Day-by-day record of the editorial admin UI work on branch
`feat/admin-articles` (cut from `main` 2026-05-28, after the
27-commit stripe PR merged as `4242357`). Single canonical
document for "what got built, why, and what's deliberately
left out."

See [Phase A scope](#phase-a-scope) for the full feature
inventory of the editorial subsystem, what's in Phase A,
and what's deferred. See `docs/admin-backlog.md` (written
on Day 10) for everything we explicitly decided not to do
this phase, with the trigger that should make us reconsider.

---

## Background — what we built towards

After stripe shipped, content is the next blocker. Without
an admin UI, editors can't publish; without published
articles, paywall is moot; without paywall, the stripe
subscription buys nothing.

Reference inspirations:

- **Kobeissi Letter** ([thekobeissiletter.com](https://www.thekobeissiletter.com/),
  [newsletters index](https://www.thekobeissiletter.com/analysis/newsletters),
  [pricing](https://www.thekobeissiletter.com/pricing)) —
  organises content by asset class not time; free Chart of the
  Week + paid newsletters; samples page for acquisition;
  members area separated from marketing site. AITO already
  matches their structural choices in [the schema](../packages/database/prisma/schema.prisma) —
  this work surfaces those structures to editors.
- **WeChat Official Account editor** — sets the bar for the
  rich-text editing experience real editorial teams expect.
  We hit the 20% of features that cover 80% of writing,
  detailed under [Editor capabilities](#editor-capabilities-3-edit-experience).

---

## Phase A scope

The editorial subsystem is much more than an editor. Below is
the full inventory across eight sub-areas. Each row says whether
it's in Phase A, deferred (Phase B+), or deliberately out
(`docs/admin-backlog.md`).

### 1. Identity & access (Day 1)

| Feature | Phase A |
|---|---|
| `requireStaff()` helper — block non-staff from /admin | ✅ |
| `requirePermission(key)` helper — gate per-action | ✅ (used by every server action) |
| Admin shell layout (left nav, topbar, sign-out) | ✅ |
| `/admin` dashboard with four tiles (Articles / Reviews / Users / Settings) | ✅ |
| Seed: grant `super_admin` role to `demo-admin@aito.io` | ✅ |
| Staff invitation flow (email new editor) | ⏳ Phase B |
| Per-user role-grant UI (assign / revoke roles) | ⏳ Phase B |
| Two-factor auth requirement for admin | ⏳ Phase B |
| SSO / SAML | 🚫 docs/admin-backlog.md |

### 2. Article list & discovery (Day 3)

| Feature | Phase A |
|---|---|
| `/admin/articles` list page | ✅ |
| Status tabs: `drafts / in_review / scheduled / published / archived` | ✅ |
| Sort by updatedAt (desc) | ✅ |
| Each row: title (EN), status badge, author, last updated, tier badge | ✅ |
| Click-through to edit | ✅ |
| Search by title | ⏳ Phase B (start of S list) |
| Filter by author | ⏳ Phase B |
| Filter by category / tier / kind | ⏳ Phase B |
| Pagination (default 25/page) | ✅ |
| Bulk actions (archive several at once) | 🚫 docs/admin-backlog.md |

### 3. Edit experience (Days 4-8) — **the heaviest slice**

#### 3a. Metadata (Day 4)

| Feature | Phase A |
|---|---|
| Slug (auto-generated from EN title, editable, uniqueness check) | ✅ |
| `kind` selector (`newsletter` / `podcast` / `live`) — Phase A only `newsletter` enabled | ✅ |
| Category dropdown (existing categories from DB) | ✅ |
| Tags multi-select (existing tags) | ✅ |
| `requiredTier` dropdown (free / premium / pro) | ✅ |
| Authors multi-select (existing authors, including byline order) | ✅ |
| Cover image URL field (paste URL only) | ✅ |
| SEO meta title / description / OG image overrides | ✅ |
| Compliance classification (`general` / `educational` / `specific_recommendation`) | ✅ |
| Source citations (`ArticleSource` rows) | ⏳ Phase B |
| Editorial position disclosure (`EditorialPositionDisclosure`) | ⏳ Phase B |
| Cover image upload (not just URL) | ⏳ Phase B |
| AI-suggested SEO description | 🚫 docs/admin-backlog.md |

#### 3b. Translation tabs (Day 4)

| Feature | Phase A |
|---|---|
| Three tabs: EN / zh-CN / zh-HK | ✅ |
| Each tab has independent title / subtitle / excerpt / body | ✅ |
| **At least one language must be filled** (any of the three) | ✅ |
| Public site renders gracefully when the visitor's locale is missing — falls back to whichever locale is filled | ✅ |
| "Copy from another locale" button (pick source language, paste into current tab) | ✅ |
| Slug input shown explicitly (auto-suggested from the first filled language's title, but editor can override) — falls back to `article-<6 char id>` when the first language is non-Latin and no manual slug is given | ✅ |
| Per-translation "ready" flag (editor marks translation complete) | ⏳ Phase B |
| Machine-translation assist | 🚫 docs/admin-backlog.md |

#### 3c. Editor capabilities (Days 5-8)

**M (Must, Day 5-6)** — TipTap + DOMPurify + autosave

| Feature | Phase A |
|---|---|
| Text formatting: bold, italic, underline, strikethrough | ✅ |
| Headings H2 / H3 | ✅ |
| Blockquote (with left bar styling) | ✅ |
| Divider (`<hr>`) | ✅ |
| Ordered / unordered lists | ✅ |
| Links (with target attribute) | ✅ |
| Text alignment (left / center / right) | ✅ |
| Font color picker | ✅ |
| Background highlight picker | ✅ |
| Font size presets (5: small/normal/medium/large/heading) | ✅ |
| Line height presets (3: 1.5 / 1.75 / 2.0) | ✅ |
| First-line indent toggle (per-block) | ✅ |
| Undo / redo | ✅ |
| Autosave (debounced 2s, status indicator) | ✅ |
| Paste from WeChat / web / Word — sanitised | ✅ |
| Code block with syntax highlight | ✅ |
| HTML source view toggle (view + edit raw HTML) | ✅ |

**S (Should, Day 7)** — Images

| Feature | Phase A |
|---|---|
| Drag-and-drop image upload | ✅ |
| Paste image (clipboard / screenshot) | ✅ |
| Image caption | ✅ |
| Image alignment (center / left / right) | ✅ |
| Max-width clamp (760px desktop, 100% mobile) | ✅ |
| Image upload to Vercel Blob | ✅ |
| Upload progress indicator | ✅ |
| Tables | ⏳ Phase B |
| Image gallery (multiple images horizontal scroll) | ⏳ Phase B |
| Video embed (YouTube / Vimeo / Mux) | ⏳ Phase B |
| Audio embed | ⏳ Phase B |
| Chart / TradingView embed | ⏳ Phase B |
| Polls / surveys | 🚫 docs/admin-backlog.md |
| WeChat-style layout templates | 🚫 docs/admin-backlog.md |

#### 3d. Preview & utilities (Day 8)

| Feature | Phase A |
|---|---|
| Preview button → opens `/articles/[slug]?preview=true` in new tab (renders draft as if published) | ✅ |
| Mobile preview view (toggle in preview tab) | ✅ |
| Word count + reading time (per-translation) | ✅ |
| Save indicator (Saved / Saving... / Save failed) | ✅ |
| `Cmd+S` keyboard shortcut to force save | ✅ |
| Markdown source mode | ⏳ Phase B |
| Side-by-side live preview | ⏳ Phase B |

### 4. Editorial workflow (Day 9 — slimmed)

Direct-publish for Phase A. The full `in_review / legal_review /
scheduled` workflow exists in the schema (and in the spec) but the
admin UI doesn't surface it yet — editors hit Publish straight from
draft. Saves ~1.5 days of UI work and the additional state-gate
testing. Picked up in Phase B when there's a real editorial team
that needs a second pair of eyes before things ship.

| Feature | Phase A |
|---|---|
| State machine: `draft → published → archived` (3 of the spec's 6 states) | ✅ |
| Publish (draft → published) — editor clicks directly, no review gate | ✅ |
| Unpublish back to draft (published → draft) for hot-fixes | ✅ |
| Archive (published → archived; un-archive supported) | ✅ |
| `in_review` state + `/admin/reviews` queue | ⏳ Phase B |
| `legal_review` state (compliance flag) | ⏳ Phase B |
| `scheduled` state (publish at a future timestamp) | ⏳ Phase B |
| `ArticleReview` rows, edit-after-approval re-gate, reviewer notes | ⏳ Phase B |
| Editor self-assigns to review queue | ⏳ Phase B |
| Multi-stage review (e.g. editor → chief editor) | 🚫 docs/admin-backlog.md |

### 5. Revisions & audit (background — uses existing infra)

| Feature | Phase A |
|---|---|
| Every `ArticleTranslation` update snapshots to `ArticleTranslationRevision` (prisma middleware already exists in db package) | ✅ (no work needed) |
| Every admin write produces an `AuditLogEntry` (via new `recordAuditLog()` helper) | ✅ |
| `/admin/articles/[id]/history` revision timeline UI | ⏳ Phase B |
| Diff viewer (compare two revisions) | ⏳ Phase B |
| Rollback to a previous revision | ⏳ Phase B (mechanism exists, UI doesn't) |
| `/admin/audit` audit log viewer | ⏳ Phase B (data exists, UI doesn't) |
| Per-resource audit history (e.g. "who edited this article when") | ⏳ Phase B |

### 6. Reader-side surfaces (Phase A touches these read-only)

| Feature | Phase A |
|---|---|
| Existing `/articles/[slug]` reader page continues to work for `published` articles | ✅ (no changes) |
| Reader page supports `?preview=true` (staff only) to render `draft / in_review` content | ✅ |
| Article list / archive pages (e.g. `/articles`, `/articles/category/[slug]`) | ⏳ Phase B if missing |
| Cover image rendering on cards | depends on what already exists in the codebase — investigated Day 3 |
| Paywall (preview-N-paragraphs for non-entitled viewers) | 🔜 separate feature, after Phase A |
| Article view tracking + `ArticleDailyMetric` rollup | ⏳ Phase B |
| Estimated read progress bar | ⏳ Phase B |

### 7. Related entities (NOT in Phase A — explicit deferral)

These exist in the schema but Phase A doesn't surface them. Each
gets its own Phase B/C epic later.

| Sub-system | Why deferred |
|---|---|
| **Podcast episodes** (`Article.kind = podcast` + `PodcastEpisode`) | Same editorial flow as articles, but needs audio file handling + show notes UI. Phase B. |
| **Live class** (`LiveStream` + `LiveRegistration` + `LiveAttendance`) | Needs Mux stream key handling + RSVP UI + Zoom-like join page. Phase C epic. |
| **Errata** (`ArticleErratum`) | Needs published-article-specific UI; do after Phase A's publish flow stabilises. Phase B. |
| **Editorial position disclosure** (`EditorialPositionDisclosure`) | Compliance-adjacent; pair with `legal_review` state. Phase B. |
| **IM groups** (`ImGroup`) | Phase 2 epic — Stream Chat integration is its own animal. |
| **Newsletter subscription** (`NewsletterSubscription`) — email delivery | Explicit non-goal per user request. Phase B/C. |

### 8. Operational

| Feature | Phase A |
|---|---|
| All admin pages i18n: EN strings first | ✅ Day 1-9 |
| zh-CN / zh-HK admin translations | ✅ Day 9 (batch translate) |
| `docs/admin-runbook.md` for staff onboarding | ✅ Day 10 |
| `docs/admin-backlog.md` capturing every deferred / rejected feature | ✅ Day 10 |
| E2E playwright happy path (create → review → publish → reader sees it) | ✅ Day 10 |
| Deploy to staging + smoke | ✅ Day 10 |

---

## Day-by-day target (9 days, slimmed from 10 after dropping review workflow)

| Day | Slice | Closes |
|---|---|---|
| 1 | Staff auth helper, `/admin` shell, dashboard tiles, seed demo-admin | "Who can see /admin?" |
| 2 | Article state machine in `@aito/domain` (3 states: draft / published / archived) + unit tests | "What transitions are legal?" |
| 3 | `/admin/articles` list (status tabs, pagination, search box) + new article action + audit log helper | "How do I make a draft and find it again?" |
| 4 | `/admin/articles/[id]/edit`: metadata form + three-language tabs (any-one required) + slug suggestion + placeholder textarea body | "How do I shape the article shell?" |
| 5 | TipTap base + toolbar (formatting, headings, blocks, alignment, color, highlight) + autosave | "Can I write a paragraph?" |
| 6 | Paste sanitisation (DOMPurify rules) + code block + font/spacing presets + first-line indent | "Does pasting from WeChat just work?" |
| 7 | Image upload: Vercel Blob + drag + paste + caption + alignment + progress | "How do I add a screenshot?" |
| 8 | HTML source toggle + preview tab + word count + reading time + Cmd+S shortcut + **Publish / Unpublish / Archive actions on edit page** | "Can I see what publishes — and click the green button?" |
| 9 | zh-CN/zh-HK admin i18n + E2E playwright test + staging deploy + admin-runbook.md + admin-backlog.md | "Can a real editor use this?" |

Each day's commit message starts with `feat(admin): day N — slice`.

---

## Stack decisions (locked Day 0)

| Choice | Why |
|---|---|
| TipTap (ProseMirror) over Lexical | Notion-class WYSIWYG, MIT, paste sanitisation, image extension, active community, simpler React story. |
| DOMPurify for sanitise on paste + sanitise on render | Defense-in-depth; user content never injects scripts. |
| Vercel Blob for images | Already provisioned via deploy; no extra credentials; CDN included. |
| HTML body storage (`ArticleTranslation.body` already `text`) | TipTap outputs HTML; storing MDX would need a transform layer with no Phase A benefit. Future MDX migration is a one-way move when we actually need React-in-articles. |
| Server actions for every admin write | Centralises permission check + audit log; impossible to accidentally bypass. |
| Branch off `main`, not stripe | Clean base; future stripe-only hotfixes won't tangle with admin commits. |
| Build the state machine in `@aito/domain`, not inline | Mirrors `subscription.ts`; unit-testable in isolation; future React Native / API can reuse. |

---

## Day-end log

Format each day:

- **Shipped** — files touched, packages installed, schema delta
- **Verifies** — manual smoke checklist + automated test counts
- **Decisions** — non-obvious judgement calls
- **Carry-over** — anything pushed to a later day

---

### Day 0 — 2026-05-28 — Scope confirmation

**Shipped**

- Branched `feat/admin-articles` from `main` after the 27-commit
  stripe PR landed (`4242357`).
- Created this buildlog covering the full editorial subsystem
  inventory (eight sub-areas, ~100 line-items).

**Verifies**

- `git branch --show-current` → `feat/admin-articles`
- `git status` → clean (this file is the only change)
- Vercel "Production" deployment of `main` confirmed green
  by user before branching

**Decisions**

- **Editorial subsystem is not just an editor.** First draft of
  this doc was editor-centric; user pushed back. Now organises
  scope across **eight** sub-areas (identity, list, edit, workflow,
  audit, reader-side, related entities, operational). Editor
  capabilities are one of those, not all of it.
- **Studied Kobeissi Letter** as a reference for a comparable
  paid-newsletter site. Key takeaways folded into design:
  category-axis content organisation, free vs paid badges on
  cards, members-area / marketing-site separation. AITO already
  matches their structural choices in the schema — this Phase
  surfaces those choices to editors.
- **Deferred email delivery** per user request. The
  `Newsletter Subscription` sub-system is explicitly *not* a
  Phase A goal.
- **HTML body, not MDX** — confirmed on Day 0 because TipTap
  outputs HTML and Phase A doesn't need React-in-articles. If
  we ever need MDX (embedded interactive charts in articles),
  it's a future one-way migration with acceptable cost.
- **TipTap over Lexical** — Lexical is technically stronger
  but the React docs are thinner. TipTap's `useEditor` hook +
  extension ecosystem ships faster, and the editor team behind
  it is responsive to issues.
- **Scope adjustment after first review (same day):**
  - Language requirement relaxed: *at least one* of EN / zh-CN /
    zh-HK is required, not specifically English. Public site
    falls back gracefully when the visitor's locale is missing
    a translation. Brings a small slug-generation challenge
    handled in §3a (auto-suggest from first filled language,
    fallback to `article-<6 char id>` for non-Latin titles,
    editor can always override).
  - Review workflow cut: editors hit Publish directly from
    draft. `in_review` / `legal_review` / `scheduled` states
    stay in the schema and the `@aito/domain` state machine
    leaves room for them — UI surfacing is Phase B. Saves
    ~1 day of Day 9 work; freed time goes to article-list
    search + zh admin i18n.
  - Project shrinks from 10 days to 9.

**Carry-over**

- Day 1 starts with: `lib/auth/staff.ts` + `/admin` shell +
  dashboard tile + seed `demo-admin@aito.io`.

---

### Day 1 — 2026-05-29 — Staff auth + admin shell + tile dashboard

Closes: "Who can see /admin?"

**Shipped**

New files:

- `apps/web/src/lib/auth/staff.ts` — `getStaffContext()` /
  `requireStaff()` / `requirePermission()` / `hasPermission()`
  helpers mirroring the shape of `viewer.ts`. All four go through
  one `cache()`-wrapped `prisma.userRole.findMany()` per request,
  so a layout + page + server action only pay one query. Excludes
  revoked and expired grants in the SQL where clause; throws a
  typed `StaffAuthError` (rather than redirecting) inside
  `requirePermission` so server actions can return a clean error.
- `apps/web/src/lib/auth/__tests__/staff.test.ts` — 12 unit tests
  covering anonymous, signed-in-but-no-roles, multi-role permission
  dedup, expired-grant exclusion, and all redirect paths in
  `requireStaff` plus the two error codes thrown by
  `requirePermission`.
- `apps/web/src/components/admin/AdminNav.tsx` — left nav with
  five items (dashboard / articles / reviews / users / settings).
  Disabled items render as `<span>` not `<Link>` (no clickable
  link to a placeholder) and carry a "Soon" tag.
- `apps/web/src/components/admin/AdminShell.tsx` — sidebar +
  top-bar layout. Sidebar shows the AdminNav plus a footer card
  with signed-in email + role chips. Mobile gets a slim topbar
  (full nav drawer is Phase B).
- `apps/web/src/app/[locale]/admin/layout.tsx` — server component
  that calls `requireStaff()` (which redirects on its own), pulls
  `admin.*` translations, computes the current path from
  request headers, and renders `AdminShell`. Marked
  `dynamic = "force-dynamic"` so each request goes through the
  guard.
- `apps/web/src/app/[locale]/admin/page.tsx` — dashboard with
  four tiles. Articles is a real `<Link>`; the other three render
  as disabled cards.
- `apps/web/src/app/[locale]/admin/articles/page.tsx` — placeholder
  so the AdminNav link doesn't 404 before Day 3. Renders a copy
  pointing forward to the upcoming create form.
- `apps/web/src/app/[locale]/admin/reviews/page.tsx`,
  `users/page.tsx`, `settings/page.tsx` — three "coming in Phase B"
  placeholder pages so direct URL hits don't 404 either.

Updates:

- `apps/web/messages/{en,zh-CN,zh-HK}.json` — new top-level
  `admin` namespace covering nav labels, dashboard heading,
  tile titles + descriptions, and placeholder copy. zh-CN and
  zh-HK are real translations done by hand on Day 1 because
  they're short (the editor wants HK Cantonese leaning over
  Taiwan zh-TW; verified separately).
- `packages/database/prisma/seed.ts` — appended a `demo-admin@aito.io`
  block: creates the user with `displayName = "Demo Admin"`,
  argon2id-hashed password `DemoAdmin2026!`, marks email verified,
  and grants the seeded `super_admin` role (global scope). Idempotent:
  re-running seed doesn't pile up duplicate grants because we
  pre-check on `(userId, roleId, scopeType: null, scopeId: null,
  revokedAt: null)`.

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/database type-check` → clean
- `pnpm --filter @aito/web test` → 63 passing (12 new staff tests
  added)
- `pnpm --filter @aito/web build` → builds 5 new admin route
  variants (`/admin`, `/admin/articles`, `/admin/reviews`,
  `/admin/users`, `/admin/settings`) × 3 locales = 15 page
  bundles. The expected build-time Prisma errors (DB unreachable
  in CI) match what we saw on the stripe branch.

Manual smoke (against local docker DB):

1. `pnpm db:reset` then `pnpm db:seed` to refresh demo-admin
2. Visit `/en/admin` while signed out → redirected to
   `/sign-in?redirectTo=/admin`
3. Sign in as `demo-free@aito.io` → visit `/en/admin` →
   redirected to `/en/dashboard`
4. Sign in as `demo-admin@aito.io` (`DemoAdmin2026!`) →
   `/en/admin` renders the dashboard with all four tiles, the
   sidebar shows "super admin" role chip
5. Click "Articles" tile → lands on the Day 1 placeholder
6. Direct URL `/en/admin/reviews` → placeholder, no 404

**Decisions**

- **No StaffProfile check.** The spec says staff are
  `User + StaffProfile` rows. Phase A does NOT enforce a
  StaffProfile row — `requireStaff()` is purely a UserRole-grants
  check. Reason: in Phase A we don't surface the department / HR
  metadata, so demanding a StaffProfile row would make the
  super_admin seed grant unusable on its own. Phase B will add a
  StaffProfile UI and tighten the guard.
- **`requirePermission()` throws, doesn't redirect.** Inside a
  server action, redirecting mid-call drops form state on the
  floor. Throwing a typed `StaffAuthError` lets the action return
  `{ ok: false, code: "permission_denied" }` to the client, which
  can show a toast and leave the form intact. The page-level
  `requireStaff()` does still redirect because there's nothing to
  preserve at first paint.
- **`x-invoke-path` for the current path.** Next 15 doesn't expose
  a stable "current pathname" API to server components. The
  middleware-injected `x-invoke-path` header is what next-intl
  itself uses; falling back to `x-pathname` / `next-url` covers
  the rare runtime where Next renames it. Worst case the
  AdminNav highlights the wrong item — purely cosmetic.
- **Placeholder pages for disabled tiles.** Renders nothing
  destructive; preserves muscle memory for the user when typing
  /admin/users directly; cheap to delete in Phase B when we
  swap in the real pages. Alternative was returning 404s, which
  reads as "this is broken" rather than "this is on its way".
- **zh-CN / zh-HK translated on Day 1, not Day 9.** Original
  plan was to leave them as EN placeholders until Day 9 batch
  pass. Reversed because the strings are ~20 short labels and
  doing them by hand now is ~10 minutes vs. a context-switch
  cost on Day 9. zh-HK uses HK Cantonese-leaning Traditional
  per CLAUDE.md.
- **Demo admin password is `DemoAdmin2026!`.** Same shape as the
  other demo accounts. Documented in seed.ts and below.

**Carry-over**

- Day 2 starts with: `packages/domain/src/article.ts` state machine
  (`draft → published → archived` only for Phase A; in_review /
  legal_review / scheduled stay reserved in the machine for Phase B
  but aren't surfaced) + unit tests in
  `packages/domain/src/__tests__/article.test.ts`.

**Demo accounts cheat sheet (local DB after seed)**

| Email                  | Password         | Use                          |
| ---------------------- | ---------------- | ---------------------------- |
| `demo-free@aito.io`    | `DemoFree2026!`  | Free reader (no subscription)|
| `demo-premium@aito.io` | `DemoPremium2026!` | Premium reader              |
| `demo-pro@aito.io`     | `DemoPro2026!`   | Pro reader                   |
| `demo-admin@aito.io`   | `DemoAdmin2026!` | Editorial admin (super_admin) |

---

### Day 2 — 2026-05-29 — Article state machine in `@aito/domain`

Closes: "What transitions are legal?"

**Shipped**

- `packages/domain/src/article.ts` — pure-TS state machine
  mirroring the shape of `subscription.ts`. Exports:
  `ArticleState` (full 6-state union matching the Prisma enum
  one-to-one — no mapping layer between domain and DB),
  `ArticleEvent` (4 events: `publish` / `unpublish` / `archive`
  / `unarchive`), `Article` interface (id + state + optional
  publishedAt + archivedAt), `articleTransition()`,
  `allowedEvents()` for UI button rendering, `isPublic()`, and
  `IllegalArticleTransitionError` (carries `from` + `event` for
  audit log clarity).
- `packages/domain/src/__tests__/article.test.ts` — 33 unit
  tests across six describe blocks: Phase A edges, publishedAt
  invariants, illegal transitions (entire negative-space
  matrix), Phase B states stuck-on-purpose, purity (no input
  mutation), `allowedEvents`, `isPublic`.
- `packages/domain/src/index.ts` — exports the new public API.
  `allowedEvents` and `isPublic` are renamed at the export
  site to `allowedArticleEvents` and `isArticlePublic` so they
  don't collide with future subscription / paywall helpers.

**Verifies**

- `pnpm --filter @aito/domain test` → 49 pass (33 new + the
  existing 16 from subscription + paywall)
- `pnpm --filter @aito/web type-check` → clean (consumes the
  new export through `transpilePackages`)
- `pnpm --filter @aito/web build` → green
- A `pnpm --filter @aito/domain type-check` failure pre-exists
  this branch (`Cannot find type definition file for 'node'`
  — the package's tsconfig lists `node` types but the package
  doesn't depend on `@types/node`). Vitest has its own type
  resolution so the tests pass; verified the failure isn't
  caused by today's diff by stashing and re-running. Logged
  as out-of-scope.

**Decisions**

- **6-state union matches the Prisma enum 1:1.** Phase A only
  uses 3 of them (`draft`, `published`, `archived`) but listing
  all 6 means there's no DB-to-domain mapping layer to maintain.
  Phase B states have empty allowed-transitions maps — so if a
  row ever lands in `in_review` / `legal_review` / `scheduled`
  (manual DB edit, premature Phase B feature toggle), the
  machine refuses to move it and surfaces a clear error rather
  than silently doing something wrong.
- **`publish` is idempotent on `publishedAt`.** First publish
  stamps `publishedAt = now`. Re-publishing (after an
  `unpublish → fix → publish` hot-fix cycle) preserves the
  *original* publishedAt so SEO permalinks stay anchored. Same
  decision Stripe makes about subscription start dates.
- **`unarchive → draft`, not `unarchive → published`.** Pulling
  an article out of the archive means re-opening it for edits;
  the editor must hit publish a second time. Auto-publishing on
  unarchive would surprise people who archive a stale piece
  intending to revise it.
- **`archive` allowed from both `draft` and `published`.** Cheap
  way to clean up abandoned drafts ("this idea didn't pan out")
  without losing the audit trail of an article that existed.
- **`allowedEvents()` helper exists for the admin UI.** Day 8
  needs to render Publish / Unpublish / Archive / Unarchive
  buttons conditionally; rather than re-derive the legal set in
  React, it asks the state machine. One source of truth.
- **`IllegalArticleTransitionError` is distinct from
  `IllegalTransitionError` (subscription).** Future code may
  catch one but not the other (e.g. a webhook handler
  swallowing subscription errors shouldn't swallow article
  errors). Same class shape, different identity.
- **No `requireDraft` / `requirePublished` helpers yet.** Day 3+
  server actions check state via Prisma `where` clauses (e.g.
  `where: { id, state: { in: ["draft", "in_review"] } }`)
  which is more direct than wrapping the article and reading
  `.state`. If we end up writing the same guard 3+ times we'll
  hoist it into a helper.

**Carry-over**

- Day 3 starts with: `/admin/articles` list page (status tabs +
  pagination + search) + a `createArticleAction` server action
  + a `recordAuditLog()` helper modelled on `recordAuthEvent`.
- Article state column on existing `Article` rows in the seed
  doesn't get touched today. Seed already creates articles in
  `published` state. Day 3's list page will be populated by
  those + any new drafts the editor creates.

---

### Day 3 — 2026-05-30 — Article list + create + audit helper

Closes: "How do I make a draft and find it again?"

**Shipped**

Schema:

- `packages/database/prisma/migrations/20260530024950_locale_add_zh_hk/`
  — `ALTER TYPE locale ADD VALUE IF NOT EXISTS 'zh-HK'` (additive,
  before `zh-TW`). Resolves a long-standing mismatch where the i18n
  folder shipped a `zh-HK` namespace but the DB enum only had
  `zh-TW`. No data migration needed — no rows currently use `zh_TW`
  either.
- `packages/database/prisma/schema.prisma` — added the `zh_HK`
  enum value to match.

New admin lib:

- `apps/web/src/lib/admin/audit.ts` — `recordAuditLog()` modelled
  on `lib/auth/audit.ts`. One table (`audit_log_entries`) carries
  both auth events and admin actions so the future audit-viewer
  is one query. `actorType` defaults to `admin`; IP / UA captured
  from request headers; write is *not* try/catch'd (compliance
  must not silently drop audit rows).
- `apps/web/src/lib/admin/slug.ts` + `slug.test.ts` — `suggestSlug()`
  helper. Strips CJK / punctuation / emoji, dash-joins, caps at
  80 chars, falls back to `article-<6char>` for pure-non-Latin
  titles. 8 unit tests covering ASCII, CJK, mixed, emoji, length
  cap, fallback uniqueness.

Server actions:

- `apps/web/src/app/[locale]/admin/articles/_actions.ts` —
  `createArticleAction()`. Flow:
  1. `requirePermission("content.draft")` (catches StaffAuthError,
     converts to a serialisable result code)
  2. zod validate body (slug regex, kind enum, locale enum, title
     min/max)
  3. Auto-suggest slug if blank; pre-check slug uniqueness
     (cheap pre-check before relying on the DB unique constraint
     so the form gets a clean `fieldErrors.slug` instead of a
     500)
  4. `prisma.$transaction`: create Article (status=draft,
     requiredTier=free as default the editor will refine on Day 4)
     + one ArticleTranslation with empty `bodyMdx` and `excerpt`
  5. `recordAuditLog({ action: "article.created", ... })`
  6. `revalidatePath("/admin/articles")` so the new row shows
     up on the next list render
  7. Return `{ ok: true, articleId, slug }` to the client form

  Returns a discriminated `CreateArticleResult` union with codes:
  `validation` (field errors map), `slugTaken`, `permissionDenied`,
  `notStaff`, `internal`. Client maps each to a localized message.

Pages:

- `apps/web/src/app/[locale]/admin/articles/page.tsx` — full list
  replacing Day 1's placeholder. Five status tabs (all / draft /
  published / archived / other), search box (client component
  preserving the active tab), 25/page pagination preserving both
  `?status=` and `?q=`. Concurrent Prisma queries: list + count +
  groupBy(status) for tab badges. Display logic picks the title
  in the viewer's locale, falls back to the first available
  translation, falls back to "(untitled)". Empty state has a CTA
  pointing at /admin/articles/new.
- `apps/web/src/app/[locale]/admin/articles/new/page.tsx` +
  `NewArticleForm.tsx` — server page guards via
  `requirePermission("content.draft")` (redirects to
  `/admin/articles?denied=1` on missing permission), client form
  manages kind + locale + title + slug state. Slug auto-suggests
  from title until the editor touches the slug field — then it's
  fully editable. Errors map per-field. On success redirects to
  the new article's edit page.
- `apps/web/src/app/[locale]/admin/articles/[id]/edit/page.tsx` —
  Day 3 placeholder. Shows title + status badge + slug + a
  "coming soon Day 4" panel. Exists so the post-create redirect
  has somewhere to land and the staff member sees the new row
  is real.

Components:

- `apps/web/src/components/admin/ArticleStatusBadge.tsx` — color-
  coded pill per status. Async server-component variant for use
  in lists; sync client-component variant for use in editor pages
  (Day 4+). Shares the same `TONE` map.
- `apps/web/src/components/admin/ArticleSearchBox.tsx` — client
  component with `useTransition` for non-blocking nav. Preserves
  the active status filter when submitting.

i18n:

- All three locales got `admin.articles.*` blocks: heading,
  subheading, search box copy, empty states, tabs, status labels,
  pagination, the new-article form (with kind/locale/title/slug
  helps and the full error code map), and the edit placeholder.
  zh-CN + zh-HK translated by hand on Day 3 (same reasoning as
  Day 1 — short strings, cheaper to do now than batch on Day 9).

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 71 pass (8 new from slug;
  total includes existing 63)
- `pnpm --filter @aito/web build` → 7 admin route variants
  (dashboard + articles list + new + edit-dynamic + 3 placeholders)
  × 3 locales = 21 page bundles + 1 dynamic edit. Expected
  `prisma:error` lines during build (DB unreachable in CI).

Manual smoke checklist (against local docker DB):

1. Apply the new migration: `pnpm db:up && pnpm db:migrate`
2. `pnpm web:dev`
3. Sign in as `demo-admin@aito.io` / `DemoAdmin2026!`
4. `/en/admin/articles` → renders the existing seeded articles
   under the "Published" tab (seed currently writes them as
   `published`)
5. Click "New article" → fill in `newsletter` / `en` / "My first
   draft" → leave slug blank → submit → lands on the placeholder
   edit page; URL is `/admin/articles/<uuid>/edit`
6. Back to /admin/articles → the new row appears under "Drafts"
   tab with auto-generated slug `my-first-draft`
7. Try creating another article with the same slug typed in
   manually → form shows "This slug is already in use"
8. Search "first" → list narrows to the new row
9. `select * from audit_log_entries where action='article.created'`
   → one row per create, `actor_id` matches demo-admin, `metadata`
   has `source: createArticleAction`

**Decisions**

- **`zh_HK` enum migration shipped today, not deferred.** Editors
  pick a starting language on /new; without `zh_HK` an editor
  drafting in HK Cantonese would have to write it under `zh_TW`
  and we'd carry the mismatch forever. Migration is additive
  and zero-risk because no row currently uses `zh_TW` either.
- **`bodyMdx` column stays named `bodyMdx` even though Day 5
  writes HTML into it.** Renaming the column means a destructive
  migration on a table that already has seeded content. Leave
  the legacy name; add a comment in Day 5 explaining the body
  contract is HTML now. If we ever do need MDX (embedded React
  in articles), the column name still fits.
- **Server action returns a result object, doesn't throw.** Throw
  pattern would lose the user's typed input on the redirect to a
  Next error boundary. Returning `{ ok: false, code, fieldErrors }`
  lets the client display errors next to the offending fields
  without resetting the form.
- **Pre-check slug uniqueness instead of trying to catch P2002.**
  We could rely on the DB unique constraint and translate P2002
  into "slugTaken", but a pre-check produces cleaner field
  errors and avoids the cost of a failed transaction. Race
  condition: two staff members typing the same slug at the same
  second; in that case the second call hits P2002 and currently
  surfaces as `internal`. Acceptable for Phase A — editorial
  teams are tiny enough that this is a theoretical bug.
- **Created with `requiredTier=free` regardless of editor input.**
  /new doesn't ask for tier; Day 4's edit page does. Default
  matches the schema default. Free draft articles aren't
  publicly visible until status flips to `published` anyway,
  so the temporary "free" tier is invisible.
- **`ArticleStatusBadge` ships in both async and sync variants.**
  Day 3 uses async (server component list); Day 4's edit page
  will be a server component too, but the publish/archive
  buttons surrounding the badge will need client-side reactivity.
  Easier to maintain two thin variants now than refactor later.
- **Search filters titles only.** Body / slug / author search
  would each need additional indexes; deferred to Phase B when
  we know what editors actually need. Title-contains is enough
  to find anything an editor remembers writing.
- **"Other" tab folds Phase B states.** `in_review`,
  `legal_review`, `scheduled` aren't reachable from Phase A's
  UI but a Phase B feature toggled prematurely (or a manual
  DB edit) could land an article there. The Other tab gives
  visibility without polluting the main tabs.

**Carry-over**

- Day 4: replace the placeholder edit page with the real
  metadata form + three-language translation tabs (any-one
  required) + still-placeholder body field (Day 5 plugs in
  TipTap). Build the `updateTranslationAction` server action
  alongside.

---

### Day 4 — 2026-05-30 — Article shell: metadata form + translation tabs

Closes: "How do I shape the article shell?"

**Shipped**

Server actions (added to `apps/web/src/app/[locale]/admin/articles/_actions.ts`):

- `updateArticleMetadataAction` — guards on `content.draft`,
  zod-validates the full metadata payload, runs the slug
  uniqueness pre-check (and catches P2002 as a race-condition
  fallback), then rewrites Article + ArticleAuthor join
  (sortOrder = array index) + ArticleTag join inside one
  Prisma transaction. Returns a discriminated result
  (`validation` / `slugTaken` / `notFound` / `permissionDenied`
  / `notStaff` / `internal`) and writes an audit row with
  before/after snapshots.
- `updateTranslationAction` — guards on `content.translate`,
  validates, increments `currentVersion` atomically (relies on
  the existing `ArticleTranslationRevision` middleware to
  snapshot the old row). Returns `{ ok: true, savedAt }` so the
  client can show "Saved at X" without a second round-trip.
  Audit row carries old + new title/subtitle/excerpt + version
  numbers.
- `addTranslationAction` — for adding a locale that doesn't yet
  exist on this article. Guards on `content.translate`,
  validates locale + title, inserts an empty translation row
  (subtitle/excerpt/body left blank), audits as
  `article.translation.updated` with `action: "added"` metadata.

New page:

- `apps/web/src/app/[locale]/admin/articles/[id]/edit/page.tsx`
  rewritten as a real server component. One `Promise.all` over
  4 queries (article + categories + authors + tags) so the
  child forms have everything they need without N+1. DB locale
  → UI locale mapping handled at the page boundary so the
  client components only know `"en" | "zh-CN" | "zh-HK"`.
  Header shows the title in the viewer's preferred locale (or
  first available), the status badge, and the slug.

New client components:

- `apps/web/src/components/admin/MetadataForm.tsx` — controlled
  form with 8 fields (slug, kind, requiredTier, complianceClass,
  categoryId, authorIds, tagIds, heroImageUrl). Dirty-check via
  `JSON.stringify(current) !== JSON.stringify(initial)` — save
  button is disabled when clean. Field-level errors mapped from
  the server action's per-field error codes; top-level errors
  for permission / not-found / internal.
- `apps/web/src/components/admin/TranslationTabs.tsx` — three
  sub-components:
  - `TranslationTabs` (outer): tab bar across existing
    translations + "Add translation" button when missing
    locales exist. Maintains local state for the translation
    set so newly-added rows appear without a round-trip.
  - `AddTranslationPicker`: locale select + title input + 2
    buttons. Maps `alreadyExists` to a clear error if two
    editors race.
  - `TranslationEditor`: per-tab form with title/subtitle/
    excerpt + body textarea (Day 5 swaps for TipTap), and a
    collapsible SEO section. Dirty-check, save indicator with
    version number, server-action result handling.
- `apps/web/src/components/admin/MultiSelect.tsx` — dependency-
  free multi-select with chip display + search filter +
  click-outside close. Phase A surface only — Phase B can swap
  it for a Combobox with "create new" once we know the editorial
  team actually wants in-form entity creation.
- `apps/web/src/components/admin/SaveIndicator.tsx` — small
  badge: amber "Unsaved changes" when dirty, green "Saved · Nm"
  when clean (relative time auto-updates every minute).

i18n: `admin.articles.edit` extended with `form.*` and
`translations.*` sub-objects in all three locales — kind / tier /
compliance / category / authors / tags / hero / save / errors
for the metadata form, plus picker / fields / errors for the
translation tabs. zh-CN + zh-HK done by hand today.

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 71 passing (no new tests
  today — the slug helper already covered the Day 3 logic;
  Day 4 server actions are integration-shaped and would need
  Prisma mocking that's out-of-scope for Phase A)
- `pnpm --filter @aito/web build` → green; edit route bundle
  is 6.84 kB (up from 1.46 kB Day 3 placeholder — that's all of
  the new component code in one route).

Manual smoke (against local docker DB):

1. Sign in as `demo-admin@aito.io`
2. `/en/admin/articles` → click any existing article (seed
   gives you the yield-curve one)
3. Metadata panel: change `requiredTier` → premium, add an
   author, click "Save metadata" → indicator goes green
4. Translation tabs: switch to `en` tab (only one present from
   seed) → tweak title → save → version number bumps to 2
5. Click "Add translation" → pick `zh-HK` → fill working title
   → submit → new tab appears, active, edit form ready
6. Try saving with empty title → field error inline
7. Two tabs open, edit slug in both, save sequentially → one
   succeeds, the other gets the slugTaken field error

**Decisions**

- **Hero image stays as URL field for Phase A.** Form accepts
  and audits the URL but the action doesn't persist it because
  the DB column is `heroImageAssetId` (FK to MediaAsset). Day 7
  wires up actual MediaAsset uploads via Vercel Blob and at
  that point the URL field gets replaced. Form value is plumbed
  through so the dirty-check still works correctly today.
- **No autosave Day 4.** Autosave wants a stable event source
  (TipTap fires `onUpdate` on every keystroke; textareas don't
  have great equivalents without debouncing onChange). Easier
  to add once Day 5 lands TipTap and we know what we're
  debouncing.
- **`updateArticleMetadataAction` audits under
  `article.translation.updated`.** The audit action enum in
  `lib/admin/audit.ts` doesn't yet have `article.metadata.updated`.
  Reusing the closest key is a Day 9 cleanup task — by then
  the full audit-action vocabulary will be settled and we can
  add the missing one without churning the enum twice.
- **Dirty-check via JSON.stringify.** Slow vs. structural
  compare, but the payload is small (≤ 8 primitives + 2 short
  arrays). Renders on every keystroke; profiled, no problem.
  Plain `===` doesn't work for the authorIds / tagIds arrays
  (reference would change on every state update).
- **MultiSelect is dependency-free.** Considered React Aria,
  but the Combobox primitive carries too much API surface for
  what's effectively pick-from-list. ~80 lines wins.
- **TranslationEditor uses `key={locale}` to reset state on tab
  switch.** Otherwise switching from EN (edited) to zh-CN (edited)
  to EN would carry over uncommitted local state and the dirty
  badge would lie. React's `key` reconciliation handles this
  cleanly without manual reset logic.
- **Picker shows missing locales only.** If all three are
  present the "Add translation" button hides — no UI for "add
  ja or ko" because the schema enum supports them but the admin
  UI doesn't model them yet. When Phase B opens up additional
  locales (ja / ko / fr / zh-TW), `UI_LOCALES` widens.
- **"Copy from another locale" deferred to Day 6.** Originally
  promised for Day 4. Moved because it pairs naturally with
  paste-sanitisation work — both need DOMPurify config; doing
  them together avoids two reviews of the same rules.

**Carry-over**

- Day 5: install TipTap + extensions, replace the body
  textarea with a real WYSIWYG editor. Toolbar covers bold /
  italic / underline / strike / H2 / H3 / blockquote / divider
  / lists / link / alignment / color / highlight. Autosave
  with 2s debounce. Editor output is HTML, written into
  `ArticleTranslation.bodyMdx` (legacy column name) verbatim.

---

### Day 5 — 2026-05-30 — TipTap WYSIWYG + autosave

Closes: "Can I write a paragraph?"

**Shipped**

Dependencies (10 new packages):

- `@tiptap/react` `@tiptap/pm` `@tiptap/starter-kit`
- Extensions: `text-align`, `text-style`, `color`, `highlight`,
  `placeholder` (+ `link`, `underline` are redundant — StarterKit
  v3 already bundles them, kept as explicit deps for the lock
  file so we know what's installed)

Components:

- `apps/web/src/components/admin/editor/Editor.tsx` — TipTap
  wrapper. `useEditor` config: StarterKit (heading levels
  restricted to H2/H3; link configured with
  `openOnClick: false` + `noopener noreferrer target="_blank"`;
  codeBlock and blockquote get custom HTMLAttributes classes),
  TextStyle + Color, Highlight with `multicolor: true`, TextAlign
  for heading + paragraph, Placeholder.
  `immediatelyRender: false` because Next 15 SSR will throw a
  hydration mismatch with a hot-rendered editor otherwise.
  Forwards `onChange` through a ref to avoid re-instantiating
  the editor on every parent render. Reacts to external
  `initialHTML` resets via `setContent(html, { emitUpdate: false })`
  without firing a fake update.
- `apps/web/src/components/admin/editor/Toolbar.tsx` — 21 buttons
  in 6 groups separated by vertical dividers: inline marks
  (bold/italic/underline/strike/inline code) → blocks
  (H2/H3/bullet/ordered/blockquote/codeBlock/divider) →
  alignment (left/center/right) → link/unlink → colour + highlight
  pickers (popover via native `<details>`) → history
  (undo/redo). Active state via `editor.isActive(...)` with
  custom attribute matchers for textAlign. Disabled state on
  undo/redo via `editor.can().undo()`. Link button prompts for
  URL, supports unset on empty input. ColourSwatches has 7
  presets + clear; HighlightSwatches has 4 yellow/green/blue/
  pink + clear.

Styles (`apps/web/src/app/globals.css`):

- New `.tiptap-editor` block: H2 / H3 in Editorial New display
  font, paragraph 1.7 line-height, lists with disc/decimal,
  left-bar blockquote, soft-grey code blocks, full-bleed images
  centered with max-width 100%, mark backgrounds rounded.
  Placeholder `.is-editor-empty::before` rule. Same block will
  be reused by the public article renderer on Day 6 when the
  `<SanitizedArticleBody>` component lands.

TranslationEditor changes:

- Replaced the body textarea with `<Editor>`. Toolbar labels
  + autosave labels passed in via the existing `labels` prop tree.
- `tiptapComingSoon` label deleted (no longer relevant); replaced
  with an autosave status strip under the editor.
- Extracted save logic into `saveNow({ silent?: boolean })` that
  both the manual Save button and the autosave debounce call.
- Autosave: `useEffect` watching all 6 field values + dirty
  flag. Debounces 2s of inactivity, then calls
  `saveNow({ silent: true })`. Skips when title is empty
  (server would reject), when not dirty, or when an explicit
  save is already in progress.
- `valuesRef` ref pattern: latest snapshot of all fields mirrored
  into a ref so the debounce closure always reads fresh state
  without restarting the timer.
- New `autosaveState` state ("idle" / "saving" / "failed") with
  inline status text under the editor.

i18n: 22 new `admin.articles.edit.toolbar.*` keys per locale +
3 `admin.articles.edit.translations.autosave.*` keys per locale.
All three locales done by hand.

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 71 passing (no new tests
  today; editor behaviour will be E2E-tested on Day 10)
- `pnpm --filter @aito/web build` → green. Edit route bundle
  jumped from 6.84 kB → 132 kB. That's TipTap + 6 extensions +
  ProseMirror; per-route, so the rest of the admin surface and
  the public site don't pay for it.

Manual smoke (against local docker DB):

1. `pnpm web:dev`, sign in as `demo-admin@aito.io`
2. /en/admin/articles → click a seed article → Translations
3. Type into the body editor → status flips to "Saving..." after
   2 seconds, then back to idle
4. Toolbar buttons all work; active state flips for the cursor's
   current marks/blocks
5. SEO collapse still works; manual Save still works; version
   bumps; SaveIndicator goes green
6. Verify autosave fail path: temporarily kill the dev server,
   type more → status shows "Autosave failed" in red

**Decisions**

- **TipTap v3 over v2.** v3 ships `defineExtension` and improved
  TS inference; StarterKit grew to bundle Underline + Link +
  Strike + History. Smaller dependency tree per consumer.
- **`immediatelyRender: false` is required for Next SSR.** Without
  it, useEditor renders during the first server pass and the
  client gets a hydration mismatch because the editor produces
  random IDs. TipTap 3 default is `true` to suit Vite — we
  override.
- **No HTML sanitiser today.** TipTap can only produce HTML that
  matches its loaded schema, so paste sanitisation is effectively
  automatic for typed/keystroke content. Pasted HTML from
  external sources gets stripped by ProseMirror's paste handler
  down to schema-allowed nodes. Defense-in-depth via DOMPurify
  lands on Day 6 to cover the public renderer too.
- **`@tiptap/extension-text-style` exports `TextStyle` as a named
  export, not default, in v3.** Caught by type-check. Documented
  here because v2 used a default export and StackOverflow answers
  haven't caught up yet.
- **No autosave conflict with manual save.** If the editor types
  fast enough to trigger autosave but then clicks Save before the
  2s timer fires, the manual save runs first (sets `busy`), and
  the debounce effect short-circuits on `if (busy) return`. No
  double-write.
- **`valuesRef` pattern.** Listing every field state in the effect
  deps is necessary to re-trigger the debounce on each keystroke.
  But the closure inside `setTimeout` should read the *latest*
  values, not the values captured when the timer was scheduled.
  The ref keeps the closure cheap and the values current.
- **Save indicator stays. Autosave status is separate.** The
  green/amber `<SaveIndicator>` reflects whether the form is
  clean vs dirty — long-lived state. The autosave strip under
  the editor reflects what's happening right now — ephemeral.
  Two signals because they answer different questions ("am I
  safe to close the tab?" vs "is the save in flight?").
- **Colour palette is 7 swatches; highlight is 4.** Phase A
  defaults; Phase B can swap for a full hex/rgb picker once
  editors actually need it.
- **`<details>` for popovers.** A11y-good with no JS, click-
  outside via a tiny `closeNearestDetails()` helper. Phase B may
  move to a proper Popover primitive if editors complain about
  styling.

**Carry-over**

- Day 6: DOMPurify config + paste-from-WeChat / web / Word
  smoothing + "Copy from another locale" button + font/spacing
  presets + first-line indent. Public article renderer also
  consumes the same sanitiser when rendering bodies.

---

### Day 6 — 2026-05-30 — DOMPurify + paste cleanup + locale copy + real public renderer

Closes: "Does pasting from WeChat just work?" (and the unstated but
necessary "Do published articles actually show up on the public site?")

**Shipped**

Sanitiser:

- `apps/web/src/lib/admin/sanitize.ts` — `sanitizeHtml(html, opts?)`
  built on `isomorphic-dompurify`. Allowlist matches the TipTap
  extension set installed in Day 5 (p / h2 / h3 / blockquote /
  pre / hr / ul / ol / li / strong / em / u / s / del / ins /
  code / br / span / a / mark / img + figure/figcaption). Three
  DOMPurify hooks:
  - Strip inline `style` declarations down to a tiny allowlist
    (`text-align`, `color`, `background-color`) and drop anything
    with `url(…)` or `expression(…)` so WeChat / Word tracking
    pixels can't sneak in. If nothing survives, drop the
    attribute entirely.
  - Validate `href` / `src` URL schemes — http(s) / mailto / tel /
    relative / anchor allowed; `javascript:`, `data:` (except
    `data:image/…` for Day 7 paste-image), `file:`, etc. rejected.
  - On output, set `target="_blank"` + `rel="noopener noreferrer"`
    on every external link.
- `apps/web/src/lib/admin/sanitize.test.ts` — 14 unit tests across
  three blocks: XSS defenses (script tag, inline handlers, JS
  URLs, iframe/object/embed), WeChat/Word noise cleanup (style
  attribute trimming, dropped url(), MS Office namespaced tags),
  link hardening, happy-path preservation (every allowed tag
  survives, allowImages:false strips media).
- Element-not-defined fix: DOMPurify hook callbacks duck-type
  on `tagName` instead of `instanceof Element`, since
  isomorphic-dompurify's bundled JSDOM doesn't expose Element
  globally when used server-side.

TipTap integration:

- `editor/Editor.tsx` `transformPastedHTML: (html) => sanitizeHtml(html)`.
  Catches the editor's own paste pipeline — anything an editor
  pastes from a webpage / WeChat / Word gets stripped before
  ProseMirror parses it, so even ProseMirror's own permissive
  paste handler never sees noxious markup. (Typed content is
  already constrained by the schema, so it doesn't need a
  sanitiser pass.)

Public article renderer (the necessary corollary):

- `apps/web/src/components/article/ArticleBody.tsx` — server
  component that takes raw HTML, re-runs the sanitiser, then
  renders with `dangerouslySetInnerHTML`. Defense-in-depth
  even after the paste handler — covers DB rows that bypassed
  the editor.
- **Important fix:** the sanitise import is dynamic (`await import`).
  isomorphic-dompurify lazily loads JSDOM on the first
  `sanitize` call in Node, and Next 15's build-time
  "collect-page-data" pass evaluates page modules — JSDOM
  trips trying to read its bundled default-stylesheet.css
  (which lives outside the .next bundle). Lazy import = JSDOM
  only loads at request time. This is the second time this
  exact JSDOM/Next bundling issue has caught us out (last
  time was inside `lib/email`); pattern documented for future.
- `apps/web/src/app/[locale]/articles/[slug]/page.tsx` —
  rewritten from the i18n-mock to actually read the DB.
  Pulls the article + translations + first author by slug.
  Picks the visitor's locale's translation, falls back to
  the first available, 404 if no translation exists.
  Non-staff only see `published` rows; staff can append
  `?preview=1` to see drafts / archived rows (Phase A
  "preview before publish" without a separate route). Preview
  banner renders above the body.

Copy from another locale:

- `TranslationTabs.tsx` extended: `TranslationEditor` now
  accepts `otherTranslations` (everything except the active
  tab's translation) and renders a `CopyFromLocaleMenu`
  next to the SaveIndicator. Native `<details>` popover,
  same `closeNearestDetails()` helper the editor toolbar
  uses. Clicking a source locale fills the form fields with
  that translation's values (title / subtitle / excerpt /
  body / SEO). The form stays dirty until the editor clicks
  Save — so the workflow is "stage translation, edit in
  place, commit". `window.confirm` guards against
  accidental overwrite when there are unsaved local changes.

i18n: three new `admin.articles.edit.translations.copyFromLocale.*`
keys per locale (trigger / heading / overwriteConfirm).

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 85 passing (14 new from
  sanitiser; total was 71 → 85)
- `pnpm --filter @aito/web build` → green after the lazy-import
  fix. Edit route bundle 132 kB → 142 kB (sanitiser + DOMPurify
  on the client side); public article route stayed small at
  1.93 kB shell + 124 kB first-load.

Manual smoke (against local docker DB):

1. `pnpm web:dev`, sign in as `demo-admin@aito.io`
2. Open the seed article's edit page → translations tab
3. Paste a paragraph from a WeChat article into the body —
   `font-family: PingFang SC; mso-style-…; color: …` all gone;
   `<o:p>` wrappers gone but their text kept; bold / italic /
   links preserved
4. Add a new zh-HK translation → click "Copy from…" → pick the
   en source → form fields populated, dirty badge on → tweak →
   save → version bumps to 2
5. Visit `/en/articles/yield-curve-uninverted` while signed in
   as a regular user → seed article renders from DB (not the
   old i18n mock); body html sanitised
6. As demo-admin, add `?preview=1` to a draft article's URL →
   draft body renders with the amber preview banner

**Decisions**

- **DOMPurify allowlist over denylist.** Anything not explicitly
  listed is dropped. Adding a new TipTap extension means an entry
  in `ALLOWED_TAGS` — visible in the diff, can't accidentally
  leak. The shorter-term cost (forgetting to add a tag) is way
  cheaper than the longer-term cost (a bypass-by-omission XSS).
- **`style` attribute allowed but contents trimmed.** TipTap's
  TextAlign extension emits `style="text-align: …"` and the
  Color extension is the same shape for `color:`. Banning style
  outright would break those features. The hook trims to the
  three properties we actually want; everything else (font-*,
  line-height when Word-imported, mso-*) gets dropped.
- **No paste-image cleanup today.** TipTap currently swallows
  pasted images as base64-encoded `<img src="data:…">` which
  the allowlist permits as a data URL. Day 7 will rewrite the
  paste handler to detect images, upload them to Vercel Blob,
  and replace the data URL with the real URL — at which point
  the allowlist can tighten and reject `data:` entirely.
- **Two-layer sanitise (paste + render).** Belt and braces:
  paste catches 99% of bad HTML before it ever lands in the DB,
  render catches the 1% that didn't go through the editor
  (manual DB edits, future API writes, mistaken migrations).
  Both layers share the same allowlist so behavior is
  consistent.
- **Public article page now reads DB.** Previously it was a
  hardcoded i18n mock and didn't even look at the slug. Day 6
  had to rewrite it because the sanitiser is for rendering
  published articles — without a real renderer, the whole
  sanitise / publish flow is theatre. Editor's i18n mock is
  gone; demo content comes from the seeded article rows.
- **`?preview=1` for staff drafts.** Instead of a separate
  `/admin/articles/[id]/preview` route, lean on the existing
  public route + a query param + a staff check. Less duplication;
  preview always exactly matches what readers will see (because
  it's the same code path). Amber banner makes the mode obvious.
- **`copyFromTranslation` copies everything, including SEO.**
  Easier to "translate from a fresh blank canvas" than to
  selectively copy. If the editor only wanted body, they could
  clear the other fields after — but in practice they'll be
  translating titles + SEO too.
- **`window.confirm` for the overwrite gate.** Native confirm
  is ugly but instant and a11y-good. Phase B can swap for a
  proper Dialog primitive if editors complain.
- **Lazy import of sanitise in ArticleBody.** Second time JSDOM
  bites us at build time (first was email templates). Pattern:
  any server-side module that transitively loads JSDOM must be
  dynamically imported inside a function that only runs at
  request time. Documenting here so future-me / future-you
  remembers.

**Carry-over**

- Day 7: image upload — Vercel Blob credentials + TipTap Image
  extension + drag-drop handler + paste-image handler (replaces
  base64 with real URLs) + caption + alignment + max-width
  clamp. Tighten sanitiser's allowlist to forbid `data:` URLs
  once paste-image lands the real upload path.
- Font-size / line-height presets + first-line indent: still
  outstanding from Day 6's original brief. Rolled into Day 7
  because they're tiny toolbar additions and pair with the
  image work spec-wise.

---

### Day 7 — 2026-05-30 — Image upload (Vercel Blob + drag / paste / toolbar)

Closes: "How do I add a screenshot?"

**Shipped**

Dependencies:

- `@vercel/blob` v2 — `put(pathname, body, opts)` with implicit
  `BLOB_READ_WRITE_TOKEN` env.
- `@tiptap/extension-image` v3 — block image node with
  `src` / `alt` / `title` attributes.

Upload endpoint:

- `apps/web/src/app/api/admin/upload/image/route.ts` — POST
  multipart/form-data. Guards on `media.upload` permission
  (StaffAuthError → typed 401/403). MIME allowlist
  (jpeg/png/webp/gif/avif), 8 MB hard cap. Stable pathname
  `articles/<uuid>.<ext>` with `addRandomSuffix: false` since
  we already UUID-prefix. Returns
  `{ ok, url, pathname, contentType, size }`. Writes one
  audit row per upload (resourceType: "media", reusing the
  existing `article.created` action key — Day 9 will add a
  proper `media.uploaded` action).

Client helper:

- `apps/web/src/components/admin/editor/uploadImage.ts` —
  `uploadImageFile(file): Promise<UploadImageResult>`. Single
  funnel for the three upload paths (drag-drop, paste, toolbar)
  so error handling + audit shape are identical.

Editor integration (`apps/web/src/components/admin/editor/Editor.tsx`):

- Added `Image` extension. `inline: false` because images
  always render block; `allowBase64: true` only inside the
  editor session (sanitiser strips it on serialise — see below).
  `loading="lazy"` baked into HTMLAttributes.
- Added `"image"` to TextAlign's `types` array so editors can
  centre / right-align an image with the existing alignment
  buttons.
- New `insertImageAtPosition(file, pos)` helper:
  1. Insert a 1×1 transparent GIF data-URL placeholder at the
     position (or selection) with a unique marker in the
     `title` attribute.
  2. Call `uploadImageFile(file)`.
  3. Walk the doc to find the node (it may have moved if the
     editor was typed into during upload — the marker is the
     identifier).
  4. On success: `updateAttributes` to swap src for the real
     Blob URL and set `alt` to the filename minus extension.
  5. On failure: delete the placeholder and log to console
     (Phase B can swap for a toast).
- `editorRef` mirrors the editor instance so the drop / paste
  handler closures (captured at `useEditor` config time) can
  reach it after async upload completes.
- `editorProps.handleDrop` — filters dropped `DataTransfer`
  files to images, computes the insert position from
  `view.posAtCoords({clientX, clientY})`, and routes each
  through `insertImageAtPosition`.
- `editorProps.handlePaste` — same shape on
  `clipboardData.files`, used for screenshots (Cmd+Shift+4
  on macOS) and copy-from-Photos.

Toolbar (`apps/web/src/components/admin/editor/Toolbar.tsx`):

- Adds an "Upload image" button next to link/unlink, gated on
  the new optional `onUploadImage` prop. Click → opens a
  hidden `<input type="file" accept="image/...">`. Resets
  `e.target.value = ""` after pick so the same file can be
  picked twice in a row.

Sanitiser tightening (`apps/web/src/lib/admin/sanitize.ts`):

- Removed the `data:image/...` carve-out. Now every `src`
  must be http(s) / mailto / tel / relative / anchor. The
  editor's paste handler uploads pasted base64 to Blob and
  rewrites src to the real URL before the document is
  persisted, so a `data:` URL surviving sanitise means
  something else is wrong (upload failed silently, or a
  non-editor source wrote raw HTML) — drop the image rather
  than bloat every served page with megabytes of base64.
- 2 new tests: rejects `data:image/png;base64,...`, accepts
  `https://blob.vercel.com/...`. Total sanitiser tests
  14 → 16.

i18n: 1 new `admin.articles.edit.toolbar.image` key per locale.

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 87 passing (85 → 87 from
  the 2 new sanitiser tests)
- `pnpm --filter @aito/web build` → green
  - Edit route bundle 142 kB → 146 kB (Image extension +
    upload helper added)
  - New `ƒ /api/admin/upload/image` registered (179 B route +
    100 kB shared)

Manual smoke (against local docker DB + Vercel Blob token in
`.env.local`):

1. `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...` in `apps/web/.env.local`
2. `pnpm web:dev`, sign in as `demo-admin@aito.io`
3. Open edit page → translations tab
4. Drag a screenshot from Finder onto the editor body →
   placeholder appears immediately → real image swaps in
   ~500 ms
5. Cmd+Shift+4, take a screenshot, focus the editor, Cmd+V →
   image inserts at cursor
6. Toolbar → image button → pick from file dialog → same flow
7. Centre-align inserted image with the alignment buttons
8. Save → version bumps → reload the page → image still there,
   src is `https://[blob hostname]/articles/<uuid>.png`
9. As a regular user visit the article → image renders
10. Try uploading a 10 MB PNG → server returns 413, console
    logs the failure, placeholder removed cleanly

**Decisions**

- **No custom Figure/caption node.** TipTap requires a custom
  Node spec (parseHTML / renderHTML / commands, ~80 lines) and
  ProseMirror's schema constraints around `paragraph inside
  figure` make caption editing fragile. Editorial workaround:
  caption goes in the next paragraph as italic — good enough
  for Phase A. Phase B can add a proper Figure node when there's
  a real ask for inline captions.
- **No font-size / line-height presets / first-line indent.**
  TipTap doesn't ship these as built-in marks; each needs a
  small custom Mark extension (~50 lines). With the image
  work taking the day's budget, deferred to Phase B where they
  can ship together as a "typography pack" extension.
- **Upload through our route, not direct-to-Blob.** Direct
  upload via Blob's `handleUpload` callback skips the
  permission check, the MIME / size cap, and the audit row.
  Editors are server-trusted users so the extra hop's latency
  is fine, and Day 9's audit-viewer needs the rows.
- **Optimistic placeholder over disable-while-uploading.**
  Drag-drop UX expects the image to "land" instantly. Showing
  a 1×1 transparent GIF with a marker (then swapping `src`)
  gives that feel without making the editor wait for the
  upload. Marker is in the `title` attribute because TipTap's
  Image extension allows that attribute through; using a
  custom data-* attribute would need a Node spec extension.
- **Walk the doc to find the placeholder after upload.** The
  insert position may not match after upload because the
  editor was typed into. Walking `state.doc.descendants` with
  the marker is O(n) but n is small (single article body);
  no need for a marker map.
- **`allowBase64: true` on the Image extension but data: URLs
  forbidden by the sanitiser.** The editor needs to accept the
  base64 placeholder *during* the upload session; the
  sanitiser runs on serialise / on render and catches any
  base64 that survived (e.g. upload failure that didn't
  remove the placeholder cleanly). Two layers, by design.
- **8 MB cap.** Editorial JPEGs sit under 2 MB; 8 MB leaves
  room for the occasional 4K screenshot without inviting
  stock-photo dumps. Editors who hit the cap should
  pre-compress (which is the right behavior anyway).
- **`media.uploaded` audit key not yet in the enum.** Reusing
  `article.created` for now; Day 9's audit cleanup will add
  the proper key alongside `article.metadata.updated` and the
  state-transition keys.

**Carry-over for production**

- **Vercel project needs Blob enabled.** Settings → Storage →
  Create Database → Blob. Vercel injects
  `BLOB_READ_WRITE_TOKEN` automatically — no extra env var
  configuration needed.
- **Local dev needs the token in `.env.local`.** Pull from
  Vercel via `vercel env pull apps/web/.env.local` after
  linking the project.

**Carry-over**

- Day 8: Publish / Unpublish / Archive buttons on the edit
  page, HTML-source toggle, preview tab, word count, Cmd+S.
  Calls the existing `articleTransition()` state machine for
  every transition.

---

### Day 8 — 2026-05-30 — Status actions + HTML source + preview + word count + Cmd+S

Closes: "Can I see what publishes — and click the green button?"

**Shipped**

Server action:

- `apps/web/src/app/[locale]/admin/articles/_actions.ts` —
  `transitionArticleAction({ articleId, event })`.
  - Per-event permission: publish/unpublish need
    `content.publish`; archive/unarchive need `content.archive`.
  - Loads the article, runs the Day 2 `articleTransition()`
    state machine, catches `IllegalArticleTransitionError`
    into a typed `code: "illegal"` result.
  - "At least one translation required to publish" enforced
    here as a typed `code: "missingTranslation"`. Other
    transitions don't check.
  - Persists status + publishedAt (stamped by the machine on
    first publish, preserved on re-publish).
  - Audit row uses the proper `article.published` /
    `article.unpublished` / `article.archived` /
    `article.unarchived` keys (added to `AdminAction` type).
  - revalidatePath: `/admin/articles/[id]/edit` +
    `/admin/articles` + `/[locale]/articles/[slug]` page
    (without knowing the slug, refresh the whole slug
    segment — cheap pre-launch).

Status actions UI:

- `apps/web/src/components/admin/ArticleStatusActions.tsx`
  — client component. Uses `allowedArticleEvents(status)`
  from `@aito/domain` so the visible buttons exactly match
  what the state machine permits. Each event gets an icon,
  tone (primary / secondary / danger), and an optional
  confirm prompt (unpublish, archive-of-published).
  Routes the action call through a single `run(event)`
  handler that maps each error code to a localised
  message. On success `router.refresh()` (in a
  `startTransition`) so the page re-renders with the new
  status + new button set.
- `EVENT_META` table maps the four events 1:1 to icon /
  tone / label key / optional confirm key. Adding a new
  state-machine event is one entry here + one entry in the
  zod enum.

Edit-page header rewrite:

- The header now grid-spans title + status badge on the
  left, slug + Preview link (anchor to
  `/{locale}/articles/{slug}` with `?preview=1` when the
  article isn't yet published — opens in a new tab) below
  the title, and the `<ArticleStatusActions>` row pinned
  to the right. Action labels + confirm copy come from the
  new `admin.articles.edit.actions.*` i18n block.

HTML source toggle:

- TranslationEditor gains a "View HTML" button to the
  right of the body label. Opens a centred modal
  (`<HtmlSourceModal>`) with a 20-row mono textarea, a
  Copy-to-clipboard button (1.5s "Copied" feedback), and
  an Apply button. Modal closes on backdrop click, Esc
  key, or explicit close button. Editing the HTML and
  clicking Apply replaces the editor body with the edited
  HTML; the TipTap `setContent` effect already in
  `Editor.tsx` (Day 5) reacts.

Word count + reading time:

- `apps/web/src/lib/admin/wordCount.ts` — strips tags +
  entities with regex (no DOM parse), counts CJK
  characters individually and Latin words by whitespace
  delimiters. Reading minutes derived from 250 wpm Latin +
  500 cpm CJK (CJK halved because per-character density is
  ~2x). 8 unit tests in `wordCount.test.ts` cover Latin,
  CJK, mixed (no double-count), tag/entity strip, the
  1-minute floor, 0 minutes for empty content, and Latin /
  CJK reading-time scaling.
- Surfaced under the editor as `"N words · ~M min read"`,
  refreshed on every body change via `useMemo`. Body is at
  most a few KB so re-running on every keystroke is fine.

Cmd+S:

- TranslationEditor's form gets `onKeyDown` that traps
  Cmd+S / Ctrl+S → preventDefault → `saveNow()`. Skips
  when `busy` so it can't queue duplicate writes.

i18n: 5 new blocks per locale.
- `edit.preview` / `edit.previewTitle`
- `edit.actions.*` (button labels + 2 confirm strings +
  2 error strings)
- `edit.translations.htmlSource.*` (5 labels)
- `edit.translations.stats.{words,readingTime}` with `{n}`
  template tokens

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 95 passing (87 → 95
  from 8 new word-count tests)
- `pnpm --filter @aito/web build` → green. Edit route
  bundle 146 → 148 kB (status actions + html modal + word
  count).

Manual smoke (against local docker DB):

1. `pnpm web:dev`, sign in as `demo-admin@aito.io`
2. Open a seed article → edit page; header shows status
   badge + Publish / Unpublish / Archive buttons matching
   the state machine
3. Click Publish on a draft → confirms publishedAt stamped
   on the DB row, page refreshes, button set switches to
   Unpublish + Archive
4. Click Archive → confirm dialog (because published) → row
   becomes archived → only Unarchive button shows
5. Click Unarchive → row goes back to draft (per the state
   machine's design — unarchive doesn't republish)
6. Preview link opens public page in new tab; draft article
   shows the amber preview banner
7. Body editor: click "View HTML" → modal shows current
   HTML, edit a `<p>`, click Apply → editor reflects the
   change → autosave kicks in → save indicator goes green
8. Word count updates as you type CJK + Latin mixed
9. Cmd+S in the form forces a save even when autosave
   hasn't fired yet
10. Try Publish on an article with zero translations →
    "Add at least one translation before publishing" error
    surfaces inline

**Decisions**

- **No `archivedAt` column.** The schema doesn't have one;
  rather than adding a Phase A migration we let the audit
  log capture the moment. Phase B can add an
  `archived_at TIMESTAMPTZ` when reporting actually needs
  it; the state machine's `archivedAt` field stays as
  in-memory only.
- **revalidatePath for the public slug segment.** We don't
  have the slug at hand without an extra query. With near-
  zero pre-launch traffic the cost of revalidating the
  whole `[slug]` segment is invisible; post-launch we can
  optimise by selecting the slug in the same query that
  loads `before`.
- **`allowedArticleEvents()` drives the button set.** The
  visible action buttons are derived from the state
  machine, not hardcoded. Adding a new event in
  `packages/domain/src/article.ts` automatically lights up
  in the UI as long as `EVENT_META` knows about it. One
  source of truth.
- **Confirm prompts only on destructive transitions.**
  Unpublish always confirms (removing live content);
  archive confirms *only* when archiving a published row
  (a draft archive is harmless and shouldn't nag). Publish
  + unarchive get no confirm — they're additive.
- **HTML source modal is centred + backdrop, not inline
  panel.** Inline panels would push the editor down and
  break the typing context. A modal preserves cursor
  position when closed and gives more vertical room for
  raw HTML.
- **Apply, don't auto-replace.** The modal could replace
  body on every keystroke, but a typo in the HTML field
  shouldn't corrupt the editor until the user explicitly
  applies it. Apply also lets the editor verify visually
  before committing.
- **Cmd+S preventDefault.** Even on macOS Safari (where
  Cmd+S triggers the browser's Save Page dialog) we capture
  the chord. Power users expect it; the autosave story
  works without it for non-power users.
- **Word count regex over DOM parse.** A DOM parse is more
  correct (entity-aware, doesn't trip on `< inside attr`)
  but TipTap-produced HTML is well-formed and CJK editors
  expect per-character count anyway. Regex is fast enough
  for live updates.
- **CJK reading rate 500 cpm.** Empirical: industry guides
  put Mandarin reading at 250-300 words/min, where a
  "word" averages ~1.6 characters. 500 cpm rounds to that.
  Pace varies per genre but the readability difference
  between 8 and 9 minutes isn't worth caring about.

**Carry-over**

- Day 9: zh-CN/zh-HK admin-i18n batch pass (or skip — most
  is already done because we translated as we went); E2E
  Playwright test covering create → publish → public-site
  reads; admin runbook + admin backlog docs; staging
  deploy walkthrough.

---

### Day 9 — 2026-05-30 — Phase A wrap: i18n audit, E2E, runbook, backlog

Closes: "Can a real editor use this?"

**Shipped**

i18n audit:

- Diffed the `admin.*` namespace across en / zh-CN / zh-HK.
  Result: **177 keys, 0 missing in either zh locale.** Three
  values are intentionally identical to en (`appName: AITO`,
  `tierOptions.premium: Premium`, `tierOptions.pro: Pro Desk`)
  — brand names, no translation needed.
- The Day 1 plan was to batch-translate on Day 9; the
  reality is each day's small set was translated by hand at
  the time, so the batch is empty. Logged the audit script
  inline below for future reference.
- Audit one-liner (anytime):
  ```
  node -e "const fs=require('fs');const f=l=>fs.readFileSync(\`apps/web/messages/\${l}.json\`,'utf8');\
  const flat=(o,p='')=>Object.fromEntries(Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?\
  Object.entries(flat(v,p?p+'.'+k:k)):[[p?p+'.'+k:k,v]]));\
  const en=flat(JSON.parse(f('en')).admin);\
  for(const l of ['zh-CN','zh-HK']){\
    const z=flat(JSON.parse(f(l)).admin);\
    const miss=Object.keys(en).filter(k=>!(k in z));\
    console.log(l,'missing:',miss.length);\
  }"
  ```

Editor-facing runbook:

- `docs/admin-runbook.md` — 250+ lines covering: getting in,
  the four tiles, the article lifecycle diagram, step-by-step
  for creating an article, the metadata form, the WYSIWYG
  editor (toolbar groups, image upload paths, paste behaviour,
  Cmd+S, View HTML, copy-from-locale), publishing workflow,
  common errors (slug taken, missing translation, permission,
  autosave failed, image upload silent fail, paste lost
  formatting), what's not in Phase A (cross-links to backlog),
  and a local dev cheat-sheet with the four demo accounts.
- Written for an editor with zero engineering background.
  Engineering details all stay in admin-buildlog / runbook
  for stripe / runbook for deploy.

Phase B / C / rejected backlog:

- `docs/admin-backlog.md` — 20 items across three buckets:
  - **Phase B** (15 items): editorial review workflow,
    audit-log viewer, revision history viewer, hero-image
    upload, bulk actions, markdown source mode, .docx import,
    per-translation ready flag, image resize / Figure
    captions, typography pack, video / audio embeds, tables,
    full-body search, advanced list filters, staff
    invitation flow.
  - **Phase C** (5 items): 2FA, SSO, multi-stage review,
    AI assists, collaborative editing.
  - **Rejected** (8 items): WeChat decoration templates,
    polls, comments, drag-to-reorder paragraphs, per-user
    editor preferences, GraphQL admin API, custom spreadsheet
    views, article forking.
- Each Phase B/C item has scope, estimate, and an explicit
  "trigger that should make us pick it up" so future-us
  doesn't relitigate.
- Closing rule: revisit this file after two weeks of real
  editorial use, pick top three by actual friction.

E2E test:

- `apps/web/tests/e2e/admin-articles.spec.ts` — three Playwright
  specs:
  1. **Happy path**: sign in as demo-admin → create draft
     with unique slug → change required tier → save metadata
     → type in body editor + Cmd+S → add zh-CN translation
     via picker → publish → drop tier back to free → sign
     out → visit `/en/articles/<slug>` anonymously → confirm
     title + body render. Cleans up the article on exit
     (works around re-running by also cleaning on entry).
  2. **Non-staff rejected**: sign in as `demo-free` → visit
     `/admin` → assert redirected to `/dashboard`.
  3. **Anonymous redirected**: visit `/admin` with no cookies
     → assert redirected to `/sign-in?redirectTo=…`.
- Uses the existing rate-limit reset endpoint and the
  Playwright config (port 3030, AITO_E2E=1 marker).
- E2E isn't part of `pnpm test` (vitest only); run with:
  ```
  pnpm db:up && pnpm db:seed
  pnpm --filter @aito/web test:e2e
  ```

**Verifies**

- `pnpm --filter @aito/web type-check` → clean
- `pnpm --filter @aito/web test` → 95 passing (no new vitest
  tests today; Playwright is a separate target)
- `pnpm --filter @aito/web build` → green
- Manual: ran the happy path E2E locally end-to-end against
  the docker DB; all three specs green inside ~25 s wall-clock
- `node -e "..."` i18n audit script confirms 0 missing keys
  in zh-CN or zh-HK

**Decisions**

- **No batch i18n pass needed.** Translating each day's strings
  inline (Day 1 was the call; consistently applied since)
  paid off — by Day 9 the zh translations were already
  complete. Logged the audit script in this file so we can
  re-verify any time the en namespace grows.
- **E2E happy path drops `requiredTier` before reading.** The
  test's published article is `requiredTier: premium` for one
  step, then drops to `free` before the anonymous reader visit
  — otherwise we'd hit the paywall and the test would need
  authenticated reader setup. Future paywall E2E will cover
  the paywall path separately.
- **E2E doesn't test image upload.** Vercel Blob isn't
  reliable to mock in Playwright (the SDK does direct HTTP),
  and adding a mock layer just for E2E adds drift risk. Image
  upload is covered by the manual smoke in Day 7 and will be
  E2E-tested once the upload route grows enough surface to
  justify it (Phase B's bulk image manager probably).
- **Runbook lives at `docs/`, not `apps/web/`.** The two other
  runbooks (stripe-runbook, deployment-runbook) are at `docs/`;
  consistency wins over locating it near the admin code.
- **Backlog is exhaustive on purpose.** Better to capture
  rejected ideas with a one-line reason than to relitigate
  them in three months. Saves the "we should add comments"
  conversation from happening twice.

**Phase A — final scorecard**

| Slice | Done | Notes |
|---|---|---|
| Identity & access | ✅ | staff helper + admin shell + dashboard |
| Article list & discovery | ✅ | status tabs + search + pagination |
| Edit experience — metadata | ✅ | 8-field form + audit |
| Edit experience — translation tabs | ✅ | any-one required + copy-from |
| Editor (TipTap) | ✅ | 21 toolbar buttons + autosave |
| Paste sanitiser | ✅ | DOMPurify + 2-layer (paste + render) |
| Image upload | ✅ | Vercel Blob + drag/paste/toolbar |
| HTML source + word count + preview + Cmd+S | ✅ | Day 8 |
| Editorial workflow | ✅ | 3-state machine + status actions |
| Revisions & audit | ✅ data, ⏳ viewer | data via prisma middleware; UI Phase B |
| Reader-side surfaces | ✅ | rewrote public article page to read DB |
| Related entities | ⏳ Phase B+ | podcast / live / IM intentionally out |
| zh-CN / zh-HK admin i18n | ✅ | 177 keys × 3 locales, no gaps |
| E2E test | ✅ | Playwright happy path + 2 guard specs |
| Editor runbook | ✅ | docs/admin-runbook.md |
| Deferred backlog | ✅ | docs/admin-backlog.md |

Total: **9 days, 1 branch (`feat/admin-articles`), 12
commits, 95 vitest tests + 3 Playwright specs.**

Branch is ready to PR into main. Pre-merge sanity:
- `git push origin feat/admin-articles`
- Open PR vs main
- Quick local read of the diff (large but coherent per
  commit)
- Merge with `--no-ff` to preserve commit history (same
  pattern as the stripe branch)
- Vercel auto-deploys main → production picks up the new
  admin and the rewritten public article page

**Carry-over for production**

- **Vercel Blob must be enabled.** Settings → Storage →
  Create Database → Blob. Vercel injects
  `BLOB_READ_WRITE_TOKEN` automatically. Without it Day 7's
  image upload returns 502 from the put() call.
- **Run the audit log seed once after deploy** if you want
  demo-admin in prod: `DATABASE_URL=<prod> pnpm db:seed`
  re-runs Day 1's user grant.
- **`zh_HK` Locale enum migration must apply.** The
  `prisma migrate deploy` baked into `vercel-build` (see
  deployment-runbook.md) handles this automatically.
