/**
 * App.test.jsx — NAV-03 routing test
 *
 * Verifies that the index route (/) renders TrailMapPage for non-teacher users
 * and that teachers are redirected to /teacher.
 *
 * Uses a minimal rendering approach: tests TeacherRedirect in isolation
 * by mocking useUser and rendering within a MemoryRouter.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";

// Mock supabase before anything else to prevent env var errors
vi.mock("../services/supabase", () => ({
  default: {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
  },
}));

// Mock useUser
vi.mock("../features/authentication/useUser", () => ({
  useUser: vi.fn(),
}));

// Mock the heavy page components to keep tests fast
vi.mock("../pages/TrailMapPage", () => ({
  default: () => <div data-testid="trail-map-page">TrailMapPage</div>,
}));

vi.mock("../components/layout/Dashboard", () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));

// Import after mocks are set up
import { useUser } from "../features/authentication/useUser";
import { TeacherRedirect } from "../App";

describe("TeacherRedirect (NAV-03)", () => {
  it("NAV-03: renders TrailMapPage for non-teacher (student) users at /", async () => {
    useUser.mockReturnValue({
      isTeacher: false,
      isStudent: true,
      user: { id: "test-student" },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route index element={<TeacherRedirect />} />
            <Route
              path="/teacher"
              element={<div data-testid="teacher-dashboard">Teacher</div>}
            />
          </Routes>
        </Suspense>
      </MemoryRouter>,
    );

    // TrailMapPage is lazy-loaded, so wait for it to resolve
    const trailPage = await screen.findByTestId("trail-map-page");
    expect(trailPage).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    expect(screen.queryByTestId("teacher-dashboard")).not.toBeInTheDocument();
  });

  it("NAV-03: redirects teachers to /teacher", () => {
    useUser.mockReturnValue({
      isTeacher: true,
      isStudent: false,
      user: { id: "test-teacher" },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route index element={<TeacherRedirect />} />
            <Route
              path="/teacher"
              element={<div data-testid="teacher-dashboard">Teacher</div>}
            />
          </Routes>
        </Suspense>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("teacher-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("trail-map-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });
});
