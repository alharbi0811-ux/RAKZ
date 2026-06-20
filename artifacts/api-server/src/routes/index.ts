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
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

// TEMP: إنشاء حساب أدمن
router.get("/setup-admin", async (req, res) => {
  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, "ابراهيم الحربي"))
      .limit(1);

    if (existing.length > 0) {
      const hash = await bcrypt.hash("0811", 12);
      await db
        .update(usersTable)
        .set({ isAdmin: true, otpExempt: true, passwordHash: hash })
        .where(eq(usersTable.username, "ابراهيم الحربي"));
      return res.json({ message: "تم تحديث الحساب وتعيينه أدمن ✅" });
    }

    const hash = await bcrypt.hash("0811", 12);
    await db.insert(usersTable).values({
      username: "ابراهيم الحربي",
      passwordHash: hash,
      displayName: "ابراهيم الحربي",
      isAdmin: true,
      otpExempt: true,
    });
    return res.json({ message: "تم إنشاء حساب الأدمن بنجاح ✅" });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
