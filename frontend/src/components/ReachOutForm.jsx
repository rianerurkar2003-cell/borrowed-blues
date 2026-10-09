import { useEffect, useState } from "react";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import { WatercolorSapling } from "@/components/Watercolor";
import { Check, ArrowRight } from "lucide-react";
import { publicService } from "@/services/public.service";
import { REACH_OUT } from "@/constants/testIds";

const PRACTICE_EMAIL = "hello@borrowedblues.com";

/**
 * The consultation-request form, shared by the modal (ConsultationDialog)
 * and the standalone /reach-out page. Plain <h2>/<p> headings rather than
 * Dialog primitives -- this renders outside a Dialog context on the page.
 *
 * Submits to POST /api/consultation-requests, which lands in the
 * therapist's Requests inbox inside the therapist portal.
 */
export default function ReachOutForm({ defaultReason = "", onCancel, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [underage, setUnderage] = useState(false);
  const [therapistName, setTherapistName] = useState("");
  const [replyWindowText, setReplyWindowText] = useState("one to two working days");
  const [languages, setLanguages] = useState(["English", "Hindi", "Marathi"]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferred_contact: "email",
    preferred_language: "English",
    is_adult: false,
    reason: defaultReason,
    preferred_time: "",
  });

  useEffect(() => {
    publicService.therapistProfile()
      .then((p) => {
        setTherapistName((p?.name || "").split(" ")[0] || "");
        if (p?.reply_window_text) setReplyWindowText(p.reply_window_text);
        if (p?.languages?.length) {
          setLanguages(p.languages);
          setForm((f) => ({ ...f, preferred_language: p.languages[0] }));
        }
      })
      .catch(() => {});
  }, []);

  const firstName = therapistName || "your therapist";

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !(form.email.trim() || form.phone.trim())) {
      toast.error("A name and an email or phone number help us get back to you.");
      return;
    }
    if (!form.is_adult) {
      setUnderage(true);
      return;
    }
    setBusy(true);
    try {
      await publicService.submitConsultation(form);
      setDone(true);
      toast.success("Your note is on its way.");
      onSuccess?.();
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  if (underage) {
    return (
      <div data-testid={REACH_OUT.underageNote} className="text-center py-6">
        <DialogLikeHeading title="A quick note" />
        <p className="mt-2 text-bb-forest/70 leading-relaxed">
          Thanks for reaching out. Because you're under 18, a parent or guardian
          will need to be part of this conversation. You (or they) can email{" "}
          <a href={`mailto:${PRACTICE_EMAIL}`} className="underline hover:text-bb-forest">
            {PRACTICE_EMAIL}
          </a>{" "}
          directly and {firstName} will explain how it works.
          {/* TODO(confirm): exact wording + under-18 policy, owned by Anushka (spec §8/§9) */}
        </p>
        {onCancel && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  }

  if (done) {
    return (
      <div data-testid={REACH_OUT.success} className="text-center py-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-bb-forest text-bb-cream grid place-items-center">
          <Check size={26} strokeWidth={1.6} />
        </div>
        <DialogLikeHeading title="Your note is on its way." className="mt-6" />
        <p className="mt-2 text-bb-forest/70 text-center">
          Here's what happens next:
        </p>
        <ol className="mt-5 text-left max-w-sm mx-auto space-y-3 text-sm text-bb-forest/80">
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-bb-moss/70 text-bb-forest grid place-items-center text-xs">1</span>
            <span>{firstName} reads your note and replies within {replyWindowText}.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-bb-moss/70 text-bb-forest grid place-items-center text-xs">2</span>
            <span>A short, free consultation call to see if it feels right.</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-bb-moss/70 text-bb-forest grid place-items-center text-xs">3</span>
            <span>If you both want to continue, you'll get a login to your Borrowed Blues space.</span>
          </li>
        </ol>
        <p className="mt-5 text-xs text-bb-forest/50">
          Can't see a reply? Check your spam folder.
        </p>
        {onCancel && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors"
            >
              Close
            </button>
          </div>
        )}
        <div className="mt-6 flex justify-center opacity-80">
          <div className="w-24 h-24">
            <WatercolorSapling className="w-full h-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} data-testid={REACH_OUT.form}>
      <DialogLikeHeading title={<>Book a <span className="bb-italic-serif">consultation.</span></>} />
      <p className="text-bb-forest/70 mt-1">
        A short, no-obligation conversation. Share what feels right —
        even a sentence is enough.
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-bb-forest/80">Your name</span>
            <input
              required
              value={form.name}
              onChange={set("name")}
              data-testid={REACH_OUT.nameInput}
              placeholder="First name is enough"
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            />
          </label>
          <label className="block">
            <span className="text-sm text-bb-forest/80">Email <span className="text-bb-forest/40">(or phone below)</span></span>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              data-testid={REACH_OUT.emailInput}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-bb-forest/80">Phone <span className="text-bb-forest/40">(or email above)</span></span>
            <input
              value={form.phone}
              onChange={set("phone")}
              data-testid={REACH_OUT.phoneInput}
              placeholder="Country code + number"
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            />
          </label>
          <label className="block">
            <span className="text-sm text-bb-forest/80">Preferred time <span className="text-bb-forest/40">(optional)</span></span>
            <input
              value={form.preferred_time}
              onChange={set("preferred_time")}
              data-testid={REACH_OUT.timeInput}
              placeholder="e.g. weekday evenings"
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-bb-forest/80">Preferred way to hear back</span>
            <select
              required
              value={form.preferred_contact}
              onChange={set("preferred_contact")}
              data-testid={REACH_OUT.preferredContactSelect}
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            >
              <option value="email">Email</option>
              <option value="phone_call">Phone call</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-bb-forest/80">Preferred language</span>
            <select
              required
              value={form.preferred_language}
              onChange={set("preferred_language")}
              data-testid={REACH_OUT.preferredLanguageSelect}
              className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-2.5 text-bb-forest"
            >
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-bb-forest/80">
            Anything you'd like {firstName} to know? <span className="text-bb-forest/40">(optional)</span>
          </span>
          <textarea
            rows={4}
            value={form.reason}
            onChange={set("reason")}
            data-testid={REACH_OUT.reasonInput}
            placeholder="A word, a sentence, a paragraph — whatever feels right."
            className="mt-1.5 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3 text-bb-forest leading-relaxed resize-none"
          />
          <span className="mt-1 block text-xs text-bb-forest/50">
            Many people leave this blank. That's completely fine.
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={form.is_adult}
            onChange={(e) => setForm({ ...form, is_adult: e.target.checked })}
            data-testid={REACH_OUT.isAdultCheckbox}
            className="mt-0.5 h-5 w-5 rounded border-bb-moss text-bb-teal focus-visible:ring-2 focus-visible:ring-bb-teal/40"
          />
          <span className="text-sm text-bb-forest/80">I'm 18 or older</span>
        </label>
      </div>

      <p className="mt-4 text-xs text-bb-forest/55">
        Your note is private. It reaches only {firstName}.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-sm text-bb-forest/70 hover:text-bb-forest"
          >
            Not now
          </button>
        )}
        <button
          type="submit"
          disabled={busy}
          data-testid={REACH_OUT.submitButton}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm hover:bg-bb-forest-2 transition-colors disabled:opacity-60"
        >
          {busy ? "Sending…" : <>Send note <ArrowRight size={15} strokeWidth={1.6}/></>}
        </button>
      </div>
    </form>
  );
}

/** Visual stand-in for DialogTitle -- a plain heading so this form works
 * identically inside a Dialog and standalone on the /reach-out page. */
function DialogLikeHeading({ title, className = "" }) {
  return (
    <h2 className={`font-serif text-3xl text-bb-forest ${className}`}>
      {title}
    </h2>
  );
}
