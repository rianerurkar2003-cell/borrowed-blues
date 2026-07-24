import { useEffect, useState } from "react";
import { NavLink, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { WatercolorBird, WatercolorSapling, WatercolorEucalyptus, WatercolorRipple, BirdFlock, LOGO_URL } from "@/components/Watercolor";
import { toast } from "sonner";
import { LogOut, CalendarDays, BookHeart, ClipboardList, Sparkles, User, Home as HomeIcon, LibraryBig } from "lucide-react";

const NAV = [
  { to: "/portal",              label: "Dashboard",    icon: HomeIcon, end: true },
  { to: "/portal/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/portal/journal",      label: "Journal",      icon: BookHeart },
  { to: "/portal/homework",     label: "Homework",     icon: ClipboardList },
  { to: "/portal/resources",    label: "Resources",    icon: LibraryBig },
  { to: "/portal/profile",      label: "Profile",      icon: User },
];

function Shell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0,2).join("");

  return (
    <div className="min-h-screen bg-bb-cream flex" data-testid="client-portal">
      <aside className="w-[248px] shrink-0 hidden md:flex flex-col border-r border-bb-moss/60 bg-bb-warm px-6 py-8">
        <Link to="/" className="flex items-center mb-10">
          <img src={LOGO_URL} alt="Borrowed Blues" className="h-11 w-auto" draggable={false} />
        </Link>
        <p className="bb-eyebrow mb-3">Your portal</p>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={!!end}
              data-testid={`client-nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] transition-colors ${
                  isActive ? "bg-bb-moss/70 text-bb-forest" : "text-bb-forest/70 hover:text-bb-forest hover:bg-bb-moss/40"
                }`}
            >
              <Icon size={17} strokeWidth={1.5}/> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-bb-moss/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-bb-forest text-bb-cream grid place-items-center text-sm font-serif">{initials || "•"}</div>
            <div>
              <p className="text-sm text-bb-forest">{user?.name}</p>
              <p className="text-xs text-bb-forest/60">Client</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); nav("/"); }}
            data-testid="client-logout"
            className="flex items-center gap-2 text-sm text-bb-forest/70 hover:text-bb-forest"
          >
            <LogOut size={15}/> Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-bb-cream/95 backdrop-blur border-b border-bb-moss/60 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-bb-forest">Borrowed Blues</Link>
          <button onClick={async ()=>{ await logout(); nav("/"); }} className="text-sm text-bb-forest/70">Sign out</button>
        </header>
        <div className="md:hidden overflow-x-auto bb-scroll-x border-b border-bb-moss/60 bg-bb-warm px-4 py-2 flex gap-1">
          {NAV.map(({to,label,end})=>(
            <NavLink key={to} to={to} end={!!end} className={({isActive})=>`px-3 py-2 rounded-full text-xs whitespace-nowrap ${isActive?"bg-bb-forest text-bb-cream":"text-bb-forest/70"}`}>{label}</NavLink>
          ))}
        </div>
        <main className="p-6 md:p-10 lg:p-14 max-w-[1180px]">{children}</main>
      </div>
    </div>
  );
}

/* ------------------------ Dashboard ------------------------ */
const QUOTES = [
  "Rest is not a reward. It is a form of care.",
  "You do not have to arrive to begin.",
  "Small moments of noticing add up.",
  "It is enough to have shown up today.",
];

function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/client/dashboard").then(r => setData(r.data)); }, []);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  const first = data?.upcoming?.[0];
  const summary = data?.latest_summary;
  const hw = data?.homework || [];
  const reflections = data?.reflections || [];

  return (
    <div>
      <p className="bb-eyebrow">A gentle hello</p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl text-bb-forest">
        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, <span className="bb-italic-serif">{(user?.name || "").split(" ")[0]}.</span>
      </h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">We saved the small things you left last time. Take your time.</p>

      <div className="mt-10 grid lg:grid-cols-3 gap-6">
        {/* Upcoming */}
        <section className="lg:col-span-2 bg-bb-warm rounded-3xl p-8 shadow-soft relative overflow-hidden" data-testid="upcoming-card">
          <div className="absolute -right-8 -bottom-8 w-48 opacity-70">
            <WatercolorSapling className="w-full h-full"/>
          </div>
          <p className="bb-eyebrow">Upcoming session</p>
          {first ? (
            <>
              <h2 className="mt-3 font-serif text-3xl text-bb-forest">
                {new Date(first.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <p className="mt-2 text-bb-forest/70">at {first.time} · {first.mode} · {first.duration_min} min</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/portal/appointments" className="px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">View details</Link>
                <Link to="/portal/appointments" className="px-5 py-2.5 rounded-full border border-bb-forest/30 text-bb-forest text-sm">Reschedule</Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-3 font-serif text-3xl text-bb-forest">Nothing scheduled yet.</h2>
              <p className="mt-2 text-bb-forest/70">Request a time whenever you're ready.</p>
              <Link to="/portal/appointments" className="mt-6 inline-flex px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Request a session</Link>
            </>
          )}
        </section>

        {/* Inspirational sidebar */}
        <section className="bg-bb-forest text-bb-cream rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-6 w-32 opacity-70">
            <WatercolorBird className="w-full h-full"/>
          </div>
          <p className="bb-eyebrow text-bb-cream/70">A small note</p>
          <p className="mt-4 font-serif italic text-2xl leading-snug">"{quote}"</p>
        </section>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="summary-card">
          <p className="bb-eyebrow">Latest session summary</p>
          {summary ? (
            <>
              <h3 className="mt-3 font-serif text-2xl text-bb-forest">A note from your therapist</h3>
              <p className="mt-4 text-bb-forest/75 leading-relaxed">{summary.summary}</p>
              {summary.homework && (
                <p className="mt-4 text-sm text-bb-teal">A gentle homework: {summary.homework}</p>
              )}
            </>
          ) : (
            <p className="mt-4 text-bb-forest/60">Your therapist hasn't shared a summary yet.</p>
          )}
        </section>

        <section className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="homework-card">
          <div className="flex items-center justify-between">
            <p className="bb-eyebrow">Homework</p>
            <Link to="/portal/homework" className="text-sm text-bb-teal hover:underline">View all →</Link>
          </div>
          {hw.length === 0 ? (
            <p className="mt-4 text-bb-forest/60">No open items. A quiet week.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {hw.slice(0, 3).map((h) => (
                <li key={h.id} className="flex items-start gap-3">
                  <Sparkles size={16} className="mt-1 text-bb-teal" strokeWidth={1.4}/>
                  <div>
                    <p className="font-serif text-lg text-bb-forest">{h.title}</p>
                    <p className="text-sm text-bb-forest/65">{h.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="reflections-card">
        <div className="flex items-center justify-between">
          <p className="bb-eyebrow">Your reflections</p>
          <Link to="/portal/journal" className="text-sm text-bb-teal hover:underline">Open journal →</Link>
        </div>
        {reflections.length === 0 ? (
          <p className="mt-4 text-bb-forest/60">Nothing yet. Even a sentence is enough.</p>
        ) : (
          <ul className="mt-4 divide-y divide-bb-moss/60">
            {reflections.map((r) => (
              <li key={r.id} className="py-4">
                <p className="font-serif text-lg text-bb-forest">{r.title}</p>
                <p className="text-sm text-bb-forest/65 line-clamp-2">{r.body}</p>
                <p className="mt-1 text-xs text-bb-forest/50">{new Date(r.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BirdFlock className="mt-16 w-40 opacity-60 mx-auto"/>
    </div>
  );
}

/* ------------------------ Appointments ------------------------ */
function Appointments() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ date: "", time: "10:00", mode: "online", notes: "" });
  const load = () => api.get("/client/appointments").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const request = async (e) => {
    e.preventDefault();
    try {
      await api.post("/client/appointments/request", form);
      toast.success("Request sent. Your therapist will confirm soon.");
      setForm({ date: "", time: "10:00", mode: "online", notes: "" });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Appointments</h1>

      <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="appointment-list">
          <p className="bb-eyebrow mb-6">Your calendar</p>
          {items.length === 0 && <p className="text-bb-forest/60">No sessions yet.</p>}
          <ul className="divide-y divide-bb-moss/60">
            {items.map((a) => (
              <li key={a.id} className="py-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-serif text-xl text-bb-forest">
                    {new Date(a.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-sm text-bb-forest/65">{a.time} · {a.mode} · {a.duration_min} min</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full capitalize ${
                  a.status === "completed" ? "bg-bb-moss/70 text-bb-forest" :
                  a.status === "requested" ? "bg-bb-blue-2 text-bb-forest" :
                  a.status === "cancelled" ? "bg-[#f2dede] text-[#8a3a1c]" :
                  "bg-bb-forest text-bb-cream"
                }`}>{a.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={request} className="bg-bb-moss/50 rounded-3xl p-8" data-testid="appointment-request">
          <p className="bb-eyebrow">Request a session</p>
          <h3 className="mt-2 font-serif text-2xl text-bb-forest">A quiet ask.</h3>
          <label className="block mt-6 text-sm text-bb-forest/80">Date
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
              <option value="online">Online</option>
              <option value="in-person">In person</option>
            </select>
          </label>
          <label className="block mt-4 text-sm text-bb-forest/80">A short note (optional)
            <textarea rows={3} value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})}
              className="mt-1 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3"/>
          </label>
          <button className="mt-6 w-full py-3 rounded-full bg-bb-forest text-bb-cream" data-testid="appointment-submit">Send request</button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------ Journal ------------------------ */
function Journal() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("gentle");

  const load = () => api.get("/client/reflections").then(r => setEntries(r.data));
  useEffect(() => { load(); }, []);

  const save = async (is_draft) => {
    if (!body.trim()) return toast.error("Write a little something first.");
    try {
      await api.post("/client/reflections", { title: title || "Untitled", body, mood, is_draft });
      toast.success(is_draft ? "Saved as a draft." : "Reflection kept.");
      setTitle(""); setBody(""); setMood("gentle"); load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div>
      <p className="bb-eyebrow">A private notebook</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Reflection journal</h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_1.2fr] gap-8">
        <div className="bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="journal-editor">
          <p className="bb-eyebrow">A new entry</p>
          <input value={title} onChange={(e)=>setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="mt-5 w-full text-2xl font-serif text-bb-forest bg-transparent border-b border-bb-moss/70 focus:border-bb-teal py-2 outline-none"/>
          <textarea rows={9} value={body} onChange={(e)=>setBody(e.target.value)}
            placeholder="Even a sentence is enough."
            data-testid="journal-body"
            className="mt-4 w-full bg-transparent text-bb-forest/85 outline-none leading-relaxed resize-none"/>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-bb-forest/70">Mood</label>
            <select value={mood} onChange={(e)=>setMood(e.target.value)}
              className="rounded-full bg-bb-moss/50 border border-bb-moss px-3 py-1.5 text-sm">
              {["gentle","tender","quiet","tired","hopeful","curious"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={()=>save(false)} data-testid="journal-save" className="px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm">Keep this</button>
            <button onClick={()=>save(true)}  data-testid="journal-draft" className="px-5 py-2.5 rounded-full border border-bb-forest/30 text-bb-forest text-sm">Save as draft</button>
          </div>
        </div>

        <div>
          <p className="bb-eyebrow mb-4">Previous reflections</p>
          <ul className="space-y-4" data-testid="journal-list">
            {entries.length === 0 && <p className="text-bb-forest/60">Nothing yet.</p>}
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ Homework ------------------------ */
function Homework() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/client/homework").then(r => setItems(r.data));
  useEffect(() => { load(); }, []);

  const toggleComplete = async (h) => {
    try {
      await api.patch(`/client/homework/${h.id}`, { completed: !h.completed, completed_items: h.completed_items || [] });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };
  const toggleItem = async (h, idx) => {
    const done = new Set(h.completed_items || []);
    done.has(idx) ? done.delete(idx) : done.add(idx);
    try {
      await api.patch(`/client/homework/${h.id}`, { completed: h.completed, completed_items: Array.from(done) });
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div>
      <p className="bb-eyebrow">Between sessions</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Homework</h1>
      <p className="mt-3 text-bb-forest/70 max-w-xl">Tender practices, not deadlines. Return whenever it feels possible.</p>

      <ul className="mt-10 space-y-6" data-testid="homework-list">
        {items.length === 0 && <p className="text-bb-forest/60">No homework yet.</p>}
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
              <button onClick={()=>toggleComplete(h)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm ${h.completed?"border border-bb-forest/30 text-bb-forest":"bg-bb-forest text-bb-cream"}`}>
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
                        <input type="checkbox" checked={done} onChange={()=>toggleItem(h, idx)}
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
    </div>
  );
}

/* ------------------------ Resources ------------------------ */
function ClientResources() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/client/resources").then(r => setItems(r.data)); }, []);
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

/* ------------------------ Profile ------------------------ */
function Profile() {
  const { user } = useAuth();
  return (
    <div className="max-w-2xl">
      <p className="bb-eyebrow">About you</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Your profile</h1>
      <div className="mt-10 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="client-profile">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="bb-eyebrow">Name</p>
            <p className="mt-1 font-serif text-xl text-bb-forest">{user?.name}</p>
          </div>
          <div>
            <p className="bb-eyebrow">Email</p>
            <p className="mt-1 text-bb-forest">{user?.email}</p>
          </div>
          <div>
            <p className="bb-eyebrow">Role</p>
            <p className="mt-1 text-bb-forest capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="bb-eyebrow">Joined</p>
            <p className="mt-1 text-bb-forest">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
          </div>
        </div>
        <p className="mt-8 text-sm text-bb-forest/60">Profile editing coming soon — please reach out if anything needs updating.</p>
      </div>
    </div>
  );
}

/* ------------------------ Router ------------------------ */
export default function ClientPortal() {
  return (
    <Shell>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="journal" element={<Journal />} />
        <Route path="homework" element={<Homework />} />
        <Route path="resources" element={<ClientResources />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </Shell>
  );
}
