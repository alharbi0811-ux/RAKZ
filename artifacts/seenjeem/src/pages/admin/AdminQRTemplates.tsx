import { API_BASE } from "@/lib/apiBase";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Plus, Trash2, Edit, Check, X, Upload, Move, Image as ImageIcon, Power, PowerOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";


interface QrTemplate {
  id: number;
  name: string;
  templateImageUrl: string | null;
  qrPositionX: number;
  qrPositionY: number;
  qrSize: number;
  isActive: boolean;
  createdAt: string;
}

interface TemplateForm {
  name: string;
  imageFile: File | null;
  imageUrl: string;
  qrPositionX: number;
  qrPositionY: number;
  qrSize: number;
}

const defaultForm: TemplateForm = {
  name: "",
  imageFile: null,
  imageUrl: "",
  qrPositionX: 50,
  qrPositionY: 50,
  qrSize: 200,
};

export default function AdminQRTemplates() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<QrTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const dragContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/qr-templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPreviewSrc(null);
    setRemoveImage(false);
    setShowModal(true);
  };

  const openEdit = (t: QrTemplate) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      imageFile: null,
      imageUrl: t.templateImageUrl || "",
      qrPositionX: t.qrPositionX,
      qrPositionY: t.qrPositionY,
      qrSize: t.qrSize,
    });
    setPreviewSrc(t.templateImageUrl || null);
    setRemoveImage(false);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, imageFile: file, imageUrl: "" }));
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url, imageFile: null }));
    setPreviewSrc(url || null);
    if (url) setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setForm((f) => ({ ...f, imageFile: null, imageUrl: "" }));
    setPreviewSrc(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getPositionFromMouse = (e: React.MouseEvent | MouseEvent | React.TouchEvent | TouchEvent) => {
    if (!dragContainerRef.current) return null;
    const rect = dragContainerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const x = Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)));
    return { x, y };
  };

  const handleQrDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getPositionFromMouse(e);
      if (pos) setForm((f) => ({ ...f, qrPositionX: pos.x, qrPositionY: pos.y }));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("الاسم مطلوب", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("qrPositionX", String(form.qrPositionX));
      fd.append("qrPositionY", String(form.qrPositionY));
      fd.append("qrSize", String(form.qrSize));
      if (form.imageFile) fd.append("templateImage", form.imageFile);
      else if (form.imageUrl) fd.append("templateImageUrl", form.imageUrl);
      else if (removeImage) fd.append("removeImage", "true");

      const url = editingId
        ? `${API_BASE}/admin/qr-templates/${editingId}`
        : `${API_BASE}/admin/qr-templates`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      showToast(editingId ? "تم التحديث" : "تم الإنشاء");
      setShowModal(false);
      fetchTemplates();
    } catch {
      showToast("حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: number, isActive: boolean) => {
    const endpoint = isActive
      ? `${API_BASE}/admin/qr-templates/${id}/deactivate`
      : `${API_BASE}/admin/qr-templates/${id}/activate`;
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { showToast(isActive ? "تم إلغاء التفعيل" : "تم التفعيل"); fetchTemplates(); }
    else showToast("حدث خطأ", "error");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل تريد حذف هذا القالب؟")) return;
    const res = await fetch(`${API_BASE}/admin/qr-templates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { showToast("تم الحذف"); fetchTemplates(); }
    else showToast("حدث خطأ", "error");
  };

  const qrPx = Math.round((form.qrSize / 400) * 100);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl font-bold text-sm shadow-xl ${
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <QrCode size={24} className="text-purple-400" />
            قوالب QR
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666688" }}>
            تحكم في إطارات عرض QR Code داخل الأسئلة
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7B2FBE, #5a1f8e)" }}>
          <Plus size={16} />
          قالب جديد
        </button>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">جاري التحميل...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20" style={{ color: "#444466" }}>
          <QrCode size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">لا توجد قوالب بعد</p>
          <p className="text-sm mt-1">أنشئ قالباً جديداً لتخصيص عرض QR Code</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border transition-all"
              style={{
                background: "#0f0f1e",
                borderColor: t.isActive ? "rgba(123,47,190,0.7)" : "rgba(123,47,190,0.2)",
                boxShadow: t.isActive ? "0 0 20px rgba(123,47,190,0.25)" : "none",
              }}>
              {/* Preview */}
              <div className="relative bg-black/30 h-44 overflow-hidden flex items-center justify-center">
                {t.templateImageUrl ? (
                  <>
                    <img src={t.templateImageUrl} alt={t.name}
                      className="w-full h-full object-contain" />
                    <div className="absolute"
                      style={{
                        left: `${t.qrPositionX}%`,
                        top: `${t.qrPositionY}%`,
                        transform: "translate(-50%, -50%)",
                        width: `${Math.round((t.qrSize / 400) * 100)}%`,
                        maxWidth: "80%",
                      }}>
                      <div className="bg-white rounded p-1 flex items-center justify-center aspect-square shadow-lg">
                        <QrCode size="100%" className="text-black opacity-40" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <ImageIcon size={32} />
                    <span className="text-xs">بدون صورة قالب</span>
                    <div className="bg-white rounded p-2">
                      <QrCode size={40} className="text-black" />
                    </div>
                  </div>
                )}
                {t.isActive && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    نشط
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <p className="font-black text-white text-sm mb-1">{t.name}</p>
                <p className="text-[11px] font-mono mb-3" style={{ color: "#555577" }}>
                  X: {t.qrPositionX}% · Y: {t.qrPositionY}% · حجم: {t.qrSize}px
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleActivate(t.id, t.isActive)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all"
                    style={t.isActive
                      ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
                      : { background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
                    }>
                    {t.isActive ? <><PowerOff size={12} /> إلغاء التفعيل</> : <><Power size={12} /> تفعيل</>}
                  </button>
                  <button onClick={() => openEdit(t)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc", border: "1px solid rgba(123,47,190,0.3)" }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "#0f0f1e", border: "1px solid rgba(123,47,190,0.4)" }}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(123,47,190,0.2)", background: "rgba(123,47,190,0.08)" }}>
                <h2 className="font-black text-white flex items-center gap-2">
                  <QrCode size={18} className="text-purple-400" />
                  {editingId ? "تعديل القالب" : "قالب جديد"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ color: "#666688" }} className="hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#9988bb" }}>اسم القالب</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: إطار ديوان الدارع"
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-black/30 text-white border outline-none focus:border-purple-500 transition-colors"
                    style={{ borderColor: "rgba(123,47,190,0.3)" }} />
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#9988bb" }}>
                    صورة القالب <span className="font-normal opacity-60">(اختياري — PNG بخلفية شفافة يفضل)</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc", border: "1px solid rgba(123,47,190,0.3)" }}>
                      <Upload size={14} /> رفع صورة
                    </button>
                    <input className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-black/30 text-white border outline-none focus:border-purple-500 transition-colors"
                      style={{ borderColor: "rgba(123,47,190,0.3)" }}
                      placeholder="أو رابط صورة..."
                      value={form.imageUrl}
                      onChange={(e) => handleUrlChange(e.target.value)} />
                    {(previewSrc || form.imageFile) && (
                      <button onClick={handleRemoveImage}
                        className="px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <X size={14} />
                      </button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>

                {/* Position & size editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold flex items-center gap-1" style={{ color: "#9988bb" }}>
                      <Move size={12} />
                      موقع وحجم QR
                    </label>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc" }}>
                      {isDragging ? "🔵 يتم السحب..." : "⠿ اسحب رمز QR"}
                    </span>
                  </div>

                  {/* Canvas */}
                  <div
                    ref={dragContainerRef}
                    className="relative w-full rounded-xl overflow-hidden select-none"
                    style={{
                      aspectRatio: "16/9",
                      background: "#0a0a14",
                      border: `2px solid ${isDragging ? "rgba(123,47,190,0.9)" : "rgba(123,47,190,0.4)"}`,
                      cursor: isDragging ? "grabbing" : "default",
                      transition: "border-color 0.15s",
                    }}
                  >
                    {/* Template image */}
                    {previewSrc ? (
                      <img src={previewSrc} alt="preview" className="w-full h-full object-contain pointer-events-none" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-25 pointer-events-none">
                        <ImageIcon size={28} className="text-white" />
                        <p className="text-white text-xs font-bold">ارفع صورة القالب أولاً</p>
                      </div>
                    )}

                    {/* Crosshair lines */}
                    <div className="absolute pointer-events-none opacity-20"
                      style={{ left: `${form.qrPositionX}%`, top: 0, bottom: 0, width: 1, background: "#a855f7" }} />
                    <div className="absolute pointer-events-none opacity-20"
                      style={{ top: `${form.qrPositionY}%`, left: 0, right: 0, height: 1, background: "#a855f7" }} />

                    {/* Draggable QR placeholder */}
                    <div
                      className="absolute"
                      style={{
                        left: `${form.qrPositionX}%`,
                        top: `${form.qrPositionY}%`,
                        transform: "translate(-50%, -50%)",
                        width: `${qrPx}%`,
                        maxWidth: "60%",
                        minWidth: "6%",
                        cursor: isDragging ? "grabbing" : "grab",
                        zIndex: 10,
                        filter: isDragging ? "drop-shadow(0 0 8px rgba(168,85,247,0.8))" : "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
                        transition: isDragging ? "none" : "filter 0.15s",
                      }}
                      onMouseDown={handleQrDragStart}
                      onTouchStart={handleQrDragStart}
                    >
                      {/* QR card */}
                      <div
                        className="bg-white rounded-lg flex flex-col items-center justify-center aspect-square"
                        style={{
                          border: `3px solid ${isDragging ? "#a855f7" : "#7B2FBE"}`,
                          padding: "4%",
                        }}
                      >
                        <QrCode className="text-black w-full h-full" style={{ opacity: 0.5 }} />
                      </div>
                      {/* Drag hint badge */}
                      {!isDragging && (
                        <div
                          className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(123,47,190,0.9)", color: "white" }}
                        >
                          ⠿ اسحب
                        </div>
                      )}
                    </div>

                    {/* Position badge while dragging */}
                    {isDragging && (
                      <div
                        className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-1 rounded-lg"
                        style={{ background: "rgba(123,47,190,0.9)", color: "white" }}
                      >
                        {form.qrPositionX}% , {form.qrPositionY}%
                      </div>
                    )}
                  </div>

                  {/* Numeric inputs */}
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: "#666688" }}>X (أفقي %)</label>
                      <input type="number" min={0} max={100} value={form.qrPositionX}
                        onChange={(e) => setForm((f) => ({ ...f, qrPositionX: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-white border outline-none focus:border-purple-500 text-center"
                        style={{ borderColor: "rgba(123,47,190,0.3)" }} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: "#666688" }}>Y (عمودي %)</label>
                      <input type="number" min={0} max={100} value={form.qrPositionY}
                        onChange={(e) => setForm((f) => ({ ...f, qrPositionY: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-white border outline-none focus:border-purple-500 text-center"
                        style={{ borderColor: "rgba(123,47,190,0.3)" }} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1" style={{ color: "#666688" }}>حجم QR (px)</label>
                      <input type="number" min={50} max={600} step={10} value={form.qrSize}
                        onChange={(e) => setForm((f) => ({ ...f, qrSize: Math.max(50, Math.min(600, parseInt(e.target.value) || 200)) }))}
                        className="w-full px-3 py-2 rounded-lg text-sm bg-black/30 text-white border outline-none focus:border-purple-500 text-center"
                        style={{ borderColor: "rgba(123,47,190,0.3)" }} />
                    </div>
                  </div>

                  {/* Size slider */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold" style={{ color: "#666688" }}>
                      <span>حجم QR</span>
                      <span style={{ color: "#c084fc" }}>{form.qrSize}px</span>
                    </div>
                    <input type="range" min={50} max={600} step={10} value={form.qrSize}
                      onChange={(e) => setForm((f) => ({ ...f, qrSize: parseInt(e.target.value) }))}
                      className="w-full accent-purple-500" />
                    <div className="flex justify-between text-[10px]" style={{ color: "#333355" }}>
                      <span>صغير 50px</span><span>كبير 600px</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7B2FBE, #5a1f8e)" }}>
                    {saving ? "جاري الحفظ..." : <><Check size={16} /> حفظ القالب</>}
                  </button>
                  <button onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#888", border: "1px solid rgba(255,255,255,0.1)" }}>
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
