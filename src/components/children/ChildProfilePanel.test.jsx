import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../i18n";
import ChildProfilePanel from "./ChildProfilePanel";

const ACTIVE_CHILD = {
  id: "child-1",
  nickname: "Star",
  avatar_id: "avatar-1",
  is_active: true,
};
const PAUSED_CHILD = { ...ACTIVE_CHILD, id: "child-2", is_active: false };

vi.mock("../../features/authentication/useUser", () => ({
  useUser: () => ({ user: { id: "parent-1" } }),
}));

// ChildProfileForm has its own dedicated test file — stub it here so this
// file stays focused on the Data & Privacy section.
vi.mock("./ChildProfileForm", () => ({
  default: () => <div data-testid="child-profile-form" />,
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const setChildActiveMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ id: "child-1", is_active: false }))
);
vi.mock("../../services/apiChildProfiles", () => ({
  setChildActive: setChildActiveMock,
}));

const exportStudentDataMock = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      exportMetadata: { exportDate: "2026-08-04" },
      students: { description: "Profile info", recordCount: 1, data: [] },
    })
  )
);
const downloadStudentDataJSONMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve("blob:mock-url"))
);
vi.mock("../../services/dataExportService", () => ({
  exportStudentData: exportStudentDataMock,
  downloadStudentDataJSON: downloadStudentDataJSONMock,
}));

const deleteChildProfileMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ success: true }))
);
const signOutMock = vi.hoisted(() => vi.fn());
vi.mock("../../services/accountDeletionService", () => ({
  deleteChildProfile: deleteChildProfileMock,
}));
vi.mock("../../services/supabase", () => ({
  default: { auth: { signOut: signOutMock } },
}));

const renderPanel = (child, onBack = vi.fn()) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    onBack,
    ...render(
      <QueryClientProvider client={client}>
        <ChildProfilePanel child={child} onBack={onBack} />
      </QueryClientProvider>
    ),
  };
};

beforeEach(() => {
  setChildActiveMock.mockClear();
  exportStudentDataMock.mockClear();
  downloadStudentDataJSONMock.mockClear();
  deleteChildProfileMock.mockClear();
  signOutMock.mockClear();
  global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = vi.fn();
});

describe("ChildProfilePanel — Profile + Data & Privacy", () => {
  it("renders both section headers", () => {
    renderPanel(ACTIVE_CHILD);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Data & Privacy")).toBeInTheDocument();
  });

  it("renders the Profile section via ChildProfileForm", () => {
    renderPanel(ACTIVE_CHILD);
    expect(screen.getByTestId("child-profile-form")).toBeInTheDocument();
  });

  it("Delete is rendered below/after Review, Download, and Pause", () => {
    renderPanel(ACTIVE_CHILD);
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    const reviewIdx = buttons.findIndex((t) => t.includes("Review Data"));
    const downloadIdx = buttons.findIndex((t) =>
      t.includes("Download My Child's Data")
    );
    const pauseIdx = buttons.findIndex((t) => t.includes("Pause Profile"));
    const deleteIdx = buttons.findIndex((t) => t.includes("Delete Profile"));
    expect(deleteIdx).toBeGreaterThan(reviewIdx);
    expect(deleteIdx).toBeGreaterThan(downloadIdx);
    expect(deleteIdx).toBeGreaterThan(pauseIdx);
  });

  it("Download calls downloadStudentDataJSON(childId)", async () => {
    renderPanel(ACTIVE_CHILD);
    fireEvent.click(
      screen.getByRole("button", { name: /Download My Child's Data/ })
    );
    await waitFor(() =>
      expect(downloadStudentDataJSONMock).toHaveBeenCalledWith("child-1")
    );
  });

  it("Review calls exportStudentData(childId) and renders a summary", async () => {
    renderPanel(ACTIVE_CHILD);
    fireEvent.click(screen.getByRole("button", { name: /Review Data/ }));
    await waitFor(() =>
      expect(exportStudentDataMock).toHaveBeenCalledWith("child-1")
    );
    expect(await screen.findByText("Profile info")).toBeInTheDocument();
  });

  it("Pause confirm calls setChildActive(childId, false)", async () => {
    renderPanel(ACTIVE_CHILD);
    fireEvent.click(screen.getByRole("button", { name: /Pause Profile/ }));

    // Inline amber confirm block appears with a second Pause Profile button
    const confirmButtons = screen.getAllByRole("button", {
      name: /Pause Profile/,
    });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(setChildActiveMock).toHaveBeenCalledWith("child-1", false)
    );
  });

  it("a paused child shows Turn Back On, calling setChildActive(childId, true)", async () => {
    renderPanel(PAUSED_CHILD);
    expect(
      screen.getByRole("button", { name: /Turn Back On/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Pause Profile/ })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Turn Back On/ }));
    await waitFor(() =>
      expect(setChildActiveMock).toHaveBeenCalledWith("child-2", true)
    );
  });

  it("Pause uses amber classes, Delete uses red classes", () => {
    renderPanel(ACTIVE_CHILD);
    const pauseButton = screen.getByRole("button", { name: /Pause Profile/ });
    const deleteButton = screen.getByRole("button", {
      name: /Delete Profile/,
    });
    expect(pauseButton.className).toMatch(/amber-/);
    expect(deleteButton.className).toMatch(/red-/);
  });
});

describe("ChildProfilePanel — Delete (DeleteChildModal wiring, D-12)", () => {
  it("opens DeleteChildModal with 'Delete Forever' disabled until the nickname matches (case-insensitive)", () => {
    renderPanel(ACTIVE_CHILD);
    fireEvent.click(screen.getByRole("button", { name: /Delete Profile/ }));

    const submitButton = screen.getByRole("button", {
      name: "Delete Forever",
    });
    expect(submitButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Star");
    fireEvent.change(input, { target: { value: "wrong" } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "sTaR" } });
    expect(submitButton).not.toBeDisabled();
  });

  it("a matching entry calls deleteChildProfile(childId, typed) and does NOT sign out", async () => {
    const onBack = vi.fn();
    renderPanel(ACTIVE_CHILD, onBack);
    fireEvent.click(screen.getByRole("button", { name: /Delete Profile/ }));

    const input = screen.getByPlaceholderText("Star");
    fireEvent.change(input, { target: { value: "Star" } });

    fireEvent.click(screen.getByRole("button", { name: "Delete Forever" }));

    await waitFor(() =>
      expect(deleteChildProfileMock).toHaveBeenCalledWith("child-1", "Star")
    );
    expect(signOutMock).not.toHaveBeenCalled();
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });
});
