/**
 * NeedsLandscapeContext.test.jsx
 *
 * Lifecycle integration tests for the NeedsLandscapeProvider + hooks.
 * Covers: default outside provider, mount-sets-true, unmount-clears,
 * false-clears-prior-true, prop-flip, INFRA-04 non-mobile lock.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";

// Mock useIsMobile and useOrientation BEFORE importing the modules that use them,
// so the INFRA-04 test can assert non-mobile gating.
vi.mock("../hooks/useIsMobile", () => ({
  useIsMobile: () => false,
}));
vi.mock("../hooks/useOrientation", () => ({
  useOrientation: () => ({ isPortrait: true, isLandscape: false }),
}));
vi.mock("../utils/pwaDetection", () => ({
  isAndroidDevice: () => false,
  isInStandaloneMode: () => false,
}));

import {
  NeedsLandscapeProvider,
  useDeclareNeedsLandscape,
  useNeedsLandscape,
} from "./NeedsLandscapeContext";
import { useRotatePrompt } from "../hooks/useRotatePrompt";

// ---------------------------------------------------------------------------
// Helpers — render two consumers under one provider so they share state
// ---------------------------------------------------------------------------

function Reader({ onValue }) {
  const value = useNeedsLandscape();
  onValue(value);
  return null;
}

function Declarer({ value }) {
  useDeclareNeedsLandscape(value);
  return null;
}

function PromptReader({ onValue }) {
  const { shouldShowPrompt } = useRotatePrompt();
  onValue(shouldShowPrompt);
  return null;
}

describe("NeedsLandscapeContext", () => {
  it("returns false outside provider (default-value variant)", () => {
    const samples = [];
    render(<Reader onValue={(v) => samples.push(v)} />);
    expect(samples[samples.length - 1]).toBe(false);
  });

  it("reader sees false initially inside fresh provider", () => {
    const samples = [];
    render(
      <NeedsLandscapeProvider>
        <Reader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    expect(samples[samples.length - 1]).toBe(false);
  });

  it("reader sees true after a declarer mounts with true", () => {
    const samples = [];
    render(
      <NeedsLandscapeProvider>
        <Declarer value={true} />
        <Reader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    // After effects flush, reader should observe true
    expect(samples.includes(true)).toBe(true);
    expect(samples[samples.length - 1]).toBe(true);
  });

  it("reader sees false again after declarer unmounts (cleanup)", () => {
    const samples = [];
    const { rerender } = render(
      <NeedsLandscapeProvider>
        <Declarer value={true} />
        <Reader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    expect(samples[samples.length - 1]).toBe(true);

    // Unmount the declarer (re-render without it)
    act(() => {
      rerender(
        <NeedsLandscapeProvider>
          <Reader onValue={(v) => samples.push(v)} />
        </NeedsLandscapeProvider>
      );
    });

    expect(samples[samples.length - 1]).toBe(false);
  });

  it("declarer with false clears any prior true (last-writer-wins)", () => {
    const samples = [];
    const { rerender } = render(
      <NeedsLandscapeProvider>
        <Declarer value={true} />
        <Reader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    expect(samples[samples.length - 1]).toBe(true);

    // Swap declarer for one that declares false
    act(() => {
      rerender(
        <NeedsLandscapeProvider>
          <Declarer value={false} />
          <Reader onValue={(v) => samples.push(v)} />
        </NeedsLandscapeProvider>
      );
    });

    expect(samples[samples.length - 1]).toBe(false);
  });

  it("flipping declarer prop from true to false flips reader to false", () => {
    const samples = [];
    const { rerender } = render(
      <NeedsLandscapeProvider>
        <Declarer value={true} />
        <Reader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    expect(samples[samples.length - 1]).toBe(true);

    act(() => {
      rerender(
        <NeedsLandscapeProvider>
          <Declarer value={false} />
          <Reader onValue={(v) => samples.push(v)} />
        </NeedsLandscapeProvider>
      );
    });

    expect(samples[samples.length - 1]).toBe(false);
  });

  // INFRA-04 lock: tablet/desktop (useIsMobile=false) NEVER shows rotate prompt
  // regardless of ctxNeedsLandscape. We exercise useRotatePrompt directly with
  // useIsMobile mocked to return false at module level (above).
  it("useRotatePrompt returns shouldShowPrompt=false on non-mobile regardless of ctxNeedsLandscape (INFRA-04)", () => {
    const samples = [];
    render(
      <NeedsLandscapeProvider>
        <Declarer value={true} />
        <PromptReader onValue={(v) => samples.push(v)} />
      </NeedsLandscapeProvider>
    );
    // Even though context says needsLandscape=true, useIsMobile=false gates
    // the prompt off entirely. Composed gate `legacyGate && ctxNeedsLandscape`
    // would also be false because legacyGate is false.
    expect(samples.every((v) => v === false)).toBe(true);
  });
});
