import { Router } from "express";
import { db, reportsTable } from "@workspace/db";

const router = Router();

router.post("/seed", async (req, res) => {
  try {
    const existing = await db.select().from(reportsTable).limit(1);
    if (existing.length > 0) {
      res.json({ ok: true, message: "Already seeded" });
      return;
    }
    res.json({ ok: true, message: "Use server auto-seed on startup" });
  } catch (err) {
    req.log.error({ err }, "Seed error");
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
