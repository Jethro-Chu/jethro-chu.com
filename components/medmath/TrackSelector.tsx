"use client";

import { MEDMATH_CATEGORIES, MED_SURG_CATEGORIES, CRITICAL_CARE_CATEGORIES } from "@/lib/medmath/categories";
import type { MedMathCategory, PracticeDifficultySelection } from "@/lib/medmath/types";

interface TrackSelectorProps {
  selectedCategories: MedMathCategory[];
  onSelectCategories: (cats: MedMathCategory[]) => void;
  selectedDifficulty: PracticeDifficultySelection;
  onSelectDifficulty: (diff: PracticeDifficultySelection) => void;
}

export function TrackSelector({
  selectedCategories,
  onSelectCategories,
  selectedDifficulty,
  onSelectDifficulty,
}: TrackSelectorProps) {
  const isAllSelected = selectedCategories.length === MEDMATH_CATEGORIES.length;
  const isMedSurgSelected =
    selectedCategories.length === MED_SURG_CATEGORIES.length &&
    MED_SURG_CATEGORIES.every((c) => selectedCategories.includes(c));
  const isCriticalCareSelected =
    selectedCategories.length === CRITICAL_CARE_CATEGORIES.length &&
    CRITICAL_CARE_CATEGORIES.every((c) => selectedCategories.includes(c));

  const handleToggleCategory = (cat: MedMathCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) return; // Must keep at least one
      onSelectCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      onSelectCategories([...selectedCategories, cat]);
    }
  };

  const handleSelectTrack = (track: "all" | "med-surg" | "critical-care") => {
    if (track === "all") {
      onSelectCategories(MEDMATH_CATEGORIES.map((c) => c.id));
    } else if (track === "med-surg") {
      onSelectCategories([...MED_SURG_CATEGORIES]);
    } else if (track === "critical-care") {
      onSelectCategories([...CRITICAL_CARE_CATEGORIES]);
    }
  };

  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-xs">
      {/* Quick Track Toggles */}
      <div className="flex flex-col gap-3 pb-4 border-b border-[var(--color-line)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">
            Clinical Focus Track
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectTrack("all")}
            className={`rounded-sm px-3 py-1 font-mono text-xs font-medium transition-colors ${
              isAllSelected
                ? "bg-[var(--color-pine)] text-white shadow-xs"
                : "border border-[var(--color-line)] bg-[var(--color-sand)]/50 text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
            }`}
          >
            All 13 Topics
          </button>
          <button
            type="button"
            onClick={() => handleSelectTrack("med-surg")}
            className={`rounded-sm px-3 py-1 font-mono text-xs font-medium transition-colors ${
              isMedSurgSelected
                ? "bg-[var(--color-pine)] text-white shadow-xs"
                : "border border-[var(--color-line)] bg-[var(--color-sand)]/50 text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
            }`}
          >
            Med-Surg Floor
          </button>
          <button
            type="button"
            onClick={() => handleSelectTrack("critical-care")}
            className={`rounded-sm px-3 py-1 font-mono text-xs font-medium transition-colors ${
              isCriticalCareSelected
                ? "bg-[var(--color-pine)] text-white shadow-xs"
                : "border border-[var(--color-line)] bg-[var(--color-sand)]/50 text-[var(--color-ink)] hover:bg-[var(--color-sand)]"
            }`}
          >
            Critical Care & ICU
          </button>
        </div>
      </div>

      {/* Individual Topic Checkbox Pills */}
      <div className="pt-4">
        <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Selected Categories ({selectedCategories.length} of {MEDMATH_CATEGORIES.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MEDMATH_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`rounded-sm px-2.5 py-1 font-mono text-xs transition-colors ${
                  isSelected
                    ? "border border-[var(--color-pine)] bg-[var(--color-pine)]/10 font-semibold text-[var(--color-pine)]"
                    : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:border-gray-400"
                }`}
              >
                {isSelected ? "✓ " : "+ "}
                {cat.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty Level Selector */}
      <div className="mt-4 border-t border-[var(--color-line)] pt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Difficulty Mode
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "mixed", label: "Mixed / Adaptive" },
              { id: "beginner", label: "Beginner" },
              { id: "intermediate", label: "Intermediate" },
              { id: "advanced", label: "Advanced" },
              { id: "critical-care", label: "ICU / High Acuity" },
            ] as const
          ).map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => onSelectDifficulty(diff.id)}
              className={`rounded-sm px-2.5 py-1 font-mono text-xs transition-colors ${
                selectedDifficulty === diff.id
                  ? "bg-[var(--color-pine)] text-white font-semibold shadow-xs"
                  : "border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
