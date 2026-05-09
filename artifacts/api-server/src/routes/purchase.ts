import { Router } from "express";
import { db, reportsTable, purchasesTable, generatedReportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/purchase", requireAuth, async (req, res) => {
  const { reportId, generatedReportId } = req.body;
  const userId = req.session!.userId!;

  if (!reportId) {
    res.status(400).json({ error: "reportId is required" });
    return;
  }

  try {
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, reportId)).limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const existing = await db.select().from(purchasesTable)
      .where(and(eq(purchasesTable.userId, userId), eq(purchasesTable.reportId, reportId)))
      .limit(1);
    if (existing.length > 0) {
      res.json({ ok: true, purchaseId: existing[0].id, alreadyOwned: true });
      return;
    }

    const [purchase] = await db.insert(purchasesTable).values({
      userId,
      reportId,
      generatedReportId: generatedReportId ?? null,
      amountCents: report.priceCents,
      status: "completed",
    }).returning();

    res.json({ ok: true, purchaseId: purchase.id, alreadyOwned: false });
  } catch (err) {
    req.log.error({ err }, "Purchase error");
    res.status(500).json({ error: "Purchase failed" });
  }
});

router.get("/purchases", requireAuth, async (req, res) => {
  const userId = req.session!.userId!;
  try {
    const purchases = await db.select({
      id: purchasesTable.id,
      reportId: purchasesTable.reportId,
      amountCents: purchasesTable.amountCents,
      status: purchasesTable.status,
      createdAt: purchasesTable.createdAt,
      reportTitle: reportsTable.title,
    })
    .from(purchasesTable)
    .leftJoin(reportsTable, eq(purchasesTable.reportId, reportsTable.id))
    .where(eq(purchasesTable.userId, userId));
    res.json(purchases);
  } catch (err) {
    req.log.error({ err }, "Purchases list error");
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

export default router;
