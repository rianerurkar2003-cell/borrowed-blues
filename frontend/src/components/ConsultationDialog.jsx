import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { http } from "@/lib/http";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import { WatercolorSapling } from "@/components/Watercolor";
import { Check, ArrowRight } from "lucide-react";
import { publicService } from "@/services/public.service";
import consultationIllustration from "@/assets/consultation-illustration.png";

/**
 * A gentle public consultation-request form. Renders any `children` as the
 * trigger button. Submits to POST /api/consultation-requests, which lands in
 * the therapist's Requests inbox inside the therapist portal.
 *
 * Usage:
 *   <ConsultationDialog>
 *     <button className="…">Book a consultation</button>
 *   </ConsultationDialog>
 */
export default function ConsultationDialog({ children, defaultReason = "" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [therapistName, setTherapistName] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: defaultReason,
    preferred_time: "",
  });

  useEffect(() => {
    publicService.therapistProfile()
      .then((p) => setTherapistName((p?.name || "").split(" ")[0] || ""))
      .catch(() => {});
  }, []);

  const firstName = therapistName || "your therapist";

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const reset = () => {
    setForm({ name: "", email: "", phone: "", reason: defaultReason, preferred_time: "" });
    setDone(false);
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("A name and email help us get back to you.");
      return;
    }
    setBusy(true);
    try {
      await http.post("/consultation-requests", form);
      setDone(true);
      toast.success("Your note is on its way.");
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 220);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        data-testid="consultation-dialog"
        className="max-w-3xl bg-bb-cream border border-bb-moss/70 rounded-3xl p-0 overflow-hidden"
      >
        <div className="grid md:grid-cols-[325px_1fr]">
          <aside className="hidden md:flex flex-col bg-bb-moss/50 p-6">
            <p className="bb-eyebrow">A quiet first step</p>
            <p className="mt-3 font-serif text-xl text-bb-forest leading-snug">
              Send a short note. {firstName} will reply personally.
            </p>
            <img
              src={consultationIllustration}
              alt=""
              className="mt-6 w-[277px] h-[534px] object-contain"
            />
          </aside>

          <div className="p-6 md:p-8">
            {done ? (
              <div data-testid="consultation-success" className="text-center py-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-bb-forest text-bb-cream grid place-items-center">
                  <Check size={26} strokeWidth={1.6} />
                </div>
                <DialogHeader className="mt-6">
                  <DialogTitle className="font-serif text-3xl text-bb-forest text-center">
                    Your note is on its way.
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-bb-forest/70 text-center">
                    {firstName} usually replies within one to two working
                    days. In the meantime, take your time. There is nothing
                    you need to do next.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-6 flex justify-center opacity-80">
                  <div className="w-24 h-24">
                    <WatercolorSapling className="w-full h-full" />
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} data-testid="consultation-form">
                <DialogHeader>
                  <DialogTitle className="font-serif text-3xl text-bb-forest">
                    Book a <span className="bb-italic-serif">consultation.</span>
                  </DialogTitle>
                  <DialogDescription className="text-bb-forest/70 mt-1">
                    A short, no-obligation conversation. Share what feels right —
                    even a sentence is enough.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-6 grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-bb-forest/80">Your name</span>
                      <input
                        required
                        value={form.name}
                        onChange={set("name")}
                        data-testid="consult-name"
                        placeholder="First name is enough"
                        className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-bb-forest/80">Email</span>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        data-testid="consult-email"
                        placeholder="you@example.com"
                        className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
                      />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-bb-forest/80">Phone <span className="text-bb-forest/40">(optional)</span></span>
                      <input
                        value={form.phone}
                        onChange={set("phone")}
                        data-testid="consult-phone"
                        placeholder="Country code + number"
                        className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-bb-forest/80">Preferred time <span className="text-bb-forest/40">(optional)</span></span>
                      <input
                        value={form.preferred_time}
                        onChange={set("preferred_time")}
                        data-testid="consult-time"
                        placeholder="e.g. weekday evenings"
                        className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm text-bb-forest/80">What brings you here? <span className="text-bb-forest/40">(optional)</span></span>
                    <textarea
                      rows={4}
                      value={form.reason}
                      onChange={set("reason")}
                      data-testid="consult-reason"
                      placeholder="A word, a sentence, a paragraph — whatever feels right."
                      className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3 text-bb-forest leading-relaxed resize-none"
                    />
                  </label>
                </div>

                <p className="mt-4 text-xs text-bb-forest/55">
                  Your note is private. It reaches only {firstName}.
                </p>

                <DialogFooter className="mt-6 flex-col sm:flex-row sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-5 py-2.5 rounded-full text-sm text-bb-forest/70 hover:text-bb-forest"
                  >
                    Not now
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    data-testid="consult-submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors disabled:opacity-60"
                  >
                    {busy ? "Sending…" : <>Send note <ArrowRight size={15} strokeWidth={1.6}/></>}
                  </button>
                </DialogFooter>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
