import { Router } from "express";
import mongoose from "mongoose";
import { Report, Purchase } from "@workspace/db";

const router = Router();

router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: 1 });
    res.json(reports.map(r => r.toJSON()));
  } catch (err) {
    req.log.error({ err }, "List reports error");
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    const report = await Report.findById(id);
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }

    let purchased = false;
    const userId = req.jwtUser?.userId;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const p = await Purchase.findOne({ userId, reportId: id });
      purchased = !!p;
    }

    res.json({ ...report.toJSON(), purchased });
  } catch (err) {
    req.log.error({ err }, "Get report error");
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

router.get("/reports/:id/purchases", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.jwtUser?.userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(id)) {
      res.json({ purchased: false });
      return;
    }
    const purchase = await Purchase.findOne({ userId, reportId: id });
    res.json({ purchased: !!purchase });
  } catch (err) {
    req.log.error({ err }, "Check purchase error");
    res.status(500).json({ error: "Failed to check purchase" });
  }
});

export default router;
