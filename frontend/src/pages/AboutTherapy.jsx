import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import ConsultationDialog from "@/components/ConsultationDialog";
import { ArrowRight, Check, X } from "lucide-react";
import aboutTherapyHero from "@/assets/about-therapy-hero.png";
import whatIsTherapyImg from "@/assets/what-is-therapy.png";
import readyToBeginImg from "@/assets/ready-to-begin.png";
import sessionMeetImg from "@/assets/session-meet.png";
import sessionShareImg from "@/assets/session-share.png";
import sessionReflectImg from "@/assets/session-reflect.png";
import sessionTalkImg from "@/assets/session-talk.png";
import sessionGrowImg from "@/assets/session-grow.png";

const IS_IS_NOT = {
  is: ["Collaborative", "Confidential", "Reflection", "Growth", "Personal"],
  isnt: ["Judgement", "Advice giving", "A quick fix", "Only for crises", "One-size-fits-all"],
};

const FIRST_SESSION = [
  { label: "Meet",    body: "You'll spend some time getting to know one another and discussing what brings you to therapy.", img: sessionMeetImg },
  { label: "Share",   body: "This is your opportunity to ask about the process, confidentiality, or anything you're unsure about.", img: sessionShareImg },
  { label: "Reflect", body: "Together, we identify what you'd like support with and what you hope to gain from therapy.",           img: sessionReflectImg },
  { label: "Talk",    body: "You'll have space to share your thoughts, experiences, and concerns at a pace that feels comfortable.", img: sessionTalkImg },
  { label: "Grow",    body: "You'll leave with a shared understanding of what future sessions may look like.",                     img: sessionGrowImg },
];

export default function AboutTherapy() {
  return (
    <>
      {/* HERO — the illustration fills the full section (1280x740); the header
          floats transparently on top (see PublicLayout), and the copy sits in
          the open space the artwork's own composition leaves on the left. */}
      <section
        data-testid="about-hero"
        className="relative overflow-hidden md:-mt-[92px] w-full md:aspect-[1280/740] bg-bb-cream"
      >
        {/* Desktop/tablet: full-bleed background image with the copy overlaid. */}
        <img
          src={aboutTherapyHero}
          alt="Watercolor eucalyptus branches with berries and a small blue bird."
          className="hidden md:block absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative md:absolute md:inset-0 flex items-center px-6 md:px-16 lg:px-24 py-10 md:py-0">
          <div className="max-w-lg">
            <p className="bb-eyebrow">A guide, not a manual</p>
            <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-bb-forest leading-[1.03]">
              Understanding <span className="bb-italic-serif">therapy.</span>
            </h1>
            <p className="mt-6 text-bb-forest/75 leading-relaxed max-w-lg">
              Therapy is a collaborative space to explore your thoughts, emotions,
              and experiences with the support of a trained professional. Whether
              you're curious, uncertain, or simply looking to understand what to
              expect, this guide is here to help you begin with clarity.
            </p>
            <ConsultationDialog>
              <button
                type="button"
                data-testid="about-cta"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-[40px] bg-bb-forest text-bb-cream hover:bg-bb-teal transition-colors"
              >
                Book a consultation <ArrowRight size={16} strokeWidth={1.6}/>
              </button>
            </ConsultationDialog>
          </div>
        </div>
        {/* Mobile: image follows the copy in normal document flow, not overlaid. */}
        <img
          src={aboutTherapyHero}
          alt="Watercolor eucalyptus branches with berries and a small blue bird."
          className="md:hidden w-full aspect-[16/9] object-cover"
        />
      </section>

      {/* Section frame standardised to 1280x832 (matching "Ready to begin" below). */}
      <section className="relative overflow-hidden py-16 lg:py-0 lg:aspect-[1280/832] flex items-center">
        <div className="bb-container relative w-full">
          <div className="max-w-lg">
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
        </div>
        {/* River artwork bleeds in from the bottom-right, matching the reference layout,
            shown at its native 901x524 size. */}
        <img
          src={whatIsTherapyImg}
          alt="A watercolor river winding through the landscape."
          className="hidden md:block absolute right-0 bottom-0 w-[901px] h-[524px] max-w-none translate-y-[8%] pointer-events-none select-none"
        />
      </section>

      {/* Therapy is / isn't */}
      <section className="py-16 md:py-24 bg-[#C4CFA5]/60">
        <div className="bb-container grid md:grid-cols-2 gap-12 md:gap-24">
          <div data-testid="therapy-is" className="text-center">
            <h3 className="text-3xl md:text-4xl text-bb-forest">
              Therapy <span className="bb-italic-serif">is:</span>
            </h3>
            <ul className="mt-8 space-y-4 flex flex-col items-center">
              {IS_IS_NOT.is.map((item) => (
                <li key={item} className="flex items-center gap-3 text-bb-forest text-lg">
                  <Check strokeWidth={1.6} className="text-bb-teal" size={22}/>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div data-testid="therapy-isnt" className="text-center">
            <h3 className="text-3xl md:text-4xl text-bb-forest">
              Therapy <span className="bb-italic-serif">isn't:</span>
            </h3>
            <ul className="mt-8 space-y-4 flex flex-col items-center">
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

          {/* Evenly distributed, linear grid: 3 cards on top, 2 centered below —
              a 6-column track lets the last two items span cols 2-3 and 4-5. */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-6 gap-8 md:gap-10">
            {FIRST_SESSION.map(({ label, body, img }, i) => (
              <article
                key={label}
                data-testid={`first-session-${label.toLowerCase()}`}
                className={`bg-bb-warm rounded-2xl p-6 shadow-soft sm:col-span-2 ${
                  i === 3 ? "sm:col-start-2" : i === 4 ? "sm:col-start-4" : ""
                }`}
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bb-moss/40 bb-wet-edge">
                  <img src={img} alt={label} className="w-full h-full object-cover" />
                </div>
                <h4 className="mt-5 font-serif text-2xl text-bb-forest">{label}</h4>
                <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed split screen — artwork fills the left half edge to edge,
          copy sits on a solid Sky-blue field on the right. */}
      <section data-testid="about-ready" className="relative overflow-hidden lg:aspect-[1280/832]">
        <div className="grid md:grid-cols-2 md:h-full">
          <div className="relative aspect-[639/830] md:aspect-auto md:h-full">
            <img
              src={readyToBeginImg}
              alt="Two watercolor bluebirds in flight beside a eucalyptus branch."
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="bg-bb-sky flex items-center px-8 py-16 md:px-16 md:h-full">
            <div className="max-w-md">
              <p className="bb-eyebrow text-white/70">Take your time</p>
              <h3 className="mt-3 text-3xl md:text-4xl text-white">
                Ready to <span className="bb-italic-serif">Begin?</span>
              </h3>
              <p className="mt-4 text-white/85">
                Taking the first step doesn't require having all the answers. It
                simply begins with a conversation.
              </p>
              <ConsultationDialog>
                <button
                  type="button"
                  data-testid="about-bottom-cta"
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-[40px] bg-white text-bb-forest hover:bg-bb-mist transition-colors"
                >
                  Book your first consultation
                </button>
              </ConsultationDialog>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
