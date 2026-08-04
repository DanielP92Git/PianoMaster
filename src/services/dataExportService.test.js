import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase", () => ({
  default: {
    from: vi.fn(),
  },
}));

vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn().mockResolvedValue({
    userId: "student-1",
    isOwner: true,
    isTeacher: false,
  }),
}));

import { getExportedDataTypes, exportStudentData } from "./dataExportService";

describe("dataExportService — STUDENT_DATA_TABLES completeness", () => {
  const ADDED_TABLES = [
    "instrument_practice_logs",
    "instrument_practice_streak",
    "notifications",
    "push_subscriptions",
    "student_daily_challenges",
    "student_unit_progress",
  ];

  const EXCLUDED_TABLES = ["rate_limits", "parental_consent_tokens"];

  it("has at least 16 tables", () => {
    const tables = getExportedDataTypes();
    expect(tables.length).toBeGreaterThanOrEqual(16);
  });

  it("includes each of the 6 added parent-facing tables", () => {
    const tableNames = getExportedDataTypes().map((t) => t.table);
    ADDED_TABLES.forEach((table) => {
      expect(tableNames).toContain(table);
    });
  });

  it("does NOT include the excluded operational/security tables", () => {
    const tableNames = getExportedDataTypes().map((t) => t.table);
    EXCLUDED_TABLES.forEach((table) => {
      expect(tableNames).not.toContain(table);
    });
  });

  it("has a non-empty description for every table", () => {
    const tables = getExportedDataTypes();
    tables.forEach(({ table, description }) => {
      expect(description).toBeTruthy();
      expect(description).not.toBe(table);
    });
  });
});

describe("dataExportService — exportStudentData", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { verifyStudentDataAccess } = await import("./authorizationUtils");
    verifyStudentDataAccess.mockResolvedValue({
      userId: "student-1",
      isOwner: true,
      isTeacher: false,
    });
  });

  it("iterates the completed table list and includes the added tables in the export", async () => {
    const supabase = (await import("./supabase")).default;
    supabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));

    const result = await exportStudentData("student-1");

    expect(result.exportMetadata.tablesIncluded).toContain(
      "student_unit_progress"
    );
    expect(result.exportMetadata.tablesIncluded).toContain("notifications");
    expect(result).toHaveProperty("student_unit_progress");
    expect(result).toHaveProperty("notifications");
  });
});
