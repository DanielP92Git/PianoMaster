import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../i18n";
import ChildProfileForm from "./ChildProfileForm";

const AVATARS = [
  { id: "avatar-1", name: "Star", image_url: "/avatars/star.png" },
  { id: "avatar-2", name: "Moon", image_url: "/avatars/moon.png" },
];

vi.mock("../../services/apiAvatars", () => ({
  getAvatar: vi.fn(() => Promise.resolve(AVATARS)),
}));

const createChildProfileMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ id: "child-1", nickname: "Star" }))
);
const renameChildProfileMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ id: "child-1" }))
);
const updateChildAvatarMock = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ id: "child-1" }))
);

vi.mock("../../services/apiChildProfiles", () => ({
  createChildProfile: createChildProfileMock,
  renameChildProfile: renameChildProfileMock,
  updateChildAvatar: updateChildAvatarMock,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const renderWithClient = (ui) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
};

describe("ChildProfileForm", () => {
  beforeEach(() => {
    createChildProfileMock.mockClear();
    renameChildProfileMock.mockClear();
    updateChildAvatarMock.mockClear();
  });

  it("always renders the nickname helper text", async () => {
    renderWithClient(<ChildProfileForm onSaved={vi.fn()} />);
    expect(
      await screen.findByText(
        "Use a first name or nickname — please don't use your child's full name."
      )
    ).toBeInTheDocument();
  });

  it("shows the non-blocking full-name warning but keeps submit enabled once a nickname and avatar are set", async () => {
    renderWithClient(<ChildProfileForm onSaved={vi.fn()} />);

    // Wait for the avatar grid to load, then select a tile.
    const group = await screen.findByRole("group", { name: "avatar-picker" });
    const tiles = within(group).getAllByRole("button");
    fireEvent.click(tiles[0]);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Jane Smith" } });

    expect(
      await screen.findByText(
        "That looks like it might be a full name. You can still save — a nickname just keeps things more private."
      )
    ).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: "Create Profile" });
    expect(submitButton).not.toBeDisabled();
  });

  it("selecting an avatar tile marks it selected (aria-pressed)", async () => {
    renderWithClient(<ChildProfileForm onSaved={vi.fn()} />);
    const group = await screen.findByRole("group", { name: "avatar-picker" });
    const tiles = within(group).getAllByRole("button");
    expect(tiles[0]).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(tiles[0]);
    expect(tiles[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("create mode: submit calls createChildProfile with nickname and avatarId", async () => {
    const onSaved = vi.fn();
    renderWithClient(<ChildProfileForm onSaved={onSaved} />);

    const group = await screen.findByRole("group", { name: "avatar-picker" });
    const tiles = within(group).getAllByRole("button");
    fireEvent.click(tiles[1]);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Star" } });

    const submitButton = screen.getByRole("button", { name: "Create Profile" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createChildProfileMock).toHaveBeenCalledWith({
        nickname: "Star",
        avatarId: "avatar-2",
      });
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("edit mode: submit calls renameChildProfile + updateChildAvatar", async () => {
    const onSaved = vi.fn();
    renderWithClient(
      <ChildProfileForm
        childId="child-1"
        initialNickname="Star"
        initialAvatarId="avatar-1"
        onSaved={onSaved}
      />
    );

    const submitButton = await screen.findByRole("button", {
      name: "Update Profile",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(renameChildProfileMock).toHaveBeenCalledWith("child-1", "Star");
    });
    await waitFor(() => {
      expect(updateChildAvatarMock).toHaveBeenCalledWith("child-1", "avatar-1");
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("renders no file input anywhere in the DOM (PROFILE-02)", async () => {
    const { container } = renderWithClient(
      <ChildProfileForm onSaved={vi.fn()} />
    );
    await screen.findByRole("group", { name: "avatar-picker" });
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });
});
