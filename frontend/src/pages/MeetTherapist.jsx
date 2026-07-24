import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { WatercolorEucalyptus, WatercolorBird, WatercolorSapling, WatercolorRipple } from "@/components/Watercolor";
import { ArrowRight } from "lucide-react";

const PILLARS_ARTS = [WatercolorBird, WatercolorEucalyptus, WatercolorRipple, WatercolorSapling];

export default function MeetTherapist() {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    api.get("/therapist/profile").then((r) => setProfile(r.data)).catch(() => setProfile({}));
  }, []);

  const p = profile || {};

  return (
    <>
      {/* Hero split */}
      <section data-testid="therapist-hero" className="grid md:grid-cols-2 min-h-[62vh]">
        <div className="relative bg-bb-warm overflow-hidden">
          <div className="absolute inset-0 opacity-90">
            <WatercolorEucalyptus className="w-full h-full" />
          </div>
          <div className="relative h-full min-h-[360px] flex items-end p-8 md:p-12">
            <div className="rounded-2xl bg-bb-warm/80 backdrop-blur px-5 py-4 shadow-soft">
              <p className="bb-eyebrow text-bb-teal">Presence</p>
              <p className="font-serif italic text-bb-forest text-lg">"A slow room, a steady voice."</p>
            </div>
          </div>
        </div>
        <div className="bg-bb-forest text-bb-cream flex items-center px-8 md:px-14 py-16 md:py-24">
          <div className="max-w-lg">
            <p className="bb-eyebrow text-bb-cream/70">Meet your therapist</p>
            <h1 className="mt-4 text-5xl md:text-6xl leading-[1.05]">
              {p.name || "Dr. Anaya Verma"}
            </h1>
            <p className="mt-3 font-serif italic text-bb-cream/80">{p.title || "Licensed Psychotherapist"}</p>
            <p className="mt-8 text-bb-cream/80 leading-relaxed">
              Every therapeutic relationship begins with trust. Here's a little
              about my background, approach, and the values that guide my work.
            </p>
            <Link
              to="/about-therapy"
              data-testid="therapist-cta"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bb-cream text-bb-forest hover:bg-white transition-colors"
            >
              Book your first consultation <ArrowRight size={16} strokeWidth={1.6}/>
            </Link>
          </div>
        </div>
      </section>

      {/* Personal note */}
      <section className="py-24">
        <div className="bb-container grid md:grid-cols-[1.1fr_1fr] gap-14 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl text-bb-forest">A personal note,</h2>
            <div className="mt-8 space-y-5 text-bb-forest/75 leading-relaxed">
              <p>{p.personal_note}</p>
              <p>{p.approach}</p>
              <p>I hope that when we work together, you feel heard, understood, and empowered to create meaningful change in a way that feels authentic to you.</p>
            </div>
          </div>
          <div className="relative aspect-square">
            <WatercolorSapling className="w-full h-full animate-drift" />
          </div>
        </div>
      </section>

      {/* Qualifications + Areas */}
      <section className="grid md:grid-cols-2">
        <div className="bg-[#DAE29F] p-10 md:p-16">
          <h3 className="text-3xl md:text-4xl text-bb-forest">Qualifications & experience</h3>
          <dl className="mt-10 space-y-6">
            {(p.qualifications || []).map((q) => (
              <div key={q.label} className="pb-6 border-b border-bb-forest/15">
                <dt className="font-serif text-lg text-bb-forest">{q.label}</dt>
                <dd className="mt-1 text-bb-forest/75">{q.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-[#2F5F5B] text-bb-cream p-10 md:p-16">
          <h3 className="text-3xl md:text-4xl">Areas I can help with</h3>
          <ul className="mt-10 space-y-4 text-lg">
            {(p.areas || []).map((a) => (
              <li key={a} data-testid={`area-${a.toLowerCase()}`} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-bb-cream/80" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Approach */}
      <section className="py-24">
        <div className="bb-container">
          <p className="bb-eyebrow">The room, held</p>
          <h3 className="mt-3 text-4xl md:text-5xl text-bb-forest">My therapeutic approach</h3>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(p.pillars || []).map((pi, i) => {
              const Art = PILLARS_ARTS[i % PILLARS_ARTS.length];
              return (
                <article
                  key={pi.title}
                  data-testid={`approach-${pi.title.toLowerCase()}`}
                  className="rounded-2xl bg-[#DDECF3] p-6 shadow-soft"
                >
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white/40 bb-wet-edge">
                    <Art className="w-full h-full" />
                  </div>
                  <h4 className="mt-5 font-serif text-2xl text-bb-forest">{pi.title}</h4>
                  <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed">{pi.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="pb-24">
        <div className="bb-container">
          <div className="rounded-3xl bg-[#DDECF3] p-8 md:p-14 grid md:grid-cols-[1fr_1fr] items-center gap-8">
            <div className="relative min-h-[220px]">
              <WatercolorBird className="w-64" />
            </div>
            <div className="text-right md:text-left">
              <h4 className="text-3xl md:text-4xl text-bb-forest">A quiet first step.</h4>
              <p className="mt-3 text-bb-forest/70 max-w-md">
                A short consultation, no pressure. You can decide how the story
                unfolds after that.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
              >
                Book a consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
