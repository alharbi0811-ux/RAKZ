import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { invalidateSiteLogoCache } from "@/lib/siteLogoCache";

import { API_BASE } from "@/lib/apiBase";

interface SiteSettings {
  siteName: string | null;
  siteLogoUrl: string | null;
}

export default function AdminSiteSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({ siteName: "سين جيم", siteLogoUrl: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/site-settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setSettings({ siteName: d.siteName || "سين جيم", siteLogoUrl: d.siteLogoUrl || null });
          setLogoPreview(d.siteLogoUrl || null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_BASE}/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ في الرفع");
      const url = data.url;
      setSettings((s) => ({ ...s, siteLogoUrl: url }));
      setLogoPreview(url);
    } catch (e) {
      alert("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_BASE}/admin/site-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ siteLogoUrl: settings.siteLogoUrl, siteName: settings.siteName }),
      });
      if (!res.ok) throw new Error("خطأ في الحفظ");
      invalidateSiteLogoCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "#7B2FBE" }}>
        <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-white">إعدادات الموقع</h1>
        <p className="text-sm mt-1" style={{ color: "#666688" }}>الشعار الذي يظهر داخل رموز QR تلقائياً</p>
      </div>

      <div
        className="rounded-2xl p-6 space-y-6"
        style={{ background: "#0f0f1e", border: "1px solid rgba(123,47,190,0.25)" }}
      >
        {/* Logo Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-bold" style={{ color: "#c084fc" }}>شعار الموقع</label>

          <div className="flex items-start gap-6">
            <div
              className="flex-shrink-0 w-24 h-24 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
              style={{ background: "rgba(123,47,190,0.12)", border: `2px dashed ${logoPreview ? "#7B2FBE" : "rgba(123,47,190,0.3)"}` }}
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-20 h-20 object-contain rounded-lg" />
              ) : (
                <div className="text-center">
                  <p className="text-2xl mb-1">🖼️</p>
                  <p className="text-xs" style={{ color: "#666688" }}>ارفع شعاراً</p>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc", border: "1px solid rgba(123,47,190,0.4)" }}
              >
                {uploading ? "⏳ جاري الرفع..." : "📤 رفع شعار جديد"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: "#555577" }}>أو أدخل رابط الشعار مباشرة:</p>
                <input
                  type="text"
                  value={settings.siteLogoUrl || ""}
                  onChange={(e) => {
                    setSettings((s) => ({ ...s, siteLogoUrl: e.target.value || null }));
                    setLogoPreview(e.target.value || null);
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(123,47,190,0.3)", color: "#e2e2f0" }}
                  dir="ltr"
                />
              </div>
              {logoPreview && (
                <button
                  onClick={() => { setSettings((s) => ({ ...s, siteLogoUrl: null })); setLogoPreview(null); }}
                  className="text-xs transition-all hover:opacity-80"
                  style={{ color: "#ef4444" }}
                >
                  ✕ حذف الشعار
                </button>
              )}
            </div>
          </div>
        </div>

        {/* QR Preview */}
        <div className="space-y-3">
          <label className="block text-sm font-bold" style={{ color: "#c084fc" }}>معاينة QR مع الشعار</label>
          <div
            className="flex items-center justify-center p-6 rounded-xl"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(123,47,190,0.15)" }}
          >
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG
                value="https://example.com/preview"
                size={180}
                level="H"
                {...(logoPreview
                  ? {
                      imageSettings: {
                        src: logoPreview,
                        height: Math.round(180 * 0.18),
                        width: Math.round(180 * 0.18),
                        excavate: true,
                      },
                    }
                  : {})}
              />
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: "#444466" }}>
            {logoPreview
              ? "✓ الشعار سيظهر داخل جميع رموز QR بعد الحفظ"
              : "ارفع شعاراً لرؤيته داخل QR"}
          </p>
        </div>

        {/* Settings info */}
        <div
          className="rounded-xl p-4 space-y-2 text-xs"
          style={{ background: "rgba(123,47,190,0.08)", border: "1px solid rgba(123,47,190,0.2)" }}
        >
          <p className="font-bold" style={{ color: "#c084fc" }}>⚙️ الإعدادات الثابتة:</p>
          <div className="grid grid-cols-2 gap-2" style={{ color: "#888899" }}>
            <span>حجم الشعار: <b style={{ color: "#e2e2f0" }}>18% من QR</b></span>
            <span>مستوى تصحيح الخطأ: <b style={{ color: "#e2e2f0" }}>H (عالي)</b></span>
            <span>الموضع: <b style={{ color: "#e2e2f0" }}>المنتصف</b></span>
            <span>الحد الأقصى: <b style={{ color: "#e2e2f0" }}>25%</b></span>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl font-black text-white text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{
            background: saved
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #7B2FBE, #5B1FA0)",
            boxShadow: "0 4px 20px rgba(123,47,190,0.4)",
          }}
        >
          {saving ? "⏳ جاري الحفظ..." : saved ? "✓ تم الحفظ!" : "💾 حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
