import { Router } from "express";
import mongoose from "mongoose";
import { GeneratedReport, Purchase } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = Router();

type Pdf = InstanceType<typeof PDFDocument>;

type VisualDatum = { label: string; value: number; secondaryValue?: number; size?: number };
type VisualChart = { type: string; title: string; unit?: string; annotation?: string; data: VisualDatum[] };
type VisualSection = { title: string; summary?: string; keyInsight?: string; chart: VisualChart };
type VisualKpi = { label: string; value: string; context?: string; trend?: "up" | "down" | "flat" };
type VisualReport = { executiveSummary: string; kpis: VisualKpi[]; sections: VisualSection[] };

const COLORS = ["#2D4A46", "#2F6B8A", "#D97706", "#8B5CF6", "#DB2777", "#16A34A", "#DC2626", "#0891B2"];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shorten(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, Math.max(0, length - 1))}…` : value;
}

function drawHeader(doc: Pdf, title: string, subtitle: string): void {
  doc.rect(0, 0, doc.page.width, 88).fill("#2D4A46");
  doc.fill("white").fontSize(19).font("Helvetica-Bold").text("ChemAxis", 56, 24);
  doc.fontSize(8).font("Helvetica").fill("#DCEAE6").text("VISUAL INTELLIGENCE REPORT", 58, 52);
  doc.fill("#1E293B").fontSize(16).font("Helvetica-Bold").text(title, 56, 112, { width: doc.page.width - 112 });
  doc.fill("#64748B").fontSize(9).font("Helvetica").text(subtitle, 56, 136, { width: doc.page.width - 112 });
}

function drawKpis(doc: Pdf, kpis: VisualKpi[], y: number): number {
  const cards = kpis.slice(0, 6);
  const width = (doc.page.width - 112 - 12) / 2;
  const height = 65;
  cards.forEach((kpi, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 56 + column * (width + 12);
    const top = y + row * (height + 12);
    const color = kpi.trend === "up" ? "#15803D" : kpi.trend === "down" ? "#DC2626" : "#2F6B8A";
    doc.roundedRect(x, top, width, height, 8).fill("#F8FAFC").stroke("#E2E8F0");
    doc.fill("#64748B").fontSize(7).font("Helvetica-Bold").text(shorten(kpi.label, 38).toUpperCase(), x + 12, top + 11, { width: width - 24 });
    doc.fill("#1E293B").fontSize(16).font("Helvetica-Bold").text(kpi.value, x + 12, top + 24, { width: width - 24 });
    if (kpi.context) doc.fill(color).fontSize(7).font("Helvetica").text(shorten(kpi.context, 58), x + 12, top + 49, { width: width - 24 });
  });
  return y + Math.ceil(cards.length / 2) * (height + 12);
}

function drawBarChart(doc: Pdf, data: VisualDatum[], x: number, y: number, width: number, height: number): void {
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const baseline = y + height - 28;
  const barGap = 8;
  const barWidth = Math.max(10, (width - barGap * (data.length - 1)) / data.length);
  doc.moveTo(x, baseline).lineTo(x + width, baseline).stroke("#CBD5E1");
  data.forEach((item, index) => {
    const valueHeight = (Math.abs(item.value) / max) * (height - 58);
    const barX = x + index * (barWidth + barGap);
    const barY = item.value >= 0 ? baseline - valueHeight : baseline;
    doc.roundedRect(barX, barY, barWidth, Math.max(2, valueHeight), 3).fill(COLORS[index % COLORS.length]);
    doc.fill("#475569").fontSize(6).font("Helvetica").text(shorten(item.label, 12), barX - 6, baseline + 5, { width: barWidth + 12, align: "center" });
    doc.fill("#1E293B").fontSize(6).font("Helvetica-Bold").text(String(item.value), barX - 6, Math.max(y, barY - 11), { width: barWidth + 12, align: "center" });
  });
}

function drawLineChart(doc: Pdf, data: VisualDatum[], x: number, y: number, width: number, height: number, area = false): void {
  const values = data.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const top = y + 12;
  const bottom = y + height - 30;
  for (let i = 0; i <= 3; i++) {
    const lineY = top + ((bottom - top) * i) / 3;
    doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke("#E2E8F0");
  }
  const points = data.map((item, index) => ({
    x: x + (index * width) / Math.max(1, data.length - 1),
    y: bottom - ((item.value - min) / range) * (bottom - top),
  }));
  if (area) {
    doc.moveTo(points[0].x, bottom);
    points.forEach((point) => doc.lineTo(point.x, point.y));
    doc.lineTo(points[points.length - 1].x, bottom).closePath().fill("#CFE3D9");
  }
  doc.moveTo(points[0].x, points[0].y).lineWidth(2).strokeColor("#2D4A46");
  points.slice(1).forEach((point) => doc.lineTo(point.x, point.y));
  doc.stroke();
  points.forEach((point, index) => {
    doc.circle(point.x, point.y, 3).fill(COLORS[index % COLORS.length]);
    doc.fill("#475569").fontSize(6).font("Helvetica").text(shorten(data[index].label, 12), point.x - 19, bottom + 6, { width: 38, align: "center" });
  });
}

function drawPieSlice(doc: Pdf, x: number, y: number, radius: number, start: number, end: number, color: string): void {
  const segments = Math.ceil(Math.abs(end - start) / (Math.PI / 2));
  const step = (end - start) / segments;
  doc.moveTo(x, y).lineTo(x + radius * Math.cos(start), y + radius * Math.sin(start));
  for (let index = 0; index < segments; index++) {
    const from = start + index * step;
    const to = from + step;
    const control = (4 / 3) * Math.tan((to - from) / 4);
    doc.bezierCurveTo(
      x + radius * (Math.cos(from) - control * Math.sin(from)),
      y + radius * (Math.sin(from) + control * Math.cos(from)),
      x + radius * (Math.cos(to) + control * Math.sin(to)),
      y + radius * (Math.sin(to) - control * Math.cos(to)),
      x + radius * Math.cos(to),
      y + radius * Math.sin(to),
    );
  }
  doc.closePath().fill(color);
}

function drawDonutChart(doc: Pdf, data: VisualDatum[], x: number, y: number, width: number, height: number): void {
  const total = data.reduce((sum, item) => sum + Math.max(item.value, 0), 0) || 1;
  const centerX = x + Math.min(width * 0.3, 100);
  const centerY = y + height / 2;
  const radius = Math.min(height * 0.34, 52);
  let angle = -Math.PI / 2;
  data.forEach((item, index) => {
    const next = angle + (Math.max(item.value, 0) / total) * Math.PI * 2;
    drawPieSlice(doc, centerX, centerY, radius, angle, next, COLORS[index % COLORS.length]);
    angle = next;
  });
  doc.circle(centerX, centerY, radius * 0.56).fill("white");
  doc.fill("#1E293B").fontSize(9).font("Helvetica-Bold").text("Total", centerX - 20, centerY - 9, { width: 40, align: "center" });
  doc.fill("#64748B").fontSize(7).font("Helvetica").text(String(total), centerX - 20, centerY + 4, { width: 40, align: "center" });
  data.slice(0, 6).forEach((item, index) => {
    const legendY = y + 10 + index * 20;
    const share = ((Math.max(item.value, 0) / total) * 100).toFixed(1);
    doc.rect(x + width * 0.54, legendY + 2, 8, 8).fill(COLORS[index % COLORS.length]);
    doc.fill("#475569").fontSize(7).font("Helvetica").text(`${shorten(item.label, 22)}  ${share}%`, x + width * 0.54 + 13, legendY, { width: width * 0.43 - 13 });
  });
}

function drawRadarChart(doc: Pdf, data: VisualDatum[], x: number, y: number, width: number, height: number): void {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) * 0.31;
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);
  const angleFor = (index: number) => -Math.PI / 2 + (index * Math.PI * 2) / data.length;
  for (let ring = 1; ring <= 3; ring++) {
    const points = data.map((_, index) => {
      const angle = angleFor(index);
      const ringRadius = (radius * ring) / 3;
      return [centerX + ringRadius * Math.cos(angle), centerY + ringRadius * Math.sin(angle)];
    });
    doc.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach((point) => doc.lineTo(point[0], point[1]));
    doc.closePath().stroke("#E2E8F0");
  }
  const values = data.map((item, index) => {
    const angle = angleFor(index);
    const distance = (Math.abs(item.value) / max) * radius;
    return [centerX + distance * Math.cos(angle), centerY + distance * Math.sin(angle)];
  });
  doc.moveTo(values[0][0], values[0][1]);
  values.slice(1).forEach((point) => doc.lineTo(point[0], point[1]));
  doc.closePath().fill("#B7D7CE").stroke("#2D4A46");
  data.forEach((item, index) => {
    const angle = angleFor(index);
    const labelX = centerX + (radius + 15) * Math.cos(angle) - 22;
    const labelY = centerY + (radius + 15) * Math.sin(angle) - 4;
    doc.fill("#475569").fontSize(6).font("Helvetica").text(shorten(item.label, 12), labelX, labelY, { width: 44, align: "center" });
  });
}

function drawProcessChart(doc: Pdf, chart: VisualChart, x: number, y: number, width: number, height: number): void {
  const data = chart.data.slice(0, 6);
  const horizontal = chart.type === "flow" || chart.type === "timeline";
  const count = data.length;
  if (horizontal) {
    const boxWidth = Math.min(96, (width - (count - 1) * 16) / count);
    data.forEach((item, index) => {
      const boxX = x + index * (boxWidth + 16);
      const boxY = y + height / 2 - 24;
      doc.roundedRect(boxX, boxY, boxWidth, 48, 7).fill(index % 2 ? "#E9F2F0" : "#F8FAFC").stroke("#B7D7CE");
      doc.fill("#2D4A46").fontSize(7).font("Helvetica-Bold").text(shorten(item.label, 20), boxX + 6, boxY + 11, { width: boxWidth - 12, align: "center" });
      doc.fill("#64748B").fontSize(7).font("Helvetica").text(String(item.value), boxX + 6, boxY + 29, { width: boxWidth - 12, align: "center" });
      if (index < count - 1) {
        doc.moveTo(boxX + boxWidth, boxY + 24).lineTo(boxX + boxWidth + 11, boxY + 24).stroke("#2D4A46");
        doc.polygon([boxX + boxWidth + 11, boxY + 24], [boxX + boxWidth + 6, boxY + 20], [boxX + boxWidth + 6, boxY + 28]).fill("#2D4A46");
      }
    });
    return;
  }
  drawBarChart(doc, data, x, y, width, height);
}

function drawSpecialChart(doc: Pdf, chart: VisualChart, x: number, y: number, width: number, height: number): void {
  if (chart.type === "donut") return drawDonutChart(doc, chart.data, x, y, width, height);
  if (chart.type === "radar") return drawRadarChart(doc, chart.data, x, y, width, height);
  if (chart.type === "line") return drawLineChart(doc, chart.data, x, y, width, height);
  if (chart.type === "area") return drawLineChart(doc, chart.data, x, y, width, height, true);
  if (chart.type === "flow" || chart.type === "timeline") return drawProcessChart(doc, chart, x, y, width, height);
  if (chart.type === "scatter" || chart.type === "bubble") {
    const maxX = Math.max(...chart.data.map((item) => item.value), 1);
    const maxY = Math.max(...chart.data.map((item) => item.secondaryValue ?? item.value), 1);
    chart.data.forEach((item, index) => {
      const pointX = x + (item.value / maxX) * (width - 24) + 12;
      const pointY = y + height - ((item.secondaryValue ?? item.value) / maxY) * (height - 35) - 20;
      doc.circle(pointX, pointY, clamp(item.size ?? 5, 4, 16)).fill(COLORS[index % COLORS.length]);
      doc.fill("#475569").fontSize(6).font("Helvetica").text(shorten(item.label, 12), pointX - 22, pointY + 8, { width: 44, align: "center" });
    });
    return;
  }
  if (chart.type === "heatmap") {
    const max = Math.max(...chart.data.map((item) => item.value), 1);
    chart.data.forEach((item, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const cellWidth = (width - 18) / 4;
      const cellHeight = 34;
      const intensity = clamp(item.value / max, 0.14, 1);
      doc.fillColor("#2D4A46", intensity).roundedRect(x + column * (cellWidth + 6), y + row * (cellHeight + 6), cellWidth, cellHeight, 4).fill();
      doc.fill("white").fontSize(6).font("Helvetica-Bold").text(shorten(item.label, 14), x + column * (cellWidth + 6) + 4, y + row * (cellHeight + 6) + 7, { width: cellWidth - 8, align: "center" });
      doc.fill("white").fontSize(7).font("Helvetica").text(String(item.value), x + column * (cellWidth + 6) + 4, y + row * (cellHeight + 6) + 19, { width: cellWidth - 8, align: "center" });
    });
    return;
  }
  if (chart.type === "funnel") {
    const max = Math.max(...chart.data.map((item) => item.value), 1);
    chart.data.forEach((item, index) => {
      const barWidth = Math.max(40, (item.value / max) * width);
      const barX = x + (width - barWidth) / 2;
      const barY = y + index * 30;
      doc.roundedRect(barX, barY, barWidth, 22, 5).fill(COLORS[index % COLORS.length]);
      doc.fill("white").fontSize(7).font("Helvetica-Bold").text(`${shorten(item.label, 22)}  ${item.value}`, barX + 8, barY + 7, { width: barWidth - 16, align: "center" });
    });
    return;
  }
  drawBarChart(doc, chart.data, x, y, width, height);
}

function drawVisualSection(doc: Pdf, section: VisualSection): void {
  drawHeader(doc, section.title, section.keyInsight ?? "");
  const x = 56;
  const y = 174;
  const width = doc.page.width - 112;
  doc.roundedRect(x, y, width, 270, 10).fill("#F8FAFC").stroke("#E2E8F0");
  doc.fill("#1E293B").fontSize(12).font("Helvetica-Bold").text(section.chart.title, x + 16, y + 16, { width: width - 32 });
  if (section.chart.unit) doc.fill("#64748B").fontSize(7).font("Helvetica").text(`Unit: ${section.chart.unit}`, x + 16, y + 33, { width: width - 32 });
  drawSpecialChart(doc, section.chart, x + 22, y + 52, width - 44, 160);
  if (section.chart.annotation) doc.fill("#2D4A46").fontSize(8).font("Helvetica-Bold").text(`Insight: ${section.chart.annotation}`, x + 16, y + 228, { width: width - 32 });
  if (section.summary) doc.fill("#475569").fontSize(9).font("Helvetica").text(section.summary, x, 472, { width, lineGap: 3 });
}

router.get("/generated/:id/download", requireAuth, async (req, res) => {
  const genId = String(req.params.id);
  const userId = req.jwtUser!.userId;

  if (!mongoose.Types.ObjectId.isValid(genId)) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  try {
    const gen = await GeneratedReport.findOne({ _id: genId, userId });
    if (!gen) { res.status(404).json({ error: "Report not found" }); return; }
    if (gen.get("status") !== "done") { res.status(400).json({ error: "Report is not ready yet" }); return; }

    const purchase = await Purchase.findOne({ userId, reportId: gen.get("reportId") });
    if (!purchase) { res.status(403).json({ error: "Please purchase this report to download it" }); return; }

    const contentData = (gen.get("content") as Record<string, unknown>) ?? {};
    const raw: string = (contentData.raw as string) ?? "";
    const sections: Record<string, string> = (contentData.sections as Record<string, string>) ?? {};
    const visualReport = contentData.visualReport as VisualReport | undefined;
    const reportTitle: string = (contentData.reportTitle as string) ?? "Chemical Market Report";
    const targetLanguage: string = (contentData.targetLanguage as string) ?? "en";
    const generatedAt: string = (contentData.generatedAt as string) ?? new Date().toISOString();

    const doc = new PDFDocument({ margin: 60, size: "A4", bufferPages: true });
    const filename = `chemaxis-report-${genId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    if (visualReport?.executiveSummary && Array.isArray(visualReport.kpis) && Array.isArray(visualReport.sections)) {
      doc.rect(0, 0, doc.page.width, 190).fill("#2D4A46");
      doc.fill("#DCEAE6").fontSize(9).font("Helvetica-Bold").text("CHEMAXIS  /  VISUAL INTELLIGENCE REPORT", 56, 44);
      doc.fill("white").fontSize(26).font("Helvetica-Bold").text(reportTitle, 56, 68, { width: doc.page.width - 112 });
      doc.fill("#DCEAE6").fontSize(9).font("Helvetica").text(`Generated: ${new Date(generatedAt).toLocaleDateString()}  |  Language: ${targetLanguage.toUpperCase()}`, 56, 150);
      doc.fill("#1E293B").fontSize(13).font("Helvetica-Bold").text("Executive snapshot", 56, 220);
      doc.fill("#475569").fontSize(10).font("Helvetica").text(visualReport.executiveSummary, 56, 244, { width: doc.page.width - 112, lineGap: 4 });
      drawKpis(doc, visualReport.kpis, 330);

      for (const section of visualReport.sections) {
        doc.addPage();
        drawVisualSection(doc, section);
      }
    } else if (Object.keys(sections).length > 0) {
      doc.rect(0, 0, doc.page.width, 120).fill("#2D4A46");
      doc.fill("white").fontSize(24).font("Helvetica-Bold").text("ChemAxis", 60, 30);
      doc.fontSize(10).font("Helvetica").text("Chemical Data Intelligence Platform", 60, 60);
      doc.fontSize(8).text(`Generated: ${new Date(generatedAt).toLocaleDateString()} | Language: ${targetLanguage.toUpperCase()}`, 60, 78);
      doc.fill("#2D4A46").rect(0, 120, doc.page.width, 4).fill("#B0C4B1");
      doc.moveDown(4);
      doc.fill("#2D4A46").fontSize(20).font("Helvetica-Bold").text(reportTitle, { align: "center" });
      doc.moveDown(0.5);
      doc.fill("#64748B").fontSize(10).font("Helvetica").text("Market Intelligence Report — Powered by AI", { align: "center" });
      doc.moveDown(2);
      doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke("#E2E8F0");
      doc.moveDown(1);
      for (const [sectionName, sectionContent] of Object.entries(sections)) {
        if (!sectionContent?.trim()) continue;
        doc.addPage();
        doc.rect(60, 60, doc.page.width - 120, 32).fill("#F1F5F9");
        doc.fill("#2D4A46").fontSize(14).font("Helvetica-Bold").text(sectionName, 72, 70);
        doc.moveDown(2);
        doc.fill("#1E293B").fontSize(10).font("Helvetica").text(sectionContent, { lineGap: 4 });
        doc.moveDown(1);
      }
    } else {
      doc.fill("#1E293B").fontSize(10).font("Helvetica").text(raw, { lineGap: 4 });
    }

    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.fill("#94A3B8").fontSize(8).font("Helvetica")
        .text(`ChemAxis Intelligence Report | Page ${i + 1} of ${pages.count}`, 60, doc.page.height - 40, { align: "center" });
    }

    doc.end();
  } catch (err) {
    req.log.error({ err }, "Download error");
    if (!res.headersSent) res.status(500).json({ error: "Download failed" });
  }
});

export default router;
