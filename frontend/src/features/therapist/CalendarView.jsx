import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import StatusBadge from "@/shared/components/StatusBadge";

const EMPTY_FORM = { client_id: "", date: "", time: "10:00", mode: "online", duration_min: 50 };

export default function CalendarView() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return therapistService.appointments()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
    therapistService.clients().then(setClients).catch((e) => toast.error(toAppError(e).message));
  }, [load]);
  const nameById = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.date) return toast.error("Choose a client and a date.");
    try {
      await therapistService.createAppointment(form);
      toast.success("Appointment scheduled.");
      setForm(EMPTY_FORM);
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  const setStatus = async (a, status) => {
    try {
      await therapistService.updateAppointment(a.id, { status });
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">All sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Calendar</h1>

      <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="calendar-list">
          {loading ? (
            <p className="text-bb-forest/60">Loading the calendar…</p>
          ) : error ? (
            <p className="text-bb-forest/60">Couldn't load the calendar. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
          ) : items.length === 0 ? (
            <p className="text-bb-forest/60">Nothing scheduled yet.</p>
          ) : (
            <ul className="divide-y divide-bb-moss/60">
              {items.map((a) => (
                <li key={a.id} className="py-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg text-bb-forest">
                      {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {a.time}
                    </p>
                    <p className="text-sm text-bb-forest/70">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {a.status !== "completed" && (
                      <button onClick={() => setStatus(a, "completed")} className="text-xs px-3 py-1 rounded-full border border-bb-forest/25 text-bb-forest">Mark done</button>
                    )}
                    {a.status !== "cancelled" && (
                      <button onClick={() => setStatus(a, "cancelled")} className="text-xs px-3 py-1 rounded-full border border-bb-forest/25 text-bb-forest/70">Cancel</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={submit} className="bg-bb-moss/50 rounded-3xl p-8 h-fit" data-testid="calendar-form">
          <p className="bb-eyebrow">New appointment</p>
          <label className="block mt-4 text-sm text-bb-forest/80">Client
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
              <option value="">Select a client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Date
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
              <option value="online">Online</option><option value="in-person">In person</option>
            </select>
          </label>
          <button className="mt-6 w-full py-3 rounded-full bg-bb-forest text-bb-cream">Schedule</button>
          <p className="mt-3 text-xs text-bb-forest/60">Google Calendar sync coming soon.</p>
        </form>
      </div>
    </div>
  );
}
