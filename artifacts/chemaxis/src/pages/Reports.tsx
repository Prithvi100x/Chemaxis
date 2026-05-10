import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type Report } from "@/lib/api";
import { FlaskConical, Search, Filter, FileText, Tag, LogOut } from "lucide-react";

const CATEGORIES = ["All", "Petrochemicals", "Specialty Chemicals", "Industrial Chemicals", "Polymers"];
const LANG_LABELS: Record<string, string> = { zh: "Chinese → AI Translated", en: "English" };

export default function Reports() {
  const { user, logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    api.reports.list()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags?.some(t => t.toLowerCase().includes(q));
    const matchCat = category === "All" || r.category === category;
    return matchSearch && matchCat;
  });

  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-[#2D4A46] font-bold text-lg">
          <FlaskConical className="w-6 h-6" /> ChemAxis
        </a>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <a href="/dashboard" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">Dashboard</a>
              <a href="/my-reports" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">My Reports</a>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-red-600">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">Sign In</a>
              <a href="/register" className="text-sm bg-[#2D4A46] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#1E3330]">Get Started</a>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E293B] mb-2">Our Reports</h1>
          <p className="text-[#64748B]">Browse below and click any report to learn more. Each one comes as a downloadable PDF in your chosen language.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]"
              placeholder="Search by name or topic…"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#94A3B8]" />
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B]">No reports found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(r => (
              <a key={r.id} href={`/reports/${r.id}`} className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#B0C4B1] hover:shadow-lg transition-all p-6 flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold bg-[#F1F5F9] text-[#2D4A46] px-3 py-1 rounded-full">{r.category}</span>
                  <span className="text-[#2D4A46] font-bold text-lg">${(r.priceCents / 100).toFixed(0)}</span>
                </div>
                <h3 className="font-bold text-[#1E293B] mb-2 group-hover:text-[#2D4A46] transition-colors leading-snug">{r.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed mb-4 flex-1 line-clamp-3">{r.description}</p>
                {r.sampleContent && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(r.sampleContent).slice(0, 2).map(([k, v]) => (
                      <div key={k} className="bg-[#FAFAF8] rounded-lg p-2.5">
                        <div className="text-xs text-[#94A3B8] capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                        <div className="text-sm font-bold text-[#1E293B] truncate">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <FileText className="w-3.5 h-3.5" />{r.pageCount} pages
                  </div>
                  {r.sourceLanguage === "zh" && (
                    <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Translated</span>
                  )}
                  {r.purchased && (
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Purchased</span>
                  )}
                </div>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.tags.slice(0, 3).map(t => (
                      <span key={t} className="flex items-center gap-1 text-xs text-[#94A3B8]"><Tag className="w-2.5 h-2.5" />{t}</span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
