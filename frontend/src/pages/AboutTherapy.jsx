import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WatercolorEucalyptus, WatercolorBird, WatercolorRipple, WatercolorSapling, WatercolorPair } from "@/components/Watercolor";
import { ArrowRight, Check, X } from "lucide-react";

const IS_IS_NOT = {
  is: ["Collaborative", "Confidential", "Reflection", "Growth", "Personal"],
  isnt: ["Judgement", "Advice giving", "A quick fix", "Only for crises", "One-size-fits-all"],
};

const FIRST_SESSION = [
  { label: "Meet",    body: "You'll spend some time getting to know one another and discussing what brings you to therapy.", Art: WatercolorBird },
  { label: "Share",   body: "This is your opportunity to ask about the process, confidentiality, or anything you're unsure about.", Art: WatercolorPair },
  { label: "Reflect", body: "Together, we identify what you'd like support with and what you hope to gain from therapy.",           Art: WatercolorRipple },
  { label: "Talk",    body: "You'll have space to share your thoughts, experiences, and concerns at a pace that feels comfortable.", Art: WatercolorEucalyptus },
  { label: "Grow",    body: "You'll leave with a shared understanding of what future sessions may look like.",                     Art: WatercolorSapling },
];

export default function AboutTherapy() {
  return (
    <>
      <section data-testid="about-hero" className="relative overflow-hidden">
        <div className="bb-container pt-20 pb-16 md:pt-28 md:pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="bb-eyebrow">A guide, not a manual</p>
            <h1 className="mt-4 text-5xl md:text-7xl text-bb-forest leading-[1.03]">
              Understanding <span className="bb-italic-serif">therapy.</span>
            </h1>
            <p className="mt-6 text-bb-forest/75 leading-relaxed max-w-lg">
              Therapy is a collaborative space to explore your thoughts, emotions,
              and experiences with the support of a trained professional. Whether
              you're curious, uncertain, or simply looking to understand what to
              expect, this guide is here to help you begin with clarity.
            </p>
            <Link
              to="/meet-your-therapist"
              data-testid="about-cta"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
            >
              Book a consultation <ArrowRight size={16} strokeWidth={1.6}/>
            </Link>
          </div>
          <div className="relative aspect-square max-w-md ml-auto">
            <WatercolorEucalyptus className="w-full h-full animate-drift" />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="bb-container grid md:grid-cols-2 gap-14 items-start">
          <div>
            <p className="bb-eyebrow">What it is</p>
            <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest">What is therapy?</h2>
            <div className="mt-6 space-y-5 text-bb-forest/75 leading-relaxed">
              <p>
                Therapy is a collaborative process where you work with a trained
                professional to better understand your thoughts, emotions, and
                experiences. It provides a safe and supportive space to explore
                challenges, develop healthier coping strategies, and work towards
                meaningful personal growth.
              </p>
              <p>
                Rather than giving advice or quick solutions, therapy helps you gain
                insight, build resilience, and discover approaches that feel right
                for you.
              </p>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-bb-moss/40 aspect-[4/3] bb-wet-edge">
            <WatercolorRipple className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Therapy is / isn't */}
      <section className="py-16 md:py-24 bg-[#C4CFA5]/60">
        <div className="bb-container grid md:grid-cols-2 gap-12 md:gap-24">
          <div data-testid="therapy-is">
            <h3 className="text-3xl md:text-4xl text-bb-forest text-center md:text-left">
              Therapy <span className="bb-italic-serif">is:</span>
            </h3>
            <ul className="mt-8 space-y-4">
              {IS_IS_NOT.is.map((item) => (
                <li key={item} className="flex items-center gap-3 text-bb-forest text-lg">
                  <Check strokeWidth={1.6} className="text-bb-teal" size={22}/>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div data-testid="therapy-isnt">
            <h3 className="text-3xl md:text-4xl text-bb-forest text-center md:text-left">
              Therapy <span className="bb-italic-serif">isn't:</span>
            </h3>
            <ul className="mt-8 space-y-4">
              {IS_IS_NOT.isnt.map((item) => (
                <li key={item} className="flex items-center gap-3 text-bb-forest/80 text-lg">
                  <X strokeWidth={1.6} className="text-bb-forest/60" size={22}/>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* First session */}
      <section className="py-24">
        <div className="bb-container">
          <p className="bb-eyebrow">A gentle start</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest max-w-2xl">
            What to expect during your first session?
          </h2>

          <div className="mt-14 grid md:grid-cols-3 gap-8 md:gap-10">
            {FIRST_SESSION.map(({ label, body, Art }, i) => (
              <article
                key={label}
                data-testid={`first-session-${label.toLowerCase()}`}
                className={`bg-bb-warm rounded-2xl p-6 shadow-soft ${i % 3 === 1 ? "md:translate-y-10" : ""}`}
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bb-moss/40 bb-wet-edge">
                  <Art className="w-full h-full" />
                </div>
                <h4 className="mt-5 font-serif text-2xl text-bb-forest">{label}</h4>
                <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="bb-container">
          <div className="relative rounded-3xl bg-bb-blue/50 p-10 md:p-16 grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
            <div className="max-w-md">
              <p className="bb-eyebrow">Take your time</p>
              <h3 className="mt-3 text-3xl md:text-4xl text-bb-forest">Ready to begin?</h3>
              <p className="mt-4 text-bb-forest/70">
                Taking the first step doesn't require having all the answers. It
                simply begins with a conversation.
              </p>
              <Link
                to="/meet-your-therapist"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
              >
                Book your first consultation
              </Link>
            </div>
            <div className="relative min-h-[220px]">
              <WatercolorBird className="w-72 float-right" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
