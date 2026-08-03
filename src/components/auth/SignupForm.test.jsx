import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../i18n";
import SignupForm from "./SignupForm";

// Captures the signup mutation so tests can assert it was (or wasn't) called
// — e.g. the under-18 dead-end must create no account (D-10/SIGNUP-02).
const signupSpy = vi.hoisted(() => vi.fn());

// Mock useSignup hook
vi.mock("../../features/authentication/useSignup", () => ({
  useSignup: () => ({ signup: signupSpy, isPending: false }),
}));

// Mock SocialLogin — renders role prop as text so tests can assert it
vi.mock("./SocialLogin", () => ({
  SocialLogin: ({ role }) => <div data-testid="social-login">{role}</div>,
}));

// Mock AgeGate — renders buttons to drive the wizard through the dob-gate
// step, exercising both the 18+ and under-18 branches (D-01, D-10).
// Back navigation is owned by the shell, so this mock exposes no back button.
vi.mock("./AgeGate", () => ({
  AgeGate: (props) => (
    <div data-testid="age-gate">
      <button onClick={() => props.onSubmit({ month: 6, day: 1, year: 2000 })}>
        Submit 18+ DOB
      </button>
      <button onClick={() => props.onUnder18()}>Submit under-18 DOB</button>
    </div>
  ),
}));

// Mock AgeBlockScreen — renders the friendly under-18 dead-end with its two
// ghost actions (D-10).
vi.mock("./AgeBlockScreen", () => ({
  AgeBlockScreen: (props) => (
    <div data-testid="age-block">
      <p>PianoMaster accounts are for parents &amp; guardians</p>
      <button onClick={() => props.onTryAgain()}>Try a different date</button>
      <button onClick={() => props.onBackToLogin()}>Back to login</button>
    </div>
  ),
}));

// Mock react-router-dom (defensive — nothing in this tree calls it directly
// once useSignup/SocialLogin are mocked, but keeps the test hermetic)
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// The role step is select-then-confirm (design screen 5), so advancing past it
// takes two clicks.
const chooseRole = (label) => {
  fireEvent.click(screen.getByText(label));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
};

// The single back affordance lives in the shell and is icon-only.
const clickBack = () =>
  fireEvent.click(screen.getByRole("button", { name: "Back" }));

describe("SignupForm Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Step 1: Role selection is the initial step (D-01, D-02)
  it("renders role selection as the first step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    expect(screen.getByText("I'm a parent")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
  });

  it("requires a role before continuing", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByText("I'm a parent"));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("back from role selection returns to login", () => {
    const onBackToLogin = vi.fn();
    render(<SignupForm onBackToLogin={onBackToLogin} />);
    clickBack();
    expect(onBackToLogin).toHaveBeenCalled();
  });

  // D-12/SIGNUP-05: a direct Privacy Policy link on the registration entry screen
  it("shows a Privacy Policy link on the role-entry screen", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  // D-01: the dob-gate sits between role and credentials on BOTH branches so
  // a minor cannot pick Teacher to dodge the age gate (T-03-17)
  it("parent role selection navigates to the dob-gate step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  it("teacher role selection also navigates to the dob-gate step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("First name")).not.toBeInTheDocument();
  });

  // Under-18 dead-end (D-10, SIGNUP-02)
  it("an under-18 DOB shows the age-block screen and creates no account", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit under-18 DOB"));

    expect(screen.getByTestId("age-block")).toBeInTheDocument();
    expect(
      screen.getByText("PianoMaster accounts are for parents & guardians")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
    expect(signupSpy).not.toHaveBeenCalled();
  });

  it("'Try a different date' from the age-block screen returns to the dob-gate step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit under-18 DOB"));
    expect(screen.getByTestId("age-block")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Try a different date"));
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("age-block")).not.toBeInTheDocument();
    expect(signupSpy).not.toHaveBeenCalled();
  });

  it("an 18+ DOB advances from the dob-gate to the credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  // Back navigation
  it("back from dob-gate returns to role selection", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
    clickBack();
    expect(screen.getByText("I'm a parent")).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
  });

  it("back from credentials returns to the dob-gate step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    clickBack();
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  // Parent-only credentials, no child data (D-04, SIGNUP-04)
  it("the parent credentials step renders only an optional parent-name field, no child name fields", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));

    expect(screen.getByText("Your name (optional)")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("First name")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Last name")).not.toBeInTheDocument();
  });

  it("the teacher credentials step still renders first/last name fields", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));

    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last name")).toBeInTheDocument();
    expect(screen.queryByText("Your name (optional)")).not.toBeInTheDocument();
  });

  it("submits the parent branch with role and optional parentName, no birthYear/parentEmail", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("I'm a parent");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "parent@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create My Account" }));

    expect(signupSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "parent@test.com",
        password: "password123",
        role: "parent",
        firstName: null,
        lastName: null,
      })
    );
  });

  // Google OAuth
  it("SocialLogin receives role prop on credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    fireEvent.click(screen.getByText("Submit 18+ DOB"));
    const socialLogin = screen.getByTestId("social-login");
    expect(socialLogin.textContent).toBe("teacher");
  });
});
