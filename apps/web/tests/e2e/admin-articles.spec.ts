import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@aito/database";

const prisma = new PrismaClient();

/**
 * End-to-end happy path for the editorial admin: sign in as demo-admin,
 * create a draft, edit metadata, publish, and confirm the public article
 * page renders the freshly-published body.
 *
 * Assumes `pnpm db:seed` has been run so `demo-admin@aito.io` exists with
 * the `super_admin` role grant. Cleans up its own article rows on exit.
 */

const ADMIN_EMAIL = "demo-admin@aito.io";
const ADMIN_PASSWORD = "DemoAdmin2026!";

async function resetRateLimit(page: Page) {
  await page.request.post("/api/auth/e2e-test/reset-rate-limit");
}

async function signInAsAdmin(page: Page) {
  await page.goto("/en/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(ADMIN_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Sign in/ }).click();
  // After sign-in we land on /dashboard (or wherever redirectTo pointed).
  await page.waitForURL(/\/(en|zh-CN|zh-HK)\/(dashboard|admin)/);
}

async function cleanupArticleBySlug(slug: string) {
  // Cascade on Article → ArticleTranslation / ArticleAuthor / ArticleTag.
  await prisma.article.deleteMany({ where: { slug } });
}

test.beforeEach(async ({ page }) => {
  await resetRateLimit(page);
  await page.context().clearCookies();
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("admin — phase A happy path", () => {
  test("create → edit metadata → add zh translation → publish → public reader sees it", async ({
    page,
  }) => {
    const ts = Date.now();
    const slug = `e2e-${ts}`;
    const enTitle = `E2E test article ${ts}`;
    const zhTitle = `测试文章 ${ts}`;

    // Make sure the slug is free, in case a prior run aborted before
    // cleanup. (The DB constraint would surface as our slugTaken code.)
    await cleanupArticleBySlug(slug);

    await signInAsAdmin(page);

    // ── 1. Create draft ──────────────────────────────────────────────
    await page.goto("/en/admin/articles/new");
    // Pick newsletter (the default) and EN as starting locale (default).
    await page.getByLabel(/Working title/).fill(enTitle);

    // Touch the slug field so the auto-suggest stops and we control it.
    await page.locator('input[id="slug"]').click();
    await page.locator('input[id="slug"]').fill(slug);

    await page.getByRole("button", { name: /Create draft/ }).click();

    // Server action redirects to /admin/articles/<id>/edit.
    await page.waitForURL(/\/admin\/articles\/[0-9a-f-]+\/edit/);
    const editUrl = page.url();
    const articleId = editUrl.match(/\/articles\/([0-9a-f-]+)\/edit/)![1]!;

    // Status badge should read "draft".
    await expect(page.getByText(/draft/i).first()).toBeVisible();

    // ── 2. Edit metadata: change required tier to premium ──────────
    await page
      .locator("select")
      .filter({ hasText: /Free \(public\)/ })
      .selectOption("premium");
    await page.getByRole("button", { name: /Save metadata/ }).click();
    // SaveIndicator goes green.
    await expect(page.getByText(/^Saved/)).toBeVisible({ timeout: 5000 });

    // ── 3. Edit the EN translation body ───────────────────────────
    // The body editor is contenteditable — `.tiptap-editor` class.
    const editor = page.locator(".tiptap-editor").first();
    await editor.click();
    await editor.fill("This is the body of the E2E test article.");
    // Autosave fires after 2s; force it via Cmd+S to make the test
    // deterministic.
    await page.keyboard.press("Meta+s");
    // The translation save indicator should reach "Saved" within a few
    // seconds (Meta+s skips the 2s debounce).
    await expect(page.getByText(/^Saved/).first()).toBeVisible({
      timeout: 5000,
    });

    // ── 4. Add a zh-CN translation ────────────────────────────────
    await page.getByRole("button", { name: /Add translation/ }).click();
    // The picker's locale select defaults to the first missing locale
    // (zh-CN if EN is already present).
    const titleInput = page.getByPlaceholder(/Working title in this language/);
    await titleInput.fill(zhTitle);
    await page.getByRole("button", { name: /^Add$/ }).click();

    // After add, the new tab is active. Title input in the editor form
    // pre-fills from the picker. Verify the tab bar now shows both
    // locales.
    await expect(page.getByRole("button", { name: "en" })).toBeVisible();
    await expect(page.getByRole("button", { name: "zh-CN" })).toBeVisible();

    // ── 5. Publish ────────────────────────────────────────────────
    await page
      .getByRole("button", { name: /^Publish$/ })
      .click();
    // Status badge flips to "published"; the page reloads in place via
    // router.refresh().
    await expect(page.getByText(/published/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── 6. Public reader sees it ─────────────────────────────────
    // Demo-admin is signed in (a regular session, paywall check uses
    // viewer entitlements). The article requires `premium`, and
    // demo-admin has no subscription — so we'd hit the paywall.
    // For the happy-path verification we drop the requiredTier back
    // to free first so the body renders for anyone, then visit.
    await page
      .locator("select")
      .filter({ hasText: /Premium/ })
      .selectOption("free");
    await page.getByRole("button", { name: /Save metadata/ }).click();
    await expect(page.getByText(/^Saved/).first()).toBeVisible({
      timeout: 5000,
    });

    // Drop the admin cookie and visit anonymously — the article is
    // published + free so anyone can read it.
    await page.context().clearCookies();
    await page.goto(`/en/articles/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      enTitle,
    );
    await expect(
      page.getByText(/This is the body of the E2E test article/),
    ).toBeVisible();

    // Cleanup
    await cleanupArticleBySlug(slug);
    // Mark article id used so the variable isn't flagged unused.
    expect(articleId).toMatch(/^[0-9a-f-]+$/);
  });

  test("non-staff user is redirected away from /admin", async ({ page }) => {
    // Sign in as the regular Free demo user.
    await page.goto("/en/sign-in");
    await page.getByLabel("Email", { exact: true }).fill("demo-free@aito.io");
    await page.getByLabel("Password", { exact: true }).fill("DemoFree2026!");
    await page.getByRole("button", { name: /Sign in/ }).click();
    await page.waitForURL(/\/(en|zh-CN|zh-HK)\/dashboard/);

    // Now try /admin directly.
    await page.goto("/en/admin");
    // requireStaff() redirects signed-in non-staff to /dashboard.
    await page.waitForURL(/\/dashboard/);
    expect(page.url()).toMatch(/\/dashboard/);
  });

  test("anonymous visitor to /admin is sent to sign-in", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/en/admin");
    await page.waitForURL(/\/sign-in/);
    // The redirect carries ?redirectTo=/admin so the user lands back
    // after signing in.
    expect(page.url()).toMatch(/redirectTo=/);
  });
});
