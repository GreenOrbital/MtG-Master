import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cardTipsRouter from "./card-tips";
import cardSynergiesRouter from "./card-synergies";
import deckAnalysisRouter from "./deck-analysis";
import cardCombosRouter from "./card-combos";
import deckCombosRouter from "./deck-combos";
import userDataRouter from "./user-data";
import cardParallaxRouter from "./card-parallax";
import deckSuggestionRouter from "./deck-suggestion";
import partnerRouter from "./partner";
import geoLanguageRouter from "./geo-language";
import friendsRouter from "./friends";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geoLanguageRouter);
router.use(friendsRouter);
router.use(cardTipsRouter);
router.use(cardSynergiesRouter);
router.use(deckAnalysisRouter);
router.use(cardCombosRouter);
router.use(deckCombosRouter);
router.use(userDataRouter);
router.use(cardParallaxRouter);
router.use(deckSuggestionRouter);
router.use(partnerRouter);

export default router;
