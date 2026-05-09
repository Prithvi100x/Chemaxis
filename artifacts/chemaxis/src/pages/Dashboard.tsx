import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api, type GeneratedReport, type Purchase } from "@/lib/api";
import { FlaskConical, FileText, ShoppingBag, Download, LogOut, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    done: { icon: CheckCircle2, color: "text-green-700 bg-green-50 border-green-200", label: "Ready" },
    processing: { icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200", label: "Generating…" },
    pending: { icon: Clock, color: "text-blue-700 bg-blue-50 border-blue-200", label: "Queued" },
    error: { icon: AlertCircle, color: "text-red-700 bg-red-50 border-red-200", label: "Error" },
  }[status] ?? { icon: Clock, color: "text-gray-700 bg-gray-50 border-gray-200", label: status };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [myReports, setMyReports] = useState<GeneratedReport[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.generate.myReports(), api.purchase.list()])
      .then(([r, p]) => { setMyReports(r); setPurchases(p); })
      .finally(() => setDataLoading(false));
  }, [user]);

  const handleLogout = async () => { await logout(); setLocation("/"); };

  if (loading || !user) return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>;

  const totalSpent = purchases.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-[#2D4A46] font-bold text-lg">
          <FlaskConical className="w-6 h-6" /> ChemAxis
        </a>
        <div className="flex items-center gap-4">
          <a href="/reports" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">Browse Reports</a>
          <a href="/my-reports" className="text-sm text-[#64748B] hover:text-[#2D4A46] font-medium">My Reports</a>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-red-600">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E293B]">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-[#64748B] mt-1">Here's what's happening with your reports.</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Reports Generated", value: myReports.length, icon: FileText, color: "bg-[#2D4A46]" },
            { label: "Reports Purchased", value: purchases.length, icon: ShoppingBag, color: "bg-[#B0C4B1]" },
            { label: "Total Spent", value: `$${(totalSpent / 100).toFixed(2)}`, icon: Download, color: "bg-[#93A5CF]" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1E293B]">{s.value}</div>
                <div className="text-sm text-[#64748B]">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#1E293B]">Recent Generated Reports</h2>
            <a href="/my-reports" className="text-sm text-[#2D4A46] font-semibold hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></a>
          </div>
          {dataLoading ? (
            <div className="py-8 flex justify-center"><div className="w-6 h-6 border-3 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>
          ) : myReports.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-[#64748B] text-sm">No reports generated yet.</p>
              <a href="/reports" className="inline-block mt-3 text-sm text-[#2D4A46] font-semibold hover:underline">Browse reports →</a>
            </div>
          ) : (
            <div className="space-y-3">
              {myReports.slice(-5).reverse().map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
                  <div>
                    <div className="font-medium text-[#1E293B] text-sm">{r.reportTitle ?? "Report"}</div>
                    <div className="text-xs text-[#94A3B8] mt-0.5">{r.reportCategory} · {new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    {r.status === "done" && (
                      <a href={`/my-reports`} className="text-xs text-[#2D4A46] font-semibold hover:underline">Download →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-[#2D4A46] to-[#4A7068] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Ready to explore more data?</h3>
            <p className="text-[#B0C4B1] text-sm">Browse our full library of chemical market reports.</p>
          </div>
          <a href="/reports" className="bg-white text-[#2D4A46] font-bold px-5 py-2.5 rounded-xl hover:bg-[#FAFAF8] transition-colors text-sm whitespace-nowrap">
            Browse Reports →
          </a>
        </div>
      </div>
    </div>
  );
}
