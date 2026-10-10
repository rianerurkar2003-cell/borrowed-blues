import { ONBOARDING } from "@/constants/testIds";

const OPTIONS = [
  { value: "step", label: "One question at a time" },
  { value: "single", label: "Everything on one page" },
  { value: "call", label: "I'd rather go through this on our call" },
];

/**
 * Shown once at the start of Stage 1. Choosing "call" defers Stages 1 and
 * 3 entirely (still requires Stage 2 consent) and lets the therapist know.
 */
export default function StructureChooser({ onChoose, busy }) {
  return (
    <fieldset className="mt-8" data-testid={ONBOARDING.structureChooser}>
      <legend className="text-sm text-bb-forest/80 mb-3">How would you like to go through this?</legend>
      <div className="grid gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={busy}
            onClick={() => onChoose(opt.value)}
            data-testid={`${ONBOARDING.structureOption}-${opt.value}`}
            className="text-left px-5 py-4 rounded-2xl bg-bb-warm border border-bb-moss hover:border-bb-teal transition-colors text-bb-forest disabled:opacity-60 min-h-[44px]"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
