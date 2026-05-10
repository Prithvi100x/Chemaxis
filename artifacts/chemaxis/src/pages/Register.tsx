import React, { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { FlaskConical, Eye, EyeOff } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: "Google Sign-In is not yet enabled. Please use email/password.",
  google_failed: "Google Sign-In failed. Please try again.",
  google_cancelled: "Google Sign-In was cancelled.",
};

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const oauthError = params.get("error") ? (GOOGLE_ERRORS[params.get("error")!] ?? "Something went wrong.") : "";

  const [form, setForm] = useState({ name: "", email: "", company: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(oauthError);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.company || undefined);
      setLocation("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-6 text-[#2D4A46] font-bold text-xl">
            <FlaskConical className="w-7 h-7" />
            ChemAxis
          </a>
          <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Create a Free Account</h1>
          <p className="text-[#64748B] text-sm">Sign up to browse and download chemical market reports.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          {/* Google Sign-Up */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 py-3 border border-[#E2E8F0] rounded-xl bg-white hover:bg-[#FAFAF8] transition-colors text-sm font-medium text-[#1E293B] mb-4"
          >
            <GoogleIcon />
            Sign up with Google
          </a>

          <div className="relative flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8]">or</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Full Name</label>
              <input value={form.name} onChange={set("name")} required className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={set("email")} required className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]" placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Company <span className="text-[#94A3B8] font-normal">(optional)</span></label>
              <input value={form.company} onChange={set("company")} className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]" placeholder="Acme Chemicals Ltd." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46] pr-12" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2D4A46]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Confirm Password</label>
              <input type={showPw ? "text" : "password"} value={form.confirm} onChange={set("confirm")} required className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-[#2D4A46] hover:bg-[#1E3330] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 mt-2">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#2D4A46] font-semibold hover:underline">Sign in</a>
        </p>
        <p className="text-center text-sm text-[#64748B] mt-2">
          <a href="/" className="hover:underline">← Back to home</a>
        </p>
      </div>
    </div>
  );
}
