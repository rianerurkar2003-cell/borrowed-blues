import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { BirdFlock } from "@/components/Watercolor";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import upcomingSessionImg from "@/assets/upcoming-session.png";
import blueberriesBb1 from "@/assets/blueberries-bb1.png";

const QUOTES = [
  "Rest is not a reward. It is a form of care.",
  "You do not have to arrive to begin.",
  "Small moments of noticing add up.",
  "It is enough to have shown up today.",
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.dashboard()
      .then(setData)
      .catch((e) => toast.error(toAppError(e).message))
      .finally(() => setLoading(false));
  }, []);

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const first = data?.upcoming?.[0];
  const summary = data?.latest_summary;
  const hw = data?.homework || [];
  const reflections = data?.reflections || [];

  return (
    <div>
      <p className="bb-eyebrow">A gentle hello</p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl text-bb-forest">
        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, <span className="bb-italic-serif">{(user?.name || "").split(" ")[0]}.</span>
      </h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">We saved the small things you left last time. Take your time.</p>

      {loading ? (
        <p className="mt-10 text-bb-forest/60">Loading your dashboard…</p>
      ) : (
      <>
      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-bb-warm rounded-3xl p-8 shadow-soft relative overflow-hidden" data-testid="upcoming-card">
          <img src={upcomingSessionImg} alt="" className="absolute right-0 bottom-0 w-[130px] h-[65px] md:w-[380px] md:h-[190px] object-contain object-right opacity-90 pointer-events-none" />
          <p className="bb-eyebrow">Upcoming session</p>
          {first ? (
            <>
              <h2 className="mt-3 font-serif text-3xl text-bb-forest">
                {new Date(first.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <p className="mt-2 text-bb-forest/70">at {first.time} · {first.mode} · {first.duration_min} min</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/portal/appointments" className="px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">View details</Link>
                <Link to="/portal/appointments" className="px-5 py-2.5 rounded-full border border-bb-forest/30 text-bb-forest text-sm">Reschedule</Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 font-serif text-3xl text-bb-forest">Nothing scheduled yet.</h2>
              <p className="mt-2 text-bb-forest/70">Request a time whenever you're ready.</p>
              <Link to="/portal/appointments" className="mt-6 inline-flex px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Request a session</Link>
            </>
          )}
        </section>

        <section className="bg-bb-forest text-bb-cream rounded-3xl p-8 relative overflow-hidden">
          <img src={blueberriesBb1} alt="" className="absolute right-0 bottom-0 w-[100px] h-[50px] md:w-[220px] md:h-[110px] object-contain object-right opacity-90 pointer-events-none" />
          <p className="bb-eyebrow !text-bb-mist">A small note</p>
          <p className="mt-4 font-serif italic text-2xl leading-snug">"{quote}"</p>
        </section>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="summary-card">
          <p className="bb-eyebrow">Latest session summary</p>
          {summary ? (
            <>
              <h3 className="mt-3 font-serif text-2xl text-bb-forest">A note from your therapist</h3>
              <p className="mt-4 text-bb-forest/75 leading-relaxed">{summary.summary}</p>
              {summary.homework && <p className="mt-4 text-sm text-bb-teal">A gentle homework: {summary.homework}</p>}
            </>
          ) : (
            <p className="mt-4 text-bb-forest/60">Your therapist hasn't shared a summary yet.</p>
          )}
        </section>

        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="homework-card">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Homework</p>
            <Link to="/portal/homework" className="text-sm text-bb-teal hover:underline">View all →</Link>
          </div>
          {hw.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No open items. A quiet week.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {hw.slice(0, 3).map((h) => (
                <li key={h.id} className="flex items-start gap-3">
                  <Sparkles size={16} className="mt-1 text-bb-teal" strokeWidth={1.4}/>
                  <div>
                    <p className="font-serif text-lg text-bb-forest">{h.title}</p>
                    <p className="text-sm text-bb-forest/65">{h.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="reflections-card">
        <div className="flex items-center justify-between">
          <p className="bb-eyebrow">Your reflections</p>
          <Link to="/portal/journal" className="text-sm text-bb-teal hover:underline">Open journal →</Link>
        </div>
        {reflections.length === 0 ? (
          <p className="mt-4 text-bb-forest/60">Nothing yet. Even a sentence is enough.</p>
        ) : (
          <ul className="mt-4 divide-y divide-bb-moss/60">
            {reflections.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-serif text-lg text-bb-forest">{r.title}</p>
                <p className="text-sm text-bb-forest/65 line-clamp-2">{r.body}</p>
                <p className="mt-1 text-xs text-bb-forest/50">{new Date(r.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>
      )}

      <BirdFlock className="mt-16 w-40 opacity-60 mx-auto"/>
    </div>
  );
}
