import { useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

export default function ClientResources() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    clientService.resources().then(setItems).catch((e) => toast.error(toAppError(e).message));
  }, []);
  return (
    <div>
      <p className="bb-eyebrow">A quiet library</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Resources for you</h1>
      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="client-resources-list">
        {items.map((r) => (
          <article key={r.id} className="bg-bb-warm rounded-2xl p-6 shadow-soft">
            <p className="bb-eyebrow">{r.category}</p>
            <h3 className="mt-3 font-serif text-xl text-bb-forest">{r.title}</h3>
            <p className="mt-2 text-sm text-bb-forest/70">{r.description}</p>
            <a href={r.url || "#"} className="mt-4 inline-block text-sm text-bb-teal">Open →</a>
          </article>
        ))}
      </div>
    </div>
  );
}
