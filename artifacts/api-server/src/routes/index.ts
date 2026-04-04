import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scanCardRouter from "./scan-card";
import cardTipsRouter from "./card-tips";
import cardSynergiesRouter from "./card-synergies";
import deckAnalysisRouter from "./deck-analysis";
import recognizeCardRouter from "./recognize-card";
import cardCombosRouter from "./card-combos";
import userDataRouter from "./user-data";
import translateTextRouter from "./translate-text";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scanCardRouter);
router.use(cardTipsRouter);
router.use(cardSynergiesRouter);
router.use(deckAnalysisRouter);
router.use(recognizeCardRouter);
router.use(cardCombosRouter);
router.use(userDataRouter);
router.use(translateTextRouter);

export default router;
