import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../i18n";
import SignupForm from "./SignupForm";

// Mock useSignup hook
vi.mock("../../features/authentication/useSignup", () => ({
  useSignup: () => ({ signup: vi.fn(), isPending: false }),
}));

// Mock SocialLogin — renders role prop as text so tests can assert it
vi.mock("./SocialLogin", () => ({
  SocialLogin: ({ role }) => <div data-testid="social-login">{role}</div>,
}));

// Mock AgeGate — renders buttons to drive wizard through the age step.
// Back navigation is owned by the shell, so these mocks expose no back button.
vi.mock("./AgeGate", () => ({
  AgeGate: (props) => (
    <div data-testid="age-gate">
      <button onClick={() => props.onSubmit(2016)}>Select year</button>
      <button onClick={() => props.onSubmit(2010)}>Select year 13+</button>
    </div>
  ),
}));

// Mock ParentEmailStep — renders buttons to drive wizard through the parent email step
vi.mock("./ParentEmailStep", () => ({
  ParentEmailStep: (props) => (
    <div data-testid="parent-email-step">
      <button onClick={() => props.onSubmit("parent@test.com")}>
        Submit email
      </button>
      <button onClick={() => props.onSkip && props.onSkip()}>Skip email</button>
    </div>
  ),
}));

// Mock react-router-dom
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

  // Step 1: Role selection is the initial step (D-01, D-02, D-03)
  it("renders role selection as the first step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
  });

  it("requires a role before continuing", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByText("Student"));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("back from role selection returns to login", () => {
    const onBackToLogin = vi.fn();
    render(<SignupForm onBackToLogin={onBackToLogin} />);
    clickBack();
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it("student role selection navigates to birth year step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  it("teacher role selection navigates directly to credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
  });

  // Age branching (D-02, D-07)
  it("birth year under-13 navigates to parent email step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    fireEvent.click(screen.getByText("Select year")); // 2016 (under 13)
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
  });

  it("birth year 13+ skips parent email and goes to credentials", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    fireEvent.click(screen.getByText("Select year 13+")); // 2010 (13+)
    expect(screen.queryByTestId("parent-email-step")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
  });

  // Back navigation (D-04)
  it("back from birth-year returns to role selection", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
    clickBack();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
  });

  it("back from parent-email returns to birth-year", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    fireEvent.click(screen.getByText("Select year")); // under 13
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
    clickBack();
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  it("back from credentials (teacher) returns to role", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    clickBack();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("back from credentials (under-13 student) returns to parent-email", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    fireEvent.click(screen.getByText("Select year")); // under 13
    fireEvent.click(screen.getByText("Submit email"));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    clickBack();
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
  });

  it("back from credentials (13+ student) returns to birth-year", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Student");
    fireEvent.click(screen.getByText("Select year 13+"));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    clickBack();
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  // Google OAuth (D-08, D-09)
  it("SocialLogin receives role prop on credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    chooseRole("Teacher");
    const socialLogin = screen.getByTestId("social-login");
    expect(socialLogin.textContent).toBe("teacher");
  });
});
