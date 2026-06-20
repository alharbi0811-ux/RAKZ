import { API_BASE } from "@/lib/apiBase";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";



interface OtpSession {
  tempToken: string;
  otp: string;
  expiresAt: number;
}

export default function VerifyOtpPage() {
  const [, navigate] = useLocation();
  const { finalizeAuth } = useAuth();

  const [session, setSession] = useState<OtpSession | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [otpRevealed, setOtpRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load session from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("rakez-otp-session");
    if (!raw) { navigate("/login"); return; }
    try {
      const s = JSON.parse(raw) as OtpSession;
      if (Date.now() > s.expiresAt) {
        sessionStorage.removeItem("rakez-otp-session");
        navigate("/login");
        return;
      }
      setSession(s);
      const remaining = Math.floor((s.expiresAt - Date.now()) / 1000);
      setSecondsLeft(remaining);
    } catch {
      navigate("/login");
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [secondsLeft > 0]);

  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerLabel = expired ? "انتهت الصلاحية" : `${minutes}:${String(seconds).padStart(2, "0")}`;
  const timerPct = session ? Math.max(0, (secondsLeft / Math.floor((session.expiresAt - Date.now() + secondsLeft * 1000) / 1000)) * 100) : 100;

  /* ── Focus helper ── */
  function focusAt(i: number) {
    const inputs = containerRef.current?.querySelectorAll("input");
    (inputs?.[i] as HTMLInputElement | undefined)?.focus();
  }

  function handleBoxKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (code[i]) {
        setCode(code.slice(0, i) + code.slice(i + 1));
      } else if (i > 0) {
        focusAt(i - 1);
        setCode(code.slice(0, i - 1) + code.slice(i));
      }
    }
  }

  function handleBoxChange(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const arr = (code.padEnd(6, " ")).split("");
    arr[i] = digit;
    const next = arr.join("").trimEnd();
    setCode(next);
    if (i < 5) focusAt(i + 1);
    // Auto-submit when all 6 entered
    if (next.replace(/\s/g, "").length === 6) {
      submitCode(next.trim());
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      e.preventDefault();
      setCode(pasted);
      focusAt(Math.min(pasted.length, 5));
      if (pasted.length === 6) submitCode(pasted);
    }
  }

  async function submitCode(codeToSubmit: string) {
    if (!session || loading || expired) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: session.tempToken, code: codeToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCode("");
        focusAt(0);
        throw new Error(data.error || "رمز غير صحيح");
      }
      sessionStorage.removeItem("rakez-otp-session");
      finalizeAuth(data.token, data.user);
      window.location.href = data.user.isAdmin ? "/admin" : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitCode(code.trim());
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(135deg, #3a007a 0%, #5a1ab8 30%, #7B3FF2 60%, #a06eee 85%, #c49cf5 100%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.25 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3">
              <ShieldCheck size={26} className="text-purple-300" />
            </div>
            <h1 className="text-white font-extrabold text-xl mb-1">التحقق الأمني</h1>
            <p className="text-white/50 text-sm text-center">أدخل رمز التحقق الظاهر أدناه في الحقل</p>
          </div>

          {/* OTP Display card */}
          <div className="relative mb-6 rounded-2xl overflow-hidden">
            <div
              className="p-5 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(123,47,190,0.35), rgba(167,139,250,0.18))",
                border: "1px solid rgba(167,139,250,0.35)",
                borderRadius: "16px",
              }}
            >
              <p className="text-white/50 text-xs mb-2 tracking-widest uppercase">رمز التحقق</p>

              {otpRevealed ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex justify-center gap-2 font-mono"
                  dir="ltr"
                >
                  {session.otp.split("").map((d, i) => (
                    <span
                      key={i}
                      className="w-10 h-12 flex items-center justify-center rounded-xl text-2xl font-black text-white"
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOtpRevealed(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-purple-200 hover:text-white transition-colors"
                >
                  <span className="text-2xl tracking-[0.5em] select-none">••••••</span>
                </button>
              )}

              {!otpRevealed && (
                <p className="text-white/40 text-xs mt-2">اضغط لإظهار الرمز</p>
              )}
            </div>

            {/* Timer bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: expired
                      ? "rgba(248,113,113,0.7)"
                      : secondsLeft <= 30
                      ? "rgba(251,191,36,0.8)"
                      : "rgba(167,139,250,0.8)",
                  }}
                  animate={{ width: `${timerPct}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
              <span
                className="text-xs font-mono tabular-nums shrink-0"
                style={{ color: expired ? "rgba(248,113,113,0.9)" : "rgba(255,255,255,0.5)" }}
              >
                {timerLabel}
              </span>
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2 text-center">أعد إدخال الرمز للتأكيد</label>

              {/* 6-box input */}
              <div ref={containerRef} className="flex gap-2 justify-center" dir="ltr">
                {[0,1,2,3,4,5].map(i => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] && code[i] !== " " ? code[i] : ""}
                    autoFocus={i === 0}
                    disabled={expired || loading}
                    onChange={e => handleBoxChange(i, e.target.value)}
                    onKeyDown={e => handleBoxKey(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="w-11 h-14 text-center text-xl font-black text-white rounded-xl border-2 bg-white/10 outline-none transition-all font-mono disabled:opacity-40"
                    style={{
                      borderColor: code[i] && code[i] !== " "
                        ? "rgba(167,139,250,0.9)"
                        : "rgba(255,255,255,0.2)",
                      boxShadow: code[i] && code[i] !== " "
                        ? "0 0 12px rgba(167,139,250,0.35)"
                        : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/20 border border-red-400/30 rounded-xl px-4 py-3 text-red-200 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {expired ? (
              <div className="text-center">
                <p className="text-red-300/80 text-sm mb-3">انتهت صلاحية الرمز</p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  <RefreshCw size={16} />
                  تسجيل الدخول مجدداً
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || code.replace(/\s/g, "").length < 6}
                className="w-full flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#8B35D6] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                <LogIn size={18} />
                {loading ? "جاري التحقق..." : "تأكيد الدخول"}
              </button>
            )}

            <button
              type="button"
              onClick={() => { sessionStorage.removeItem("rakez-otp-session"); navigate("/login"); }}
              className="text-white/40 hover:text-white text-sm text-center transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
