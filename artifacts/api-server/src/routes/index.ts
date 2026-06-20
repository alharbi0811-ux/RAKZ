import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import historyRouter from "./history";
import categoriesRouter from "./categories";
import qrTemplatesRouter from "./qr-templates";
import externalPagesRouter from "./external-pages";
import categoryLayoutsRouter from "./category-layouts";
import siteSettingsRouter from "./site-settings";
import studyModeRouter from "./study-mode";
import feedbackRouter from "./feedback";
import favoritesRouter from "./favorites";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(qrTemplatesRouter);
router.use(externalPagesRouter);
router.use(categoryLayoutsRouter);
router.use(siteSettingsRouter);
router.use(studyModeRouter);
router.use(historyRouter);
router.use(adminRouter);
router.use(feedbackRouter);
router.use(favoritesRouter);

export default router;
