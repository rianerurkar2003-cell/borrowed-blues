import { ONBOARDING } from "@/constants/testIds";

/**
 * A visible secondary button, not a faint link -- the design brief is
 * explicit that skipping must read as a real, equally-weighted choice.
 */
export default function SkipButton({ children = "Skip for now", ...props }) {
  return (
    <button
      type="button"
      data-testid={ONBOARDING.skipButton}
      className="px-5 py-2.5 rounded-full border border-bb-forest/30 text-bb-forest text-sm hover:bg-bb-moss/30 transition-colors min-h-[44px]"
      {...props}
    >
      {children}
    </button>
  );
}
