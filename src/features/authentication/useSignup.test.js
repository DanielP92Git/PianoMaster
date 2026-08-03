import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client — hoisted recorders track from()/upsert()/rpc() calls
const calls = vi.hoisted(() => ({
  fromTables: [],
  upsertRows: [],
  rpcCalls: [],
}));

vi.mock("../../services/supabase", () => ({
  default: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "test-id" } }, error: null }),
    },
    from: vi.fn((table) => {
      calls.fromTables.push(table);
      return {
        upsert: vi.fn((rows) => {
          calls.upsertRows.push({ table, rows });
          return Promise.resolve({ error: null });
        }),
      };
    }),
    rpc: vi.fn((fnName, params) => {
      calls.rpcCalls.push({ fnName, params });
      return Promise.resolve({ error: null });
    }),
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

// Capture the mutationFn/onSuccess/onError passed to useMutation so we can
// invoke them directly, bypassing react-query's async scheduling.
const mutationHandlers = vi.hoisted(() => ({ current: null }));
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn((config) => {
    mutationHandlers.current = config;
    return {
      mutate: (variables) => {
        config
          .mutationFn(variables)
          .then((data) => config.onSuccess?.(data, variables))
          .catch((error) => config.onError?.(error));
      },
      isPending: false,
    };
  }),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

import { useSignup } from "./useSignup";

describe("useSignup", () => {
  beforeEach(() => {
    calls.fromTables.length = 0;
    calls.upsertRows.length = 0;
    calls.rpcCalls.length = 0;
    vi.clearAllMocks();
  });

  it("role 'parent' upserts only into parents with id/display_name/age_verified_at", async () => {
    const { signup } = useSignup();

    signup({
      role: "parent",
      email: "parent@example.com",
      password: "password123",
      parentName: "Jane Doe",
    });

    // mutationFn is async; flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls.fromTables).toEqual(["parents"]);
    expect(calls.upsertRows).toHaveLength(1);
    const { table, rows } = calls.upsertRows[0];
    expect(table).toBe("parents");
    expect(rows[0]).toMatchObject({
      id: "test-id",
      display_name: "Jane Doe",
    });
    expect(typeof rows[0].age_verified_at).toBe("string");
    expect(new Date(rows[0].age_verified_at).toString()).not.toBe(
      "Invalid Date"
    );
  });

  it("role 'parent' never calls from('students') or rpc('promote_placeholder_student')", async () => {
    const { signup } = useSignup();

    signup({
      role: "parent",
      email: "parent@example.com",
      password: "password123",
      parentName: "Jane Doe",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls.fromTables).not.toContain("students");
    expect(calls.rpcCalls).toHaveLength(0);
  });

  it("role 'parent' with no parentName upserts display_name: null", async () => {
    const { signup } = useSignup();

    signup({
      role: "parent",
      email: "parent@example.com",
      password: "password123",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls.upsertRows[0].rows[0].display_name).toBeNull();
  });

  it("role 'teacher' still upserts into teachers with first_name/last_name (unchanged)", async () => {
    const { signup } = useSignup();

    signup({
      role: "teacher",
      email: "teacher@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Smith",
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls.fromTables).toEqual(["teachers"]);
    expect(calls.upsertRows).toHaveLength(1);
    const { table, rows } = calls.upsertRows[0];
    expect(table).toBe("teachers");
    expect(rows[0]).toMatchObject({
      id: "test-id",
      first_name: "Jane",
      last_name: "Smith",
      email: "teacher@example.com",
      is_active: true,
    });
  });
});
