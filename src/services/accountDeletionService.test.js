import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase", () => ({
  default: {
    auth: {
      signOut: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));

import supabase from "./supabase";
import { verifyStudentDataAccess } from "./authorizationUtils";
import { deleteChildProfile } from "./accountDeletionService";

describe("deleteChildProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mirrors supabase.from('child_profiles').select('nickname').eq('id', childId).single()
  const mockChildFetchChain = (resolvedValue) => {
    const singleMock = vi.fn().mockResolvedValue(resolvedValue);
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    return { select: selectMock };
  };

  // Mirrors supabase.from('students').delete().eq('id', childId)
  const mockDeleteChain = (resolvedValue) => {
    const eqMock = vi.fn().mockResolvedValue(resolvedValue);
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    return { delete: deleteMock, eqMock, deleteMock };
  };

  it('deletes students.eq("id", childId) on the happy path and does NOT call signOut', async () => {
    verifyStudentDataAccess.mockResolvedValue({
      userId: "parentA",
      isOwner: true,
      isTeacher: false,
      isParent: true,
    });

    const childFetchChain = mockChildFetchChain({
      data: { nickname: "Sparkle" },
      error: null,
    });
    const deleteChain = mockDeleteChain({ error: null });

    supabase.from.mockImplementation((table) => {
      if (table === "child_profiles") return childFetchChain;
      if (table === "students") return deleteChain;
      throw new Error(`Unexpected table query: ${table}`);
    });

    const result = await deleteChildProfile("childX", "sparkle");

    expect(supabase.from).toHaveBeenCalledWith("students");
    expect(deleteChain.deleteMock).toHaveBeenCalled();
    expect(deleteChain.eqMock).toHaveBeenCalledWith("id", "childX");
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: expect.stringContaining("Sparkle"),
    });
  });

  it('throws "Name does not match" and does not call delete when confirmationNickname is wrong', async () => {
    verifyStudentDataAccess.mockResolvedValue({
      userId: "parentA",
      isOwner: true,
      isTeacher: false,
      isParent: true,
    });

    const childFetchChain = mockChildFetchChain({
      data: { nickname: "Sparkle" },
      error: null,
    });
    const deleteChain = mockDeleteChain({ error: null });

    supabase.from.mockImplementation((table) => {
      if (table === "child_profiles") return childFetchChain;
      if (table === "students") return deleteChain;
      throw new Error(`Unexpected table query: ${table}`);
    });

    await expect(deleteChildProfile("childX", "wrong-name")).rejects.toThrow(
      "Name does not match"
    );
    expect(deleteChain.deleteMock).not.toHaveBeenCalled();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('throws "Unauthorized" when the caller does not own the child', async () => {
    verifyStudentDataAccess.mockResolvedValue({
      userId: "parentB",
      isOwner: false,
      isTeacher: false,
    });

    await expect(deleteChildProfile("childX", "sparkle")).rejects.toThrow(
      "Unauthorized"
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
