import { useAuth } from "@/state/AuthContext";

export default function TherapistProfile() {
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
