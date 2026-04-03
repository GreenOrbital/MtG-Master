import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanCardRouter from "./scan-card";
import cardTipsRouter from "./card-tips";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanCardRouter);
router.use(cardTipsRouter);

export default router;
