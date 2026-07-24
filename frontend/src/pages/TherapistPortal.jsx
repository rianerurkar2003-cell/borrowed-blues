import { useEffect, useState } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { WatercolorEucalyptus, WatercolorRipple, BirdFlock, LOGO_URL } from "@/components/Watercolor";
import { LogOut, LayoutDashboard, Users, CalendarDays, ClipboardList, LibraryBig, User as UserIcon, Sparkles } from "lucide-react";

const NAV = [
  { to: "/therapist",           label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/therapist/clients",   label: "Clients",    icon: Users },
  { to: "/therapist/calendar",  label: "Calendar",   icon: CalendarDays },
  { to: "/therapist/requests",  label: "Requests",   icon: ClipboardList },
  { to: "/therapist/resources", label: "Resources",  icon: LibraryBig },
  { to: "/therapist/profile",   label: "Profile",    icon: UserIcon },
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0,2).join("");

  return (
    <div className="min-h-screen bg-bb-cream flex" data-testid="therapist-portal">
      <aside className="w-[248px] shrink-0 hidden md:flex flex-col border-r border-bb-moss/60 bg-bb-forest text-bb-cream px-6 py-8">
        <Link to="/" className="flex items-center mb-10">
          <img
            src={LOGO_URL}
            alt="Borrowed Blues"
            className="h-9 w-auto"
            style={{ filter: "invert(1)" }}
            draggable={false}
          />
        </Link>
        <p className="bb-eyebrow text-bb-cream/70 mb-3">Your practice</p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={!!end}
              data-testid={`therapist-nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] transition-colors ${
                  isActive ? "bg-bb-teal/40 text-bb-cream" : "text-bb-cream/70 hover:bg-bb-teal/20"
                }`}
            >
              <Icon size={17} strokeWidth={1.5}/> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-bb-cream/15">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-bb-cream text-bb-forest grid place-items-center text-sm font-serif">{initials || "•"}</div>
            <div>
              <p className="text-sm">{user?.name}</p>
              <p className="text-xs text-bb-cream/60">Therapist</p>
            </div>
          </div>
          <button onClick={async () => { await logout(); nav("/"); }}
            data-testid="therapist-logout"
            className="flex items-center gap-2 text-sm text-bb-cream/70 hover:text-bb-cream">
            <LogOut size={15}/> Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-bb-forest text-bb-cream px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif">Borrowed Blues</Link>
          <button onClick={async () => { await logout(); nav("/"); }} className="text-sm text-bb-cream/80">Sign out</button>
        </header>
        <div className="md:hidden overflow-x-auto bb-scroll-x border-b border-bb-moss/60 bg-bb-warm px-4 py-2 flex gap-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={!!end} className={({ isActive }) => `px-3 py-2 rounded-full text-xs whitespace-nowrap ${isActive ? "bg-bb-forest text-bb-cream" : "text-bb-forest/70"}`}>{label}</NavLink>
          ))}
        </div>
        <main className="p-6 md:p-10 lg:p-14 max-w-[1240px]">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------ Dashboard ------------------------ */
function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState({ today: [], upcoming: [], requests: [], reflections: [], client_count: 0 });
  const [clients, setClients] = useState([]);
  useEffect(() => {
    api.get("/therapist/dashboard").then(r => setData(r.data));
    api.get("/therapist/clients").then(r => setClients(r.data));
  }, []);
  const nameById = Object.fromEntries(clients.map(c => [c.id, c.name]));

  return (
    <div>
      <p className="bb-eyebrow">Today's practice</p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl text-bb-forest">
        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, <span className="bb-italic-serif">{(user?.name || "").split(" ")[0] || "Doctor"}.</span>
      </h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">{data.today.length} session{data.today.length === 1 ? "" : "s"} today. {data.requests.length} new request{data.requests.length === 1 ? "" : "s"} waiting.</p>

      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-bb-warm rounded-3xl p-8 shadow-soft relative overflow-hidden" data-testid="today-card">
          <div className="absolute -right-8 -bottom-8 w-56 opacity-40">
            <WatercolorEucalyptus className="w-full h-full"/>
          </div>
          <p className="bb-eyebrow">Today's schedule</p>
          {data.today.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">Nothing on your calendar today. A rare gift.</p>
          ) : (
            <ul className="mt-4 divide-y divide-bb-moss/60">
              {data.today.map((a) => (
                <li key={a.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl text-bb-forest">{a.time}</p>
                    <p className="text-sm text-bb-forest/65">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-bb-moss/70 text-bb-forest capitalize">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-bb-forest text-bb-cream rounded-3xl p-8 relative overflow-hidden">
          <p className="bb-eyebrow text-bb-cream/70">Quick actions</p>
          <div className="mt-5 grid gap-3">
            <Link to="calendar" className="px-5 py-3 rounded-full bg-bb-cream/95 text-bb-forest text-sm text-center">Schedule a session</Link>
            <Link to="requests" className="px-5 py-3 rounded-full border border-bb-cream/40 text-bb-cream text-sm text-center">Review requests ({data.requests.length})</Link>
            <Link to="clients"  className="px-5 py-3 rounded-full border border-bb-cream/40 text-bb-cream text-sm text-center">Open a client</Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="upcoming-sessions">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Upcoming sessions</p>
            <Link to="calendar" className="text-sm text-bb-teal hover:underline">Open calendar →</Link>
          </div>
          {data.upcoming.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No upcoming sessions.</p>
          ) : (
            <ul className="mt-4 divide-y divide-bb-moss/60">
              {data.upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="py-4">
                  <p className="font-serif text-lg text-bb-forest">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {a.time}
                  </p>
                  <p className="text-sm text-bb-forest/65">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="consultation-requests">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Consultation requests</p>
            <Link to="requests" className="text-sm text-bb-teal hover:underline">All requests →</Link>
          </div>
          {data.requests.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No new requests right now.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {data.requests.slice(0, 3).map((r) => (
                <li key={r.id} className="p-4 rounded-2xl bg-bb-moss/40">
                  <p className="font-serif text-lg text-bb-forest">{r.name}</p>
                  <p className="text-sm text-bb-forest/70">{r.reason}</p>
                  <p className="text-xs text-bb-forest/50 mt-1">{r.preferred_time || "any time"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="recent-reflections">
        <div className="flex items-center justify-between">
          <p className="bb-eyebrow">Recent client reflections</p>
          <Link to="clients" className="text-sm text-bb-teal hover:underline">Client list →</Link>
        </div>
        {data.reflections.length === 0 ? (
          <p className="mt-4 text-bb-forest/60">No reflections shared yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-bb-moss/60">
            {data.reflections.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-serif text-lg text-bb-forest">{r.title}</p>
                <p className="text-sm text-bb-forest/70 line-clamp-2">{r.body}</p>
                <p className="mt-1 text-xs text-bb-forest/50">{nameById[r.user_id] || "Client"} · {new Date(r.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BirdFlock className="mt-16 w-40 opacity-60 mx-auto"/>
    </div>
  );
}

/* ------------------------ Clients (list + notes/homework panel) ------------------------ */
function Clients() {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState({ summary: "", homework: "", shared_with_client: true });
  const [hwForm, setHwForm] = useState({ title: "", description: "", type: "writing" });

  useEffect(() => {
    api.get("/therapist/clients").then((r) => {
      setClients(r.data);
      if (r.data[0]) setSelected(r.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get("/therapist/session-notes", { params: { client_id: selected.id } }).then(r => setNotes(r.data));
  }, [selected]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteForm.summary.trim()) return toast.error("Add a short summary.");
    try {
      await api.post("/therapist/session-notes", { client_id: selected.id, ...noteForm });
      toast.success("Session note saved.");
      setNoteForm({ summary: "", homework: "", shared_with_client: true });
      const r = await api.get("/therapist/session-notes", { params: { client_id: selected.id } });
      setNotes(r.data);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const assignHw = async (e) => {
    e.preventDefault();
    if (!hwForm.title.trim()) return toast.error("Give it a title.");
    try {
      await api.post("/therapist/homework", { client_id: selected.id, ...hwForm });
      toast.success("Homework assigned gently.");
      setHwForm({ title: "", description: "", type: "writing" });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
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
                <textarea rows={4} value={noteForm.summary} onChange={(e)=>setNoteForm({...noteForm, summary:e.target.value})}
                  placeholder="What did the session hold?"
                  className="mt-3 w-full rounded-xl bg-bb-cream border border-bb-moss px-4 py-3 leading-relaxed"/>
                <input value={noteForm.homework} onChange={(e)=>setNoteForm({...noteForm, homework:e.target.value})}
                  placeholder="Optional homework"
                  className="mt-3 w-full rounded-xl bg-bb-cream border border-bb-moss px-4 py-3"/>
                <label className="mt-3 flex items-center gap-2 text-sm text-bb-forest/80">
                  <input type="checkbox" checked={noteForm.shared_with_client}
                    onChange={(e)=>setNoteForm({...noteForm, shared_with_client:e.target.checked})}
                    className="rounded border-bb-moss text-bb-teal"/>
                  Share this summary with the client
                </label>
                <button className="mt-4 px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Save note</button>
              </form>

              <form onSubmit={assignHw} className="mt-6 bg-bb-moss/50 rounded-3xl p-8" data-testid="homework-assign-form">
                <p className="bb-eyebrow">Assign homework</p>
                <input value={hwForm.title} onChange={(e)=>setHwForm({...hwForm, title:e.target.value})}
                  placeholder="Title"
                  className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
                <textarea rows={3} value={hwForm.description} onChange={(e)=>setHwForm({...hwForm, description:e.target.value})}
                  placeholder="What would you like them to try?"
                  className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
                <select value={hwForm.type} onChange={(e)=>setHwForm({...hwForm, type:e.target.value})}
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

/* ------------------------ Calendar (list-based view) ------------------------ */
function CalendarView() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ client_id: "", date: "", time: "10:00", mode: "online", duration_min: 50 });
  const load = () => api.get("/therapist/appointments").then(r => setItems(r.data));
  useEffect(() => {
    load();
    api.get("/therapist/clients").then(r => setClients(r.data));
  }, []);
  const nameById = Object.fromEntries(clients.map(c => [c.id, c.name]));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.date) return toast.error("Choose a client and a date.");
    try {
      await api.post("/therapist/appointments", form);
      toast.success("Appointment scheduled.");
      setForm({ client_id: "", date: "", time: "10:00", mode: "online", duration_min: 50 });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const setStatus = async (a, status) => {
    try {
      await api.patch(`/therapist/appointments/${a.id}`, { status });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div>
      <p className="bb-eyebrow">All sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Calendar</h1>

      <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="calendar-list">
          <ul className="divide-y divide-bb-moss/60">
            {items.length === 0 && <p className="text-bb-forest/60">Nothing scheduled yet.</p>}
            {items.map((a) => (
              <li key={a.id} className="py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-lg text-bb-forest">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} · {a.time}
                  </p>
                  <p className="text-sm text-bb-forest/70">{nameById[a.client_id] || "Client"} · {a.mode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full capitalize ${
                    a.status === "completed" ? "bg-bb-moss/70 text-bb-forest" :
                    a.status === "requested" ? "bg-bb-blue-2 text-bb-forest" :
                    a.status === "cancelled" ? "bg-[#f2dede] text-[#8a3a1c]" :
                    "bg-bb-forest text-bb-cream"
                  }`}>{a.status}</span>
                  {a.status !== "completed" && (
                    <button onClick={()=>setStatus(a, "completed")} className="text-xs px-3 py-1 rounded-full border border-bb-forest/25 text-bb-forest">Mark done</button>
                  )}
                  {a.status !== "cancelled" && (
                    <button onClick={()=>setStatus(a, "cancelled")} className="text-xs px-3 py-1 rounded-full border border-bb-forest/25 text-bb-forest/70">Cancel</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className="bg-bb-moss/50 rounded-3xl p-8 h-fit" data-testid="calendar-form">
          <p className="bb-eyebrow">New appointment</p>
          <label className="block mt-4 text-sm text-bb-forest/80">Client
            <select value={form.client_id} onChange={(e)=>setForm({...form, client_id:e.target.value})}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Date
            <input required type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Time
            <input required type="time" value={form.time} onChange={(e)=>setForm({...form, time:e.target.value})}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">Mode
            <select value={form.mode} onChange={(e)=>setForm({...form, mode:e.target.value})}
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

/* ------------------------ Requests ------------------------ */
function Requests() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/therapist/requests").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const setStatus = async (id, status) => {
    try { await api.patch(`/therapist/requests/${id}`, { status }); toast.success("Updated."); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };
  return (
    <div>
      <p className="bb-eyebrow">Inbox</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Consultation requests</h1>

      <ul className="mt-10 space-y-4" data-testid="requests-list">
        {items.length === 0 && <p className="text-bb-forest/60">No requests yet.</p>}
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
              {r.status !== "accepted" && <button onClick={()=>setStatus(r.id, "accepted")} className="text-sm px-4 py-2 rounded-full bg-bb-forest text-bb-cream">Accept</button>}
              {r.status !== "declined" && <button onClick={()=>setStatus(r.id, "declined")} className="text-sm px-4 py-2 rounded-full border border-bb-forest/30 text-bb-forest">Decline</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------ Resources ------------------------ */
function TherapistResources() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", category: "Reflection", kind: "article", url: "", body: "", is_public: true });
  const load = () => api.get("/resources/public").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Add a title.");
    try {
      await api.post("/therapist/resources", form);
      toast.success("Resource added.");
      setForm({ title: "", description: "", category: "Reflection", kind: "article", url: "", body: "", is_public: true });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
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
          <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})}
            placeholder="Title" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <input value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}
            placeholder="Category" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <select value={form.kind} onChange={(e)=>setForm({...form, kind:e.target.value})}
            className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3">
            <option value="article">Article</option><option value="pdf">PDF</option><option value="video">Video</option><option value="link">Link</option>
          </select>
          <input value={form.url} onChange={(e)=>setForm({...form, url:e.target.value})}
            placeholder="Link (optional)" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <textarea rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}
            placeholder="Short description" className="mt-3 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          <button className="mt-4 w-full py-3 rounded-full bg-bb-forest text-bb-cream">Add resource</button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------ Profile ------------------------ */
function TherapistProfile() {
  const { user } = useAuth();
  return (
    <div className="max-w-2xl">
      <p className="bb-eyebrow">About you</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Your profile</h1>
      <div className="mt-10 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="therapist-profile">
        <p className="font-serif text-xl text-bb-forest">{user?.name}</p>
        <p className="text-bb-forest/70">{user?.email}</p>
        <p className="mt-2 text-sm text-bb-forest/60 capitalize">Role: {user?.role}</p>
      </div>
    </div>
  );
}

/* ------------------------ Router ------------------------ */
export default function TherapistPortal() {
  return (
    <Shell>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="clients"   element={<Clients />} />
        <Route path="calendar"  element={<CalendarView />} />
        <Route path="requests"  element={<Requests />} />
        <Route path="resources" element={<TherapistResources />} />
        <Route path="profile"   element={<TherapistProfile />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Shell>
  );
}
