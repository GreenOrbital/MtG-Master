import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanCardRouter from "./scan-card";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanCardRouter);

export default router;
