import { Router } from "express";
import mongoose from "mongoose";
import { GeneratedReport, Purchase } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = Router();

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
    const reportTitle: string = (contentData.reportTitle as string) ?? "Chemical Market Report";
    const targetLanguage: string = (contentData.targetLanguage as string) ?? "en";
    const generatedAt: string = (contentData.generatedAt as string) ?? new Date().toISOString();

    const doc = new PDFDocument({ margin: 60, size: "A4", bufferPages: true });
    const filename = `chemaxis-report-${genId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

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

    if (Object.keys(sections).length > 0) {
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
