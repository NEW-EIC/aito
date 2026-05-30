# Editorial admin runbook

How to publish an article using the AITO admin. Written for the
editorial team — assumes no engineering background.

For implementation history of the admin itself, see
[docs/admin-buildlog.md](./admin-buildlog.md). For things the admin
does **not** do yet (and the reasons), see
[docs/admin-backlog.md](./admin-backlog.md).

---

## Getting in

The admin lives at **`/admin`** on whichever host you're on:

| Environment | URL |
|---|---|
| Local dev | `http://localhost:3001/en/admin` |
| Production | `https://your-domain.com/en/admin` |

You need a staff account with the `editor` role (or higher). The
seeded dev account is **`demo-admin@aito.io` / `DemoAdmin2026!`**
and has `super_admin`, which trumps everything.

If you sign in as a non-staff user (e.g. `demo-free@aito.io`) and
visit `/admin`, you'll be redirected to `/dashboard`. That's
intentional — `/admin` is not browsable for readers.

---

## The four tiles

| Tile | Status |
|---|---|
| **Articles** | Live — create, edit, publish, archive |
| Reviews queue | Coming in Phase B (editorial review workflow) |
| Users | Coming in Phase B (read-only user lookup) |
| Settings | Coming in Phase B (PlatformSetting toggles) |

For Phase A everything happens under **Articles**.

---

## Lifecycle of an article

```
draft  ─── publish ──▶  published  ─── archive ──▶  archived
  │                      │                            │
  │                      └── unpublish ──▶ draft      │
  │                                                   │
  └──────── archive ────▶ archived ◀── unarchive ─────┘
```

Three states, four transitions. Phase B adds in_review / legal_review /
scheduled, but for now you go straight from draft to published.

---

## Creating a new article

1. Articles → **New article** (top right)
2. **Kind** — Newsletter / Podcast / Blog post. Pick newsletter for
   most editorial copy.
3. **Starting language** — pick whichever language you're going to
   write first. You can add the other two later. *At least one*
   language is required before publishing; the public site falls
   back to whichever locale is filled when a reader's preference
   isn't covered.
4. **Working title** — used to auto-suggest the URL slug. You can
   change it later on the edit page.
5. **URL slug** — auto-filled. Override if you want
   `/articles/q3-outlook` instead of the suggestion.
6. **Create draft** → lands on the article's edit page.

> CJK-only titles auto-suggest `article-<6char>` as the slug because
> URL-encoded CJK is unreadable. Override with English transliteration
> if you can; otherwise leave the placeholder.

---

## Editing the article

The edit page has two panels:

### Metadata (top)

- **Slug** — change to anything unique
- **Kind** — same enum as create
- **Required tier** — Free / Premium / Pro. Drafts ignore this; once
  published, readers below this tier hit the paywall.
- **Compliance class** — pick the most accurate label. Currently no
  workflow consequence for `specific_recommendation`; Phase B adds
  mandatory legal review.
- **Category** — single-pick from the seeded categories
- **Authors** — multi-pick. Order matters (drives byline order).
- **Tags** — multi-pick
- **Hero image URL** — paste a URL. Real upload (drag-from-Finder)
  arrives in Phase B; until then, host the cover image somewhere
  and link it.

Click **Save metadata** when done. Save button is disabled when
nothing has changed.

### Translations (bottom)

Tabs per language — `en`, `zh-CN`, `zh-HK`. Switch by clicking.
Add a missing language via the **Add translation** button on the
right of the tab bar.

Each translation has:

- **Title** (required), **Subtitle**, **Excerpt**
- **Body** — the WYSIWYG editor (see below)
- **SEO** (collapsed by default) — override title/description for
  search engines and OG cards. Falls back to article title/excerpt
  when blank.

#### Body editor (TipTap)

Toolbar buttons, left to right:

| Group | Buttons |
|---|---|
| Inline | Bold · Italic · Underline · Strikethrough · Code |
| Blocks | H2 · H3 · Bullet list · Numbered list · Quote · Code block · Divider |
| Alignment | Left · Center · Right |
| Links | Link · Unlink · **Upload image** |
| Color | Text color · Highlight |
| History | Undo · Redo |

**Adding images** — three ways, all upload to Vercel Blob and replace
with a real URL:

1. **Drag from Finder / Explorer** onto the editor
2. **Cmd+V** a screenshot (use Cmd+Shift+4 on macOS)
3. **Upload image** button → file picker

Max 8 MB per image; JPEG / PNG / WebP / GIF / AVIF. The image lands
at its drop position. To resize or reposition, use the alignment
buttons; we don't have inline resize handles yet (Phase B).

**Captions** — write the caption as the next paragraph in italic.
We don't have a proper Figure/caption node yet (Phase B).

**Pasting from WeChat / Word / a webpage** — paste as normal. The
editor strips inline styles, MS Office namespaced tags, and any
`<script>` / `<iframe>` / `onclick="…"` automatically. Bold, italic,
links, lists, headings, blockquotes — all preserved.

**Cmd+S** force-saves anywhere in the form (autosave already fires
2 seconds after you stop typing, but power-user reflex works).

**View HTML** button — top right of the body editor. Opens a modal
showing the raw HTML. Useful for fixing markup the WYSIWYG can't
reach (e.g. removing a stuck attribute). Edit + Apply to commit.

**Word count + reading time** appear under the editor as you type.
Reading rate: 250 wpm Latin + 500 cpm CJK.

#### Copy from another locale

When translating from one language to another, click **Copy from…**
(top right of the translation panel) → pick the source language.
Pulls title / subtitle / excerpt / body / SEO into the active tab.
Edits stay local until you click Save translation; confirms before
overwriting unsaved changes.

---

## Publishing

Look at the top right of the edit page. The button set depends on
the current status:

- **Draft** → Publish · Archive
- **Published** → Unpublish · Archive
- **Archived** → Unarchive (goes back to Draft, then re-publish)

Click **Publish** when ready. If the article has zero translations,
publish refuses with an inline message — add at least one.

**Confirm prompts**:
- Unpublish always confirms (pulls live content)
- Archive confirms only when archiving a published article (a draft
  archive is harmless)

Once published, the article shows up at `/articles/<slug>` for any
reader whose plan tier qualifies for the article's `requiredTier`.
The Preview link in the header opens the article in a new tab; for
drafts and archives it appends `?preview=1` so staff can see them
even though readers can't.

---

## Common errors

### "This slug is already in use"

Slugs are globally unique. Pick a different one or check whether the
existing article is yours.

### "Add at least one translation before publishing"

Publish is gated on having at least one filled translation. Add one
via the **Add translation** picker.

### "Your role doesn't include editing articles"

You're signed in as a staff user whose role doesn't include
`content.draft`. Ask `super_admin` (the CTO) to grant the
`editor` role.

### Autosave failed

Network glitch. The amber strip under the editor shows the failure;
click **Save translation** to retry. Your typing is preserved.

### Image upload silently does nothing

- Check the file is under 8 MB (the server returns 413)
- Check the MIME is JPEG / PNG / WebP / GIF / AVIF (server returns
  415 for `.heic` and other formats)
- Check Vercel Blob is enabled on the project (Settings → Storage →
  Create Database → Blob). The env var `BLOB_READ_WRITE_TOKEN` must
  be present.

### The WYSIWYG didn't catch up after I pasted

The paste handler strips noisy markup. Sometimes that means a
formatting you wanted (e.g. a specific font face) gets dropped.
Re-apply via the toolbar — it'll persist this time because the
toolbar emits TipTap-native marks.

---

## What's not in Phase A

Quick reference; full list with reasons in
[docs/admin-backlog.md](./admin-backlog.md):

- **Editorial review workflow** — for now editors publish directly.
- **Audit log viewer UI** — audit rows are written for every action,
  but no in-admin viewer yet. Query the `audit_log_entries` table
  via Prisma Studio or psql.
- **Article version history viewer** — every translation save
  snapshots into `article_translation_revisions` (Prisma middleware),
  but no in-admin viewer.
- **Image inline resize / Figure with caption / video embed /
  tables** — text + image only for Phase A.
- **Markdown source mode** — only HTML source today.
- **Bulk actions** — one article at a time.
- **Staff invitation flow** — `super_admin` grants roles via
  `prisma.userRole.create(...)` for now.
- **2FA for admin** — single password layer.
- **Live class / podcast / IM group admin** — own epics later.
- **Email delivery for newsletters** — Phase B/C.

---

## Local dev cheat sheet

```bash
# Postgres + web
pnpm db:up
pnpm web:dev                  # http://localhost:3001

# Reset DB (deletes everything; re-seeds demo accounts)
pnpm --filter @aito/database db:reset

# Inspect DB
pnpm db:studio                # http://localhost:5555

# Run the test suite (95 passing today)
pnpm test
```

Demo accounts after `pnpm db:seed`:

| Email | Password | Role |
|---|---|---|
| `demo-free@aito.io` | `DemoFree2026!` | Reader (no subscription) |
| `demo-premium@aito.io` | `DemoPremium2026!` | Premium reader |
| `demo-pro@aito.io` | `DemoPro2026!` | Pro reader |
| `demo-admin@aito.io` | `DemoAdmin2026!` | Editor (super_admin) |
