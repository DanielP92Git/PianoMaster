import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import LoginForm from "./LoginForm";

const mockLogin = vi.fn();
const mockResetPassword = vi.fn();
const mockResetMutation = vi.fn();
let resetSucceeded = false;

vi.mock("../../features/authentication/useLogin", () => ({
  useLogin: () => ({ login: mockLogin, isPending: false }),
}));

vi.mock("../../features/authentication/useResetPassword", () => ({
  useResetPassword: () => ({
    resetPassword: mockResetPassword,
    isPending: false,
    isSuccess: resetSucceeded,
    reset: mockResetMutation,
  }),
}));

vi.mock("./SocialLogin", () => ({
  SocialLogin: () => <div data-testid="social-login" />,
}));

vi.mock("./SignupForm", () => ({
  default: () => <div data-testid="signup-form" />,
}));

vi.mock("../../utils/pwa", () => ({ lockOrientation: vi.fn() }));

// i18n: return the key so assertions don't depend on copy.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en", dir: () => "ltr" },
  }),
  Trans: ({ i18nKey }) => <span>{i18nKey}</span>,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    resetSucceeded = false;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the login view by default", () => {
    render(<LoginForm />);
    expect(screen.getByText("auth.login.heading")).toBeInTheDocument();
    expect(screen.getByLabelText("auth.login.emailLabel")).toBeInTheDocument();
    expect(screen.getByTestId("social-login")).toBeInTheDocument();
  });

  it("toggles the password field between password and text", () => {
    render(<LoginForm />);
    const password = screen.getByLabelText("auth.login.passwordLabel");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "auth.login.showPassword" })
    );
    expect(password).toHaveAttribute("type", "text");
  });

  it("submits credentials via useLogin", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("auth.login.emailLabel"), {
      target: { value: "kid@example.com" },
    });
    fireEvent.change(screen.getByLabelText("auth.login.passwordLabel"), {
      target: { value: "pianohero" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.login.cta" }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: "kid@example.com",
      password: "pianohero",
    });
  });

  it("switches to the forgot-password view and carries the typed email over", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("auth.login.emailLabel"), {
      target: { value: "kid@example.com" },
    });
    fireEvent.click(screen.getByText("auth.forgotPassword.link"));

    // The heading/body render twice — mobile hero and desktop column — with
    // one of the pair hidden by a `lg:` class that jsdom doesn't apply.
    expect(screen.getAllByText("auth.forgotPassword.body").length).toBe(2);
    expect(screen.getByLabelText("auth.forgotPassword.emailLabel")).toHaveValue(
      "kid@example.com"
    );
  });

  it("returns to login from the forgot-password view", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText("auth.forgotPassword.link"));
    // [0] is the circular back button, [1] the "Back to log in" text link.
    fireEvent.click(
      screen.getAllByRole("button", {
        name: "auth.forgotPassword.backToLogin",
      })[0]
    );

    expect(screen.getByText("auth.login.heading")).toBeInTheDocument();
    expect(mockResetMutation).toHaveBeenCalled();
  });

  it("shows the reset-sent view with a ticking resend countdown", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    resetSucceeded = true;
    render(<LoginForm />);

    expect(
      screen.getByText("auth.forgotPassword.sentTitle")
    ).toBeInTheDocument();
    // Countdown starts at 60 and is rendered through <Trans>.
    expect(
      screen.getByText("auth.forgotPassword.resendIn")
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(
      screen.getByText("auth.forgotPassword.resendIn")
    ).toBeInTheDocument();
  });

  it("opens the signup wizard from the create-account link", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByText("auth.login.createAccount"));
    expect(screen.getByTestId("signup-form")).toBeInTheDocument();
  });
});
