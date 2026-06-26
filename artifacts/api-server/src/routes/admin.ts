import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { categoriesTable, questionsTable, usersTable, customRolesTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const imgStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `question-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`);
  },
});
const uploadImg = multer({
  storage: imgStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("يجب أن يكون الملف صورة"));
  },
});

router.use(requireAuth, requireAdmin);

// ───── Image Upload ─────
router.post("/admin/upload-image", uploadImg.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "لم يتم رفع أي صورة" });
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({ url: `${baseUrl}/api/uploads/${req.file.filename}` });
});

// ───── Stats ─────
router.get("/admin/stats", async (_req, res) => {
  try {
    const [catCount] = await db.select({ count: count() }).from(categoriesTable);
    const [qCount] = await db.select({ count: count() }).from(questionsTable);
    const [uCount] = await db.select({ count: count() }).from(usersTable);
    res.json({
      categories: catCount.count,
      questions: qCount.count,
      users: uCount.count,
    });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ───── Categories ─────
router.get("/admin/categories", async (_req, res) => {
  try {
    const cats = await db
      .select()
      .from(categoriesTable)
      .orderBy(desc(categoriesTable.createdAt));
    const withCount = await Promise.all(
      cats.map(async (cat) => {
        const [{ count: qCount }] = await db
          .select({ count: count() })
          .from(questionsTable)
          .where(eq(questionsTable.categoryId, cat.id));
        return { ...cat, questionCount: Number(qCount) };
      })
    );
    res.json(withCount);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

const categorySchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().min(1),
  section: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  flagUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

router.post("/admin/categories", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json(cat);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/admin/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [cat] = await db
      .update(categoriesTable)
      .set(parsed.data)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) return res.status(404).json({ error: "التصنيف غير موجود" });
    res.json(cat);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/admin/categories/:id/toggle-hidden", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [current] = await db
      .select({ isHidden: categoriesTable.isHidden })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id));
    if (!current) return res.status(404).json({ error: "الفئة غير موجودة" });
    const [updated] = await db
      .update(categoriesTable)
      .set({ isHidden: !current.isHidden })
      .where(eq(categoriesTable.id, id))
      .returning({ id: categoriesTable.id, isHidden: categoriesTable.isHidden });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/admin/categories/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const statusSchema = z.object({
    status: z.enum(["open", "closed", "in_progress"]),
    lockMessage: z.string().optional().nullable(),
  });
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [cat] = await db
      .update(categoriesTable)
      .set({ status: parsed.data.status, lockMessage: parsed.data.lockMessage ?? null })
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) return res.status(404).json({ error: "الفئة غير موجودة" });
    res.json({ id: cat.id, status: cat.status, lockMessage: cat.lockMessage });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ───── Questions ─────
router.get("/admin/questions", async (_req, res) => {
  try {
    const qs = await db
      .select()
      .from(questionsTable)
      .orderBy(desc(questionsTable.createdAt));
    res.json(qs);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

const questionSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionText: z.string().min(1),
  answer: z.string().min(1),
  optionA: z.string().optional().nullable(),
  optionB: z.string().optional().nullable(),
  optionC: z.string().optional().nullable(),
  optionD: z.string().optional().nullable(),
  correctOption: z.string().optional().nullable(),
  points: z.coerce.number().int().optional().default(400),
  timeSeconds: z.coerce.number().int().optional().default(30),
  imageUrl: z.string().optional().nullable(),
  answerImageUrl: z.string().optional().nullable(),
  externalPageId: z.coerce.number().int().optional().nullable(),
  qrTemplateId: z.coerce.number().int().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

router.post("/admin/questions", async (req, res) => {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
  try {
    const [q] = await db.insert(questionsTable).values(parsed.data).returning();
    res.status(201).json(q);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ───── Bulk Question Import ─────
const bulkItemSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.coerce.number().int(),
  questionText: z.string().min(1),
  answer: z.string().min(1),
});

router.post("/admin/questions/bulk", async (req, res) => {
  const parsed = z.array(bulkItemSchema).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
  if (parsed.data.length === 0) return res.status(400).json({ error: "لا توجد أسئلة للإدراج" });
  try {
    const inserted = await db
      .insert(questionsTable)
      .values(parsed.data.map((item) => ({ ...item, isActive: true, timeSeconds: 30 })))
      .returning();
    res.status(201).json({ count: inserted.length, questions: inserted });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.put("/admin/questions/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = questionSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  try {
    const [q] = await db
      .update(questionsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(questionsTable.id, id))
      .returning();
    if (!q) return res.status(404).json({ error: "السؤال غير موجود" });
    res.json(q);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/questions/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(questionsTable).where(eq(questionsTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ───── Users ─────
router.get("/admin/users", async (_req, res) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        isAdmin: usersTable.isAdmin,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json(users);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// الرتب الأساسية المدمجة
const BUILT_IN_ROLES = ["superadmin", "admin", "programmer", "writer", "player"] as const;
type BuiltInRole = typeof BUILT_IN_ROLES[number];

const BUILT_IN_ROLE_IS_ADMIN: Record<BuiltInRole, boolean> = {
  superadmin: true,
  admin: true,
  programmer: true,
  writer: false,
  player: false,
};

async function resolveRoleIsAdmin(role: string): Promise<boolean> {
  if (BUILT_IN_ROLES.includes(role as BuiltInRole)) {
    return BUILT_IN_ROLE_IS_ADMIN[role as BuiltInRole];
  }
  const [custom] = await db.select().from(customRolesTable).where(eq(customRolesTable.name, role)).limit(1);
  return custom?.isAdmin ?? false;
}

async function isValidRole(role: string): Promise<boolean> {
  if (BUILT_IN_ROLES.includes(role as BuiltInRole)) return true;
  const [custom] = await db.select().from(customRolesTable).where(eq(customRolesTable.name, role)).limit(1);
  return !!custom;
}

router.patch("/admin/users/:id/role", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { role } = req.body as { role: string };

  if (!(await isValidRole(role))) {
    return res.status(400).json({ error: "رتبة غير صحيحة" });
  }

  const [callerUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!callerUser || callerUser.role !== "superadmin") {
    const [targetUser] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (targetUser?.role === "superadmin") {
      return res.status(403).json({ error: "لا يمكن تعديل رتبة المالك" });
    }
  }

  if (id === req.userId && role !== "superadmin") {
    return res.status(400).json({ error: "لا يمكنك تخفيض رتبتك" });
  }

  try {
    const isAdmin = await resolveRoleIsAdmin(role);
    const [updated] = await db
      .update(usersTable)
      .set({ role, isAdmin })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, role: usersTable.role, isAdmin: usersTable.isAdmin });
    if (!updated) return res.status(404).json({ error: "المستخدم غير موجود" });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// ───── Custom Roles ─────

// GET /admin/roles — يرجع الرتب الأساسية + المخصصة
router.get("/admin/roles", async (_req, res) => {
  try {
    const custom = await db.select().from(customRolesTable).orderBy(customRolesTable.createdAt);
    const builtIn = [
      { id: "superadmin", name: "superadmin", label: "المالك",   isAdmin: true,  isBuiltIn: true },
      { id: "admin",      name: "admin",      label: "المدير",   isAdmin: true,  isBuiltIn: true },
      { id: "programmer", name: "programmer", label: "المبرمج",  isAdmin: true,  isBuiltIn: true },
      { id: "writer",     name: "writer",     label: "الكاتب",   isAdmin: false, isBuiltIn: true },
      { id: "player",     name: "player",     label: "اللاعب",   isAdmin: false, isBuiltIn: true },
    ];
    const customMapped = custom.map((r) => ({ ...r, id: String(r.id), isBuiltIn: false }));
    res.json([...builtIn, ...customMapped]);
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

// POST /admin/roles — إضافة رتبة مخصصة (المالك فقط)
const customRoleSchema = z.object({
  name: z.string().min(2).max(30).regex(/^[a-z0-9_]+$/, "الاسم يجب أن يكون بالإنجليزية (حروف صغيرة، أرقام، شرطة سفلية)"),
  label: z.string().min(1).max(20),
  isAdmin: z.boolean().optional().default(false),
});

router.post("/admin/roles", async (req: AuthRequest, res) => {
  const [callerUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!callerUser || callerUser.role !== "superadmin") {
    return res.status(403).json({ error: "فقط المالك يمكنه إضافة رتب جديدة" });
  }

  const parsed = customRoleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "بيانات غير صحيحة" });

  if (BUILT_IN_ROLES.includes(parsed.data.name as BuiltInRole)) {
    return res.status(400).json({ error: "هذا الاسم محجوز لرتبة أساسية" });
  }

  try {
    const [role] = await db.insert(customRolesTable).values(parsed.data).returning();
    res.status(201).json({ ...role, id: String(role.id), isBuiltIn: false });
  } catch {
    res.status(500).json({ error: "الرتبة موجودة مسبقاً أو خطأ في الخادم" });
  }
});

/* ─── OTP Exempt Management ─── */

router.get("/admin/otp-exempt", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, phone: usersTable.phone, otpExempt: usersTable.otpExempt })
      .from(usersTable)
      .where(eq(usersTable.otpExempt, true));
    res.json({ users });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/admin/otp-exempt/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  try {
    const [user] = await db.update(usersTable).set({ otpExempt: true }).where(eq(usersTable.id, id)).returning({ id: usersTable.id, username: usersTable.username });
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
    res.json({ ok: true, user });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.delete("/admin/otp-exempt/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "معرّف غير صحيح" });
  try {
    await db.update(usersTable).set({ otpExempt: false }).where(eq(usersTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/users-search", requireAuth, requireAdmin, async (req, res) => {
  const q = String(req.query.q || "").trim();
  try {
    const users = await db
      .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, otpExempt: usersTable.otpExempt })
      .from(usersTable)
      .limit(20);
    const filtered = q ? users.filter(u => u.username.includes(q) || (u.displayName ?? "").includes(q)) : users;
    res.json({ users: filtered });
  } catch {
    res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
