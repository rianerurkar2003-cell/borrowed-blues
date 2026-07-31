import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import resourcesHero from "@/assets/resources-hero.png";
import copingIceInHand from "@/assets/coping-ice-in-hand.png";
import copingColdWaterSplash from "@/assets/coping-cold-water-splash.png";
import copingButterflyHug from "@/assets/coping-butterfly-hug.png";
import copingGrounding from "@/assets/coping-grounding.png";

/* ---------- content ---------- */

const BREATHING_EXERCISES = [
  {
    id: "box",
    title: "Box Breathing",
    description: "A steady four-part rhythm to settle a racing mind.",
    duration: "~2 min",
    cycles: 8,
    phases: [
      { label: "Breathe in", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Breathe out", seconds: 4 },
      { label: "Hold", seconds: 4 },
    ],
  },
  {
    id: "478",
    title: "4-7-8 Breathing",
    description: "A longer exhale to gently ease the body toward rest.",
    duration: "~2 min",
    cycles: 6,
    phases: [
      { label: "Breathe in", seconds: 4 },
      { label: "Hold", seconds: 7 },
      { label: "Breathe out", seconds: 8 },
    ],
  },
  {
    id: "belly",
    title: "Belly Breathing",
    description: "Slow, deep breaths that soften the chest and shoulders.",
    duration: "~3 min",
    cycles: 16,
    phases: [
      { label: "Breathe in", seconds: 5 },
      { label: "Breathe out", seconds: 6 },
    ],
  },
  {
    id: "alternate",
    title: "Alternate Nostril Breathing",
    description: "A gentle, balancing pattern between left and right.",
    duration: "~3 min",
    cycles: 8,
    phases: [
      { label: "Breathe in — left side", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Breathe out — right side", seconds: 4 },
      { label: "Breathe in — right side", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Breathe out — left side", seconds: 4 },
    ],
  },
];

const COPING_TOOLS = [
  {
    id: "ice",
    title: "Ice in the Hand",
    img: copingIceInHand,
    blurb: "A sharp, grounding sensation that interrupts overwhelm.",
    whyItHelps:
      "Holding something intensely cold gives the body a strong, safe physical sensation to focus on. It can interrupt a spiral of anxious or overwhelming thoughts by bringing attention back to the present moment.",
    whenToUse:
      "When emotions feel too big to sit with, or when you notice yourself dissociating, panicking, or spiraling.",
    steps: [
      "Hold a piece of ice in your hand, or place your hand in a bowl of ice water.",
      "Notice the sensation without trying to change it — the cold, the tingling, the ache.",
      "Let your attention rest on the feeling in your hand rather than your thoughts.",
      "Hold for as long as feels bearable, then let go and notice how your body feels.",
    ],
    whenToStop:
      "Stop as soon as the sensation becomes painful rather than intense, or if you have any circulation or skin sensitivity concerns.",
  },
  {
    id: "cold-water",
    title: "Cold Water Splash",
    img: copingColdWaterSplash,
    blurb: "A quick reset for the nervous system, using cold water.",
    whyItHelps:
      "Cold water on the face can activate the body's dive reflex, gently slowing the heart rate and calming the nervous system when it's in a state of high alert.",
    whenToUse:
      "During a panic spike, after a distressing moment, or whenever you need a fast, physical way to come back to yourself.",
    steps: [
      "Run cool water over your hands or splash it gently on your face.",
      "Pause and feel the temperature change on your skin.",
      "Take a slow breath as the sensation settles.",
      "Repeat once or twice if it feels helpful.",
    ],
    whenToStop:
      "Stop if the water feels too cold or uncomfortable, or if you have a heart condition that cold exposure could affect — check with your doctor if unsure.",
  },
  {
    id: "butterfly-hug",
    title: "Butterfly Hug",
    img: copingButterflyHug,
    blurb: "A self-soothing, bilateral tapping technique.",
    whyItHelps:
      "The gentle, alternating tapping mimics bilateral stimulation used in trauma-informed therapies, which can help soothe the nervous system and create a felt sense of safety and self-comfort.",
    whenToUse:
      "When you need comfort but are on your own, or alongside any moment that calls for a little extra gentleness.",
    steps: [
      "Cross your arms over your chest, hands resting on your upper arms.",
      "Gently and slowly tap one hand, then the other, in a slow alternating rhythm.",
      "Breathe slowly as you tap, letting your shoulders soften.",
      "Continue for as long as feels comforting — there's no set amount of time.",
    ],
    whenToStop:
      "Stop whenever you feel ready, or if the tapping starts to feel agitating rather than soothing.",
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 Grounding",
    img: copingGrounding,
    blurb: "A sensory technique to bring you back to the present.",
    whyItHelps:
      "Naming things you can sense right now gently redirects attention away from anxious thoughts and toward the present moment, using your senses as an anchor.",
    whenToUse:
      "When your mind is racing, when you feel disconnected from your surroundings, or before a moment that feels overwhelming.",
    steps: [
      "Notice 5 things you can see around you.",
      "Notice 4 things you can physically feel (your feet on the floor, fabric on your skin).",
      "Notice 3 things you can hear.",
      "Notice 2 things you can smell.",
      "Notice 1 thing you can taste.",
    ],
    whenToStop:
      "There's no need to rush — move through the senses slowly, and stop whenever you feel steadier.",
  },
];

/* ---------- breathing session ---------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function BreathingSession({ exercise, onClose }) {
  const [cycle, setCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [done, setDone] = useState(false);
  const reducedMotion = useReducedMotion();
  const timeoutRef = useRef(null);
  // Tracks the ripple's expand/contract target. Unlike deriving it fresh from
  // the current phase, this only changes on "in"/"out" phases — a "Hold"
  // phase intentionally leaves it untouched, so the ripple stays exactly
  // where it was (expanded after inhaling, contracted after exhaling).
  const [expanded, setExpanded] = useState(true);

  const phase = exercise.phases[phaseIndex];

  useEffect(() => {
    if (/in/i.test(phase.label)) setExpanded(true);
    else if (/out/i.test(phase.label)) setExpanded(false);
  }, [phase.label]);

  useEffect(() => {
    if (done) return undefined;
    timeoutRef.current = setTimeout(() => {
      const nextPhaseIndex = phaseIndex + 1;
      if (nextPhaseIndex < exercise.phases.length) {
        setPhaseIndex(nextPhaseIndex);
      } else {
        const nextCycle = cycle + 1;
        if (nextCycle < exercise.cycles) {
          setCycle(nextCycle);
          setPhaseIndex(0);
        } else {
          setDone(true);
        }
      }
    }, phase.seconds * 1000);
    return () => clearTimeout(timeoutRef.current);
  }, [phaseIndex, cycle, done, exercise, phase.seconds]);

  const scaleClass = reducedMotion ? "" : expanded ? "scale-100" : "scale-[0.7]";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.title} — breathing session`}
      className="fixed inset-0 z-50 bg-bb-forest flex flex-col items-center justify-center px-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="End breathing session"
        data-testid="breathing-close"
        className="absolute top-6 right-6 md:top-10 md:right-10 text-bb-cream/70 hover:text-bb-cream transition-colors"
      >
        <X size={26} strokeWidth={1.4} />
      </button>

      {!done ? (
        <>
          {/* A still-water ripple, standing in for a plain circle: concentric
              rings fading outward, expanding/contracting together as one
              calm, unified shape rather than a solid dot. */}
          <div
            aria-hidden
            className={`relative w-48 h-48 md:w-64 md:h-64 transition-transform ease-in-out ${scaleClass}`}
            style={{ transitionDuration: `${phase.seconds}s` }}
          >
            <span className="absolute inset-0 rounded-full border border-bb-cream/10" />
            <span className="absolute inset-[13%] rounded-full border border-bb-cream/18" />
            <span className="absolute inset-[26%] rounded-full border border-bb-cream/28" />
            <span className="absolute inset-[39%] rounded-full border border-bb-cream/40" />
            <span className="absolute inset-[48%] rounded-full bg-bb-cream/55" />
          </div>
          <p
            key={phaseIndex + "-" + cycle}
            className="mt-12 font-serif text-3xl md:text-4xl text-bb-cream text-center"
            aria-live="polite"
          >
            {phase.label}
          </p>
          <p className="mt-4 text-bb-cream/50 text-sm tracking-wide">
            {exercise.title} · cycle {cycle + 1} of {exercise.cycles}
          </p>
        </>
      ) : (
        <div className="text-center animate-fade-in">
          <p className="font-serif italic text-2xl md:text-3xl text-bb-cream">
            Take a moment to notice how you feel.
          </p>
          <button
            type="button"
            onClick={onClose}
            data-testid="breathing-done-close"
            className="mt-10 px-6 py-3 rounded-[40px] bg-bb-cream text-bb-forest hover:bg-bb-mist transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function BreathingCard({ exercise, onStart }) {
  return (
    <article
      data-testid={`breathing-${exercise.id}`}
      className="bg-bb-warm rounded-2xl p-8 shadow-soft flex flex-col"
    >
      <div
        aria-hidden
        className="w-16 h-16 rounded-full bg-bb-mist flex items-center justify-center"
      >
        <span className="w-6 h-6 rounded-full bg-bb-sky/70" />
      </div>
      <h3 className="mt-6 font-serif text-2xl text-bb-forest">{exercise.title}</h3>
      <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed flex-1">
        {exercise.description}
      </p>
      <p className="mt-4 text-xs uppercase tracking-widest text-bb-forest/45">
        {exercise.duration}
      </p>
      <button
        type="button"
        onClick={() => onStart(exercise)}
        data-testid={`breathing-start-${exercise.id}`}
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[40px] bg-bb-forest text-bb-cream hover:bg-bb-teal transition-colors"
      >
        Start
      </button>
    </article>
  );
}

/* ---------- coping tools ---------- */

function CopingCard({ tool, open, onToggle }) {
  return (
    <article
      data-testid={`coping-${tool.id}`}
      className="bg-bb-warm rounded-2xl overflow-hidden shadow-soft"
    >
      <div className="aspect-[4/3] bg-bb-moss/40">
        <img src={tool.img} alt={tool.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-8">
        <h3 className="font-serif text-2xl text-bb-forest">{tool.title}</h3>
        <p className="mt-2 text-bb-forest/70 text-[15px] leading-relaxed">{tool.blurb}</p>
        <button
          type="button"
          onClick={() => onToggle(tool.id)}
          aria-expanded={open}
          aria-controls={`coping-steps-${tool.id}`}
          data-testid={`coping-view-steps-${tool.id}`}
          className="mt-5 text-sm text-bb-teal hover:text-bb-forest transition-colors"
        >
          {open ? "Hide steps" : "View Steps"}
        </button>

        {open && (
          <div
            id={`coping-steps-${tool.id}`}
            className="mt-6 pt-6 border-t border-bb-moss/60 space-y-5 animate-fade-in"
          >
            <div>
              <p className="bb-eyebrow">Why it helps</p>
              <p className="mt-2 text-bb-forest/80 text-[15px] leading-relaxed">{tool.whyItHelps}</p>
            </div>
            <div>
              <p className="bb-eyebrow">When to use it</p>
              <p className="mt-2 text-bb-forest/80 text-[15px] leading-relaxed">{tool.whenToUse}</p>
            </div>
            <div>
              <p className="bb-eyebrow">Steps</p>
              <ol className="mt-2 space-y-2 text-bb-forest/80 text-[15px] leading-relaxed list-decimal list-inside">
                {tool.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="bb-eyebrow">When to stop</p>
              <p className="mt-2 text-bb-forest/80 text-[15px] leading-relaxed">{tool.whenToStop}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- reflection space ---------- */

function JournalPanel({ testId, heading, prompt, value, onChange, onErase }) {
  return (
    <div data-testid={testId} className="p-8 md:p-14 flex flex-col min-h-[420px]">
      <h3 className="font-serif text-3xl md:text-4xl text-bb-forest">{heading}</h3>
      <p className="mt-3 text-bb-forest/60 italic">{prompt}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={heading}
        placeholder="Begin writing…"
        className="mt-8 flex-1 w-full bg-transparent border-none outline-none resize-none font-serif text-lg text-bb-forest leading-[2] placeholder:text-bb-forest/35 rounded-lg focus-visible:ring-2 focus-visible:ring-bb-teal/40"
      />
      <button
        type="button"
        onClick={onErase}
        data-testid={`${testId}-erase`}
        className="mt-6 self-start px-5 py-2.5 rounded-[40px] text-sm bg-bb-moss/60 text-bb-forest hover:bg-bb-teal hover:text-white transition-colors"
      >
        Erase
      </button>
    </div>
  );
}

/* ---------- page ---------- */

export default function Resources() {
  const [activeExercise, setActiveExercise] = useState(null);
  const [openCoping, setOpenCoping] = useState(null);
  const [sosText, setSosText] = useState("");
  const [feelingText, setFeelingText] = useState("");

  return (
    <>
      {/* HERO — title unchanged, illustration replaced. */}
      <section className="relative overflow-hidden">
        <div className="bb-container pt-24 pb-16 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <p className="bb-eyebrow">Reading &amp; reflection</p>
            <h1 className="mt-4 text-5xl md:text-7xl text-bb-forest leading-[1.03]">
              A quiet <span className="bb-italic-serif">library.</span>
            </h1>
            <p className="mt-6 text-bb-forest/70 max-w-xl leading-relaxed">
              A slowly-growing collection of articles, downloads, and gentle
              exercises — written to feel less like homework and more like a
              conversation.
            </p>
          </div>
          <div className="hidden md:flex justify-end">
            <img
              src={resourcesHero}
              alt="Watercolor illustration of two bluebirds resting on a berry branch."
              className="w-[490px] h-[490px] object-contain"
            />
          </div>
        </div>
      </section>

      {/* LET'S BREATHE */}
      <section className="py-20 md:py-28">
        <div className="bb-container">
          <p className="bb-eyebrow">Let's Breathe</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest max-w-2xl">
            A few slow minutes, whenever you need them.
          </h2>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BREATHING_EXERCISES.map((ex) => (
              <BreathingCard key={ex.id} exercise={ex} onStart={setActiveExercise} />
            ))}
          </div>
        </div>
      </section>

      {/* LET'S COPE */}
      <section className="py-20 md:py-28 bg-bb-warm/60">
        <div className="bb-container">
          <p className="bb-eyebrow">Let's Cope</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest max-w-2xl">
            Gentle tools for difficult moments.
          </h2>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COPING_TOOLS.map((tool) => (
              <CopingCard
                key={tool.id}
                tool={tool}
                open={openCoping === tool.id}
                onToggle={(id) => setOpenCoping((cur) => (cur === id ? null : id))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* REFLECTION SPACE */}
      <section className="py-20 md:py-28">
        <div className="bb-container">
          <p className="bb-eyebrow">Reflection Space</p>
          <h2 className="mt-3 text-4xl md:text-5xl text-bb-forest max-w-2xl">
            A page for whatever's on your mind.
          </h2>
          <div className="mt-14 rounded-3xl bg-bb-warm shadow-soft overflow-hidden grid md:grid-cols-2 md:divide-x divide-bb-moss/60">
            <JournalPanel
              testId="journal-sos"
              heading="SOS Journal"
              prompt="What's happening right now, in this moment?"
              value={sosText}
              onChange={setSosText}
              onErase={() => setSosText("")}
            />
            <div className="border-t md:border-t-0 border-bb-moss/60">
              <JournalPanel
                testId="journal-feeling"
                heading="How Are You Feeling Today?"
                prompt="No right answer — just write what comes."
                value={feelingText}
                onChange={setFeelingText}
                onErase={() => setFeelingText("")}
              />
            </div>
          </div>
        </div>
      </section>

      {activeExercise && (
        <BreathingSession exercise={activeExercise} onClose={() => setActiveExercise(null)} />
      )}
    </>
  );
}
