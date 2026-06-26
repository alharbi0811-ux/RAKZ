import { API_BASE } from "@/lib/apiBase";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowRight, Check, Eye, EyeOff, ImagePlus, X, Loader2 } from "lucide-react";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { useAuth } from "@/context/AuthContext";
import LogoQR from "@/components/LogoQR";

interface Category { id: number; nameAr: string; }
interface ExternalPage { id: number; title: string; slug: string; }
interface QrTemplate { id: number; name: string; templateImageUrl: string | null; qrPositionX: number; qrPositionY: number; qrSize: number; }

const difficulties = [
  { value: "easy",   label: "سهل",   points: 200, color: "#34d399", bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)" },
  { value: "medium", label: "متوسط", points: 400, color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.35)" },
  { value: "hard",   label: "صعب",   points: 600, color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.35)" },
];

const inputStyle: React.CSSProperties = {
  background: "#0b0b14",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e2f0",
  borderRadius: "8px",
  padding: "10px 14px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontFamily: "monospace",
  color: "#555577",
  marginBottom: "6px",
  letterSpacing: "0.04em",
};


export default function AdminQuestionForm() {
  const [location, navigate] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/admin/questions/:id/edit");
  const isEdit = matchEdit;
  const editId = paramsEdit?.id;

  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const preselectedCategory = urlParams.get("categoryId");

  const adminFetch = useAdminFetch();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [externalPages, setExternalPages] = useState<ExternalPage[]>([]);
  const [qrTemplates, setQrTemplates] = useState<QrTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingQ, setUploadingQ] = useState(false);
  const [uploadingA, setUploadingA] = useState(false);
  const imgQRef = useRef<HTMLInputElement>(null);
  const imgARef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    categoryId: preselectedCategory || "",
    questionText: "",
    answer: "",
    optionA: "", optionB: "", optionC: "", optionD: "",
    correctOption: "" as "" | "a" | "b" | "c" | "d",
    difficulty: "medium",
    points: "400",
    isActive: true,
    imageUrl: "" as string,
    answerImageUrl: "" as string,
    externalPageId: "" as string,
    qrTemplateId: "" as string,
  });

  async function uploadImage(file: File, field: "imageUrl" | "answerImageUrl") {
    const setUploading = field === "imageUrl" ? setUploadingQ : setUploadingA;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الرفع");
      setForm((p) => ({ ...p, [field]: data.url }));
    } catch (err: any) {
      setError(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  const selectedCategory = categories.find((c) => String(c.id) === String(form.categoryId));
  const isBadounKalam = selectedCategory?.nameAr.includes("كلام") || selectedCategory?.nameAr.includes("ولا كلمة");
  const selectedPage = externalPages.find((p) => String(p.id) === String(form.externalPageId));
  const selectedTemplate = qrTemplates.find((t) => String(t.id) === String(form.qrTemplateId));
  const pageUrl = selectedPage ? `${window.location.origin}/p/${selectedPage.slug}` : "";

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<any>) => (e.target.style.borderColor = "rgba(123,47,190,0.6)"),
    onBlur:  (e: React.FocusEvent<any>) => (e.target.style.borderColor = "rgba(255,255,255,0.08)"),
  };

  useEffect(() => {
    adminFetch("/admin/categories").then(setCategories).catch(console.error);
  }, [adminFetch]);

  useEffect(() => {
    adminFetch("/external-pages").then((data: ExternalPage[]) => setExternalPages(data)).catch(() => {});
    adminFetch("/admin/qr-templates").then((data: QrTemplate[]) => setQrTemplates(data)).catch(() => {});

    if (isEdit && editId) {
      adminFetch("/admin/questions")
        .then((qs: any[]) => {
          const q = qs.find((x) => x.id === Number(editId));
          if (q) {
            setForm({
              categoryId: String(q.categoryId),
              questionText: q.questionText,
              answer: q.answer,
              optionA: q.optionA || "", optionB: q.optionB || "",
              optionC: q.optionC || "", optionD: q.optionD || "",
              correctOption: q.correctOption || "",
              difficulty: q.difficulty,
              points: String(q.points),
              isActive: q.isActive,
              imageUrl: q.imageUrl || "",
              answerImageUrl: q.answerImageUrl || "",
              externalPageId: q.externalPageId ? String(q.externalPageId) : "",
              qrTemplateId: q.qrTemplateId ? String(q.qrTemplateId) : "",
            });
          }
        })
        .catch(console.error);
    }
  }, [isEdit, editId, adminFetch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.categoryId) return setError("يرجى اختيار الفئة");
    if (!form.questionText.trim()) return setError("يرجى إدخال نص السؤال");
    if (!form.answer.trim()) return setError("يرجى إدخال الإجابة");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        categoryId: Number(form.categoryId),
        questionText: form.questionText,
        answer: form.answer,
        difficulty: form.difficulty,
        points: Number(form.points),
        timeSeconds: 30,
        isActive: form.isActive,
      };
      if (form.optionA) payload.optionA = form.optionA;
      if (form.optionB) payload.optionB = form.optionB;
      if (form.optionC) payload.optionC = form.optionC;
      if (form.optionD) payload.optionD = form.optionD;
      if (form.correctOption) payload.correctOption = form.correctOption;
      payload.imageUrl = form.imageUrl || null;
      payload.answerImageUrl = form.answerImageUrl || null;
      if (form.externalPageId) payload.externalPageId = Number(form.externalPageId);
      else payload.externalPageId = null;
      if (form.qrTemplateId) payload.qrTemplateId = Number(form.qrTemplateId);
      else payload.qrTemplateId = null;

      if (isEdit && editId) {
        await adminFetch(`/admin/questions/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/admin/questions", { method: "POST", body: JSON.stringify(payload) });
      }
      navigate(`/admin/categories/${form.categoryId}/questions`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<any>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const hasOptions = form.optionA || form.optionB || form.optionC || form.optionD;

  return (
    <div>
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={() => navigate(-1 as any)}
          className="p-2 rounded-lg transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#555577" }}
        >
          <ArrowRight size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono" style={{ color: "#3b82f6" }}>~/admin/questions $</span>
            <span className="text-xs font-mono" style={{ color: "#444466" }}>{isEdit ? "edit" : "new"}</span>
          </div>
          <h2 className="text-xl font-black text-white">
            {isEdit ? "تعديل السؤال" : "سؤال جديد"}
          </h2>
        </div>
      </div>

      <div className="max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 space-y-5"
          style={{ background: "#12121f", border: "1px solid rgba(59,130,246,0.15)" }}
        >
          {/* Category */}
          <div>
            <label style={labelStyle}>الفئة *</label>
            <select value={form.categoryId} onChange={set("categoryId")} required style={{ ...inputStyle, cursor: "pointer" }} {...focusHandlers}>
              <option value="" style={{ background: "#0b0b14" }}>اختر الفئة...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#0b0b14" }}>{c.nameAr}</option>
              ))}
            </select>
          </div>

          {/* Question text */}
          <div>
            <label style={labelStyle}>نص السؤال *</label>
            <textarea
              value={form.questionText}
              onChange={set("questionText")}
              required
              placeholder="اكتب السؤال هنا..."
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              {...focusHandlers}
            />
          </div>

          {/* Question Image */}
          <div>
            <label style={labelStyle}>صورة السؤال (اختياري)</label>
            <input
              ref={imgQRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "imageUrl"); e.target.value = ""; }}
            />
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(123,47,190,0.3)", background: "#0b0b14" }}>
                <img src={form.imageUrl} alt="صورة السؤال" className="w-full object-contain max-h-48" />
                <div className="absolute top-2 left-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => imgQRef.current?.click()}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: "rgba(123,47,190,0.8)" }}
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(248,113,113,0.8)" }}
                  >
                    <X size={13} color="white" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imgQRef.current?.click()}
                disabled={uploadingQ}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl transition-all disabled:opacity-60"
                style={{ border: "2px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", color: "#555577" }}
              >
                {uploadingQ
                  ? <><Loader2 size={20} className="animate-spin" style={{ color: "#7B2FBE" }} /><span className="text-xs font-mono">جاري الرفع...</span></>
                  : <><ImagePlus size={20} /><span className="text-xs font-mono">اضغط لرفع صورة السؤال</span></>
                }
              </button>
            )}
          </div>

          {/* Answer */}
          <div>
            <label style={labelStyle}>الإجابة الصحيحة *</label>
            <input type="text" value={form.answer} onChange={set("answer")} required placeholder="الإجابة..." style={inputStyle} {...focusHandlers} />
          </div>

          {/* Answer Image */}
          <div>
            <label style={labelStyle}>صورة الجواب (اختياري)</label>
            <input
              ref={imgARef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "answerImageUrl"); e.target.value = ""; }}
            />
            {form.answerImageUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(52,211,153,0.3)", background: "#0b0b14" }}>
                <img src={form.answerImageUrl} alt="صورة الجواب" className="w-full object-contain max-h-48" />
                <div className="absolute top-2 left-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => imgARef.current?.click()}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: "rgba(16,185,129,0.8)" }}
                  >
                    تغيير
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, answerImageUrl: "" }))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(248,113,113,0.8)" }}
                  >
                    <X size={13} color="white" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imgARef.current?.click()}
                disabled={uploadingA}
                className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl transition-all disabled:opacity-60"
                style={{ border: "2px dashed rgba(52,211,153,0.15)", background: "rgba(52,211,153,0.02)", color: "#555577" }}
              >
                {uploadingA
                  ? <><Loader2 size={20} className="animate-spin" style={{ color: "#34d399" }} /><span className="text-xs font-mono">جاري الرفع...</span></>
                  : <><ImagePlus size={20} /><span className="text-xs font-mono">اضغط لرفع صورة الجواب</span></>
                }
              </button>
            )}
          </div>

          {/* Options */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "10px" }}>
              الخيارات <span style={{ color: "#2a2a3a" }}>(اختياري — لأسئلة الاختيار من متعدد)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const key = `option${letter}` as keyof typeof form;
                const val = letter.toLowerCase() as "a" | "b" | "c" | "d";
                const isCorrect = form.correctOption === val;
                return (
                  <div key={letter} className="relative">
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono font-bold"
                      style={
                        isCorrect
                          ? { background: "#7B2FBE", color: "white" }
                          : { background: "rgba(255,255,255,0.06)", color: "#444466" }
                      }
                    >
                      {letter}
                    </span>
                    <input
                      type="text"
                      value={form[key] as string}
                      onChange={set(key)}
                      placeholder={`الخيار ${letter}`}
                      style={{ ...inputStyle, paddingRight: "36px" }}
                      {...focusHandlers}
                    />
                  </div>
                );
              })}
            </div>
            {hasOptions && (
              <div className="mt-3">
                <label style={{ ...labelStyle, marginBottom: "8px" }}>الخيار الصحيح</label>
                <div className="flex gap-2">
                  {(["a", "b", "c", "d"] as const).map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setForm((p) => ({ ...p, correctOption: v }))}
                      className="w-10 h-10 rounded-lg text-sm font-mono font-bold transition-all"
                      style={
                        form.correctOption === v
                          ? { background: "#7B2FBE", color: "white", boxShadow: "0 0 12px rgba(123,47,190,0.4)" }
                          : { background: "rgba(255,255,255,0.04)", color: "#555577", border: "1px solid rgba(255,255,255,0.07)" }
                      }
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QR / External Page Fields (for بدون كلام categories) */}
          {isBadounKalam && (
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              <p className="text-xs font-mono" style={{ color: "#3b82f6" }}>⬡ إعدادات بدون كلام — QR</p>

              <div>
                <label style={labelStyle}>الصفحة الخارجية (سيُولَّد QR لها)</label>
                <select
                  value={form.externalPageId}
                  onChange={set("externalPageId")}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  {...focusHandlers}
                >
                  <option value="">— بدون صفحة —</option>
                  {externalPages.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>قالب QR</label>
                <select
                  value={form.qrTemplateId}
                  onChange={set("qrTemplateId")}
                  style={{ ...inputStyle, cursor: "pointer" }}
                  {...focusHandlers}
                >
                  <option value="">— بدون قالب —</option>
                  {qrTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {selectedPage && (
                <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.3)" }}>
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg">
                    <LogoQR value={pageUrl} size={72} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm">{selectedPage.title}</p>
                    <p className="text-xs font-mono truncate" style={{ color: "#3b82f6" }}>{pageUrl}</p>
                    {selectedTemplate && (
                      <p className="text-xs mt-1 font-mono" style={{ color: "#8888aa" }}>
                        قالب: {selectedTemplate.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Difficulty + Points (linked) */}
          <div>
            <label style={labelStyle}>الصعوبة والنقاط</label>
            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((d) => {
                const active = form.difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, difficulty: d.value, points: String(d.points) }))}
                    className="flex flex-col items-center gap-1 py-3 rounded-lg transition-all"
                    style={
                      active
                        ? { background: d.bg, border: `1px solid ${d.border}`, boxShadow: `0 0 12px ${d.bg}` }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }
                    }
                  >
                    <span className="text-lg font-black font-mono" style={{ color: active ? d.color : "#333355" }}>
                      {d.points}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: active ? d.color : "#444466" }}>
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className="relative w-11 h-6 rounded-full transition-all flex-shrink-0"
              style={{
                background: form.isActive ? "#7B2FBE" : "rgba(255,255,255,0.08)",
                boxShadow: form.isActive ? "0 0 10px rgba(123,47,190,0.4)" : "none",
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                style={{ [form.isActive ? "right" : "left"]: "2px" }}
              />
            </button>
            <div className="flex items-center gap-1.5">
              {form.isActive ? <Eye size={12} style={{ color: "#34d399" }} /> : <EyeOff size={12} style={{ color: "#555577" }} />}
              <span className="text-xs font-mono" style={{ color: form.isActive ? "#34d399" : "#555577" }}>
                {form.isActive ? "السؤال نشط" : "السؤال مخفي"}
              </span>
            </div>
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-mono"
              style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}
            >
              ✗ {error}
            </div>
          )}

          {/* Actions */}
          <div
            className="flex gap-3 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                boxShadow: "0 0 16px rgba(59,130,246,0.35)",
              }}
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Check size={15} />}
              {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة السؤال"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1 as any)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#8888aa" }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
