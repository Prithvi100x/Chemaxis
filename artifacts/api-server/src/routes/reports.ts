import { Router } from "express";
import { db, reportsTable, purchasesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/reports", async (req, res) => {
  try {
    const reports = await db.select({
      id: reportsTable.id,
      title: reportsTable.title,
      description: reportsTable.description,
      category: reportsTable.category,
      sourceLanguage: reportsTable.sourceLanguage,
      priceCents: reportsTable.priceCents,
      tags: reportsTable.tags,
      pageCount: reportsTable.pageCount,
      sampleContent: reportsTable.sampleContent,
      createdAt: reportsTable.createdAt,
    }).from(reportsTable).orderBy(reportsTable.createdAt);
    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "List reports error");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [report] = await db.select({
      id: reportsTable.id,
      title: reportsTable.title,
      description: reportsTable.description,
      category: reportsTable.category,
      sourceLanguage: reportsTable.sourceLanguage,
      priceCents: reportsTable.priceCents,
      tags: reportsTable.tags,
      pageCount: reportsTable.pageCount,
      sampleContent: reportsTable.sampleContent,
      createdAt: reportsTable.createdAt,
    }).from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    let purchased = false;
    if (req.session?.userId) {
      const [p] = await db.select().from(purchasesTable)
        .where(and(eq(purchasesTable.userId, req.session.userId), eq(purchasesTable.reportId, id)))
        .limit(1);
      purchased = !!p;
    }

    res.json({ ...report, purchased });
  } catch (err) {
    req.log.error({ err }, "Get report error");
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

router.get("/reports/:id/purchases", requireAuth, async (req, res) => {
  try {
    const reportId = Number(req.params.id);
    const userId = req.session!.userId!;
    const [purchase] = await db.select().from(purchasesTable)
      .where(and(eq(purchasesTable.userId, userId), eq(purchasesTable.reportId, reportId)))
      .limit(1);
    res.json({ purchased: !!purchase });
  } catch (err) {
    req.log.error({ err }, "Check purchase error");
    res.status(500).json({ error: "Failed to check purchase" });
  }
});

export default router;
