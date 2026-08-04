/**
 * Phase 04 / Plan 01 — Child profiles & parental gating EN <-> HE locale parity gate.
 *
 * This plan authors every new EN + HE i18n string this phase needs, in one
 * place, so downstream Phase-4 UI plans only ever call t("...") and never
 * edit a locale file directly (removes locale-file write contention across
 * the other ten plans and guarantees EN<->HE parity from the start).
 *
 * Covers the four new top-level namespaces (switcher, children, dataRights,
 * parentGate) plus the errorRetryAskParent key added to the existing
 * top-level `common` bucket. Mirrors sight-reading-parity.test.js /
 * scaffolding-card-parity.test.js pattern: i18next missing-key behavior is
 * silent fallback to the default string, so drift between EN and HE never
 * surfaces in production until a real user trips the gap. A static test
 * makes the gap impossible to ship.
 */

import { describe, it, expect } from "vitest";
import enCommon from "../en/common.json";
import heCommon from "../he/common.json";

function collectPaths(obj, prefix = "") {
  const paths = new Set();
  if (!obj || typeof obj !== "object") return paths;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const p of collectPaths(v, key)) paths.add(p);
    } else {
      paths.add(key);
    }
  }
  return paths;
}

const NEW_NAMESPACES = ["switcher", "children", "dataRights", "parentGate"];

describe("Phase 04 EN <-> HE locale parity", () => {
  NEW_NAMESPACES.forEach((namespace) => {
    it(`${namespace}: EN and HE key sets are identical`, () => {
      const enPaths = collectPaths(enCommon[namespace] || {});
      const hePaths = collectPaths(heCommon[namespace] || {});
      expect([...hePaths].sort()).toEqual([...enPaths].sort());
    });
  });

  it("common.errorRetryAskParent exists in both locales", () => {
    expect(typeof enCommon.common.errorRetryAskParent).toBe("string");
    expect(enCommon.common.errorRetryAskParent.length).toBeGreaterThan(0);
    expect(typeof heCommon.common.errorRetryAskParent).toBe("string");
    expect(heCommon.common.errorRetryAskParent.length).toBeGreaterThan(0);
  });

  it("children.form.nicknameFullNameWarning is a non-empty string in both locales", () => {
    expect(typeof enCommon.children.form.nicknameFullNameWarning).toBe(
      "string"
    );
    expect(
      enCommon.children.form.nicknameFullNameWarning.length
    ).toBeGreaterThan(0);
    expect(typeof heCommon.children.form.nicknameFullNameWarning).toBe(
      "string"
    );
    expect(
      heCommon.children.form.nicknameFullNameWarning.length
    ).toBeGreaterThan(0);
  });

  it("dataRights.deactivate.confirm and dataRights.delete.confirm contain {{nickname}} interpolation in both locales", () => {
    expect(enCommon.dataRights.deactivate.confirm).toContain("{{nickname}}");
    expect(enCommon.dataRights.delete.confirm).toContain("{{nickname}}");
    expect(heCommon.dataRights.deactivate.confirm).toContain("{{nickname}}");
    expect(heCommon.dataRights.delete.confirm).toContain("{{nickname}}");
  });

  it("old pages.settings.notifications.parentGate block is untouched in both locales", () => {
    expect(enCommon.pages.settings.notifications.parentGate.title).toBe(
      "Are you a grown-up?"
    );
    expect(heCommon.pages.settings.notifications.parentGate.title).toBe(
      "האם את/ה מבוגר/ת?"
    );
  });
});
