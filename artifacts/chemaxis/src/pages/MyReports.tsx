import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api, type GeneratedReport } from "@/lib/api";
import { FlaskConical, Download, FileText, Clock, CheckCircle2, AlertCircle, ArrowRight, LogOut } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string; Icon: typeof Clock }> = {
    done: { color: "text-green-700 bg-green-50 border-green-200", label: "Ready to Download", Icon: CheckCircle2 },
    processing: { color: "text-amber-700 bg-amber-50 border-amber-200", label: "Generating…", Icon: Clock },
    pending: { color: "text-blue-700 bg-blue-50 border-blue-200", label: "Queued", Icon: Clock },
    error: { color: "text-red-700 bg-red-50 border-red-200", label: "Failed", Icon: AlertCircle },
  };
  const c = cfg[status] ?? { color: "text-gray-600 bg-gray-50 border-gray-200", label: status, Icon: Clock };
  const Icon = c.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${c.color}`}>
      <Icon className="w-3.5 h-3.5" /> {c.label}
    </span>
  );
}

export default function MyReports() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [purchases, setPurchases] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.generate.myReports(), api.purchase.list()])
      .then(([gens, purch]) => {
        setReports([...gens].reverse());
        setPurchases(new Set(purch.map(p => p.reportId)));
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = async () => { await logout(); setLocation("/"); };

  if (authLoading || !user) return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-[#2D4A46] font-bold text-lg">
          <FlaskConical className="w-6 h-6" /> ChemAxis
        </a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">Dashboard</a>
          <a href="/reports" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">Browse Reports</a>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-red-600">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E293B] mb-1">My Reports</h1>
          <p className="text-[#64748B] text-sm">All your generated and purchased reports are here.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E2E8F0]">
            <FileText className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <h3 className="font-bold text-[#1E293B] mb-2">No reports yet</h3>
            <p className="text-[#64748B] text-sm mb-6">Browse our library and generate your first AI report.</p>
            <a href="/reports" className="inline-flex items-center gap-2 bg-[#2D4A46] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1E3330]">
              Browse Reports <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => {
              const isPurchased = purchases.has(r.reportId);
              const canDownload = r.status === "done" && isPurchased;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#1E293B]">{r.reportTitle ?? "Report"}</h3>
                        <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">{r.reportCategory}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#94A3B8] mt-1">
                        <span>Generated {new Date(r.createdAt).toLocaleDateString()}</span>
                        <span>Language: {r.targetLanguage.toUpperCase()}</span>
                        {r.customNotes && <span className="truncate max-w-[200px]">Focus: {r.customNotes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={r.status} />
                      {canDownload ? (
                        <a
                          href={api.generate.download(r.id)}
                          className="flex items-center gap-1.5 bg-[#2D4A46] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#1E3330] transition-colors"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </a>
                      ) : r.status === "done" && !isPurchased ? (
                        <a
                          href={`/reports/${r.reportId}`}
                          className="flex items-center gap-1.5 bg-[#B0C4B1] text-[#2D4A46] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#9AB59B] transition-colors"
                        >
                          Purchase to Download
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {r.status === "done" && r.content?.sections && (
                    <div className="mt-4 p-4 bg-[#FAFAF8] rounded-xl border border-[#E2E8F0]">
                      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Preview — Executive Summary</p>
                      <p className="text-sm text-[#475569] leading-relaxed">
                        {(r.content.sections["Executive Summary"] ?? Object.values(r.content.sections)[0] ?? "").substring(0, 300)}…
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <a href="/reports" className="inline-flex items-center gap-2 text-[#2D4A46] font-semibold hover:underline text-sm">
            <ArrowRight className="w-4 h-4" /> Browse more reports
          </a>
        </div>
      </div>
    </div>
  );
}
