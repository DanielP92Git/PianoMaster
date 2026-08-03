import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isUnder13,
  isUnder18,
  isValidDOB,
  dobPartsToDate,
} from "./ageUtils";

describe("ageUtils", () => {
  describe("isUnder18", () => {
    it("returns false for someone whose 18th birthday is today", () => {
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      expect(isUnder18(dob)).toBe(false);
    });

    it("returns true for someone 17 years 364 days old", () => {
      const today = new Date();
      // 18 years ago, plus 1 day => not yet 18 (17y364d, or 17y365d on a leap
      // boundary) — either way still under 18.
      const dob = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate() + 1
      );
      expect(isUnder18(dob)).toBe(true);
    });

    it("returns false for someone 18 years 1 day old", () => {
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate() - 1
      );
      expect(isUnder18(dob)).toBe(false);
    });
  });

  describe("isValidDOB", () => {
    it("rejects a future date", () => {
      const today = new Date();
      const future = {
        month: today.getMonth() + 1,
        day: today.getDate(),
        year: today.getFullYear() + 1,
      };
      expect(isValidDOB(future)).toBe(false);
    });

    it("rejects a year older than 120", () => {
      const today = new Date();
      const tooOld = {
        month: 1,
        day: 1,
        year: today.getFullYear() - 121,
      };
      expect(isValidDOB(tooOld)).toBe(false);
    });

    it("accepts a plausible adult DOB", () => {
      const today = new Date();
      const plausible = {
        month: today.getMonth() + 1,
        day: today.getDate(),
        year: today.getFullYear() - 30,
      };
      expect(isValidDOB(plausible)).toBe(true);
    });
  });

  describe("dobPartsToDate", () => {
    it("treats month as 1-indexed and produces the correct Date", () => {
      const date = dobPartsToDate({ month: 3, day: 15, year: 1990 });
      expect(date.getFullYear()).toBe(1990);
      expect(date.getMonth()).toBe(2); // 0-indexed: March = 2
      expect(date.getDate()).toBe(15);
    });
  });

  describe("existing exports still work (regression guard)", () => {
    it("calculateAge accounts for birthday not yet occurred this year", () => {
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - 10,
        today.getMonth(),
        today.getDate() + 1
      );
      expect(calculateAge(dob)).toBe(9);
    });

    it("isUnder13 returns true for a 12-year-old", () => {
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - 12,
        today.getMonth(),
        today.getDate()
      );
      expect(isUnder13(dob)).toBe(true);
    });
  });
});
