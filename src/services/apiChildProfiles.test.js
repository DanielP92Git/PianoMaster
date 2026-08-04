import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUser = vi.hoisted(() => ({ id: "parent-1" }));
const mockUserRef = vi.hoisted(() => ({ current: mockUser }));

vi.mock("./supabase", () => ({
  default: {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: mockUserRef.current } })
      ),
    },
    from: vi.fn(),
  },
}));

import supabase from "./supabase";
import {
  createChildProfile,
  renameChildProfile,
  updateChildAvatar,
  setChildActive,
  getChildProfiles,
} from "./apiChildProfiles";

describe("apiChildProfiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRef.current = mockUser;
  });

  describe("createChildProfile", () => {
    it("inserts { parent_id: user.id, nickname, avatar_id, is_active: true } and returns the row", async () => {
      const insertedRow = {
        id: "child-1",
        parent_id: "parent-1",
        nickname: "Sparky",
        avatar_id: "avatar-1",
        is_active: true,
      };
      const singleMock = vi.fn().mockResolvedValue({
        data: insertedRow,
        error: null,
      });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const insertMock = vi.fn().mockReturnValue({ select: selectMock });
      supabase.from.mockReturnValue({ insert: insertMock });

      const result = await createChildProfile({
        nickname: "Sparky",
        avatarId: "avatar-1",
      });

      expect(supabase.from).toHaveBeenCalledWith("child_profiles");
      expect(insertMock).toHaveBeenCalledWith([
        {
          parent_id: "parent-1",
          nickname: "Sparky",
          avatar_id: "avatar-1",
          is_active: true,
        },
      ]);
      expect(result).toEqual(insertedRow);
    });

    it('throws "Not authenticated" when supabase.auth.getUser() returns no user', async () => {
      mockUserRef.current = null;

      await expect(
        createChildProfile({ nickname: "Sparky", avatarId: "avatar-1" })
      ).rejects.toThrow("Not authenticated");
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe("renameChildProfile", () => {
    it("issues .update({ nickname }).eq('id', childId)", async () => {
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: { id: "child-1" }, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ update: updateMock });

      await renameChildProfile("child-1", "New Name");

      expect(supabase.from).toHaveBeenCalledWith("child_profiles");
      expect(updateMock).toHaveBeenCalledWith({ nickname: "New Name" });
      expect(eqMock).toHaveBeenCalledWith("id", "child-1");
    });

    it('throws "Not authenticated" when no user', async () => {
      mockUserRef.current = null;

      await expect(renameChildProfile("child-1", "New Name")).rejects.toThrow(
        "Not authenticated"
      );
    });
  });

  describe("updateChildAvatar", () => {
    it("issues .update({ avatar_id: avatarId }).eq('id', childId)", async () => {
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: { id: "child-1" }, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ update: updateMock });

      await updateChildAvatar("child-1", "avatar-2");

      expect(supabase.from).toHaveBeenCalledWith("child_profiles");
      expect(updateMock).toHaveBeenCalledWith({ avatar_id: "avatar-2" });
      expect(eqMock).toHaveBeenCalledWith("id", "child-1");
    });

    it('throws "Not authenticated" when no user', async () => {
      mockUserRef.current = null;

      await expect(updateChildAvatar("child-1", "avatar-2")).rejects.toThrow(
        "Not authenticated"
      );
    });
  });

  describe("setChildActive", () => {
    it("issues update({is_active}).eq('id', childId)", async () => {
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: { id: "child-1" }, error: null });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ update: updateMock });

      await setChildActive("child-1", false);

      expect(supabase.from).toHaveBeenCalledWith("child_profiles");
      expect(updateMock).toHaveBeenCalledWith({ is_active: false });
      expect(eqMock).toHaveBeenCalledWith("id", "child-1");
    });

    it('throws "Not authenticated" when no user', async () => {
      mockUserRef.current = null;

      await expect(setChildActive("child-1", false)).rejects.toThrow(
        "Not authenticated"
      );
    });
  });

  describe("getChildProfiles", () => {
    it("filters by parent_id", async () => {
      const rows = [{ id: "child-1", parent_id: "parent-1" }];
      const eqMock = vi.fn().mockResolvedValue({ data: rows, error: null });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      supabase.from.mockReturnValue({ select: selectMock });

      const result = await getChildProfiles("parent-1");

      expect(supabase.from).toHaveBeenCalledWith("child_profiles");
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(eqMock).toHaveBeenCalledWith("parent_id", "parent-1");
      expect(result).toEqual(rows);
    });
  });
});
