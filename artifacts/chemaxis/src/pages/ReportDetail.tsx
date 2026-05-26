import React, { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { api, type Report, type GeneratedReport } from "@/lib/api";
import { FlaskConical, FileText, Download, ShoppingCart, Loader2, CheckCircle2, Globe, ArrowLeft, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh", label: "Chinese (Simplified)" },
  { code: "ar", label: "Arabic" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
];

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetLang, setTargetLang] = useState("en");
  const [customNotes, setCustomNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genReport, setGenReport] = useState<GeneratedReport | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState("");
  const [genFailed, setGenFailed] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const id = params?.id ?? "";

  useEffect(() => {
    if (!id) return;
    api.reports.get(id).then(r => { setReport(r); setPurchased(r.purchased ?? false); }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGenerate = async () => {
    if (!user) { setLocation("/login"); return; }
    setError(""); setGenFailed(false); setGenerating(true); setGenReport(null);
    try {
      const { id: genId } = await api.generate.start(id, targetLang, customNotes);

      const poll = async () => {
        try {
          const g = await api.generate.get(genId);
          setGenReport(g);
          if (g.status === "done" || g.status === "error") {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            setGenerating(false);
            if (g.status === "error") setGenFailed(true);
          }
        } catch {
          // ignore transient poll errors
        }
      };

      await poll();
      pollRef.current = setInterval(poll, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
      setGenerating(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) { setLocation("/login"); return; }
    setPurchasing(true); setError("");
    try {
      await api.purchase.buy(id, genReport?.id);
      setPurchased(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  const handleLogout = async () => { await logout(); window.location.href = "/"; };

  if (loading) return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#2D4A46] border-t-transparent rounded-full animate-spin" /></div>;
  if (!report) return <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><p className="text-[#64748B]">Report not found.</p></div>;

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-[#2D4A46] font-bold text-lg">
          <FlaskConical className="w-6 h-6" /> ChemAxis
        </a>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <a href="/dashboard" className="text-sm text-[#64748B] hover:text-[#2D4A46]">Dashboard</a>
              <a href="/my-reports" className="text-sm text-[#64748B] hover:text-[#2D4A46]">My Reports</a>
              <button onClick={handleLogout} className="text-sm text-[#94A3B8] hover:text-red-500">Sign Out</button>
            </>
          ) : (
            <a href="/login" className="text-sm bg-[#2D4A46] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#1E3330]">Sign In</a>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <a href="/reports" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#2D4A46] mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </a>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold bg-[#F1F5F9] text-[#2D4A46] px-3 py-1 rounded-full">{report.category}</span>
              {report.sourceLanguage === "zh" && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-semibold">AI Translation Available</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[#1E293B] mb-4 leading-tight">{report.title}</h1>
            <p className="text-[#475569] leading-relaxed mb-6">{report.description}</p>

            <div className="flex items-center gap-6 text-sm text-[#64748B] mb-8">
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{report.pageCount} pages</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />Source: {report.sourceLanguage === "zh" ? "Chinese" : "English"}</span>
            </div>

            {report.sampleContent && Object.keys(report.sampleContent).length > 0 && (
              <div className="mb-8">
                <button onClick={() => setShowSample(!showSample)} className="flex items-center gap-2 font-semibold text-[#1E293B] mb-3 hover:text-[#2D4A46]">
                  Preview Data {showSample ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showSample && (
                  <div className="grid grid-cols-2 gap-3 p-5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                    {Object.entries(report.sampleContent).map(([k, v]) => (
                      <div key={k} className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
                        <div className="text-xs text-[#94A3B8] capitalize mb-1">{k.replace(/([A-Z])/g, " $1").trim()}</div>
                        <div className="font-bold text-[#1E293B] text-sm">{Array.isArray(v) ? (v as string[]).join(", ") : String(v)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {genReport?.status === "done" && genReport.content?.sections && (
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <div className="bg-[#2D4A46] px-6 py-4">
                  <h2 className="text-white font-bold">Your Report Preview</h2>
                  <p className="text-[#B0C4B1] text-sm mt-1">Language: {LANGUAGES.find(l => l.code === genReport.targetLanguage)?.label ?? genReport.targetLanguage}</p>
                </div>
                <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                  {Object.entries(genReport.content.sections).slice(0, 3).map(([name, text]) => (
                    <div key={name}>
                      <h3 className="font-bold text-[#2D4A46] mb-2">{name}</h3>
                      <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-wrap">{text.substring(0, 500)}{text.length > 500 ? "…" : ""}</p>
                    </div>
                  ))}
                  {Object.keys(genReport.content.sections).length > 3 && (
                    <p className="text-[#94A3B8] text-sm italic">+ {Object.keys(genReport.content.sections).length - 3} more sections in the full PDF…</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sticky top-6">
              <div className="text-3xl font-bold text-[#1E293B] mb-1">${(report.priceCents / 100).toFixed(2)}</div>
              <p className="text-[#64748B] text-sm mb-6">Pay once. Download anytime.</p>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}

              {!genReport || genReport.status === "error" ? (
                <div className="space-y-4">
                  {genFailed && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Generation failed</p>
                        <p className="text-xs mt-0.5 text-red-600">Something went wrong while creating your report. Please try again.</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] mb-2">Choose your language</label>
                    <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46]">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                      Anything special to include? <span className="text-[#94A3B8] font-normal">(optional)</span>
                    </label>
                    <textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#FAFAF8] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D4A46] resize-none"
                      placeholder="e.g. Focus on supply problems, or Southeast Asia pricing…" />
                  </div>
                  <button onClick={handleGenerate} disabled={generating}
                    className="w-full py-3 bg-[#2D4A46] hover:bg-[#1E3330] text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {generating
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating report…</>
                      : genFailed
                        ? <><RefreshCw className="w-4 h-4" /> Try Again</>
                        : "Create My Report"}
                  </button>
                  {!user && <p className="text-xs text-center text-[#94A3B8]">You will need to sign in before creating a report.</p>}
                </div>
              ) : genReport.status === "processing" || genReport.status === "pending" ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2D4A46] mx-auto mb-3" />
                  <p className="font-semibold text-[#1E293B]">We are creating your report…</p>
                  <p className="text-[#64748B] text-sm mt-1">This usually takes about 1 minute. You can come back later.</p>
                </div>
              ) : genReport.status === "done" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" /> Your report is ready!
                  </div>
                  {!purchased ? (
                    <button onClick={handlePurchase} disabled={purchasing}
                      className="w-full py-3 bg-[#2D4A46] hover:bg-[#1E3330] text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {purchasing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><ShoppingCart className="w-4 h-4" /> Buy & Download PDF — ${(report.priceCents / 100).toFixed(2)}</>}
                    </button>
                  ) : (
                    <a href={api.generate.download(genReport.id)}
                      className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Download PDF
                    </a>
                  )}
                  <button onClick={() => setGenReport(null)} className="w-full py-2 text-sm text-[#64748B] hover:text-[#2D4A46] border border-[#E2E8F0] rounded-xl">
                    Start over with different options
                  </button>
                </div>
              ) : null}

              <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-2">
                {["Translated from Chinese market sources", "Available in 5 languages", "Professional PDF download", "Clear sections: prices, forecasts, risks"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#64748B]">
                    <CheckCircle2 className="w-4 h-4 text-[#B0C4B1] shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
