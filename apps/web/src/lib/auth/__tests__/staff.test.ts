import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must precede module import.

vi.mock("@aito/database", () => ({
  prisma: {
    userRole: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../session", () => ({
  getSessionFromCookie: vi.fn(),
}));

// React.cache returns the function unchanged in test (no per-request memo).
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T>(fn: T): T => fn };
});

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`__redirect__:${path}`);
  }),
}));

import { prisma } from "@aito/database";
import { getSessionFromCookie } from "../session";
import { redirect } from "next/navigation";
import {
  getStaffContext,
  requireStaff,
  requirePermission,
  hasPermission,
  StaffAuthError,
} from "../staff";

const findMany = prisma.userRole.findMany as ReturnType<typeof vi.fn>;
const sessionMock = getSessionFromCookie as ReturnType<typeof vi.fn>;
const redirectMock = redirect as unknown as ReturnType<typeof vi.fn>;

function user(id = "user_1", email = "demo@example.com") {
  return { user: { id, email } };
}

function grantWith(roleKey: string, permissions: string[]) {
  return {
    role: {
      key: roleKey,
      permissions: permissions.map((key) => ({
        permission: { key },
      })),
    },
  };
}

describe("getStaffContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the visitor is anonymous", async () => {
    sessionMock.mockResolvedValue(null);
    expect(await getStaffContext()).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns null when the visitor has no active role grants", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([]);
    expect(await getStaffContext()).toBeNull();
  });

  it("dedupes permissions across multiple roles", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([
      grantWith("editor", ["content.draft", "content.publish", "user.view"]),
      grantWith("live_host", ["live.schedule", "content.draft"]),
    ]);
    const ctx = await getStaffContext();
    expect(ctx?.permissionKeys).toEqual(
      new Set([
        "content.draft",
        "content.publish",
        "user.view",
        "live.schedule",
      ]),
    );
    expect(ctx?.roleKeys).toEqual(["editor", "live_host"]);
  });

  it("queries with the right exclusions (revoked, expired)", async () => {
    sessionMock.mockResolvedValue(user("user_42"));
    findMany.mockResolvedValue([]);
    await getStaffContext();
    const where = findMany.mock.calls[0][0].where;
    expect(where.userId).toBe("user_42");
    expect(where.revokedAt).toBeNull();
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { expiresAt: null },
        expect.objectContaining({ expiresAt: { gt: expect.any(Date) } }),
      ]),
    );
  });
});

describe("requireStaff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to sign-in with redirectTo=/admin when anonymous", async () => {
    sessionMock.mockResolvedValue(null);
    await expect(requireStaff()).rejects.toThrow(
      /__redirect__:\/sign-in\?redirectTo=\/admin/,
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/sign-in?redirectTo=/admin",
    );
  });

  it("redirects to /dashboard when signed-in but not staff", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([]); // no grants
    await expect(requireStaff()).rejects.toThrow(
      /__redirect__:\/dashboard/,
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("returns the staff context for an active staff user", async () => {
    sessionMock.mockResolvedValue(user("user_7", "ed@example.com"));
    findMany.mockResolvedValue([grantWith("editor", ["content.draft"])]);
    const ctx = await requireStaff();
    expect(ctx.userId).toBe("user_7");
    expect(ctx.email).toBe("ed@example.com");
    expect(ctx.roleKeys).toEqual(["editor"]);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requirePermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws StaffAuthError(not_staff) when the viewer isn't staff", async () => {
    sessionMock.mockResolvedValue(null);
    await expect(requirePermission("content.publish")).rejects.toBeInstanceOf(
      StaffAuthError,
    );
    await expect(
      requirePermission("content.publish").catch((err) => err.code),
    ).resolves.toBe("not_staff");
  });

  it("throws StaffAuthError(permission_denied) when staff lacks the key", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([grantWith("support", ["user.view"])]);
    await expect(
      requirePermission("content.publish").catch((err) => err.code),
    ).resolves.toBe("permission_denied");
  });

  it("returns the context when the key is granted", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([
      grantWith("editor", ["content.draft", "content.publish"]),
    ]);
    const ctx = await requirePermission("content.publish");
    expect(ctx.permissionKeys.has("content.publish")).toBe(true);
  });
});

describe("hasPermission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false for anonymous viewers", async () => {
    sessionMock.mockResolvedValue(null);
    expect(await hasPermission("content.draft")).toBe(false);
  });

  it("returns true / false based on grant set", async () => {
    sessionMock.mockResolvedValue(user());
    findMany.mockResolvedValue([grantWith("editor", ["content.draft"])]);
    expect(await hasPermission("content.draft")).toBe(true);
    expect(await hasPermission("finance.refund")).toBe(false);
  });
});
