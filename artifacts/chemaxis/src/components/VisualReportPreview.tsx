import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import type { VisualChart, VisualReport } from "@/lib/api";

const COLORS = ["#2D4A46", "#2F6B8A", "#D97706", "#8B5CF6", "#DB2777", "#16A34A"];

function TooltipCard({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number | string; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-[#1E293B]">{label}</p>
      <p className="mt-1 text-[#2D4A46]">{payload[0].value}</p>
    </div>
  );
}

function ProcessChart({ chart }: { chart: VisualChart }) {
  return (
    <div className="flex h-full items-center gap-2 overflow-x-auto px-1">
      {chart.data.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex min-w-[96px] items-center gap-2">
          <div className="min-w-[84px] rounded-xl border border-[#B7D7CE] bg-[#F1F8F5] px-3 py-3 text-center">
            <p className="text-[10px] font-bold text-[#2D4A46]">{item.label}</p>
            <p className="mt-1 text-sm font-bold text-[#1E293B]">{item.value}</p>
          </div>
          {index < chart.data.length - 1 && <span className="text-lg text-[#2D4A46]">→</span>}
        </div>
      ))}
    </div>
  );
}

function Heatmap({ chart }: { chart: VisualChart }) {
  const max = Math.max(...chart.data.map((item) => item.value), 1);
  return (
    <div className="grid h-full grid-cols-3 gap-2">
      {chart.data.map((item, index) => {
        const opacity = Math.max(0.18, item.value / max);
        return (
          <div key={`${item.label}-${index}`} className="flex flex-col justify-center rounded-lg px-2 text-center" style={{ backgroundColor: `rgba(45, 74, 70, ${opacity})` }}>
            <p className="text-[10px] font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function Funnel({ chart }: { chart: VisualChart }) {
  const max = Math.max(...chart.data.map((item) => item.value), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-4">
      {chart.data.map((item, index) => {
        const width = `${Math.max(28, (item.value / max) * 100)}%`;
        return (
          <div key={`${item.label}-${index}`} className="mx-auto rounded-md px-3 py-2 text-center text-xs font-semibold text-white" style={{ width, backgroundColor: COLORS[index % COLORS.length] }}>
            {item.label} · {item.value}
          </div>
        );
      })}
    </div>
  );
}

function ChartCanvas({ chart }: { chart: VisualChart }) {
  const common = { data: chart.data, margin: { top: 8, right: 8, bottom: 4, left: -16 } };
  const axis = <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />;
  const grid = <CartesianGrid stroke="#E2E8F0" vertical={false} />;

  if (chart.type === "donut") {
    return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chart.data} dataKey="value" nameKey="label" innerRadius="54%" outerRadius="78%" paddingAngle={3}>{chart.data.map((item, index) => <Cell key={`${item.label}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip content={<TooltipCard />} /></PieChart></ResponsiveContainer>;
  }
  if (chart.type === "line") {
    return <ResponsiveContainer width="100%" height="100%"><LineChart {...common}>{grid}{axis}<YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} /><Tooltip content={<TooltipCard />} /><Line type="monotone" dataKey="value" stroke="#2D4A46" strokeWidth={3} dot={{ r: 3, fill: "#2D4A46" }} /></LineChart></ResponsiveContainer>;
  }
  if (chart.type === "area") {
    return <ResponsiveContainer width="100%" height="100%"><AreaChart {...common}>{grid}{axis}<YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} /><Tooltip content={<TooltipCard />} /><Area type="monotone" dataKey="value" stroke="#2D4A46" fill="#B7D7CE" fillOpacity={0.8} /></AreaChart></ResponsiveContainer>;
  }
  if (chart.type === "radar") {
    return <ResponsiveContainer width="100%" height="100%"><RadarChart data={chart.data}><Tooltip content={<TooltipCard />} /><Radar dataKey="value" stroke="#2D4A46" fill="#76A898" fillOpacity={0.55} /></RadarChart></ResponsiveContainer>;
  }
  if (chart.type === "scatter" || chart.type === "bubble") {
    const points = chart.data.map((item) => ({ x: item.value, y: item.secondaryValue ?? item.value, z: item.size ?? 80, label: item.label }));
    return <ResponsiveContainer width="100%" height="100%"><ScatterChart><XAxis type="number" dataKey="x" name="Value" tick={{ fontSize: 10 }} /><YAxis type="number" dataKey="y" name="Comparison" tick={{ fontSize: 10 }} /><Tooltip cursor={{ strokeDasharray: "3 3" }} content={<TooltipCard />} /><Scatter data={points} fill="#2F6B8A" /></ScatterChart></ResponsiveContainer>;
  }
  if (chart.type === "heatmap") return <Heatmap chart={chart} />;
  if (chart.type === "funnel") return <Funnel chart={chart} />;
  if (chart.type === "timeline" || chart.type === "flow") return <ProcessChart chart={chart} />;
  return <ResponsiveContainer width="100%" height="100%"><BarChart {...common}>{grid}{axis}<YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} /><Tooltip content={<TooltipCard />} /><Bar dataKey="value" radius={[5, 5, 0, 0]}>{chart.data.map((item, index) => <Cell key={`${item.label}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>;
}

export function VisualReportPreview({ report }: { report: VisualReport }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
      <div className="bg-[#2D4A46] px-6 py-5">
        <p className="text-xs font-bold tracking-[0.18em] text-[#B7D7CE]">VISUAL INTELLIGENCE REPORT</p>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{report.executiveSummary}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 border-b border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-3">
        {report.kpis.slice(0, 6).map((kpi) => <div key={kpi.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">{kpi.label}</p><p className="mt-1 text-lg font-bold text-[#1E293B]">{kpi.value}</p>{kpi.context && <p className="mt-1 text-[10px] text-[#64748B]">{kpi.context}</p>}</div>)}
      </div>
      <div className="space-y-5 p-5">
        {report.sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-[#E2E8F0] p-4">
            <div className="mb-3"><h3 className="font-bold text-[#1E293B]">{section.title}</h3><p className="mt-1 text-xs text-[#64748B]">{section.chart.title}{section.chart.unit ? ` · ${section.chart.unit}` : ""}</p></div>
            <div className="h-52"><ChartCanvas chart={section.chart} /></div>
            {section.chart.annotation && <p className="mt-3 rounded-lg bg-[#F1F8F5] px-3 py-2 text-xs font-medium text-[#2D4A46]">Insight: {section.chart.annotation}</p>}
            {section.summary && <p className="mt-3 text-sm leading-relaxed text-[#475569]">{section.summary}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
