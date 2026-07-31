import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { http } from "@/lib/http";
import { toAppError } from "@/lib/errors";
import loginIllustration from "@/assets/login-illustration.png";

const inputClass =
  "mt-2 w-full rounded-xl bg-transparent border border-bb-soft-light/40 px-4 py-3 text-bb-soft-light placeholder:text-bb-soft-light/40 focus:border-bb-soft-light/80 outline-none transition-colors";

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
      await http.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("If that email exists, a quiet reset link has been sent.");
      setForgotOpen(false);
    } catch (err) {
      toast.error(toAppError(err).message);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen grid lg:grid-cols-2">
      {/* Illustrated left panel — full-bleed, no overlay. */}
      <aside className="relative hidden lg:block overflow-hidden">
        <img
          src={loginIllustration}
          alt="Watercolor coastline with two small birds among wildflowers."
          className="absolute inset-0 w-full h-full object-cover"
        />
      </aside>

      {/* Form panel */}
      <section className="relative flex items-center justify-center px-6 py-16 bg-bb-teal">
        <Link
          to="/"
          className="absolute top-8 left-6 lg:left-12 inline-flex items-center gap-2 text-bb-soft-light/70 hover:text-bb-soft-light transition-colors"
        >
          <ArrowLeft size={16}/> <span className="text-sm">Back home</span>
        </Link>

        <div className="w-full max-w-md">
          <h1 className="font-serif text-4xl md:text-5xl text-bb-soft-light">
            Welcome back!
          </h1>
          <p className="mt-4 text-bb-soft-light/80">
            Sign in to continue your therapy journey.
          </p>

          {!forgotOpen ? (
          <form onSubmit={submit} className="mt-10 space-y-6" data-testid="login-form">
            <label className="block">
              <span className="text-sm text-bb-soft-light/90">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email"
                placeholder="Value"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-sm text-bb-soft-light/90">Password</span>
              <div className="relative">
                <input
                  required
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password"
                  placeholder="Value"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-bb-soft-light/60 hover:text-bb-soft-light"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-bb-soft-light/90 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  data-testid="login-remember"
                  className="rounded border-bb-soft-light/40 text-bb-forest focus:ring-bb-soft-light"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                data-testid="login-forgot"
                className="text-bb-soft-light/80 hover:text-bb-soft-light hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p data-testid="login-error" className="text-sm text-bb-forest bg-bb-soft-light/90 border border-bb-soft-light rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit"
              className="w-full py-3.5 rounded-[40px] bg-bb-soft-light text-bb-forest hover:bg-white transition-colors disabled:opacity-60"
            >
              {busy ? "One moment…" : "Sign in"}
            </button>

            <p className="text-xs text-bb-soft-light/70 text-center">
              New here? Ask about a first consultation on the <Link to="/meet-your-therapist" className="text-bb-soft-light hover:underline">therapist page</Link>.
            </p>

            <div className="mt-6 rounded-xl bg-bb-forest/40 border border-bb-soft-light/15 p-4 text-xs text-bb-soft-light/80 leading-relaxed">
              <p className="font-medium text-bb-soft-light mb-1">Try the demo:</p>
              <p>Therapist — <span className="italic">therapist@borrowedblues.com</span> / TherapistPass123!</p>
              <p>Client — <span className="italic">client@borrowedblues.com</span> / ClientPass123!</p>
            </div>
          </form>
          ) : (
          <form onSubmit={sendForgot} className="mt-10 space-y-6" data-testid="forgot-form">
            <label className="block">
              <span className="text-sm text-bb-soft-light/90">Email</span>
              <input
                required type="email" value={forgotEmail}
                onChange={(e)=>setForgotEmail(e.target.value)}
                data-testid="forgot-email"
                placeholder="Value"
                className={inputClass}
              />
            </label>
            <div className="flex items-center gap-4">
              <button type="submit" className="px-6 py-3 rounded-[40px] bg-bb-soft-light text-bb-forest hover:bg-white transition-colors">Send reset link</button>
              <button type="button" onClick={()=>setForgotOpen(false)} className="text-bb-soft-light/80 hover:text-bb-soft-light text-sm">Back to sign in</button>
            </div>
          </form>
          )}
        </div>
      </section>
    </div>
  );
}
