import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase default export
vi.mock("./supabase", () => ({
  default: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import supabase from "./supabase";
import { verifyStudentDataAccess } from "./authorizationUtils";

describe("verifyStudentDataAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = (userId = "parentA") => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } } });
  };

  // Mirrors supabase.from('child_profiles').select('id').eq('id', studentId).eq('parent_id', user.id).maybeSingle()
  const mockChildProfilesChain = (resolvedValue) => {
    const maybeSingleMock = vi.fn().mockResolvedValue(resolvedValue);
    const eq2Mock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
    return { select: selectMock, eq1Mock, eq2Mock, maybeSingleMock };
  };

  // Mirrors supabase.from('teacher_student_connections').select('id').eq('teacher_id',...).eq('student_id',...).eq('status','accepted').maybeSingle()
  const mockTeacherConnectionChain = (resolvedValue) => {
    const maybeSingleMock = vi.fn().mockResolvedValue(resolvedValue);
    const eq3Mock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eq2Mock = vi.fn().mockReturnValue({ eq: eq3Mock });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });
    return { select: selectMock };
  };

  it("returns isOwner/isParent true when the parent owns the child (owned child_profiles row found)", async () => {
    mockUser("parentA");

    const childProfilesChain = mockChildProfilesChain({
      data: { id: "childX" },
      error: null,
    });
    supabase.from.mockImplementation((table) => {
      if (table === "child_profiles") return childProfilesChain;
      throw new Error(`Unexpected table query: ${table}`);
    });

    const result = await verifyStudentDataAccess("childX");

    expect(supabase.from).toHaveBeenCalledWith("child_profiles");
    expect(childProfilesChain.eq1Mock).toHaveBeenCalledWith("id", "childX");
    expect(childProfilesChain.eq2Mock).toHaveBeenCalledWith(
      "parent_id",
      "parentA"
    );
    expect(result).toEqual({
      userId: "parentA",
      isOwner: true,
      isTeacher: false,
      isParent: true,
    });
  });

  it("throws Unauthorized when the child is NOT owned by the parent and there is no teacher connection", async () => {
    mockUser("parentA");

    const childProfilesChain = mockChildProfilesChain({
      data: null,
      error: null,
    });
    const teacherChain = mockTeacherConnectionChain({
      data: null,
      error: null,
    });
    supabase.from.mockImplementation((table) => {
      if (table === "child_profiles") return childProfilesChain;
      if (table === "teacher_student_connections") return teacherChain;
      throw new Error(`Unexpected table query: ${table}`);
    });

    await expect(verifyStudentDataAccess("childZ")).rejects.toThrow(
      /Unauthorized/
    );
  });

  it("returns isOwner true without querying child_profiles when the user is the student themselves", async () => {
    mockUser("student1");

    const result = await verifyStudentDataAccess("student1");

    expect(supabase.from).not.toHaveBeenCalled();
    expect(result).toEqual({
      userId: "student1",
      isOwner: true,
      isTeacher: false,
    });
  });

  it("throws Not authenticated when there is no user", async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(verifyStudentDataAccess("childX")).rejects.toThrow(
      "Not authenticated"
    );
  });
});
