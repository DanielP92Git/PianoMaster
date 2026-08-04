import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../i18n";
import ManageChildrenScreen from "./ManageChildrenScreen";

const CHILDREN = [
  { id: "child-1", nickname: "Star", avatar_id: "avatar-1", is_active: true },
  {
    id: "child-2",
    nickname: "Moon",
    avatar_id: "avatar-2",
    is_active: false,
  },
];

const useChildProfilesMock = vi.hoisted(() =>
  vi.fn(() => ({ data: CHILDREN, isLoading: false }))
);
vi.mock("../../hooks/useChildProfiles", () => ({
  useChildProfiles: useChildProfilesMock,
}));

const switchChildMock = vi.hoisted(() => vi.fn());
vi.mock("../../contexts/ActiveChildContext", () => ({
  useActiveChild: () => ({ switchChild: switchChildMock }),
}));

vi.mock("../../services/apiAvatars", () => ({
  getAvatar: vi.fn(() =>
    Promise.resolve([
      { id: "avatar-1", name: "Star", image_url: "/avatars/star.png" },
      { id: "avatar-2", name: "Moon", image_url: "/avatars/moon.png" },
    ])
  ),
}));

// Panel/form are covered by their own test files — stub here so this file
// stays focused on ManageChildrenScreen's list/drill-in/create-entry logic.
vi.mock("./ChildProfilePanel", () => ({
  default: ({ child, onBack }) => (
    <div data-testid="child-panel">
      <span>{child.nickname}</span>
      <button onClick={onBack}>panel-back</button>
    </div>
  ),
}));
vi.mock("./ChildProfileForm", () => ({
  default: ({ onSaved }) => (
    <div data-testid="child-create-form">
      <button onClick={() => onSaved({ id: "new-child" })}>
        create-submit
      </button>
    </div>
  ),
}));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderScreen = (initialEntries = ["/manage-children"]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <ManageChildrenScreen />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("ManageChildrenScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    switchChildMock.mockClear();
  });

  it("renders the page title", () => {
    renderScreen();
    expect(screen.getByText("Manage Children")).toBeInTheDocument();
  });

  it("lists all children with correct status pills, including a Paused badge", () => {
    renderScreen();
    expect(screen.getByText("Star")).toBeInTheDocument();
    expect(screen.getByText("Moon")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("clicking a row shows the per-child panel", () => {
    renderScreen();
    fireEvent.click(screen.getByText("Star").closest("button"));
    expect(screen.getByTestId("child-panel")).toBeInTheDocument();
    expect(screen.queryByText("Moon")).not.toBeInTheDocument();
  });

  it("panel onBack returns to the list", () => {
    renderScreen();
    fireEvent.click(screen.getByText("Star").closest("button"));
    fireEvent.click(screen.getByText("panel-back"));
    expect(screen.queryByTestId("child-panel")).not.toBeInTheDocument();
    expect(screen.getByText("Star")).toBeInTheDocument();
  });

  it("?add=1 renders the create form instead of the list", () => {
    renderScreen(["/manage-children?add=1"]);
    expect(screen.getByTestId("child-create-form")).toBeInTheDocument();
    expect(screen.queryByText("Star")).not.toBeInTheDocument();
  });

  it("create onSaved auto-switches into the new child and navigates to the dashboard (D-15)", () => {
    renderScreen(["/manage-children?add=1"]);
    fireEvent.click(screen.getByText("create-submit"));
    expect(switchChildMock).toHaveBeenCalledWith("new-child");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
