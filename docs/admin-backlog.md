# Admin — backlog & rejected scope

Phase B and beyond for the editorial admin. Phase A is documented
day-by-day in [admin-buildlog.md](./admin-buildlog.md); this file
captures what we deliberately deferred, with the trigger that should
make us pick each item up. Stripe's equivalent is
[stripe-backlog.md](./stripe-backlog.md).

Don't pick up Phase B items until Phase A has been used by real
editors for at least two weeks and we have actual friction points,
not predicted ones.

---

## Phase B — fills a real gap the editor will hit

### 1. Editorial review workflow

**Why deferred**: We cut this on Day 0 to ship Phase A in 9 days
instead of 10. The schema reserves `in_review`, `legal_review`, and
`scheduled` states + `ArticleReview` rows; the `@aito/domain` state
machine leaves stubs. The admin UI doesn't surface any of it.

**Scope when picked up**:
- `/admin/reviews` queue page (placeholder already exists, redirects
  to dashboard right now)
- New events in `articleTransition()`:
  `draft → in_review`, `in_review → published`, `in_review → draft`
  (request changes), `published → legal_review` for compliance flips
- New server actions: `submitForReviewAction`,
  `approveReviewAction`, `requestChangesAction`
- `ArticleReview` row created on every state change with the
  reviewer's id + reviewedVersion locked to the current
  `currentVersion`. Edit-after-approval re-engages the gate (stale
  review detection — already specified in
  `packages/database/docs/lifecycles.md`).
- Notification to reviewers (email or in-admin badge)

**Estimate**: 2-3 days. Mostly UI + the state-machine edges.

**Trigger**: First time an editor publishes something they shouldn't
have, or first compliance officer asks for sign-off authority.

### 2. Audit log viewer UI

**Why deferred**: Every admin write since Day 3 writes an
`AuditLogEntry` row, but you have to query the DB to see them. Phase
A has no UI for browsing or filtering.

**Scope when picked up**:
- `/admin/audit` route, gated on `system.audit_log` permission
  (already seeded)
- Filters: actor, action prefix (e.g. `article.*`), resource type,
  date range
- Diff viewer for `oldValue` vs `newValue` JSON blobs
- 90-day retention reminder (matches the existing decision in
  `packages/database/docs/decisions.md`)
- "Who edited this article" tab on the article edit page

**Estimate**: 2 days.

**Trigger**: First compliance request ("who changed X and when?") or
first incident where we need to retrace an admin action.

### 3. Article revision history viewer

**Why deferred**: Every translation save snapshots into
`ArticleTranslationRevision` via Prisma middleware (already
implemented in the database package). The audit data is there but the
admin can't browse it.

**Scope when picked up**:
- `/admin/articles/[id]/history` page, lists revisions per
  translation locale
- Side-by-side diff (probably `react-diff-viewer-continued`)
- "Restore this version" button that writes a *new* revision (never
  rewrite history)
- Compare-with-current toggle on the edit page

**Estimate**: 2-3 days.

**Trigger**: First editor asks "can I see what I had two saves ago"
— probably within a week of regular use.

### 4. Hero image upload (replaces URL field)

**Why deferred**: Day 4 metadata form shipped Hero Image as a URL
field. Schema has `heroImageAssetId` (FK to `MediaAsset`) which the
URL doesn't populate.

**Scope when picked up**:
- Replace the URL input with the same Vercel Blob upload flow
  Day 7 uses for inline images
- Create a `MediaAsset` row, set `Article.heroImageAssetId`
- `<img>` rendering on the article reader page using the asset
- Optional: 3 standard crops (hero, OG card, thumbnail) generated
  on upload

**Estimate**: 1 day for the upload swap; +1 day if we want
auto-crops.

**Trigger**: First editor pastes an external URL and gets confused
about copyright / 404 risk.

### 5. Bulk actions on the article list

**Why deferred**: Phase A list has no checkboxes; everything is
one-article-at-a-time.

**Scope when picked up**:
- Checkboxes per row + a "select all on page" header checkbox
- Bulk: archive, unarchive, change category, change required tier
- Per-bulk confirmation modal showing affected article count

**Estimate**: 1 day.

**Trigger**: First time we have 100+ articles and an editorial
reorganisation hits.

### 6. Markdown source mode

**Why deferred**: We have HTML source view (Day 8). Editors who
prefer Markdown still have to manually convert.

**Scope when picked up**:
- Toggle next to "View HTML" → "View Markdown"
- HTML → MDX conversion (e.g. `turndown`) + back-conversion on Apply
- Round-trip fidelity for headings / lists / blockquotes / code;
  marks like color / highlight don't round-trip cleanly so they
  flatten

**Estimate**: 1.5 days, mostly fidelity testing.

**Trigger**: Second editor asks for it; first is anecdote.

### 7. .docx / Notion import

**Why deferred**: WeChat paste works (Day 6). Editors writing in
Word or Notion can paste from the rendered preview but lose some
structure.

**Scope when picked up**:
- "Import file" button on the new-article page
- mammoth (.docx → HTML) or notion-to-md adapter
- DOMPurify pass before insertion

**Estimate**: 1.5 days.

**Trigger**: Editor with a 5,000-word Word document complains that
paste lost the headings.

### 8. Per-translation "ready" flag

**Why deferred**: Day 4 noted this. The schema has no column;
publishing is gated on "at least one translation exists" today, not
on any per-translation completeness flag.

**Scope when picked up**:
- Schema: `ArticleTranslation.readyAt DateTime?`
- Editor marks "ready" via a checkbox; publishes happen against
  the ready set
- Public site falls back to a translation that's `readyAt = null`
  only if no `readyAt != null` translation matches the locale

**Estimate**: 0.5 day code + migration.

**Trigger**: Editor publishes accidentally with a half-finished zh
translation visible to readers.

### 9. Article inline image: resize handles + Figure / caption

**Why deferred**: Day 7 ships images with alignment (left / center /
right) but no width control or inline caption. The accepted Phase A
workaround is "next paragraph in italic".

**Scope when picked up**:
- Custom TipTap Node spec for `figure` with optional `figcaption`
  child
- Drag-resize handles on image nodes (`@tiptap/extension-image`
  + a resize plugin like `tiptap-image-resize` or custom)
- Width attribute persisted as inline style; sanitiser allows
  `width` on `<img>`

**Estimate**: 2 days.

**Trigger**: First demo gets feedback that images look uniform and
captions live separately.

### 10. Typography pack: font-size / line-height / first-line indent

**Why deferred**: Day 7 noted these. TipTap doesn't ship them as
built-ins; each needs a custom Mark extension.

**Scope when picked up**:
- Custom `FontSize` Mark — toggle 5 sizes via TextStyle
- Custom `LineHeight` Node attribute on paragraph + heading
- `FirstLineIndent` paragraph attribute (boolean, CSS
  `text-indent: 2em`)
- Toolbar pickers (dropdowns) + reset buttons

**Estimate**: 1.5 days.

**Trigger**: Editor specifically asks for it, OR a designer says
the current uniform typography is too plain.

### 11. Video / audio embeds

**Why deferred**: Phase A is text + images.

**Scope when picked up**:
- TipTap `Youtube` / `Vimeo` extensions (official, MIT)
- Audio: `<audio controls>` via a simple custom Node, or Mux for
  branded player
- Paste-handler detects YouTube / Vimeo URLs → swap for embed node
- Sanitiser allowlist gains `iframe[src^="https://www.youtube.com/embed/"]`
  and similar with strict origin matching

**Estimate**: 2 days.

**Trigger**: Live class recap article wants the YouTube replay
embedded inline.

### 12. Tables

**Why deferred**: TipTap ships an `@tiptap/extension-table` but
table UX (resize columns, merge cells, add row above/below) is
~5 toolbar buttons and a chunk of UI work.

**Scope when picked up**:
- `@tiptap/extension-table` + ↔ resize columns
- Toolbar group for table operations
- Sanitiser allowlist gains `table` / `thead` / `tbody` / `tr` /
  `th` / `td` with `colspan` / `rowspan` / `scope`
- Mobile-friendly table styling on the reader page

**Estimate**: 2 days.

**Trigger**: First article that wants a comparison table that isn't
better expressed as a list.

### 13. Search across full body / slug / author

**Why deferred**: Day 3 search filters titles only. Body search
needs a tsvector or pg_trgm index.

**Scope when picked up**:
- Postgres GIN index on `tsvector_concat(title, excerpt, body_mdx)`
  per translation
- Search input switches to debounced server-action query
- Highlight matches in the list rows

**Estimate**: 1 day, plus migration time on the index in production.

**Trigger**: First "I know I wrote about X somewhere" moment from
an editor.

### 14. Filters: author / category / tier / kind on list

**Why deferred**: Day 3 list filters by status only. Other
dimensions need URL query plumbing and dropdown components.

**Scope when picked up**:
- Add `?author=…` / `?category=…` / `?tier=…` / `?kind=…` to the
  list page; combine with `&status=…&q=…`
- Filter chips above the list with × to remove
- Server action takes the filter set as input

**Estimate**: 0.5 day.

**Trigger**: First time an editor scrolls past page 3 looking for
something specific.

### 15. Staff invitation flow

**Why deferred**: New staff members today are created by an admin
running raw SQL or via Prisma Studio. There's no in-admin
"invite a teammate" flow.

**Scope when picked up**:
- `/admin/users` page, gated on `system.roles` permission
- "Invite" form: email + initial role
- Sends an email with a magic link that creates the
  `UserCredential` row on first sign-in (or pre-sets the password)
- Role-grant UI on the user detail page

**Estimate**: 2-3 days, mostly the email + magic link plumbing.

**Trigger**: Second editor needs to be onboarded.

---

## Phase C — only when we hit real scale or compliance pressure

### 16. 2FA for admin

Standard YubiKey or TOTP gate on `/admin`. Schema already has
`UserMfaFactor`; just needs the verification UI + a guard on
`requireStaff()`.

**Trigger**: First editor accidentally exposes their password OR
compliance audit asks.

### 17. SSO / SAML

For an editorial team large enough to use Okta / Google Workspace
SSO instead of email + password.

**Trigger**: Editorial team grows past ~5 people OR enterprise
contract requires it.

### 18. Multi-stage review (editor → chief editor → legal)

The Phase A spec mentions this as out-of-scope. Schema would need
a `ReviewStage` enum on `ArticleReview` and a per-article required
stage path.

**Trigger**: Genuine multi-editor team with separate editorial
authority levels.

### 19. AI-assisted layout / suggestions

Auto-suggest SEO description, auto-summarise body, auto-translate.

**Trigger**: After Phase B's manual translation flow has been used
enough to know what we'd want AI to assist with.

### 20. Inline collaborative editing (Y.js / Liveblocks)

Multi-cursor real-time editing. TipTap supports it via
`@tiptap/extension-collaboration` + a Y.js provider.

**Trigger**: Two editors collide on the same article often enough
that they ask. Probably never for AITO's scale.

---

## Explicitly NOT doing

Considered and dropped. Don't relitigate without new information.

| Rejected | Why |
|---|---|
| **WeChat-style decoration template library** | Brand voice is editorial restraint, not visual flourish. Hot-swap templates fight the editor and produce inconsistent reader experience. |
| **Polls / surveys inside articles** | Wrong product. We're a paid newsletter, not a community platform. If we ever need this, it's its own page type, not an article block. |
| **Comments on articles** | Out of scope per original spec §1.2. Discussion happens in the IM channels (Phase 2). |
| **Drag-to-reorder paragraphs** | TipTap supports it but editorial workflow doesn't need it; cut/paste is fine. Reduces cognitive load on the toolbar. |
| **Per-user editor preferences (font size, dark mode in editor)** | Editor's preferences should match the rendered output for the most-similar-to-published reading experience. We already match prose styles between editor and reader page (see globals.css `.tiptap-editor`). |
| **GraphQL admin API** | Server actions cover the admin's needs. A public-facing admin API is YAGNI until there's a third-party integration ask. |
| **Custom CMS / spreadsheet view per editor** | Engineering quicksand. The list page covers 99% of "find my article" needs; Phase B search + filters cover the rest. |
| **Article forking / branching ("save as draft of published")** | Implies a content-management product. We're a publication. If an editor wants to revise a published article they unpublish + edit + republish; the revision log captures the history. |

---

## When to next revisit this file

After **two weeks of real editorial use** in production. Pick the
top three items by "actual friction reported, not predicted". Move
them into a Phase B sprint plan and start ticking off.
