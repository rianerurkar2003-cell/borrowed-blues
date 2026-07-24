import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { WatercolorEucalyptus, BirdFlock } from "@/components/Watercolor";
import { toast } from "sonner";

const EMPTY_DASH = { today: [], upcoming: [], requests: [], reflections: [], client_count: 0 };

export default function TherapistDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(EMPTY_DASH);
  const [clients, setClients] = useState([]);
  useEffect(() => {
    therapistService.dashboard().then(setData).catch((e) => toast.error(toAppError(e).message));
    therapistService.clients().then(setClients).catch((e) => toast.error(toAppError(e).message));
  }, []);
  const nameById = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return (
    <div>
      <p className="bb-eyebrow">Today's practice</p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl text-bb-forest">
        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, <span className="bb-italic-serif">{(user?.name || "").split(" ")[0] || "Doctor"}.</span>
      </h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">{data.today.length} session{data.today.length === 1 ? "" : "s"} today. {data.requests.length} new request{data.requests.length === 1 ? "" : "s"} waiting.</p>

      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-bb-warm rounded-3xl p-8 shadow-soft relative overflow-hidden" data-testid="today-card">
          <div className="absolute -right-8 -bottom-8 w-56 opacity-40">
            <WatercolorEucalyptus className="w-full h-full"/>
          </div>
          <p className="bb-eyebrow">Today's schedule</p>
          {data.today.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">Nothing on your calendar today. A rare gift.</p>
          ) : (
            <ul className="mt-4 divide-y divide-bb-moss/60">
              {data.today.map((a) => (
                <li key={a.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl text-bb-forest">{a.time}</p>
                    <p className="text-sm text-bb-forest/65">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-bb-moss/70 text-bb-forest capitalize">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-bb-forest text-bb-cream rounded-3xl p-8 relative overflow-hidden">
          <p className="bb-eyebrow text-bb-cream/70">Quick actions</p>
          <div className="mt-5 grid gap-3">
            <Link to="/therapist/calendar" className="px-5 py-3 rounded-full bg-bb-cream/95 text-bb-forest text-sm text-center">Schedule a session</Link>
            <Link to="/therapist/requests" className="px-5 py-3 rounded-full border border-bb-cream/40 text-bb-cream text-sm text-center">Review requests ({data.requests.length})</Link>
            <Link to="/therapist/clients"  className="px-5 py-3 rounded-full border border-bb-cream/40 text-bb-cream text-sm text-center">Open a client</Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="upcoming-sessions">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Upcoming sessions</p>
            <Link to="/therapist/calendar" className="text-sm text-bb-teal hover:underline">Open calendar →</Link>
          </div>
          {data.upcoming.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No upcoming sessions.</p>
          ) : (
            <ul className="mt-4 divide-y divide-bb-moss/60">
              {data.upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="py-4">
                  <p className="font-serif text-lg text-bb-forest">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {a.time}
                  </p>
                  <p className="text-sm text-bb-forest/65">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="consultation-requests">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Consultation requests</p>
            <Link to="/therapist/requests" className="text-sm text-bb-teal hover:underline">All requests →</Link>
          </div>
          {data.requests.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No new requests right now.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.requests.slice(0, 3).map((r) => (
                <li key={r.id} className="p-4 rounded-2xl bg-bb-moss/40">
                  <p className="font-serif text-lg text-bb-forest">{r.name}</p>
                  <p className="text-sm text-bb-forest/70">{r.reason}</p>
                  <p className="text-xs text-bb-forest/50 mt-1">{r.preferred_time || "any time"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="recent-reflections">
        <div className="flex items-center justify-between">
          <p className="bb-eyebrow">Recent client reflections</p>
          <Link to="/therapist/clients" className="text-sm text-bb-teal hover:underline">Client list →</Link>
        </div>
        {data.reflections.length === 0 ? (
          <p className="mt-4 text-bb-forest/60">No reflections shared yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-bb-moss/60">
            {data.reflections.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-serif text-lg text-bb-forest">{r.title}</p>
                <p className="text-sm text-bb-forest/70 line-clamp-2">{r.body}</p>
                <p className="mt-1 text-xs text-bb-forest/50">{nameById[r.user_id] || "Client"} · {new Date(r.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BirdFlock className="mt-16 w-40 opacity-60 mx-auto"/>
    </div>
  );
}
