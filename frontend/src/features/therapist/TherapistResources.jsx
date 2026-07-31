import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

const EMPTY_FORM = { title: "", description: "", category: "Reflection", kind: "article", url: "", body: "", is_public: true };

export default function TherapistResources() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return therapistService.resources()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      title: r.title, description: r.description, category: r.category,
      kind: r.kind, url: r.url || "", body: r.body || "", is_public: r.is_public,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Add a title.");
    try {
      if (editingId) {
        await therapistService.updateResource(editingId, form);
        toast.success("Resource updated.");
      } else {
        await therapistService.createResource(form);
        toast.success("Resource added.");
      }
      cancelEdit();
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Library</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Resources</h1>

      <div className="mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div>
          {loading ? (
            <p className="text-bb-forest/60">Loading resources…</p>
          ) : error ? (
            <p className="text-bb-forest/60">Couldn't load resources. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
          ) : items.length === 0 ? (
            <p className="text-bb-forest/60">No resources yet. Add the first one.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6" data-testid="therapist-resources-list">
              {items.map((r) => (
                <article key={r.id} className="bg-bb-warm rounded-2xl p-6 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <p className="bb-eyebrow">{r.category}</p>
                    <button
                      onClick={() => startEdit(r)}
                      className="text-xs text-bb-teal hover:underline shrink-0"
                      data-testid={`edit-resource-${r.id}`}
                    >
                      Edit
                    </button>
                  </div>
                  <h3 className="mt-3 font-serif text-xl text-bb-forest">{r.title}</h3>
                  <p className="mt-2 text-sm text-bb-forest/70">{r.description}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="bg-bb-moss/50 rounded-3xl p-8 h-fit" data-testid="resource-form">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">{editingId ? "Edit resource" : "Add a resource"}</p>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-xs text-bb-forest/60 hover:text-bb-forest">
                Cancel
              </button>
            )}
          </div>
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
          <textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Full article text" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <button className="mt-4 w-full py-3 rounded-full bg-bb-forest text-bb-cream">
            {editingId ? "Save changes" : "Add resource"}
          </button>
        </form>
      </div>
    </div>
  );
}
