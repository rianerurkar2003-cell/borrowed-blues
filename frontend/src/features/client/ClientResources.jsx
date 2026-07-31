import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

export default function ClientResources() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    return clientService.resources()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <p className="bb-eyebrow">A quiet library</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Resources for you</h1>
      {loading ? (
        <p className="mt-10 text-bb-forest/60">Loading resources…</p>
      ) : error ? (
        <p className="mt-10 text-bb-forest/60">Couldn't load resources. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-bb-forest/60">No resources yet. Check back soon.</p>
      ) : (
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="client-resources-list">
          {items.map((r) => (
            <article key={r.id} className="bg-bb-warm rounded-2xl p-6 shadow-soft">
              <p className="bb-eyebrow">{r.category}</p>
              <h3 className="mt-3 font-serif text-xl text-bb-forest">{r.title}</h3>
              <p className="mt-2 text-sm text-bb-forest/70">{r.description}</p>
              <Link to={`/portal/resources/${r.id}`} className="mt-4 inline-block text-sm text-bb-teal">Open →</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
