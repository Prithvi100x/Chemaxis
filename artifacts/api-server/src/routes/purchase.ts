import { Router } from "express";
import mongoose from "mongoose";
import { Report, Purchase } from "@workspace/db";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/purchase", requireAuth, async (req, res) => {
  const { reportId, generatedReportId } = req.body;
  const userId = req.jwtUser!.userId;

  if (!reportId) {
    res.status(400).json({ error: "reportId is required" });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  try {
    const report = await Report.findById(reportId);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const existing = await Purchase.findOne({ userId, reportId });
    if (existing) {
      res.json({ ok: true, purchaseId: existing._id.toString(), alreadyOwned: true });
      return;
    }

    const purchase = await Purchase.create({
      userId,
      reportId,
      generatedReportId: generatedReportId && mongoose.Types.ObjectId.isValid(generatedReportId) ? generatedReportId : null,
      amountCents: report.get("priceCents"),
      status: "completed",
    });

    res.json({ ok: true, purchaseId: purchase._id.toString(), alreadyOwned: false });
  } catch (err) {
    req.log.error({ err }, "Purchase error");
    res.status(500).json({ error: "Purchase failed" });
  }
});

router.get("/purchases", requireAuth, async (req, res) => {
  const userId = req.jwtUser!.userId;
  try {
    const purchases = await Purchase.find({ userId })
      .populate<{ reportId: { _id: mongoose.Types.ObjectId; title: string } }>("reportId", "title")
      .sort({ createdAt: -1 });

    res.json(purchases.map(p => {
      const obj = p.toJSON() as Record<string, unknown>;
      const reportDoc = p.reportId as unknown as { _id: mongoose.Types.ObjectId; title: string } | null;
      return {
        ...obj,
        reportId: reportDoc?._id?.toString() ?? obj.reportId,
        reportTitle: reportDoc?.title ?? null,
      };
    }));
  } catch (err) {
    req.log.error({ err }, "Purchases list error");
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

export default router;
