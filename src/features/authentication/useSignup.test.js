import { describe, it, vi } from "vitest";

// Mock supabase client
vi.mock("../../services/supabase", () => ({
  default: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: "test-id" } }, error: null }),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(({ mutationFn, onSuccess, onError }) => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

describe("useSignup", () => {
  // Post Plan-01 behavior stubs (D-13)
  it.todo("sets account_status to 'active' regardless of age");
  it.todo("accepts birthYear integer parameter instead of dateOfBirth");
  it.todo("does NOT call sendParentalConsentEmail");
  it.todo("stores date_of_birth as YYYY-01-01 format from birthYear");
});
