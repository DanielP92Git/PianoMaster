/**
 * WhoIsPlayingOverlay tests (PROFILE-04, D-01/D-02/D-03/D-07)
 *
 * Verified behaviors:
 *   - Renders one 72px tile per active child + an Add tile; no gate anywhere
 *   - Tapping a sibling calls switchChild(id) then onClose()
 *   - Paused children (is_active: false) are not rendered
 *   - Zero-child state renders the empty heading + Add tile
 *   - Tapping Add navigates to /manage-children?add=1 then onClose()
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../services/apiAvatars", () => ({
  getAvatar: vi.fn(() => Promise.resolve([])),
}));

const switchChildMock = vi.fn();
let mockActiveChildValue = {
  ownedChildren: [],
  activeChildId: null,
  switchChild: switchChildMock,
};

vi.mock("../../contexts/ActiveChildContext", () => ({
  useActiveChild: () => mockActiveChildValue,
}));

import WhoIsPlayingOverlay from "./WhoIsPlayingOverlay";

const renderWithClient = (ui) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
};

describe("WhoIsPlayingOverlay", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    switchChildMock.mockReset();
  });

  it("renders nothing when open is false", () => {
    mockActiveChildValue = {
      ownedChildren: [{ id: "c1", nickname: "Ari", is_active: true }],
      activeChildId: "c1",
      switchChild: switchChildMock,
    };
    const { container } = renderWithClient(
      <WhoIsPlayingOverlay open={false} onClose={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a tile per active child + an Add tile, and no gate element", async () => {
    mockActiveChildValue = {
      ownedChildren: [
        { id: "c1", nickname: "Ari", avatar_id: "a1", is_active: true },
        { id: "c2", nickname: "Noa", avatar_id: "a2", is_active: true },
      ],
      activeChildId: "c1",
      switchChild: switchChildMock,
    };
    renderWithClient(<WhoIsPlayingOverlay open onClose={vi.fn()} />);

    expect(
      await screen.findByRole("button", { name: "Ari" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Noa" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "switcher.addTile" })
    ).toBeInTheDocument();

    // No parent gate rendered anywhere (D-07) — the math-gate submit button never appears.
    expect(screen.queryByText("parentGate.submit")).not.toBeInTheDocument();
  });

  it("does not render a tile for a paused child (is_active: false)", () => {
    mockActiveChildValue = {
      ownedChildren: [
        { id: "c1", nickname: "Ari", avatar_id: "a1", is_active: true },
        { id: "c2", nickname: "Noa", avatar_id: "a2", is_active: false },
      ],
      activeChildId: "c1",
      switchChild: switchChildMock,
    };
    renderWithClient(<WhoIsPlayingOverlay open onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Ari" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Noa" })
    ).not.toBeInTheDocument();
  });

  it("tapping a sibling tile calls switchChild with that id and closes", () => {
    const onClose = vi.fn();
    mockActiveChildValue = {
      ownedChildren: [
        { id: "c1", nickname: "Ari", avatar_id: "a1", is_active: true },
        { id: "c2", nickname: "Noa", avatar_id: "a2", is_active: true },
      ],
      activeChildId: "c1",
      switchChild: switchChildMock,
    };
    renderWithClient(<WhoIsPlayingOverlay open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Noa" }));

    expect(switchChildMock).toHaveBeenCalledWith("c2");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("zero-child state renders the empty heading + Add tile only", () => {
    mockActiveChildValue = {
      ownedChildren: [],
      activeChildId: null,
      switchChild: switchChildMock,
    };
    renderWithClient(<WhoIsPlayingOverlay open onClose={vi.fn()} />);

    expect(screen.getByText("switcher.emptyHeading")).toBeInTheDocument();
    expect(screen.getByText("switcher.emptyBody")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "switcher.addTile" })
    ).toBeInTheDocument();
  });

  it("tapping Add navigates to /manage-children?add=1 and closes", () => {
    const onClose = vi.fn();
    mockActiveChildValue = {
      ownedChildren: [],
      activeChildId: null,
      switchChild: switchChildMock,
    };
    renderWithClient(<WhoIsPlayingOverlay open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "switcher.addTile" }));

    expect(mockNavigate).toHaveBeenCalledWith("/manage-children?add=1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
