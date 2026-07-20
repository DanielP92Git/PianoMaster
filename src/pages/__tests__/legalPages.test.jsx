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
