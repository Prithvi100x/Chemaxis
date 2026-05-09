import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { FlaskConical, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          <h1 className="text-2xl font-bold text-[#1E293B] mb-1">Welcome back</h1>
          <p className="text-[#64748B] text-sm">Sign in to access your reports</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46] focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46] focus:border-transparent pr-12"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#2D4A46]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-[#2D4A46] hover:bg-[#1E3330] text-white font-semibold rounded-xl transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          No account yet?{" "}
          <a href="/register" className="text-[#2D4A46] font-semibold hover:underline">Create one free</a>
        </p>
        <p className="text-center text-sm text-[#64748B] mt-2">
          <a href="/" className="hover:underline">← Back to home</a>
        </p>
      </div>
    </div>
  );
}
