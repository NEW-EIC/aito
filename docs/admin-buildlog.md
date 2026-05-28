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
| English required before submit for review | ✅ |
| Other locales optional (graceful when missing on public site) | ✅ |
| "Copy from EN" button on zh-CN / zh-HK tabs (paste then translate) | ✅ |
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

### 4. Editorial workflow (Day 9)

| Feature | Phase A |
|---|---|
| State machine: `draft → in_review → published → archived` (4 of the spec's 6 states) | ✅ |
| Submit for review (draft → in_review) | ✅ |
| `/admin/reviews` queue: articles in_review assigned to me OR un-assigned | ✅ |
| Review action: Approve / Request changes (with note) | ✅ |
| `ArticleReview` row recorded; reviewedVersion locked to current translation version | ✅ |
| Publish (in_review + approved review → published) | ✅ |
| Edit-after-approval re-engages the review gate (stale review detection) | ✅ |
| Archive (published → archived; un-archive supported) | ✅ |
| `legal_review` state (compliance flag) | ⏳ Phase B |
| `scheduled` state (publish at a future timestamp) | ⏳ Phase B |
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

## Day-by-day target

| Day | Slice | Closes |
|---|---|---|
| 1 | Staff auth helper, `/admin` shell, dashboard tiles, seed demo-admin | "Who can see /admin?" |
| 2 | Article state machine in `@aito/domain` + unit tests | "What transitions are legal?" |
| 3 | `/admin/articles` list (with status tabs, pagination) + new article action + audit log helper | "How do I make a draft?" |
| 4 | `/admin/articles/[id]/edit`: metadata form + three-language tabs + placeholder textarea body | "How do I shape the article shell?" |
| 5 | TipTap base + toolbar (formatting, headings, blocks, alignment, color, highlight) + autosave | "Can I write a paragraph?" |
| 6 | Paste sanitisation (DOMPurify rules) + code block + font/spacing presets + first-line indent | "Does pasting from WeChat just work?" |
| 7 | Image upload: Vercel Blob + drag + paste + caption + alignment + progress | "How do I add a screenshot?" |
| 8 | HTML source toggle + preview tab + word count + reading time + Cmd+S shortcut | "Can I see what publishes?" |
| 9 | Review queue + approve + publish + archive + zh-CN/zh-HK admin i18n | "Who clicks the green button?" |
| 10 | E2E test + staging deploy + admin-runbook.md + admin-backlog.md | "Can a real editor use this?" |

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

**Carry-over**

- Day 1 starts with: `lib/auth/staff.ts` + `/admin` shell +
  dashboard tile + seed `demo-admin@aito.io`.
