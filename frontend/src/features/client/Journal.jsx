import { useCallback, useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import { JOURNAL } from "@/constants/testIds";

const MOODS = ["gentle", "tender", "quiet", "tired", "hopeful", "curious"];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("gentle");
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return clientService.reflections()
      .then(setEntries)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (is_draft) => {
    if (!body.trim()) return toast.error("Write a little something first.");
    try {
      await clientService.createReflection({
        title: title || "Untitled", body, mood, is_draft,
        visibility: shared ? "shared" : "private",
      });
      toast.success(is_draft ? "Saved as a draft." : "Reflection kept.");
      setTitle(""); setBody(""); setMood("gentle"); setShared(false); load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  const toggleVisibility = async (entry) => {
    const next = entry.visibility === "shared" ? "private" : "shared";
    try {
      await clientService.updateReflectionVisibility(entry.id, next);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, visibility: next } : e)));
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">A private notebook</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Reflection journal</h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid={JOURNAL.editor}>
          <p className="bb-eyebrow">A new entry</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="mt-5 w-full text-2xl font-serif text-bb-forest bg-transparent border-b border-bb-moss/70 focus:border-bb-teal py-2 outline-none"/>
          <textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Even a sentence is enough."
            data-testid={JOURNAL.body}
            className="mt-4 w-full bg-transparent text-bb-forest/85 outline-none leading-relaxed resize-none rounded-lg focus-visible:ring-2 focus-visible:ring-bb-teal/40"/>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-bb-forest/70">Mood</label>
            <select value={mood} onChange={(e) => setMood(e.target.value)}
              className="rounded-full bg-bb-moss/50 border border-bb-moss px-3 py-1.5 text-sm">
              {MOODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)}
              data-testid={JOURNAL.shareToggle}
              className="mt-0.5 h-4 w-4 rounded border-bb-moss text-bb-teal focus-visible:ring-2 focus-visible:ring-bb-teal/40"/>
            <span className="text-sm text-bb-forest/70">
              Share this entry with Anushka
              <span className="block text-xs text-bb-forest/50">She'll be able to read it. Off means only you can see it.</span>
            </span>
          </label>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => save(false)} data-testid={JOURNAL.save} className="px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Keep this</button>
            <button onClick={() => save(true)}  data-testid={JOURNAL.draft} className="px-5 py-2.5 rounded-full border border-bb-forest/30 text-bb-forest text-sm">Save as draft</button>
          </div>
        </div>

        <div>
          <p className="bb-eyebrow mb-4">Previous reflections</p>
          {loading ? (
            <p className="text-bb-forest/60">Loading your reflections…</p>
          ) : error ? (
            <p className="text-bb-forest/60">Couldn't load your reflections. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
          ) : entries.length === 0 ? (
            <p className="text-bb-forest/60">Nothing yet.</p>
          ) : (
            <ul className="space-y-4" data-testid={JOURNAL.list}>
              {entries.map((r) => (
                <li key={r.id} className="bg-bb-warm rounded-2xl p-6 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-xl text-bb-forest">{r.title}</p>
                    <span className="text-xs text-bb-forest/50">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-bb-forest/75 leading-relaxed whitespace-pre-line">{r.body}</p>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-bb-moss/70 text-bb-forest">{r.mood}</span>
                    {r.is_draft && <span className="px-2.5 py-1 rounded-full bg-bb-blue-2 text-bb-forest">draft</span>}
                    <button onClick={() => toggleVisibility(r)} data-testid={JOURNAL.visibilityToggle}
                      className="px-2.5 py-1 rounded-full bg-bb-moss/50 text-bb-forest hover:bg-bb-moss/70 transition-colors">
                      {r.visibility === "shared" ? "Shared" : "Only you"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
