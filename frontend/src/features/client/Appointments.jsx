import { useCallback, useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import StatusBadge from "@/shared/components/StatusBadge";

const EMPTY_FORM = { date: "", time: "10:00", mode: "online", notes: "" };

export default function Appointments() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    clientService.appointments()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const request = async (e) => {
    e.preventDefault();
    try {
      await clientService.requestAppointment(form);
      toast.success("Request sent. Your therapist will confirm soon.");
      setForm(EMPTY_FORM);
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Appointments</h1>

      <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="appointment-list">
          <p className="bb-eyebrow mb-6">Your calendar</p>
          {loading ? (
            <p className="text-bb-forest/60">Loading your sessions…</p>
          ) : error ? (
            <p className="text-bb-forest/60">Couldn't load your sessions. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
          ) : items.length === 0 ? (
            <p className="text-bb-forest/60">No sessions yet.</p>
          ) : (
            <ul className="divide-y divide-bb-moss/60">
              {items.map((a) => (
                <li key={a.id} className="py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl text-bb-forest">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-sm text-bb-forest/65">{a.time} · {a.mode} · {a.duration_min} min</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={request} className="bg-bb-moss/50 rounded-3xl p-8" data-testid="appointment-request">
          <p className="bb-eyebrow">Request a session</p>
          <h3 className="mt-2 font-serif text-2xl text-bb-forest">A quiet ask.</h3>
          <label className="block mt-6 text-sm text-bb-forest/80">Date
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Time
            <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Mode
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">A short note (optional)
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <button className="mt-6 w-full py-3 rounded-full bg-bb-forest text-bb-cream" data-testid="appointment-submit">Send request</button>
        </form>
      </div>
    </div>
  );
}
