import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WatercolorEstuary, WatercolorRipple, WatercolorBird, WatercolorSapling, WatercolorPair, WatercolorFlock, WatercolorEucalyptus, BirdFlock } from "@/components/Watercolor";
import ConsultationDialog from "@/components/ConsultationDialog";
import { Link } from "react-router-dom";

const PILLARS = [
  { title: "Understanding", body: "Learn what therapy is and how sessions typically feel.", Art: WatercolorFlock },
  { title: "Guidance",      body: "A steady, thoughtful presence — never a script.",        Art: WatercolorBird },
  { title: "Progress",      body: "Recognise growth through reflections and small milestones.", Art: WatercolorSapling },
  // WatercolorRipple's source image has a hard edge close to its bounds — scale it up
  // slightly so that edge is cropped outside the visible frame instead of showing as a stroke.
  { title: "Continuity",    body: "Stay connected to your therapeutic journey between sessions.", Art: WatercolorRipple, artClassName: "scale-125" },
];

const JOURNEY = [
  { label: "Learn",   Art: WatercolorBird },
  { label: "Book",    Art: WatercolorPair },
  { label: "Session", Art: WatercolorEucalyptus },
  { label: "Reflect", Art: WatercolorRipple },
  { label: "Growth",  Art: WatercolorSapling },
];

const FAQS = [
  { q: "How does it work?",
    a: "You begin with a short, no-obligation consultation call. If it feels right, we book your first session and move at a pace that suits you. Each session is a fifty-minute conversation held online or in person, with your reflections and homework kept in a private client portal between sessions." },
  { q: "How long is a session?",
    a: "A typical session lasts fifty minutes. First sessions sometimes run a little longer so we can settle in properly and understand what you're hoping to explore." },
  { q: "Is what I share confidential?",
    a: "Yes. Sessions, reflections, and everything you write in the portal are held in strict confidence, within the narrow limits required by law." },
  { q: "Do I need to be in crisis to come to therapy?",
    a: "Not at all. Many people come during ordinary chapters — for clarity, curiosity, or simply because something feels heavy and unnamed." },
  { q: "Can I attend online?",
    a: "Yes. Online sessions are offered whenever they're more accessible for you. In-person sessions are also available, in a calm, private space." },
  { q: "How many sessions will I need?",
    a: "There's no fixed answer. Some people come for a season; others stay longer. We revisit that question together, gently, as the work unfolds." },
  { q: "What happens between sessions?",
    a: "You'll have a private client portal with your latest session summary, any homework we've discussed, a reflection journal, and a small library of resources tailored to your work." },
  { q: "What if I need to reschedule?",
    a: "You can request a reschedule from within your client portal or by writing to Anushka directly. We try to be flexible — life moves, and therapy should move with it." },
  { q: "How much does a session cost?",
    a: "Fees are shared during the consultation call, tailored to the length and type of session. Sliding-scale options are available on request." },
  { q: "How do I book my first consultation?",
    a: "Use the 'Book a consultation' button anywhere on this site and send a short note. Anushka usually replies within one to two working days." },
];

export default function Home() {
  return (
    <>
      {/* HERO — pulled up under the sticky transparent header so the image reads
          as a true full-bleed background with the nav floating directly on it. */}
      <section
        data-testid="home-hero"
        className="relative overflow-hidden -mt-[92px] w-full aspect-[3/4] sm:aspect-[16/9] md:aspect-[16/7.5] lg:aspect-[1280/873]"
      >
        <div className="absolute inset-0">
          {/* Scaled up just enough, anchored to the top-right corner, to trim only the
              source image's left edge — which has a small stray watermark-style text
              mark baked into the file near the top-left — while the top edge itself
              stays fixed in place so the artwork's open sky is preserved in full.
              (Horizontal object-position has no effect here: the source's rendered
              width already matches the container width exactly via object-fit:cover,
              leaving no horizontal pan room on its own — only this anchored scale can
              trim the left edge.) */}
          <WatercolorEstuary className="w-full h-full scale-[1.55] sm:scale-[1.07] origin-top sm:origin-top-right" position="center top" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1
            data-testid="home-hero-title"
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-bb-forest animate-fade-up"
            style={{ textShadow: "0 1px 12px rgba(249,246,240,0.55)" }}
          >
            Begin With <span className="bb-italic-serif">Clarity</span>
          </h1>
          <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3 animate-fade-up">
            <ConsultationDialog>
              <button
                type="button"
                data-testid="hero-cta-consult"
                className="px-6 py-3 rounded-[40px] bg-bb-teal text-bb-cream text-[15px] shadow-soft hover:bg-bb-forest transition-colors"
              >
                Book a consultation
              </button>
            </ConsultationDialog>
            <Link
              to="/about-therapy"
              data-testid="hero-cta-learn"
              className="px-6 py-3 rounded-[40px] bg-bb-teal text-bb-cream text-[15px] shadow-soft hover:bg-bb-forest transition-colors"
            >
              Learn about therapy
            </Link>
          </div>
        </div>
      </section>

      {/* OVERWHELM STRIP — soft warm band */}
      <section className="bg-[#E9E4DA]">
        <div className="bb-container py-14 md:py-20 text-center">
          <h2 data-testid="home-quote" className="font-serif text-3xl sm:text-4xl md:text-5xl text-bb-forest leading-[1.1]">
            Starting therapy can feel <span className="bb-italic-serif">overwhelming.</span>
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-bb-forest/70 leading-relaxed">
            Many people delay therapy not because they don't want help, but because
            they don't know what to expect. Borrowed Blues is designed to make that
            first step feel more informed, and less intimidating.
          </p>
        </div>
      </section>

      {/* PILLARS — cards laid over a wildflower/estuary field */}
      <section data-testid="home-pillars" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <WatercolorEstuary className="w-full h-full scale-110" />
          <div className="absolute inset-0 bg-bb-forest/25" />
        </div>
        <div className="relative bb-container py-20 md:py-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
            {PILLARS.map(({ title, body, Art, artClassName = "" }, i) => (
              <article
                key={title}
                data-testid={`pillar-${title.toLowerCase()}`}
                className="group bg-bb-warm/85 backdrop-blur-sm rounded-2xl p-4 md:p-5 transition-shadow"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-bb-moss/40">
                  <Art className={`w-full h-full ${artClassName}`} />
                </div>
                <h3 className="mt-4 font-serif text-xl md:text-2xl text-bb-forest text-center">{title}</h3>
                <p className="mt-2 text-[13px] md:text-sm text-bb-forest/70 leading-relaxed text-center">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* THERAPY JOURNEY — sage/olive band with curved dotted connectors */}
      <section data-testid="therapy-journey" className="bg-[#B8C58B]/70">
        <div className="bb-container py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl md:text-5xl text-bb-teal">
              Your Therapy Journey
            </h2>
            <p className="mt-5 text-bb-forest/70">
              A simple, supportive process designed to help you feel informed
              and confident at every stage.
            </p>
          </div>

          <div className="relative mt-16 md:mt-20">
            {/* dotted curved connectors — desktop only, sits under the nodes */}
            <svg
              viewBox="0 0 1000 240"
              preserveAspectRatio="none"
              className="hidden md:block absolute inset-x-0 top-8 w-full h-40 pointer-events-none"
              aria-hidden
            >
              <g fill="none" stroke="#1C3829" strokeWidth="1.4" strokeDasharray="3 6" opacity="0.55">
                {/* Learn (100,60) → Book (300,180) */}
                <path d="M 130 70 C 190 70, 220 170, 290 175" />
                {/* Book (300,180) → Session (500,60) */}
                <path d="M 340 170 C 400 170, 440 70, 490 65" />
                {/* Session (500,60) → Reflect (700,180) */}
                <path d="M 540 75 C 600 75, 640 175, 690 175" />
                {/* Reflect (700,180) → Growth (900,80) */}
                <path d="M 740 170 C 800 170, 840 80, 890 75" />
              </g>
              {/* tiny arrowheads at each destination */}
              <g fill="#1C3829" opacity="0.6">
                <polygon points="285,171 296,169 290,180" />
                <polygon points="485,62 496,60 495,72" />
                <polygon points="685,171 696,169 690,180" />
                <polygon points="885,72 896,70 895,82" />
              </g>
            </svg>

            <ol className="relative grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-4 items-start">
              {JOURNEY.map(({ label, Art }, i) => (
                <li
                  key={label}
                  data-testid={`journey-${label.toLowerCase()}`}
                  className={`flex flex-col items-center text-center ${
                    // alternating vertical rhythm on md+
                    i % 2 === 1 ? "md:mt-24" : "md:mt-0"
                  }`}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-bb-cream/60 backdrop-blur-sm shadow-soft [&_img]:object-cover">
                    <Art className="w-full h-full" />
                  </div>
                  <p className="mt-4 font-serif text-lg md:text-xl text-bb-teal">{label}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-bb-cream">
        <div className="bb-container py-20 md:py-28 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-12 lg:gap-20">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl text-bb-forest leading-[1.05]">
              Frequently<br className="hidden md:block"/> asked questions
            </h2>
            <p className="mt-6 text-bb-forest/70 max-w-md">
              A quiet corner for the questions that often come up before the
              first session. Feel free to ask anything not answered here.
            </p>
            <BirdFlock className="mt-10 w-44 opacity-60" />
          </div>

          <Accordion type="single" collapsible className="w-full" defaultValue="q-0" data-testid="home-faq">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`q-${i}`}
                className="border-b border-bb-moss/70"
              >
                <AccordionTrigger className="py-5 text-left text-bb-forest text-base md:text-lg font-serif hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-bb-forest/70 leading-relaxed pr-6 text-[15px]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
