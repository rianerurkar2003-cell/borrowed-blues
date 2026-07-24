import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { publicService } from "@/services/public.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

const EMPTY_FORM = { title: "", description: "", category: "Reflection", kind: "article", url: "", body: "", is_public: true };

export default function TherapistResources() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(() => {
    publicService.resources().then(setItems).catch((e) => toast.error(toAppError(e).message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Add a title.");
    try {
      await therapistService.createResource(form);
      toast.success("Resource added.");
      setForm(EMPTY_FORM);
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Library</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Resources</h1>

      <div className="mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div>
          <ul className="grid sm:grid-cols-2 gap-4" data-testid="therapist-resources-list">
            {items.map((r) => (
              <li key={r.id} className="bg-bb-warm rounded-2xl p-5 shadow-soft">
                <p className="bb-eyebrow">{r.category}</p>
                <p className="mt-2 font-serif text-lg text-bb-forest">{r.title}</p>
                <p className="mt-1 text-sm text-bb-forest/70">{r.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={create} className="bg-bb-moss/50 rounded-3xl p-8 h-fit" data-testid="resource-form">
          <p className="bb-eyebrow">Add a resource</p>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Category" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
            <option value="article">Article</option><option value="pdf">PDF</option><option value="video">Video</option><option value="link">Link</option>
          </select>
          <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Link (optional)" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <button className="mt-4 w-full py-3 rounded-full bg-bb-forest text-bb-cream">Add resource</button>
        </form>
      </div>
    </div>
  );
}
