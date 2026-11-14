"use client";

import { inputClass } from "./ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR + 6 - 1960 }, (_, i) => THIS_YEAR + 5 - i);

// Month + year as two selects (Safari has no month input). Value is "YYYY-MM",
// "present" (when allowed) or null.
export function MonthYearField({
  label,
  value,
  onChange,
  allowPresent = false,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  allowPresent?: boolean;
}) {
  const present = value === "present";
  const [year, month] = value && !present ? value.split("-") : ["", ""];

  const set = (y: string, m: string) => onChange(y && m ? `${y}-${m}` : y ? `${y}-01` : null);

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs font-semibold text-muted">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={`${label} month`}
          className={inputClass}
          value={month}
          disabled={present}
          onChange={(e) => set(year || String(THIS_YEAR), e.target.value)}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, "0")}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          className={inputClass}
          value={year}
          disabled={present}
          onChange={(e) => (e.target.value ? set(e.target.value, month || "01") : onChange(null))}
        >
          <option value="">Year</option>
          {YEARS.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        {allowPresent && (
          <label className="flex items-center gap-1.5 text-xs font-semibold">
            <input type="checkbox" checked={present} onChange={(e) => onChange(e.target.checked ? "present" : null)} />
            Present
          </label>
        )}
      </div>
    </fieldset>
  );
}
