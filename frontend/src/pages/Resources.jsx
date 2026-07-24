import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { WatercolorEucalyptus, WatercolorBird } from "@/components/Watercolor";
import { Search, FileText, BookOpen, Video, Link as LinkIcon } from "lucide-react";

const CATEGORIES = ["all", "Anxiety", "Coping tools", "Reflection", "Grief", "Wellbeing", "Self-esteem"];

const KIND_ICON = {
  article: BookOpen,
  pdf: FileText,
  video: Video,
  link: LinkIcon,
};

export default function Resources() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    api.get("/resources/public", { params: { category: cat, q } }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [cat, q]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="bb-container pt-24 pb-16 grid md:grid-cols-[1.2fr_1fr] gap-8 items-end">
          <div>
            <p className="bb-eyebrow">Reading & reflection</p>
            <h1 className="mt-4 text-5xl md:text-7xl text-bb-forest leading-[1.03]">
              A quiet <span className="bb-italic-serif">library.</span>
            </h1>
            <p className="mt-6 text-bb-forest/70 max-w-xl leading-relaxed">
              A slowly-growing collection of articles, downloads, and gentle
              exercises — written to feel less like homework and more like a
              conversation.
            </p>
          </div>
          <div className="hidden md:block h-56">
            <WatercolorEucalyptus className="h-full w-full ml-auto" />
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="bb-container">
          <div data-testid="resource-controls" className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 pb-8 border-b border-bb-moss/70">
            <div className="relative flex-1 max-w-md">
              <Search size={18} strokeWidth={1.6} className="absolute left-4 top-1/2 -translate-y-1/2 text-bb-forest/50" />
              <input
                data-testid="resource-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search articles, prompts, exercises…"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-bb-warm border border-bb-moss text-bb-forest placeholder:text-bb-forest/45"
              />
            </div>
            <div className="flex flex-wrap gap-2 bb-scroll-x overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  data-testid={`resource-filter-${c}`}
                  onClick={() => setCat(c)}
                  className={`px-4 py-2 rounded-full text-sm capitalize transition-colors ${
                    cat === c
                      ? "bg-bb-forest text-bb-cream"
                      : "bg-bb-moss/60 text-bb-forest hover:bg-bb-moss"
                  }`}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          </div>

          <div data-testid="resource-grid" className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.length === 0 && (
              <p className="text-bb-forest/60 col-span-full">Nothing here yet — try another search.</p>
            )}
            {items.map((r) => {
              const Icon = KIND_ICON[r.kind] || BookOpen;
              return (
                <article
                  key={r.id}
                  data-testid={`resource-${r.id}`}
                  className="group relative bg-bb-warm rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
                >
                  <div className="flex items-center gap-3 text-bb-teal">
                    <Icon size={18} strokeWidth={1.6}/>
                    <span className="bb-eyebrow">{r.category}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-2xl text-bb-forest leading-tight">
                    {r.title}
                  </h3>
                  <p className="mt-3 text-bb-forest/70 text-[15px] leading-relaxed">{r.description}</p>
                  <div className="mt-6 pt-4 border-t border-bb-moss/60 flex items-center justify-between">
                    <span className="text-xs text-bb-forest/50 uppercase tracking-widest">{r.kind}</span>
                    <a href={r.url || "#"} className="text-sm text-bb-teal hover:underline">Read →</a>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-20 flex justify-end">
            <WatercolorBird className="w-40 opacity-80" />
          </div>
        </div>
      </section>
    </>
  );
}
