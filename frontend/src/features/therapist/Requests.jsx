import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

export default function Requests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return therapistService.requests()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await therapistService.updateRequestStatus(id, status);
      toast.success("Updated.");
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Inbox</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Consultation requests</h1>

      {loading ? (
        <p className="mt-10 text-bb-forest/60">Loading requests…</p>
      ) : error ? (
        <p className="mt-10 text-bb-forest/60">Couldn't load requests. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-bb-forest/60">No requests yet.</p>
      ) : (
        <ul className="mt-10 space-y-4" data-testid="requests-list">
          {items.map((r) => (
            <li key={r.id} className="bg-bb-warm rounded-3xl p-8 shadow-soft grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <p className="font-serif text-2xl text-bb-forest">{r.name}</p>
                <p className="text-sm text-bb-forest/60">{r.email} {r.phone ? `· ${r.phone}` : ""}</p>
                <p className="mt-3 text-bb-forest/75">{r.reason}</p>
                {r.preferred_time && <p className="mt-2 text-sm text-bb-teal">Preferred: {r.preferred_time}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-bb-moss/70 text-bb-forest capitalize">{r.status}</span>
                {r.status !== "accepted" && <button onClick={() => setStatus(r.id, "accepted")} className="text-sm px-4 py-2 rounded-full bg-bb-forest text-bb-cream">Accept</button>}
                {r.status !== "declined" && <button onClick={() => setStatus(r.id, "declined")} className="text-sm px-4 py-2 rounded-full border border-bb-forest/30 text-bb-forest">Decline</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
