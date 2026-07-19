import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../i18n";
import { RoleSelection } from "./RoleSelection";

// Captures the row handed to Supabase so the tests can assert which table the
// chosen role writes to.
const inserted = vi.hoisted(() => ({ table: null, rows: null }));

vi.mock("../../services/supabase", () => ({
  default: {
    from: (table) => {
      inserted.table = table;
      return {
        insert: (rows) => {
          inserted.rows = rows;
          return {
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: "u1" }, error: null }),
            }),
          };
        },
      };
    },
  },
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const user = {
  id: "u1",
  email: "kid@example.com",
  user_metadata: { full_name: "Noa Levi" },
};

const renderWithClient = (ui) => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
};

describe("RoleSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inserted.table = null;
    inserted.rows = null;
  });

  it("offers both roles", () => {
    renderWithClient(<RoleSelection user={user} />);
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("requires a role before continuing", () => {
    renderWithClient(<RoleSelection user={user} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByText("Student"));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("marks only the chosen card as pressed", () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("Teacher"));

    // Scoped to the form — the language toggle also uses aria-pressed.
    const form = screen
      .getByRole("button", { name: "Continue" })
      .closest("form");
    const pressed = [...form.querySelectorAll('[aria-pressed="true"]')];
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("Teacher");
  });

  it("creates a student profile when student is chosen", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(inserted.table).toBe("students"));
    expect(inserted.rows[0]).toMatchObject({
      id: "u1",
      email: "kid@example.com",
      first_name: "Noa",
    });
  });

  it("creates a teacher profile when teacher is chosen", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("Teacher"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(inserted.table).toBe("teachers"));
    // Teachers keep the surname; the student row deliberately does not set one.
    expect(inserted.rows[0]).toMatchObject({
      id: "u1",
      first_name: "Noa",
      last_name: "Levi",
      is_active: true,
    });
  });

  it("falls back to the email local-part when there is no full name", async () => {
    renderWithClient(<RoleSelection user={{ ...user, user_metadata: {} }} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(inserted.rows).not.toBeNull());
    expect(inserted.rows[0].first_name).toBe("kid");
  });
});
