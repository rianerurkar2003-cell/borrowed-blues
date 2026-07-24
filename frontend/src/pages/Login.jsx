import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { WatercolorEstuary, WatercolorBird } from "@/components/Watercolor";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { api, formatApiError } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await login(email, password, remember);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    toast.success(`Welcome back, ${res.user.name.split(" ")[0]}.`);
    const dest = res.user.role === "therapist" ? "/therapist" : "/portal";
    nav(loc.state?.from?.pathname || dest, { replace: true });
  };

  const sendForgot = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("If that email exists, a quiet reset link has been sent.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || err.message);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen bg-bb-cream grid lg:grid-cols-[1.05fr_1fr]">
      {/* Illustrated left panel */}
      <aside className="relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0">
          <WatercolorEstuary className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bb-cream/25"/>
        </div>
        <div className="relative h-full flex flex-col justify-between p-12">
          <Link to="/" className="inline-flex items-center gap-2 text-bb-forest/80 hover:text-bb-forest">
            <ArrowLeft size={16}/> <span className="text-sm">Back home</span>
          </Link>
          <div className="max-w-md">
            <p className="bb-eyebrow text-bb-teal">A quiet return</p>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl text-bb-forest leading-[1.05]">
              Welcome back to your <span className="bb-italic-serif">practice.</span>
            </h1>
            <p className="mt-4 text-bb-forest/70 max-w-sm">
              The work between sessions matters. Sign in to your journal, your
              homework, and the small notes you left for yourself.
            </p>
            <WatercolorBird className="mt-8 w-44 opacity-90"/>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-bb-forest/70 mb-8">
            <ArrowLeft size={16}/> <span className="text-sm">Back home</span>
          </Link>
          <p className="bb-eyebrow">Sign in</p>
          <h2 className="mt-3 font-serif text-4xl text-bb-forest">
            Welcome, <span className="bb-italic-serif">gently.</span>
          </h2>
          <p className="mt-2 text-bb-forest/70">
            Use the email and password you registered with. Your role will be
            recognised automatically.
          </p>

          {!forgotOpen ? (
          <form onSubmit={submit} className="mt-8 space-y-5" data-testid="login-form">
            <label className="block">
              <span className="text-sm text-bb-forest/80">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3 text-bb-forest"
              />
            </label>
            <label className="block">
              <span className="text-sm text-bb-forest/80">Password</span>
              <div className="relative">
                <input
                  required
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3 pr-11 text-bb-forest"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 translate-y-1 text-bb-forest/60"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-bb-forest/80 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  data-testid="login-remember"
                  className="rounded border-bb-moss text-bb-teal focus:ring-bb-teal"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                data-testid="login-forgot"
                className="text-bb-teal hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p data-testid="login-error" className="text-sm text-[#8a3a1c] bg-[#f4e6dc] border border-[#e3c9b6] rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit"
              className="w-full py-3.5 rounded-full bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors disabled:opacity-60"
            >
              {busy ? "One moment…" : "Sign in"}
            </button>

            <p className="text-xs text-bb-forest/60 text-center">
              New here? Ask about a first consultation on the <Link to="/meet-your-therapist" className="text-bb-teal hover:underline">therapist page</Link>.
            </p>

            <div className="mt-6 rounded-xl bg-bb-moss/40 p-4 text-xs text-bb-forest/70 leading-relaxed">
              <p className="font-medium text-bb-forest mb-1">Try the demo:</p>
              <p>Therapist — <span className="bb-italic-serif">therapist@borrowedblues.com</span> / TherapistPass123!</p>
              <p>Client — <span className="bb-italic-serif">client@borrowedblues.com</span> / ClientPass123!</p>
            </div>
          </form>
          ) : (
          <form onSubmit={sendForgot} className="mt-8 space-y-5" data-testid="forgot-form">
            <label className="block">
              <span className="text-sm text-bb-forest/80">Email</span>
              <input
                required type="email" value={forgotEmail}
                onChange={(e)=>setForgotEmail(e.target.value)}
                data-testid="forgot-email"
                className="mt-2 w-full rounded-xl bg-bb-warm border border-bb-moss px-4 py-3 text-bb-forest"
              />
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" className="px-5 py-3 rounded-full bg-bb-forest text-bb-cream">Send reset link</button>
              <button type="button" onClick={()=>setForgotOpen(false)} className="text-bb-forest/70 text-sm">Back to sign in</button>
            </div>
          </form>
          )}
        </div>
      </section>
    </div>
  );
}
