import { useState, useEffect } from "react";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { API_BASE } from "@/lib/apiBase";
import { useAuth } from "@/context/AuthContext";
import { Plus, Trash2, Save, CheckCircle, AlertCircle, ChevronDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Category { id: number; nameAr: string; name: string; }

interface QuestionRow {
  id: string;
  question: string;
  answer: string;
}

const LEVELS = [
  { points: 200, label: "سهل", color: "#34d399", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", glow: "rgba(16,185,129,0.15)" },
  { points: 400, label: "متوسط", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", glow: "rgba(251,191,36,0.15)" },
  { points: 600, label: "صعب", color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.3)", glow: "rgba(248,113,113,0.15)" },
];

function makeRow(): QuestionRow {
  return { id: Math.random().toString(36).slice(2), question: "", answer: "" };
}

export default function AdminBulkQuestions() {
  const adminFetch = useAdminFetch();
  const { token } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | "">("");
  const [catOpen, setCatOpen] = useState(false);

  const [rows, setRows] = useState<Record<number, QuestionRow[]>>({
    200: [makeRow()],
    400: [makeRow()],
    600: [makeRow()],
  });

  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    adminFetch("/admin/categories")
      .then((data: Category[]) => setCategories(data))
      .catch(() => {});
  }, []);

  const selectedCatName = categories.find(c => c.id === selectedCat)?.nameAr ?? "اختر فئة";

  function addRow(points: number) {
    setRows(prev => ({ ...prev, [points]: [...prev[points], makeRow()] }));
  }

  function removeRow(points: number, id: string) {
    setRows(prev => ({
      ...prev,
      [points]: prev[points].length === 1 ? [makeRow()] : prev[points].filter(r => r.id !== id),
    }));
  }

  function updateRow(points: number, id: string, field: "question" | "answer", val: string) {
    setRows(prev => ({
      ...prev,
      [points]: prev[points].map(r => r.id === id ? { ...r, [field]: val } : r),
    }));
  }

  function countFilled(points: number) {
    return rows[points].filter(r => r.question.trim() && r.answer.trim()).length;
  }

  const totalFilled = LEVELS.reduce((acc, l) => acc + countFilled(l.points), 0);

  async function handleSave() {
    if (!selectedCat) { setResult({ type: "error", msg: "اختر فئة أولاً" }); return; }
    if (totalFilled === 0) { setResult({ type: "error", msg: "أضف سؤالاً واحداً على الأقل" }); return; }

    const questions = LEVELS.flatMap(l =>
      rows[l.points]
        .filter(r => r.question.trim() && r.answer.trim())
        .map(r => ({
          categoryId: selectedCat,
          questionText: r.question.trim(),
          answer: r.answer.trim(),
          points: l.points,
          difficulty: l.points === 200 ? "easy" : l.points === 400 ? "medium" : "hard",
          isActive: true,
        }))
    );

    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/admin/questions/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الحفظ");
      setResult({ type: "success", msg: `تم حفظ ${data.count} سؤال بنجاح ✅` });
      setRows({ 200: [makeRow()], 400: [makeRow()], 600: [makeRow()] });
    } catch (err) {
      setResult({ type: "error", msg: err instanceof Error ? err.message : "خطأ غير متوقع" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl" style={{ background: "#f5f3ff" }}>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7B2FBE, #9b5de5)" }}>
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">إضافة أسئلة جماعية</h1>
        </div>
        <p className="text-gray-500 text-sm">أضف عدداً كبيراً من الأسئلة دفعة واحدة لفئة محددة</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-3">📂 اختر الفئة</label>
        <div className="relative max-w-sm">
          <button
            onClick={() => setCatOpen(v => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 font-bold text-right transition-all"
            style={{ borderColor: selectedCat ? "#7B2FBE" : "#e9d5ff", background: selectedCat ? "rgba(123,47,190,0.05)" : "#fff" }}
          >
            <span style={{ color: selectedCat ? "#7B2FBE" : "#aaa" }}>{selectedCatName}</span>
            <ChevronDown size={16} style={{ color: "#7B2FBE", transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          <AnimatePresence>
            {catOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-purple-100 z-50 max-h-64 overflow-y-auto"
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCat(cat.id); setCatOpen(false); }}
                    className="w-full text-right px-4 py-3 hover:bg-purple-50 font-medium text-gray-700 transition-colors border-b border-purple-50 last:border-0"
                    style={{ color: selectedCat === cat.id ? "#7B2FBE" : undefined, fontWeight: selectedCat === cat.id ? "bold" : undefined }}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {LEVELS.map(level => (
          <div
            key={level.points}
            className="rounded-2xl border-2 overflow-hidden"
            style={{ borderColor: level.border, background: level.bg }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: level.glow, borderBottom: `1px solid ${level.border}` }}>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black" style={{ color: level.color }}>{level.points}</span>
                <span className="text-sm font-bold text-gray-600">نقطة</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: level.color }}>
                  {level.label}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: level.color }}>
                {countFilled(level.points)} سؤال
              </span>
            </div>

            <div className="p-3 flex flex-col gap-3 max-h-[600px] overflow-y-auto">
              {rows[level.points].map((row, idx) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-3 shadow-sm border"
                  style={{ borderColor: row.question && row.answer ? level.border : "#e5e7eb" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400">سؤال {idx + 1}</span>
                    <button
                      onClick={() => removeRow(level.points, row.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={13} className="text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                  <textarea
                    value={row.question}
                    onChange={e => updateRow(level.points, row.id, "question", e.target.value)}
                    placeholder="اكتب السؤال هنا..."
                    rows={2}
                    className="w-full text-sm font-medium text-gray-700 placeholder-gray-300 resize-none outline-none border rounded-lg px-3 py-2 mb-2 transition-all"
                    style={{ borderColor: row.question ? level.border : "#e5e7eb" }}
                  />
                  <input
                    value={row.answer}
                    onChange={e => updateRow(level.points, row.id, "answer", e.target.value)}
                    placeholder="الجواب..."
                    className="w-full text-sm font-bold placeholder-gray-300 outline-none border rounded-lg px-3 py-2 transition-all"
                    style={{ borderColor: row.answer ? level.border : "#e5e7eb", color: level.color, background: row.answer ? level.bg : "#fff" }}
                  />
                </motion.div>
              ))}

              <button
                onClick={() => addRow(level.points)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-bold text-sm transition-all hover:opacity-80"
                style={{ borderColor: level.border, color: level.color }}
              >
                <Plus size={16} />
                إضافة سؤال
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-5 py-4 rounded-xl mb-4 font-bold"
            style={{
              background: result.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(248,113,113,0.1)",
              border: `1px solid ${result.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(248,113,113,0.3)"}`,
              color: result.type === "success" ? "#059669" : "#dc2626",
            }}
          >
            {result.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {result.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-purple-100 px-5 py-4">
        <div className="text-sm text-gray-500">
          إجمالي الأسئلة الجاهزة: <span className="font-black text-[#7B2FBE] text-base">{totalFilled}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving || totalFilled === 0 || !selectedCat}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-black text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #7B2FBE, #9b5de5)", boxShadow: "0 4px 20px rgba(123,47,190,0.4)" }}
        >
          <Save size={18} />
          {saving ? "جاري الحفظ..." : "حفظ الكل"}
        </motion.button>
      </div>
    </div>
  );
}
