import { useCallback, useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

export default function Homework() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return clientService.homework()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleComplete = async (h) => {
    try {
      await clientService.updateHomework(h.id, { completed: !h.completed, completed_items: h.completed_items || [] });
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };
  const toggleItem = async (h, idx) => {
    const done = new Set(h.completed_items || []);
    done.has(idx) ? done.delete(idx) : done.add(idx);
    try {
      await clientService.updateHomework(h.id, { completed: h.completed, completed_items: Array.from(done) });
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Between sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Homework</h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">Tender practices, not deadlines. Return whenever it feels possible.</p>

      {loading ? (
        <p className="mt-10 text-bb-forest/60">Loading your homework…</p>
      ) : error ? (
        <p className="mt-10 text-bb-forest/60">Couldn't load your homework. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-bb-forest/60">No homework yet.</p>
      ) : (
      <ul className="mt-10 space-y-6" data-testid="homework-list">
        {items.map((h) => (
          <li key={h.id} className={`bg-bb-warm rounded-3xl p-8 shadow-soft ${h.completed ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bb-eyebrow">{h.type}</span>
                  {h.completed && <span className="text-xs px-2 py-0.5 rounded-full bg-bb-moss/70 text-bb-forest">complete</span>}
                </div>
                <h3 className="mt-2 font-serif text-2xl text-bb-forest">{h.title}</h3>
                <p className="mt-2 text-bb-forest/75 leading-relaxed">{h.description}</p>
              </div>
              <button onClick={() => toggleComplete(h)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm ${h.completed ? "border border-bb-forest/30 text-bb-forest" : "bg-bb-forest text-bb-cream"}`}>
                {h.completed ? "Mark open" : "Mark complete"}
              </button>
            </div>

            {h.type === "checklist" && h.items && (
              <ul className="mt-5 space-y-2">
                {h.items.map((step, idx) => {
                  const done = (h.completed_items || []).includes(idx);
                  return (
                    <li key={idx}>
                      <label className="flex items-center gap-3 text-bb-forest">
                        <input type="checkbox" checked={done} onChange={() => toggleItem(h, idx)}
                          className="rounded border-bb-moss text-bb-teal focus:ring-bb-teal"/>
                        <span className={done ? "line-through text-bb-forest/50" : ""}>{step}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
