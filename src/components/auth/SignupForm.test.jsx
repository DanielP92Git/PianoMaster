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

  // One real test — confirms file runs and component renders initial step
  it("renders the initial step without crashing", () => {
    render(<SignupForm onBackToLogin={vi.fn()} />);
    // Current component starts at 'age' step — AgeGate is rendered
    expect(screen.getByTestId("age-gate")).toBeInTheDocument();
  });

  // Step navigation stubs (D-01, D-02, D-03) — for redesigned wizard
  it.todo("renders role selection as the first step");
  it.todo("student role selection navigates to birth year step");
  it.todo("teacher role selection navigates directly to credentials step");

  // Age branching stubs (D-02, D-07)
  it.todo("birth year under-13 navigates to parent email step");
  it.todo("birth year 13+ skips parent email and goes to credentials");

  // Back navigation stubs (D-04)
  it.todo("back from birth-year returns to role selection");
  it.todo("back from parent-email returns to birth-year");
  it.todo("back from credentials (teacher) returns to role");
  it.todo("back from credentials (under-13 student) returns to parent-email");
  it.todo("back from credentials (13+ student) returns to birth-year");

  // Step dots stubs (D-01)
  it.todo("step dots show 4 dots for student path");
  it.todo("step dots show 2 dots for teacher path");

  // Google OAuth stubs (D-08, D-09)
  it.todo("SocialLogin receives role prop on credentials step");
});
