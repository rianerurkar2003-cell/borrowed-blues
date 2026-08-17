import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";
import { toAppError } from "@/lib/errors";
import { RESET_PASSWORD } from "@/constants/testIds/auth";
import loginIllustration from "@/assets/login-illustration.png";

const inputClass =
  "mt-2 w-full rounded-xl bg-transparent border border-bb-soft-light/40 px-4 py-3 text-bb-soft-light placeholder:text-bb-soft-light/40 focus:border-bb-soft-light/80 outline-none transition-colors";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await authService.resetPassword(token, password);
      toast.success("Password updated. Sign in with your new password.");
      nav("/login", { replace: true });
    } catch (err) {
      setError(toAppError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="reset-password-page" className="min-h-screen grid lg:grid-cols-2">
      <aside className="relative hidden lg:block overflow-hidden">
        <img
          src={loginIllustration}
          alt="Watercolor coastline with two small birds among wildflowers."
          className="absolute inset-0 w-full h-full object-cover"
        />
      </aside>

      <section className="relative flex items-center justify-center px-6 py-16 bg-bb-teal">
        <Link
          to="/login"
          className="absolute top-8 left-6 lg:left-12 inline-flex items-center gap-2 text-bb-soft-light/70 hover:text-bb-soft-light transition-colors"
        >
          <ArrowLeft size={16} /> <span className="text-sm">Back to sign in</span>
        </Link>

        <div className="w-full max-w-md">
          <h1 className="font-serif text-4xl md:text-5xl text-bb-soft-light">
            Set a new password
          </h1>

          {!token ? (
            <p className="mt-4 text-bb-soft-light/80">
              This link is missing its reset token. Request a new one from the{" "}
              <Link to="/login" className="text-bb-soft-light hover:underline">
                sign-in page
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mt-4 text-bb-soft-light/80">Choose a new password below.</p>

              <form onSubmit={submit} className="mt-10 space-y-6" data-testid="reset-password-form">
                <label className="block">
                  <span className="text-sm text-bb-soft-light/90">New password</span>
                  <div className="relative">
                    <input
                      required
                      minLength={8}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid={RESET_PASSWORD.passwordInput}
                      placeholder="Value"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bb-soft-light/60 hover:text-bb-soft-light"
                      aria-label="Toggle password visibility"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-bb-soft-light/90">Confirm password</span>
                  <input
                    required
                    minLength={8}
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    data-testid={RESET_PASSWORD.passwordConfirmInput}
                    placeholder="Value"
                    className={inputClass}
                  />
                </label>

                {error && (
                  <p
                    data-testid={RESET_PASSWORD.error}
                    className="text-sm text-bb-forest bg-bb-soft-light/90 border border-bb-soft-light rounded-xl px-4 py-3"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  data-testid={RESET_PASSWORD.submitButton}
                  className="w-full py-3.5 rounded-[40px] bg-bb-soft-light text-bb-forest hover:bg-white transition-colors disabled:opacity-60"
                >
                  {busy ? "One moment…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
