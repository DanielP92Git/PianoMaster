/**
 * ParentGateProtectedRoute.test.jsx — MANDATORY COPPA-01/02 gate-bypass acceptance test.
 *
 * Falsifiable proof that:
 *   (1) COPPA-01: an unsolved gate blocks gated content and shows ParentGateMath.
 *   (2) COPPA-02 direct-URL: a fresh mount with no prior pass shows the gate — no
 *       cached bypass via direct URL / back-forward re-entry (Pitfall 11).
 *   (3) COPPA-02 no-linger via blur: solving the gate then backgrounding the app
 *       (trigger 3) closes the shared window, so a remount re-prompts.
 *   (4) COPPA-02 no-linger via a REAL route transition: solving the gate then
 *       navigating to a child-surface route (trigger 4 — an ACTUAL MemoryRouter
 *       navigation, not a manual closeGate() call) closes the shared window, so
 *       navigating back to the gated route re-prompts — the pass never lingers
 *       for the next person on a shared device (D-05/D-06, COPPA-02).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";

// ─── Mock: react-i18next ─────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en", dir: () => "ltr" },
  }),
}));

// ─── Mock: ActiveChildContext — stable activeChildId, not under test here ────
vi.mock("../../contexts/ActiveChildContext", () => ({
  useActiveChild: () => ({ activeChildId: "child-1" }),
}));

// ─── Mock: ParentGateMath — lightweight stub with Consent/Cancel buttons ─────
vi.mock("../settings/ParentGateMath", () => ({
  ParentGateMath: ({ onConsent, onCancel }) => (
    <div data-testid="parent-gate">
      <button data-testid="gate-consent" onClick={onConsent}>
        Consent
      </button>
      <button data-testid="gate-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

import { ParentGateProvider } from "../../contexts/ParentGateContext";
import ParentGateProtectedRoute from "./ParentGateProtectedRoute";

function GatedRouteContent() {
  return (
    <div>
      <div data-testid="gated-content">Secret parent content</div>
      <Link to="/trail" data-testid="go-to-child">
        Go to child surface
      </Link>
    </div>
  );
}

function ChildSurfaceContent() {
  return (
    <div>
      <div data-testid="child-surface">Trail</div>
      <Link to="/parent-portal" data-testid="go-to-gated">
        Go to gated
      </Link>
    </div>
  );
}

function AppTree({ routeKey }) {
  return (
    <MemoryRouter initialEntries={["/parent-portal"]}>
      <ParentGateProvider>
        <Routes>
          <Route
            path="/parent-portal"
            element={
              <ParentGateProtectedRoute key={routeKey}>
                <GatedRouteContent />
              </ParentGateProtectedRoute>
            }
          />
          {/* A representative child-surface route from CHILD_SURFACE_ROUTES */}
          <Route path="/trail" element={<ChildSurfaceContent />} />
        </Routes>
      </ParentGateProvider>
    </MemoryRouter>
  );
}

describe("ParentGateProtectedRoute — COPPA-01/02", () => {
  it("COPPA-01: renders ParentGateMath when not passed, hides gated children", () => {
    render(<AppTree />);

    expect(screen.getByTestId("parent-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("COPPA-01: renders gated children once the gate is passed", () => {
    render(<AppTree />);

    fireEvent.click(screen.getByTestId("gate-consent"));

    expect(screen.getByTestId("gated-content")).toBeInTheDocument();
    expect(screen.queryByTestId("parent-gate")).not.toBeInTheDocument();
  });

  it("COPPA-02 direct-URL: a fresh mount with no prior pass shows the gate (no bypass)", () => {
    // Simulates typing a URL / hitting back-forward straight into the gated
    // route with no open gate window — `passed` defaults false on a fresh
    // ParentGateProvider, so the wrapper must never render children.
    render(<AppTree />);

    expect(screen.getByTestId("parent-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("COPPA-02 no-linger via blur: pass, then blur closes the shared window so a remount re-prompts", () => {
    const { rerender } = render(<AppTree routeKey="mount-1" />);

    fireEvent.click(screen.getByTestId("gate-consent"));
    expect(screen.getByTestId("gated-content")).toBeInTheDocument();

    // trigger 3 (app backgrounded/blurred) — a real event dispatch through the
    // window, not a manual closeGate() call.
    fireEvent(window, new Event("blur"));

    // Force the route wrapper to remount (simulating a fresh mount / a
    // back-forward re-entry) while the SAME ParentGateProvider instance keeps
    // its (now closed) gate state — proves the pass did not persist.
    rerender(<AppTree routeKey="mount-2" />);

    expect(screen.getByTestId("parent-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("COPPA-02 no-linger via a REAL route transition: navigating to a child surface (/trail) then back re-prompts", () => {
    render(<AppTree />);

    // Solve the gate on the gated route.
    fireEvent.click(screen.getByTestId("gate-consent"));
    expect(screen.getByTestId("gated-content")).toBeInTheDocument();

    // Drive an ACTUAL MemoryRouter navigation to a child-surface route — NOT a
    // manual closeGate() call. This exercises the route-change listener
    // (Task 1, trigger 4) against a real location change.
    fireEvent.click(screen.getByTestId("go-to-child"));
    expect(screen.getByTestId("child-surface")).toBeInTheDocument();

    // Navigate back to the gated route.
    fireEvent.click(screen.getByTestId("go-to-gated"));

    // The shared window closed when the parent returned to a child surface —
    // the pass never lingers for the next person on the device (COPPA-02).
    expect(screen.getByTestId("parent-gate")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("gate cancel navigates back (-1) instead of revealing gated content", () => {
    // Wrap with a route history that has a prior entry so navigate(-1) is
    // observable via the previous page's content re-appearing.
    render(
      <MemoryRouter
        initialEntries={["/dashboard", "/parent-portal"]}
        initialIndex={1}
      >
        <ParentGateProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={<div data-testid="dashboard" />}
            />
            <Route
              path="/parent-portal"
              element={
                <ParentGateProtectedRoute>
                  <GatedRouteContent />
                </ParentGateProtectedRoute>
              }
            />
          </Routes>
        </ParentGateProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("gate-cancel"));

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });
});
