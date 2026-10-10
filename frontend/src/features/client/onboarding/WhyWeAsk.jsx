import { ONBOARDING } from "@/constants/testIds";

/**
 * A disclosure under any sensitive field, explaining why it's asked.
 * Native <details>/<summary> -- accessible and keyboard-operable with no
 * new dependency, per the design brief's own suggested implementation.
 */
export default function WhyWeAsk({ children }) {
  return (
    <details data-testid={ONBOARDING.whyWeAsk} className="mt-1.5 group">
      <summary className="text-xs text-bb-teal cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        Why we ask
      </summary>
      <p className="mt-1 text-xs text-bb-forest/60 leading-relaxed">{children}</p>
    </details>
  );
}
