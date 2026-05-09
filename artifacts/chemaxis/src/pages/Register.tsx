import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { FlaskConical, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", company: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
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
          <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Create your account</h1>
          <p className="text-[#64748B] text-sm">Access AI-powered chemical market reports</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Full Name</label>
              <input value={form.name} onChange={set("name")} required className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]" placeholder="Jane Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Work Email</label>
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
