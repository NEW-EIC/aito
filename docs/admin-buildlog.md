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
