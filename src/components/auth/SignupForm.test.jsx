import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SignupForm from "./SignupForm";

// Mock useSignup hook
vi.mock("../../features/authentication/useSignup", () => ({
  useSignup: () => ({ signup: vi.fn(), isPending: false }),
}));

// Mock SocialLogin — renders role prop as text so tests can assert it
vi.mock("./SocialLogin", () => ({
  SocialLogin: ({ role }) => (
    <div data-testid="social-login">{role}</div>
  ),
}));

// Mock AgeGate — renders buttons to drive wizard through the age step
vi.mock("./AgeGate", () => ({
  AgeGate: (props) => (
    <div data-testid="age-gate">
      <button onClick={() => props.onSubmit(2016)}>Select year</button>
      <button onClick={() => props.onSubmit(2010)}>Select year 13+</button>
      <button onClick={() => props.onBack()}>Back from age</button>
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
      <button onClick={() => props.onBack()}>Back from email</button>
    </div>
  ),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

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

  it("student role selection navigates to birth year step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  it("teacher role selection navigates directly to credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Teacher"));
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
  });

  // Age branching (D-02, D-07)
  it("birth year under-13 navigates to parent email step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Select year")); // 2016 (under 13)
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
  });

  it("birth year 13+ skips parent email and goes to credentials", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Select year 13+")); // 2010 (13+)
    expect(screen.queryByTestId("parent-email-step")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
  });

  // Back navigation (D-04)
  it("back from birth-year returns to role selection", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back from age"));
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.queryByTestId("age-gate")).not.toBeInTheDocument();
  });

  it("back from parent-email returns to birth-year", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Select year")); // under 13
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back from email"));
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  it("back from credentials (teacher) returns to role", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Teacher"));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("back from credentials (under-13 student) returns to parent-email", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Select year")); // under 13
    fireEvent.click(screen.getByText("Submit email"));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("parent-email-step")).toBeInTheDocument();
  });

  it("back from credentials (13+ student) returns to birth-year", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Student"));
    fireEvent.click(screen.getByText("Select year 13+"));
    expect(screen.getByPlaceholderText("First name")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  // Google OAuth (D-08, D-09)
  it("SocialLogin receives role prop on credentials step", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    fireEvent.click(screen.getByText("Teacher"));
    const socialLogin = screen.getByTestId("social-login");
    expect(socialLogin.textContent).toBe("teacher");
  });
});
