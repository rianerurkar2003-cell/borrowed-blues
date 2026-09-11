import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { therapistService } from "@/services/therapist.service";
import { toAppError } from "@/lib/errors";
import { toast } from "sonner";

export default function TherapistProfile() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [google, setGoogle] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadGoogle = () => {
    therapistService.googleStatus().then(setGoogle).catch((e) => toast.error(toAppError(e).message));
  };
  useEffect(loadGoogle, []);

  useEffect(() => {
    const result = searchParams.get("google");
    if (!result) return;
    if (result === "connected") toast.success("Google Calendar connected.");
    else toast.error("Couldn't connect Google Calendar. Try again?");
    setSearchParams((params) => { params.delete("google"); return params; }, { replace: true });
    loadGoogle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connect = async () => {
    setBusy(true);
    try {
      window.location.href = await therapistService.googleAuthUrl();
    } catch (err) {
      toast.error(toAppError(err).message);
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await therapistService.googleDisconnect();
      toast.success("Google Calendar disconnected.");
      loadGoogle();
    } catch (err) {
      toast.error(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <p className="bb-eyebrow">About you</p>
      <h1 className="mt-3 font-serif text-4xl text-bb-forest">Your profile</h1>
      <div className="mt-10 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="therapist-profile">
        <p className="font-serif text-xl text-bb-forest">{user?.name}</p>
        <p className="text-bb-forest/70">{user?.email}</p>
        <p className="mt-2 text-sm text-bb-forest/60 capitalize">Role: {user?.role}</p>
      </div>

      <div className="mt-6 bg-bb-warm rounded-3xl p-8 shadow-soft" data-testid="google-calendar-card">
        <p className="bb-eyebrow">Google Calendar</p>
        {google == null ? (
          <p className="mt-2 text-sm text-bb-forest/60">Checking connection…</p>
        ) : google.connected ? (
          <>
            <p className="mt-2 text-bb-forest/80">
              Connected as <span className="font-medium">{google.connected_email}</span>. New appointments sync automatically.
            </p>
            <button
              onClick={disconnect}
              disabled={busy}
              data-testid="google-disconnect-button"
              className="mt-4 px-5 py-2.5 rounded-full border border-bb-moss text-sm text-bb-forest disabled:opacity-60"
            >
              {busy ? "Disconnecting…" : "Disconnect"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-bb-forest/70 text-sm">
              Connect your Google account to have appointments show up on your own calendar automatically.
            </p>
            <button
              onClick={connect}
              disabled={busy}
              data-testid="google-connect-button"
              className="mt-4 px-5 py-2.5 rounded-full bg-bb-forest text-bb-cream text-sm disabled:opacity-60"
            >
              {busy ? "Redirecting…" : "Connect Google Calendar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
