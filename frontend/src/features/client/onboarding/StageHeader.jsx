import { useEffect, useRef } from "react";
import { ONBOARDING } from "@/constants/testIds";

/**
 * Stage name + an estimated time (never a percentage bar, per the design
 * brief). Moves focus to itself on mount so screen readers announce the
 * new stage on every step change -- no focus-management precedent existed
 * anywhere in this codebase before this component.
 */
export default function StageHeader({ stageNumber, totalStages, name, minutes }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [stageNumber, name]);

  return (
    <div aria-live="polite">
      <p className="bb-eyebrow">
        Stage {stageNumber} of {totalStages} · {name} · about {minutes} minute{minutes === 1 ? "" : "s"}
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        data-testid={ONBOARDING.stageHeading}
        className="mt-3 font-serif text-3xl md:text-4xl text-bb-forest outline-none"
      >
        {name}
      </h1>
    </div>
  );
}
