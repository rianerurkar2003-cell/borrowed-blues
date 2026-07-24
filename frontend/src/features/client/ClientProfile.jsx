import { useAuth } from "@/state/AuthContext";

export default function ClientProfile() {
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
