import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { ADMIN_URL } from "@/lib/firebase";

export default function Login() {
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate(ADMIN_URL);
    } catch (err) {
      const code = err?.code || "";
      let msg = "Sign-in failed.";
      if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) msg = "Invalid email or password.";
      else if (code.includes("too-many-requests")) msg = "Too many attempts — try again in a few minutes.";
      else if (code.includes("network-request-failed")) msg = "Network error — check your connection.";
      else if (err?.message) msg = err.message;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-white border border-slate-200 px-4 py-3 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 rounded-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="bg-white border border-slate-200 p-8 md:p-10 shadow-sm">
          <div className="text-overline mb-4">Admin Portal · Secure Access</div>
          <h1 className="font-display font-extrabold text-3xl text-navy-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Authenticated via Firebase. Admin role required.</p>
          {authError ? (
            <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="admin-login-form">
            <input className={input} type="email" placeholder="admin@carryfastcorp.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" required autoComplete="username" />
            <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" required autoComplete="current-password" />
            <button type="submit" disabled={busy} data-testid="login-submit" className="w-full bg-navy-900 text-white py-3 text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-xs text-slate-500 text-center">
            <Link to="/" className="hover:text-gold-500">← Back to website</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
