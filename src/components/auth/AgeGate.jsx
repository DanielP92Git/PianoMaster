import { useState } from "react";
import {
  dobPartsToDate,
  isUnder13,
  isValidDOB,
} from "../../utils/ageUtils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Age Gate component for COPPA-compliant DOB collection.
 * Displays neutral month/day/year dropdowns (not "Are you 13?" checkbox).
 * Calculates age and returns both DOB and isUnder13 flag.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with { dob: Date, isUnder13: boolean }
 * @param {Function} props.onBack - Optional back button handler
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function AgeGate({ onSubmit, onBack, disabled = false }) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const dob = {
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      year: parseInt(year, 10),
    };

    if (!isValidDOB(dob)) {
      setError("Please enter a valid date of birth");
      return;
    }

    const birthDate = dobPartsToDate(dob);
    onSubmit({
      dob: birthDate,
      isUnder13: isUnder13(birthDate),
    });
  };

  // Base select classes matching SignupForm.jsx input styling
  const selectClass = `w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2
    border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50
    transition-all duration-300 text-white`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-white/90 text-sm">When is your birthday?</p>
      </div>

      {error && (
        <div className="p-2 text-xs text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={selectClass}
          disabled={disabled}
          required
          aria-label="Birth month"
        >
          <option value="" className="text-gray-900">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1} className="text-gray-900">
              {m}
            </option>
          ))}
        </select>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className={selectClass}
          disabled={disabled}
          required
          aria-label="Birth day"
        >
          <option value="" className="text-gray-900">Day</option>
          {days.map((d) => (
            <option key={d} value={d} className="text-gray-900">
              {d}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={selectClass}
          disabled={disabled}
          required
          aria-label="Birth year"
        >
          <option value="" className="text-gray-900">Year</option>
          {years.map((y) => (
            <option key={y} value={y} className="text-gray-900">
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="flex-1 py-2 text-sm text-white/80 hover:text-white border-2 border-white/20 rounded-lg transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

export default AgeGate;
