/**
 * Render coverage for the two PUBLIC legal pages.
 *
 * Both assertions here guard fixes that are easy to regress silently:
 *
 * 1. Third-party disclosure — the privacy policy previously claimed the app used
 *    no third-party analytics trackers while loading Umami on every page and
 *    running Sentry in production. A published privacy policy asserting
 *    something untrue is a distinct legal exposure from any missing feature, so
 *    the vendor list is pinned here rather than left to manual review.
 *
 * 2. Cross-link routing — both pages used to link into /legal, which is an
 *    auth-gated attributions hub, not the terms. A logged-out visitor reading
 *    the privacy policy and clicking through got bounced to login. Since these
 *    pages are public by design, the public -> public path is pinned too.
 *    jsdom cannot catch a bad route by rendering; only the href assertion does.
 *
 * 3. The back control — same defect class as (2), on the other link of the same
 *    pages, and missed on the first pass. It pointed at /settings, which is
 *    inside the ProtectedRoute block. Nothing here may link into an auth-gated
 *    route, so that is asserted over the whole rendered tree rather than against
 *    one element: a future link added anywhere on these pages is covered too.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "../../i18n";
import PrivacyPolicyPage from "../PrivacyPolicyPage";
import TermsOfServicePage from "../TermsOfServicePage";

const renderAt = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("PrivacyPolicyPage", () => {
  it("discloses every third-party service that actually receives data", () => {
    renderAt(<PrivacyPolicyPage />);
    for (const vendor of [
      "Supabase",
      "Brevo",
      "Lemon Squeezy",
      "Umami",
      "Sentry",
    ]) {
      expect(screen.getByText(vendor)).toBeInTheDocument();
    }
  });

  it("does not claim there are no third-party analytics trackers", () => {
    const { container } = renderAt(<PrivacyPolicyPage />);
    // The exact retired sentence. Kept as a literal so that reintroducing it
    // by copy-paste fails loudly instead of quietly shipping.
    expect(container.textContent).not.toContain(
      "does not use tracking cookies or any third-party analytics trackers"
    );
    expect(container.textContent).toContain("cookie-free analytics service");
  });

  it("links onward to the public terms page, not the auth-gated hub", () => {
    renderAt(<PrivacyPolicyPage />);
    const link = screen.getByRole("link", { name: "Terms of Service" });
    expect(link).toHaveAttribute("href", "/terms");
  });
});

describe("TermsOfServicePage", () => {
  it("links back to the public privacy page, not the auth-gated hub", () => {
    renderAt(<TermsOfServicePage />);
    const link = screen.getByRole("link", { name: "Privacy Policy" });
    expect(link).toHaveAttribute("href", "/privacy");
  });
});

describe.each([
  ["PrivacyPolicyPage", PrivacyPolicyPage],
  ["TermsOfServicePage", TermsOfServicePage],
])("%s public-route discipline", (_name, Page) => {
  // The only in-app routes outside the ProtectedRoute block in App.jsx that a
  // public legal page has any reason to reach. Anything else sends a logged-out
  // reader to the login screen.
  const PUBLIC_ROUTES = ["/privacy", "/terms"];

  it("contains no internal link into an auth-gated route", () => {
    const { container } = renderAt(<Page />);
    const internal = [...container.querySelectorAll("a[href^='/']")].map((a) =>
      a.getAttribute("href")
    );
    expect(internal.length).toBeGreaterThan(0); // guards against a vacuous pass
    for (const href of internal) {
      expect(PUBLIC_ROUTES).toContain(href);
    }
  });

  it("offers a back control that is not a link to /settings", () => {
    renderAt(<Page />);
    const back = screen.getByRole("button", { name: /back|חזרה/i });
    expect(back).toBeInTheDocument();
  });
});
