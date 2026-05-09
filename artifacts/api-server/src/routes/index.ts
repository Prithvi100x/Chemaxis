import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import reportsRouter from "./reports.js";
import generateRouter from "./generate.js";
import purchaseRouter from "./purchase.js";
import downloadRouter from "./download.js";
import seedRouter from "./seed.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(reportsRouter);
router.use(generateRouter);
router.use(purchaseRouter);
router.use(downloadRouter);
router.use(seedRouter);

export default router;
