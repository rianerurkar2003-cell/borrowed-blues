import ConsultationDialog from "@/components/ConsultationDialog";
import therapistPhoto from "@/assets/therapist-photo.jpeg";
import personalNoteImg from "@/assets/personal-note.png";
import approachCompassion from "@/assets/approach-compassion.png";
import approachCollaboration from "@/assets/approach-collaboration.png";
import approachEvidenceBased from "@/assets/approach-evidence-based.png";
import approachGrowth from "@/assets/approach-growth.png";

const QUALIFICATIONS = [
  {
    label: "Education",
    items: [
      "M.A Psychology (Clinical), Mumbai University",
      "Certificate in Solution-Focused Brief Therapy",
      "Certificate in Transactional Analysis (TA 101)",
      "Certificate course in Gottman's Couple therapy",
      "Certificate course in Rational Emotive Behavioural Therapy and Acceptance and Commitment Therapy",
    ],
  },
  {
    label: "Experience",
    items: [
      "School Counsellor (1 year)",
      "Counselling Psychologist at AYJNISHD (1 year)",
      "Private Practice (Since May 2025)",
    ],
  },
  { label: "Professional Memberships", items: ["None"] },
  { label: "Languages", items: ["English, Hindi, Marathi"] },
];

const AREAS = [
  "Anxiety",
  "Depression",
  "Relationship issues",
  "Body image issues",
  "Rumination",
  "Self image issues",
  "Stress management",
  "Anger management",
  "Interpersonal problems",
];

const APPROACH = [
  { title: "Compassion", body: "You deserve a space where you feel heard without judgement.", img: approachCompassion },
  { title: "Collaboration", body: "Therapy is something we build together.", img: approachCollaboration },
  { title: "Evidence-Based", body: "My work is informed by research and tailored to your needs.", img: approachEvidenceBased },
  { title: "Growth", body: "Progress doesn't have to be perfect to be meaningful.", img: approachGrowth },
];

export default function MeetTherapist() {
  return (
    <>
      {/* HERO — full-bleed split screen: photo left, dark forest panel right. */}
      <section data-testid="therapist-hero" className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto">
          <img
            src={therapistPhoto}
            alt="Portrait of Anushka Prabhu, smiling, seated indoors."
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="bg-bb-forest text-bb-cream flex items-center px-8 md:px-16 py-16 md:py-24">
          <div className="max-w-lg">
            <h1 className="text-5xl md:text-6xl leading-[1.05] text-bb-mist">
              Meet Your Therapist
            </h1>
            <p className="mt-6 text-bb-cream/80 leading-relaxed">
              Every therapeutic relationship begins with trust. Here's a little
              about my background, approach, and the values that guide my work.
            </p>
            <ConsultationDialog>
              <button
                type="button"
                data-testid="therapist-cta"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-[40px] bg-bb-mist text-bb-forest hover:bg-white transition-colors"
              >
                Book Your First Consultation
              </button>
            </ConsultationDialog>
          </div>
        </div>
      </section>

      {/* PERSONAL NOTE — text left, artwork right, per reference layout. */}
      <section className="py-24">
        <div className="bb-container grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl text-bb-forest">A personal note,</h2>
            <div className="mt-8 space-y-5 text-bb-forest/85 leading-relaxed">
              <p>
                My decision to start a private practice came from a desire to
                prioritize my own mental health and create a way of working that
                allows me to be fully present—with both my clients and in my
                personal life. I believe that being able to show up authentically
                and without being consumed by work enables me to offer more
                thoughtful and compassionate care.
              </p>
              <p>
                Beginning therapy can feel daunting, and I will do my best to make
                the process as seamless and comfortable as possible.
              </p>
              <p>
                I have built this practice with the intention of creating a space
                where people from all walks of life feel understood and held as
                they explore the challenges they are facing or simply try to make
                sense of life. Therapy is not a one-size-fits-all process, and I
                believe that each person's needs, experiences, and goals deserve
                thoughtful consideration. My approach is collaborative, flexible,
                and always open to conversation, so we can shape the therapeutic
                journey together in a way that feels meaningful and supportive
                for you.
              </p>
            </div>
          </div>
          <div className="relative aspect-square max-w-md mx-auto md:mx-0">
            <img
              src={personalNoteImg}
              alt="A watercolor sapling standing on soft ground — a symbol of growth."
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </section>

      {/* QUALIFICATIONS + AREAS — split screen, Soft Light left / Deep Teal right. */}
      <section className="grid md:grid-cols-2">
        <div className="bg-bb-soft-light p-10 md:p-16">
          <h3 className="text-3xl md:text-4xl text-bb-forest">Qualifications &amp; Experience</h3>
          <dl className="mt-10 space-y-6">
            {QUALIFICATIONS.map((q) => (
              <div key={q.label}>
                <dt className="font-serif text-lg text-bb-forest">{q.label}:</dt>
                <dd className="mt-2 space-y-1 text-bb-forest/80 text-[15px] leading-relaxed">
                  {q.items.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bg-bb-teal text-bb-soft-light p-10 md:p-16">
          <h3 className="text-3xl md:text-4xl">Areas I can Help with</h3>
          <ul className="mt-10 space-y-4 text-lg">
            {AREAS.map((a) => (
              <li key={a} data-testid={`area-${a.toLowerCase().replace(/\s+/g, "-")}`}>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* THERAPEUTIC APPROACH — four cards on a Mist background. */}
      <section className="py-24">
        <div className="bb-container">
          <h3 className="text-4xl md:text-5xl text-bb-forest">My therapeutic approach</h3>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {APPROACH.map(({ title, body, img }) => (
              <article
                key={title}
                data-testid={`approach-${title.toLowerCase()}`}
                className="rounded-2xl bg-bb-mist p-6 shadow-soft"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-white/40">
                  <img src={img} alt={title} className="w-full h-full object-cover" />
                </div>
                <h4 className="mt-5 font-serif text-2xl text-bb-forest">{title}</h4>
                <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* READY FOR YOUR JOURNEY — full-bleed split, Sky left / Mist right. */}
      <section data-testid="therapist-ready" className="grid md:grid-cols-2">
        <div className="bg-bb-sky flex items-center px-8 md:px-16 py-16 min-h-[220px]">
          <h3 className="text-3xl md:text-4xl text-bb-soft-light">Ready for your journey?</h3>
        </div>
        <div className="bg-bb-mist flex items-center justify-center px-8 py-16">
          <ConsultationDialog>
            <button
              type="button"
              data-testid="therapist-bottom-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[40px] bg-bb-teal text-white hover:bg-bb-forest transition-colors"
            >
              Book a consultation
            </button>
          </ConsultationDialog>
        </div>
      </section>
    </>
  );
}
