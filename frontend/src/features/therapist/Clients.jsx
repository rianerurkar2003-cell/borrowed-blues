import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

const EMPTY_NOTE = { summary: "", homework: "", shared_with_client: true };
const EMPTY_HW   = { title: "", description: "", type: "writing" };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE);
  const [hwForm, setHwForm] = useState(EMPTY_HW);

  useEffect(() => {
    therapistService.clients().then((cs) => {
      setClients(cs);
      if (cs[0]) setSelected(cs[0]);
    }).catch((e) => toast.error(toAppError(e).message));
  }, []);

  const loadNotes = useCallback((clientId) => {
    therapistService.sessionNotes(clientId).then(setNotes).catch((e) => toast.error(toAppError(e).message));
  }, []);
  useEffect(() => { if (selected) loadNotes(selected.id); }, [selected, loadNotes]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteForm.summary.trim()) return toast.error("Add a short summary.");
    try {
      await therapistService.createSessionNote({ client_id: selected.id, ...noteForm });
      toast.success("Session note saved.");
      setNoteForm(EMPTY_NOTE);
      loadNotes(selected.id);
    } catch (err) { toast.error(toAppError(err).message); }
  };

  const assignHw = async (e) => {
    e.preventDefault();
    if (!hwForm.title.trim()) return toast.error("Give it a title.");
    try {
      await therapistService.assignHomework({ client_id: selected.id, ...hwForm });
      toast.success("Homework assigned gently.");
      setHwForm(EMPTY_HW);
    } catch (err) { toast.error(toAppError(err).message); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Your people</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Clients</h1>

      <div className="mt-10 grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="bg-bb-warm rounded-3xl p-4 shadow-soft h-fit" data-testid="client-list">
          <ul className="divide-y divide-bb-moss/60">
            {clients.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c)}
                  data-testid={`client-item-${c.id}`}
                  className={`w-full text-left px-3 py-3 rounded-xl ${selected?.id === c.id ? "bg-bb-moss/60 text-bb-forest" : "text-bb-forest/70 hover:bg-bb-moss/30"}`}
                >
                  <p className="font-serif text-lg">{c.name}</p>
                  <p className="text-xs text-bb-forest/55">{c.email}</p>
                </button>
              </li>
            ))}
            {clients.length === 0 && <p className="text-sm text-bb-forest/60 p-3">No clients yet.</p>}
          </ul>
        </aside>

        <div>
          {selected ? (
            <>
              <div className="bg-bb-warm rounded-3xl p-8 shadow-soft">
                <p className="bb-eyebrow">Client</p>
                <h2 className="mt-2 font-serif text-3xl text-bb-forest">{selected.name}</h2>
                <p className="text-bb-forest/70">{selected.email}</p>
              </div>

              <form onSubmit={addNote} className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="session-note-form">
                <p className="bb-eyebrow">New session summary</p>
                <textarea rows={4} value={noteForm.summary} onChange={(e) => setNoteForm({ ...noteForm, summary: e.target.value })}
                  placeholder="What did the session hold?"
                  className="mt-3 w-full rounded-xl bg-bb-cream border border-bb-moss px-4 py-3 leading-relaxed"/>
                <input value={noteForm.homework} onChange={(e) => setNoteForm({ ...noteForm, homework: e.target.value })}
                  placeholder="Optional homework"
                  className="mt-3 w-full rounded-xl bg-bb-cream border border-bb-moss px-4 py-3"/>
                <label className="mt-3 flex items-center gap-2 text-sm text-bb-forest/80">
                  <input type="checkbox" checked={noteForm.shared_with_client}
                    onChange={(e) => setNoteForm({ ...noteForm, shared_with_client: e.target.checked })}
                    className="rounded border-bb-moss text-bb-teal"/>
                  Share this summary with the client
                </label>
                <button className="mt-4 px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Save note</button>
              </form>

              <form onSubmit={assignHw} className="mt-6 bg-bb-moss/50 rounded-3xl p-8" data-testid="homework-assign-form">
                <p className="bb-eyebrow">Assign homework</p>
                <input value={hwForm.title} onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  placeholder="Title"
                  className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
                <textarea rows={3} value={hwForm.description} onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  placeholder="What would you like them to try?"
                  className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
                <select value={hwForm.type} onChange={(e) => setHwForm({ ...hwForm, type: e.target.value })}
                  className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
                  <option value="writing">Writing prompt</option>
                  <option value="checklist">Checklist</option>
                  <option value="breathing">Breathing exercise</option>
                  <option value="reading">Reading resource</option>
                </select>
                <button className="mt-4 px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Assign</button>
              </form>

              <section className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft">
                <p className="bb-eyebrow">Session notes</p>
                <ul className="mt-4 divide-y divide-bb-moss/60">
                  {notes.length === 0 && <p className="text-bb-forest/60 py-3">No notes yet.</p>}
                  {notes.map((n) => (
                    <li key={n.id} className="py-5">
                      <p className="text-xs text-bb-forest/50">{new Date(n.created_at).toLocaleDateString()} {n.shared_with_client ? "· shared" : "· private"}</p>
                      <p className="mt-1 text-bb-forest/85 leading-relaxed">{n.summary}</p>
                      {n.homework && <p className="mt-2 text-sm text-bb-teal">Homework: {n.homework}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : <p className="text-bb-forest/60">Select a client.</p>}
        </div>
      </div>
    </div>
  );
}
