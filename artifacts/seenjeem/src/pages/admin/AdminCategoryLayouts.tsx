import { API_BASE } from "@/lib/apiBase";
import { useEffect, useState, useCallback } from "react";
import { Palette, RotateCcw, Save, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useAdminFetch } from "@/hooks/useAdminFetch";


interface LayoutSettings {
  bgColor: string;
  accentColor: string;
  textColor: string;
  cardBgColor: string;
  showQr: boolean;
  showImage: boolean;
  showCategoryBadge: boolean;
  showTimer: boolean;
  questionTextSize: number;
  answerTextSize: number;
  bgImageUrl: string | null;
}

const DEFAULT_SETTINGS: LayoutSettings = {
  bgColor: "#ffffff",
  accentColor: "#7B2FBE",
  textColor: "#111827",
  cardBgColor: "#ffffff",
  showQr: true,
  showImage: true,
  showCategoryBadge: true,
  showTimer: true,
  questionTextSize: 30,
  answerTextSize: 100,
  bgImageUrl: null,
};

interface Category { id: number; nameAr: string; section: string | null; }
interface SavedLayout { categoryId: number | null; pageKey: string; settingsJson: string; }

const PAGE_TABS = [
  { key: "question", label: "صفحة السؤال" },
  { key: "answer",   label: "صفحة الجواب" },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium" style={{ color: "#aaaacc" }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border-2 cursor-pointer"
          style={{ border: "2px solid rgba(123,47,190,0.4)", background: "transparent" }} />
        <span className="text-xs font-mono" style={{ color: "#7B2FBE" }}>{value}</span>
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium flex items-center gap-2" style={{ color: "#aaaacc" }}>
        {value ? <Eye size={14} style={{ color: "#7B2FBE" }} /> : <EyeOff size={14} style={{ color: "#555577" }} />}
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ background: value ? "#7B2FBE" : "#2a2a3e" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
          style={{ background: "white", right: value ? "2px" : "auto", left: value ? "auto" : "2px" }}
        />
      </button>
    </div>
  );
}

function SliderField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "#aaaacc" }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: "#7B2FBE" }}>{value}px</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-600" />
    </div>
  );
}

function SettingsForm({
  settings, onChange, onSave, onReset, saving, isOverride,
}: {
  settings: LayoutSettings;
  onChange: (s: LayoutSettings) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  isOverride: boolean;
}) {
  const set = (key: keyof LayoutSettings, val: any) => onChange({ ...settings, [key]: val });

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#12121f", border: "1px solid rgba(123,47,190,0.2)" }}>
        <p className="text-xs font-mono font-bold" style={{ color: "#7B2FBE" }}>// الألوان</p>
        <ColorField label="لون الخلفية" value={settings.bgColor} onChange={v => set("bgColor", v)} />
        <ColorField label="لون بطاقة السؤال" value={settings.cardBgColor} onChange={v => set("cardBgColor", v)} />
        <ColorField label="اللون الرئيسي (إطار/أزرار)" value={settings.accentColor} onChange={v => set("accentColor", v)} />
        <ColorField label="لون النص" value={settings.textColor} onChange={v => set("textColor", v)} />
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: "#12121f", border: "1px solid rgba(123,47,190,0.2)" }}>
        <p className="text-xs font-mono font-bold" style={{ color: "#7B2FBE" }}>// إظهار / إخفاء</p>
        <ToggleField label="QR Code" value={settings.showQr} onChange={v => set("showQr", v)} />
        <ToggleField label="صورة السؤال" value={settings.showImage} onChange={v => set("showImage", v)} />
        <ToggleField label="شارة الفئة" value={settings.showCategoryBadge} onChange={v => set("showCategoryBadge", v)} />
        <ToggleField label="المؤقت" value={settings.showTimer} onChange={v => set("showTimer", v)} />
      </div>

      <div className="rounded-xl p-4 space-y-4" style={{ background: "#12121f", border: "1px solid rgba(123,47,190,0.2)" }}>
        <p className="text-xs font-mono font-bold" style={{ color: "#7B2FBE" }}>// حجم النص</p>
        <SliderField label="نص السؤال" value={settings.questionTextSize} min={16} max={60} onChange={v => set("questionTextSize", v)} />
        <SliderField label="نص الجواب" value={settings.answerTextSize} min={30} max={160} onChange={v => set("answerTextSize", v)} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: "linear-gradient(135deg, #7B2FBE, #5a1f8e)", color: "white", opacity: saving ? 0.7 : 1 }}
        >
          <Save size={14} />
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
        {isOverride && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "#1e1e30", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <RotateCcw size={14} />
            حذف التخصيص
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminCategoryLayouts() {
  const adminFetch = useAdminFetch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<"default" | number>("default");
  const [activePage, setActivePage] = useState<"question" | "answer">("question");
  const [currentSettings, setCurrentSettings] = useState<LayoutSettings>({ ...DEFAULT_SETTINGS });
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    adminFetch("/admin/categories").then(setCategories).catch(() => {});
    adminFetch("/admin/category-layouts").then(setSavedLayouts).catch(() => {});
  }, [adminFetch]);

  const getSettingsFor = useCallback((target: "default" | number, pageKey: string): LayoutSettings => {
    const found = savedLayouts.find(l =>
      l.pageKey === pageKey &&
      (target === "default" ? l.categoryId === null : l.categoryId === target)
    );
    if (found) return { ...DEFAULT_SETTINGS, ...JSON.parse(found.settingsJson) };

    if (target !== "default") {
      const defaultFound = savedLayouts.find(l => l.pageKey === pageKey && l.categoryId === null);
      if (defaultFound) return { ...DEFAULT_SETTINGS, ...JSON.parse(defaultFound.settingsJson) };
    }
    return { ...DEFAULT_SETTINGS };
  }, [savedLayouts]);

  useEffect(() => {
    setCurrentSettings(getSettingsFor(selectedTarget, activePage));
  }, [selectedTarget, activePage, getSettingsFor]);

  const isOverride = selectedTarget !== "default" && savedLayouts.some(
    l => l.categoryId === selectedTarget && l.pageKey === activePage
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/category-layouts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("rakez-token")}` },
        body: JSON.stringify({
          categoryId: selectedTarget === "default" ? null : selectedTarget,
          pageKey: activePage,
          settings: currentSettings,
        }),
      });
      if (!res.ok) throw new Error();
      const updated: SavedLayout = await res.json();
      setSavedLayouts(prev => {
        const filtered = prev.filter(l => !(l.categoryId === updated.categoryId && l.pageKey === updated.pageKey));
        return [...filtered, updated];
      });
      showToast("تم الحفظ بنجاح ✓");
    } catch {
      showToast("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (selectedTarget === "default") return;
    try {
      await fetch(`${API_BASE}/admin/category-layouts/${selectedTarget}/${activePage}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("rakez-token")}` },
      });
      setSavedLayouts(prev => prev.filter(l => !(l.categoryId === selectedTarget && l.pageKey === activePage)));
      setCurrentSettings(getSettingsFor("default", activePage));
      showToast("تم حذف التخصيص، يستخدم الإعداد الافتراضي الآن");
    } catch {
      showToast("حدث خطأ");
    }
  };

  const targetLabel = selectedTarget === "default"
    ? "الإعدادات الافتراضية (جميع الفئات)"
    : categories.find(c => c.id === selectedTarget)?.nameAr ?? "فئة";

  const hasOverride = (catId: number) =>
    savedLayouts.some(l => l.categoryId === catId);

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono" style={{ color: "#7B2FBE" }}>~/admin $</span>
          <span className="text-xs font-mono text-gray-600">category-layouts --manage</span>
        </div>
        <h2 className="text-2xl font-black text-white">تصاميم الفئات</h2>
        <p className="text-sm mt-1" style={{ color: "#555577" }}>تحكم في ألوان وعناصر صفحة السؤال والجواب لكل فئة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: target selector */}
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(123,47,190,0.25)" }}>
            <p className="px-4 py-3 text-xs font-mono font-bold" style={{ background: "#0f0f1e", color: "#7B2FBE", borderBottom: "1px solid rgba(123,47,190,0.15)" }}>
              // اختر الهدف
            </p>

            {/* Default */}
            <button
              onClick={() => setSelectedTarget("default")}
              className="w-full flex items-center justify-between px-4 py-3 transition-all text-right"
              style={{
                background: selectedTarget === "default" ? "rgba(123,47,190,0.15)" : "#12121f",
                color: selectedTarget === "default" ? "#c084fc" : "#888899",
                borderBottom: "1px solid rgba(123,47,190,0.1)",
              }}
            >
              <span className="text-sm font-bold">⚙ الافتراضي (كل الفئات)</span>
              {selectedTarget === "default" && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </button>

            {/* Categories toggle */}
            <button
              onClick={() => setExpandedCats(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all"
              style={{ background: "#12121f", color: "#888899", borderBottom: "1px solid rgba(123,47,190,0.1)" }}
            >
              <span className="text-sm font-bold">فئات مخصصة ({categories.filter(c => hasOverride(c.id)).length})</span>
              {expandedCats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expandedCats && (
              <div className="max-h-72 overflow-y-auto" style={{ background: "#0e0e1a" }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedTarget(cat.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 transition-all text-right"
                    style={{
                      background: selectedTarget === cat.id ? "rgba(123,47,190,0.15)" : "transparent",
                      color: selectedTarget === cat.id ? "#c084fc" : "#777799",
                      borderBottom: "1px solid rgba(123,47,190,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {hasOverride(cat.id) && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#a855f7" }} />
                      )}
                      <span className="text-sm">{cat.nameAr}</span>
                    </div>
                    {cat.section && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(123,47,190,0.15)", color: "#7B2FBE" }}>
                        {cat.section}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: "#0f0f1e", border: "1px solid rgba(123,47,190,0.15)" }}>
            <p className="text-xs font-mono" style={{ color: "#444466" }}>// أولوية التطبيق</p>
            <div className="space-y-1 text-xs" style={{ color: "#666688" }}>
              <p>1 — تخصيص الفئة</p>
              <p>2 — الإعداد الافتراضي</p>
              <p>3 — القيم الأساسية</p>
            </div>
          </div>
        </div>

        {/* Right panel: settings form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Target header */}
          <div className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(123,47,190,0.1)", border: "1px solid rgba(123,47,190,0.3)" }}>
            <div className="flex items-center gap-2">
              <Palette size={16} style={{ color: "#c084fc" }} />
              <span className="font-bold text-sm text-white">{targetLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              {isOverride && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(168,85,247,0.2)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>
                  مخصص
                </span>
              )}
              {selectedTarget !== "default" && (
                <a
                  href={`/question?editMode=1&categoryId=${selectedTarget}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #7B2FBE, #a855f7)", color: "white", textDecoration: "none" }}
                >
                  <Eye size={13} />
                  تعديل مرئي
                </a>
              )}
              {selectedTarget === "default" && (
                <a
                  href="/question?editMode=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #7B2FBE, #a855f7)", color: "white", textDecoration: "none" }}
                >
                  <Eye size={13} />
                  معاينة مرئية
                </a>
              )}
            </div>
          </div>

          {/* Page tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "#12121f", border: "1px solid rgba(123,47,190,0.2)" }}>
            {PAGE_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActivePage(tab.key as any)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={activePage === tab.key
                  ? { background: "linear-gradient(135deg, #7B2FBE, #5a1f8e)", color: "white" }
                  : { color: "#666688" }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings form */}
          <SettingsForm
            settings={currentSettings}
            onChange={setCurrentSettings}
            onSave={handleSave}
            onReset={handleReset}
            saving={saving}
            isOverride={isOverride}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl"
          style={{ background: "#7B2FBE", color: "white" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
