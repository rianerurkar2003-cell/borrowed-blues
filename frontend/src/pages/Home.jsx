import { Link } from "react-router-dom";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { WatercolorEstuary, WatercolorRipple, WatercolorBird, WatercolorSapling, WatercolorPair, WatercolorFlock, WatercolorEucalyptus, BirdFlock } from "@/components/Watercolor";
import { ArrowRight } from "lucide-react";

const PILLARS = [
  { title: "Understanding", body: "Learn what therapy is and how sessions typically feel." , Art: WatercolorFlock },
  { title: "Guidance",      body: "A steady, thoughtful presence — never a script.",        Art: WatercolorBird },
  { title: "Progress",      body: "Recognise growth through reflections and small milestones.", Art: WatercolorSapling },
  { title: "Continuity",    body: "Stay connected to your therapeutic journey between sessions.", Art: WatercolorRipple },
];

const JOURNEY = [
  { label: "Learn",   note: "Read, wonder, notice.",         Art: WatercolorBird },
  { label: "Book",    note: "A short consultation call.",    Art: WatercolorPair },
  { label: "Session", note: "An unhurried conversation.",    Art: WatercolorEucalyptus },
  { label: "Reflect", note: "Journal between sessions.",     Art: WatercolorRipple },
  { label: "Growth",  note: "Small, steady changes.",        Art: WatercolorSapling },
];

const FAQS = [
  { q: "How does it work?",
    a: "You begin with a short, no-obligation consultation call. If it feels right, we book your first session and move at a pace that suits you." },
  { q: "How long is a session?",
    a: "A typical session lasts fifty minutes. First sessions sometimes run a little longer so we can settle in properly." },
  { q: "Is what I share confidential?",
    a: "Yes. Sessions and reflections are treated with strict confidentiality, within the limits required by law." },
  { q: "Do I need to be in crisis to come to therapy?",
    a: "Not at all. Many people come during ordinary chapters — for clarity, curiosity, or simply because something feels heavy." },
  { q: "Can I attend online?",
    a: "Yes. Online sessions are offered when they feel more accessible for you. In-person is also available." },
  { q: "How many sessions will I need?",
    a: "There is no fixed answer. Some people come for a season; others stay longer. We revisit that question together, gently." },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section data-testid="home-hero" className="relative">
        <div className="bb-container pt-16 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-14 items-center">
          <div className="order-2 md:order-1">
            <p className="bb-eyebrow animate-fade-in" data-testid="home-eyebrow">A borrowed blues practice</p>
            <h1
              data-testid="home-hero-title"
              className="mt-6 text-5xl md:text-6xl lg:text-[80px] leading-[1.03] text-bb-forest animate-fade-up"
            >
              Begin with <span className="bb-italic-serif">clarity.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg md:text-xl text-bb-forest/75 leading-relaxed animate-fade-up">
              Therapy without the fluorescent lighting. A small, private practice
              helping you make sense of what is heavy, and gentle with what is
              tender.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 animate-fade-up">
              <Link
                to="/meet-your-therapist"
                data-testid="hero-cta-consult"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
              >
                Book a consultation <ArrowRight size={16} strokeWidth={1.6}/>
              </Link>
              <Link
                to="/about-therapy"
                data-testid="hero-cta-learn"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-bb-forest/30 text-bb-forest hover:bg-bb-moss/50 transition-colors"
              >
                Learn about therapy
              </Link>
            </div>
            <BirdFlock className="mt-12 w-44 opacity-60" />
          </div>

          <div className="order-1 md:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-soft aspect-[4/5] md:aspect-[3/4] bg-bb-moss/30">
              <WatercolorEstuary className="w-full h-full" />
            </div>
            {/* small floating bird stamp overlapping the top-left of the image */}
            <div className="hidden md:block absolute -left-10 -top-8 w-28 h-28 opacity-95 animate-drift">
              <WatercolorBird className="w-full h-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Overwhelm quote strip */}
      <section className="relative -mt-16">
        <div className="bb-container">
          <div data-testid="home-quote" className="bg-bb-moss/70 rounded-3xl px-8 py-14 md:px-16 md:py-20 text-center">
            <p className="font-serif text-3xl md:text-5xl text-bb-forest leading-[1.15]">
              Starting therapy can feel <span className="bb-italic-serif">overwhelming.</span>
            </p>
            <p className="mt-6 max-w-2xl mx-auto text-bb-forest/70 leading-relaxed">
              Many people delay therapy not because they don't want help, but because
              they don't know what to expect. Borrowed Blues is designed to make that
              first step feel more informed, and less intimidating.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="pt-24 pb-24">
        <div className="bb-container">
          <div className="grid md:grid-cols-4 gap-6 md:gap-8">
            {PILLARS.map(({ title, body, Art }, i) => (
              <article
                key={title}
                data-testid={`pillar-${title.toLowerCase()}`}
                className="group relative bg-bb-warm rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow duration-500"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-bb-moss/60 mb-6 bb-wet-edge">
                  <Art className="w-full h-full" />
                </div>
                <h3 className="text-2xl text-bb-forest">{title}</h3>
                <p className="mt-3 text-[15px] text-bb-forest/70 leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Therapy journey */}
      <section data-testid="therapy-journey" className="relative py-24 md:py-32 bg-[#C4CFA5]/60">
        <div className="bb-container">
          <div className="max-w-2xl">
            <p className="bb-eyebrow">A gentle sequence</p>
            <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest">Your therapy journey</h2>
            <p className="mt-5 text-bb-forest/70">
              A simple, supportive process designed to help you feel informed and
              confident at every stage.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4 items-end">
            {JOURNEY.map(({ label, note, Art }, i) => (
              <div key={label} className="flex flex-col items-center text-center" data-testid={`journey-${label.toLowerCase()}`}>
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/60 backdrop-blur-sm p-2 shadow-soft ${i%2 ? "translate-y-6" : ""}`}>
                  <Art className="w-full h-full" />
                </div>
                <p className="mt-6 font-serif text-2xl text-bb-forest">{label}</p>
                <p className="mt-1 text-sm text-bb-forest/70">{note}</p>
                {i < JOURNEY.length - 1 && (
                  <div className="hidden md:block absolute" aria-hidden></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="bb-container grid lg:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <p className="bb-eyebrow">Common questions</p>
            <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest leading-[1.05]">
              Frequently<br/> <span className="bb-italic-serif">asked</span> questions
            </h2>
            <p className="mt-6 text-bb-forest/70 max-w-md">
              A quiet corner for the questions that often come up before the first
              session. Feel free to ask anything not answered here.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full" defaultValue="q-0" data-testid="home-faq">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`q-${i}`}
                className="border-b border-bb-moss/70"
              >
                <AccordionTrigger className="py-5 text-left text-bb-forest text-lg md:text-xl font-serif hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-bb-forest/70 leading-relaxed pr-6">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="pb-24">
        <div className="bb-container">
          <div data-testid="home-cta" className="relative overflow-hidden rounded-3xl bg-bb-forest text-bb-cream p-10 md:p-16">
            <div className="absolute -right-24 -top-16 w-[420px] h-[420px] opacity-40">
              <WatercolorEucalyptus className="w-full h-full" />
            </div>
            <div className="relative max-w-xl">
              <p className="bb-eyebrow text-bb-cream/70">Ready to begin?</p>
              <h2 className="mt-3 text-4xl md:text-5xl text-bb-cream leading-tight">
                A conversation is often all it takes to begin.
              </h2>
              <p className="mt-6 text-bb-cream/80 leading-relaxed">
                Taking the first step doesn't require having all the answers. It
                simply begins with a conversation.
              </p>
              <Link
                to="/meet-your-therapist"
                data-testid="cta-book-consult"
                className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-bb-cream text-bb-forest hover:bg-white transition-colors"
              >
                Book your first consultation <ArrowRight size={16} strokeWidth={1.6}/>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
