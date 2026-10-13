import { useCallback, useEffect, useState } from "react";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";
import { REQUESTS } from "@/constants/testIds";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

function acceptSummary(r) {
  if (!r.is_adult) return "They're under 18, so no account will be created. Please follow up with their guardian.";
  if (!r.email) return "There's no email on file, so no account or email will be sent. You can add them from Clients once you've spoken.";
  return `This creates their portal account and emails ${r.email} the consultation acceptance, their login details, and an invitation to the onboarding questions.`;
}

export default function Requests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return therapistService.requests()
      .then(setItems)
      .catch((e) => { const err = toAppError(e); setError(err.message); toast.error(err.message); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    try {
      await therapistService.updateRequestStatus(id, status);
      toast.success("Updated.");
      load();
    } catch (err) { toast.error(toAppError(err).message); }
  };

  const accept = async () => {
    if (!acceptTarget) return;
    setAcceptBusy(true);
    try {
      const res = await therapistService.updateRequestStatus(acceptTarget.id, "accepted");
      const name = acceptTarget.name;
      if (res.account === "created" && res.email_sent) toast.success(`${name} was accepted and emailed their login details.`);
      else if (res.account === "existing" && res.email_sent) toast.success(`${name} was accepted and emailed.`);
      else if (res.generated_password) setCredentials({ email: res.email, password: res.generated_password, name });
      else if (res.account === "skipped_under_18") toast.success(`${name} was accepted. No account was created (under 18).`);
      else if (res.account === "skipped_no_email") toast.success(`${name} was accepted. No email on file, so nothing was sent.`);
      else if (res.account === "skipped_email_in_use") toast.warning(`${name} was accepted, but that email belongs to another account. Nothing was sent.`);
      else toast.success("Updated.");
      setAcceptTarget(null);
      load();
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setAcceptBusy(false);
    }
  };

  return (
    <div>
      <p className="bb-eyebrow">Inbox</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Consultation requests</h1>

      {loading ? (
        <p className="mt-10 text-bb-forest/60">Loading requests…</p>
      ) : error ? (
        <p className="mt-10 text-bb-forest/60">Couldn't load requests. <button onClick={load} className="underline hover:text-bb-forest">Try again</button></p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-bb-forest/60">No requests yet.</p>
      ) : (
        <ul className="mt-10 space-y-4" data-testid={REQUESTS.list}>
          {items.map((r) => (
            <li key={r.id} className="bg-bb-warm rounded-3xl p-8 shadow-soft grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <p className="font-serif text-2xl text-bb-forest">{r.name}</p>
                <p className="text-sm text-bb-forest/60">
                  {[r.email, r.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 text-sm text-bb-teal">
                  Prefers {r.preferred_contact === "phone_call" ? "a phone call" : "email"}
                  {" "}· {r.preferred_language}
                  {!r.is_adult && " · Under 18"}
                </p>
                <p className="mt-3 text-bb-forest/75">{r.reason}</p>
                {r.preferred_time && <p className="mt-2 text-sm text-bb-teal">Preferred: {r.preferred_time}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-bb-moss/70 text-bb-forest capitalize">{r.status}</span>
                {r.status !== "accepted" && <button onClick={() => setAcceptTarget(r)} data-testid={REQUESTS.acceptButton} className="text-sm px-4 py-2 rounded-full bg-bb-forest text-bb-cream">Accept</button>}
                {r.status !== "declined" && <button onClick={() => setStatus(r.id, "declined")} data-testid={REQUESTS.declineButton} className="text-sm px-4 py-2 rounded-full border border-bb-forest/30 text-bb-forest">Decline</button>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!acceptTarget} onOpenChange={(open) => !open && !acceptBusy && setAcceptTarget(null)}>
        <DialogContent data-testid={REQUESTS.acceptDialog}>
          <DialogHeader>
            <DialogTitle>Accept {acceptTarget?.name}?</DialogTitle>
            <DialogDescription>{acceptTarget && acceptSummary(acceptTarget)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setAcceptTarget(null)} disabled={acceptBusy}
              className="px-5 py-2.5 rounded-full border border-bb-moss text-sm">Cancel</button>
            <button type="button" onClick={accept} disabled={acceptBusy} data-testid={REQUESTS.acceptConfirm}
              className="px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm disabled:opacity-60">
              {acceptBusy ? "Accepting…" : "Accept"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent data-testid={REQUESTS.credentialsDialog}>
          <DialogHeader>
            <DialogTitle>{credentials?.name}'s account is ready</DialogTitle>
            <DialogDescription>
              The welcome email couldn't be sent, so please share these with them yourself. This password won't be shown again.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="rounded-xl bg-bb-warm p-4 space-y-2 text-sm">
              <p><span className="text-bb-forest/60">Email:</span> {credentials.email}</p>
              <p><span className="text-bb-forest/60">Password:</span> <code className="font-mono">{credentials.password}</code></p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
