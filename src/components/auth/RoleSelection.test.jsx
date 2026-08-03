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

const logoutMock = vi.hoisted(() => vi.fn());
vi.mock("../../services/apiAuth", () => ({
  logout: logoutMock,
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

/**
 * Computes DOB parts for someone who is exactly `years` old today
 * (birthday already occurred this year), so isUnder18's month/day
 * comparison is deterministic regardless of when the test runs.
 */
function dobPartsForAge(years) {
  const today = new Date();
  return {
    month: today.getMonth() + 1, // Date months are 0-indexed; DOB parts are 1-12
    day: today.getDate(),
    year: today.getFullYear() - years,
  };
}

function fillDob(dob) {
  fireEvent.change(screen.getByLabelText("Month"), {
    target: { value: String(dob.month) },
  });
  fireEvent.change(screen.getByLabelText("Day"), {
    target: { value: String(dob.day) },
  });
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: String(dob.year) },
  });
}

describe("RoleSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inserted.table = null;
    inserted.rows = null;
  });

  it("offers both roles on the role step", () => {
    renderWithClient(<RoleSelection user={user} />);
    expect(screen.getByText("I'm a parent")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("requires a role before continuing to the DOB step", () => {
    renderWithClient(<RoleSelection user={user} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByText("I'm a parent"));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("a role click alone inserts nothing (insert is gated behind the DOB step)", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("I'm a parent"));

    // No DOB step reached yet — the DOB fields shouldn't even be on screen.
    expect(screen.queryByLabelText("Month")).not.toBeInTheDocument();
    expect(inserted.table).toBeNull();
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("advancing to the DOB step alone (before submitting) inserts nothing", () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("I'm a parent"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Now on the DOB step.
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(inserted.table).toBeNull();
  });

  it("selecting parent then submitting a valid 18+ DOB inserts into parents with age_verified_at", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("I'm a parent"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fillDob(dobPartsForAge(30));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(inserted.table).toBe("parents"));
    expect(inserted.rows[0]).toMatchObject({
      id: "u1",
      display_name: "Noa",
    });
    expect(inserted.rows[0].age_verified_at).toEqual(expect.any(String));
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("selecting teacher then submitting a valid 18+ DOB inserts into teachers", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("Teacher"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fillDob(dobPartsForAge(30));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(inserted.table).toBe("teachers"));
    expect(inserted.rows[0]).toMatchObject({
      id: "u1",
      first_name: "Noa",
      last_name: "Levi",
      is_active: true,
    });
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("submitting an under-18 DOB signs out once and inserts nothing", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("I'm a parent"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fillDob(dobPartsForAge(17));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(inserted.table).toBeNull();

    // Renders the AgeBlockScreen copy, not a Supabase-inserting form.
    expect(
      screen.getByText("PianoMaster accounts are for parents & guardians")
    ).toBeInTheDocument();
  });

  it("an under-18 teacher branch also signs out and inserts nothing", async () => {
    renderWithClient(<RoleSelection user={user} />);
    fireEvent.click(screen.getByText("Teacher"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    fillDob(dobPartsForAge(15));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(inserted.table).toBeNull();
  });
});
