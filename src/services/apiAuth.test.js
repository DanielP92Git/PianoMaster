import { describe, it, expect, vi, beforeEach } from "vitest";

// Configurable per-table row fixtures + the session user consumed by the
// mocked supabase.auth.getSession()/getUser() calls that getCurrentUser()
// depends on before it ever reaches the table probes.
const mockRows = vi.hoisted(() => ({
  teachers: null,
  students: null,
  parents: null,
}));

const mockUser = vi.hoisted(() => ({
  id: "u1",
  email: "test@example.com",
  user_metadata: {},
}));

vi.mock("./supabase", () => ({
  default: {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { user: mockUser } },
          error: null,
        }),
      getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
    },
    from: (table) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: mockRows[table] ?? null, error: null }),
        }),
      }),
    }),
  },
}));

import { getCurrentUser } from "./apiAuth";

describe("getCurrentUser", () => {
  beforeEach(() => {
    mockRows.teachers = null;
    mockRows.students = null;
    mockRows.parents = null;
    mockUser.user_metadata = {};
  });

  it("resolves userRole 'parent', isParent true, needsRoleSelection false when only a parents row exists", async () => {
    mockRows.parents = { id: "u1", display_name: "Test Parent" };

    const result = await getCurrentUser();

    expect(result.userRole).toBe("parent");
    expect(result.isParent).toBe(true);
    // The resolved-role branch (mirroring teacher/student) never sets this
    // key at all — it's simply falsy/absent, not an explicit `false`.
    expect(result.needsRoleSelection).toBeFalsy();
  });

  it("still resolves a teacher-only session exactly as before (no regression)", async () => {
    mockRows.teachers = { id: "u1" };

    const result = await getCurrentUser();

    expect(result.userRole).toBe("teacher");
    expect(result.isTeacher).toBe(true);
    expect(result.isStudent).toBe(false);
    expect(result.isParent).toBe(false);
    expect(result.needsRoleSelection).toBeUndefined();
  });

  it("still resolves a student-only session exactly as before (no regression)", async () => {
    mockRows.students = { id: "u1" };

    const result = await getCurrentUser();

    expect(result.userRole).toBe("student");
    expect(result.isStudent).toBe(true);
    expect(result.isTeacher).toBe(false);
    expect(result.isParent).toBe(false);
  });

  it("returns needsRoleSelection true and isParent false with NO row in any of the three tables", async () => {
    const result = await getCurrentUser();

    expect(result.userRole).toBe(null);
    expect(result.isTeacher).toBe(false);
    expect(result.isStudent).toBe(false);
    expect(result.isParent).toBe(false);
    expect(result.needsRoleSelection).toBe(true);
  });

  it("never lets the parents probe override a real teacher/student match (final fallback only)", async () => {
    mockRows.teachers = { id: "u1" };
    mockRows.parents = { id: "u1", display_name: "Should not win" };

    const result = await getCurrentUser();

    expect(result.userRole).toBe("teacher");
    expect(result.isParent).toBe(false);
  });

  it("checks parents as the final fallback when metadata hints teacher but no teacher/student row exists", async () => {
    mockUser.user_metadata = { role: "teacher" };
    mockRows.parents = { id: "u1", display_name: "Parent via teacher hint" };

    const result = await getCurrentUser();

    expect(result.userRole).toBe("parent");
    expect(result.isParent).toBe(true);
  });
});
