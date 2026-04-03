import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanCardRouter from "./scan-card";
import cardTipsRouter from "./card-tips";
import cardSynergiesRouter from "./card-synergies";
import deckAnalysisRouter from "./deck-analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanCardRouter);
router.use(cardTipsRouter);
router.use(cardSynergiesRouter);
router.use(deckAnalysisRouter);

export default router;
