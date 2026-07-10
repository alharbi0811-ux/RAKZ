import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

const CONFETTI_COLORS = [
  "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6",
  "#ec4899", "#f97316", "#06b6d4", "#84cc16", "#eab308",
];

interface Piece {
  id: number; x: number; color: string; size: number;
  delay: number; duration: number; rotate: number; shape: "rect" | "circle";
}

function Confetti() {
  const pieces: Piece[] = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 12,
    delay: Math.random() * 3.5,
    duration: 3 + Math.random() * 3,
    rotate: Math.random() * 720 - 360,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));

  return (
    <div ref={pageRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: "110vh", opacity: [1, 1, 0.9, 0], rotate: p.rotate, scale: [1, 1.2, 0.8, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeIn" }}
          style={{
            position: "absolute", top: 0,
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.45 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "3px",
            boxShadow: `0 0 6px 1px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
}

/* نجمة بريق */
function Sparkle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0], rotate: [0, 90, 180] }}
      transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 2 + Math.random() * 3 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    </motion.div>
  );
}

const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: 5 + Math.random() * 90,
  y: 10 + Math.random() * 80,
  delay: Math.random() * 3,
  size: 16 + Math.random() * 20,
}));

export default function WinPage() {
  // ─── Smart Scale للأيفون ───
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const DESIGN_W = 1024, DESIGN_H = 768;
    function applyScale() {
      const el = pageRef.current;
      if (!el) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H, 1);
      el.style.transform = `scale(${scale})`;
      el.style.transformOrigin = "top left";
      el.style.width = `${DESIGN_W}px`;
      el.style.height = `${DESIGN_H}px`;
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.left = `${(vw - DESIGN_W * scale) / 2}px`;
    }
    applyScale();
    window.addEventListener("resize", applyScale);
    window.addEventListener("orientationchange", () => setTimeout(applyScale, 300));
    return () => { window.removeEventListener("resize", applyScale); };
  }, []);


  const [, navigate] = useLocation();
  const [data, setData] = useState<{
    team1Name: string; team2Name: string;
    team1Score: number; team2Score: number;
    gameName: string;
  } | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const gameData = localStorage.getItem("rakez-game-data");
    const scores = localStorage.getItem("rakez-scores");
    if (gameData && scores) {
      const g = JSON.parse(gameData);
      const s = JSON.parse(scores);
      setData({
        team1Name: g.team1Name || "الفريق الأول",
        team2Name: g.team2Name || "الفريق الثاني",
        team1Score: s.team1Score || 0,
        team2Score: s.team2Score || 0,
        gameName: g.gameName || "ركز",
      });
    }
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAgain = () => {
    ["rakez-game-data","rakez-scores","rakez-played-cells","rakez-current-team",
     "rakez-used-tools","rakez-current-question","rakez-session-id","rakez-used-question-ids"]
      .forEach(k => localStorage.removeItem(k));
    navigate("/start-game");
  };

  if (!data) return null;

  const { team1Name, team2Name, team1Score, team2Score, gameName } = data;
  const isTie = team1Score === team2Score;
  const winner = team1Score > team2Score ? team1Name : team2Name;
  const winnerScore = Math.max(team1Score, team2Score);
  const loserScore = Math.min(team1Score, team2Score);

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden" dir="rtl">
      <Confetti />

      {/* نجوم بريق */}
      {SPARKLES.map(s => <Sparkle key={s.id} {...s} />)}

      {/* الشريط العلوي — نفس تصميم صفحة السؤال */}
      <div className="bg-gradient-to-l from-[#7B2FBE] to-[#5a1f8e] px-4 py-3 flex items-center justify-between shadow-lg relative z-20">
        {/* يسار: اللوغو */}
        <div className="flex items-center shrink-0">
          <img src={`${import.meta.env.BASE_URL}logo-white.png`} alt="ركز" className="h-10" />
        </div>

        {/* وسط: اسم اللعبة */}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <span className="text-white font-bold text-lg">{gameName}</span>
        </div>

        {/* يمين: زر الخروج فقط */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handlePlayAgain}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/30 active:scale-95 text-white px-4 py-2 rounded-full text-sm font-bold transition-all border-2 border-white/25"
          >
            <LogOut size={14} /><span>الخروج</span>
          </button>
        </div>
      </div>

      {/* المحتوى */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-8 px-6 text-center pt-10 pb-16">

        {/* تأثير الفوز — نبضة دائرية خلف العنوان */}
        {!isTie && show && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none">
            {[0, 0.4, 0.8].map((delay, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-yellow-400"
                style={{ width: 120, height: 120, top: -60, left: -60 }}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, delay, repeat: Infinity }}
              />
            ))}
          </div>
        )}

        {/* العنوان */}
        <AnimatePresence>
          {show && (
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.55, duration: 0.7 }}
              className="flex flex-col items-center gap-1"
            >
              {/* أيقونة كأس */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-7xl select-none"
                style={{ filter: "drop-shadow(0 0 16px rgba(234,179,8,0.8))" }}
              >
                🏆
              </motion.div>
              <h1 className="text-5xl font-black text-[#5a1f8e] drop-shadow-sm mt-2">
                {isTie ? "مبروك للجميع" : "مبروك الفوز"}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* اسم الفائز */}
        {!isTie && show && (
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.8 }}
            animate={{
              y: 0, opacity: 1, scale: 1,
              boxShadow: [
                "0 0 24px 6px rgba(234,179,8,0.55)",
                "0 0 55px 18px rgba(234,179,8,0.9)",
                "0 0 24px 6px rgba(234,179,8,0.55)",
              ],
            }}
            transition={{
              y: { delay: 0.35, type: "spring", bounce: 0.45 },
              opacity: { delay: 0.35, duration: 0.4 },
              scale: { delay: 0.35, type: "spring" },
              boxShadow: { delay: 0.8, duration: 1.8, repeat: Infinity },
            }}
            className="bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-black font-black text-4xl px-12 py-5 rounded-3xl border-4 border-yellow-200"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
          >
            {winner}
          </motion.div>
        )}

        {/* بطاقات النتيجة */}
        {show && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, type: "spring", bounce: 0.35 }}
            className="flex gap-5 justify-center w-full max-w-md"
          >
            {/* الفريق الأول */}
            <motion.div
              className={`flex-1 rounded-3xl overflow-hidden shadow-xl border-3 ${
                isTie ? "border-yellow-400 ring-2 ring-yellow-300" :
                team1Score >= team2Score ? "border-yellow-400 ring-2 ring-yellow-300" : "border-gray-200"
              }`}
              animate={!isTie && team1Score >= team2Score ? {
                boxShadow: ["0 4px 20px rgba(234,179,8,0.3)","0 4px 40px rgba(234,179,8,0.7)","0 4px 20px rgba(234,179,8,0.3)"]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className={`px-4 py-3 text-white font-black text-center text-sm ${
                isTie ? "bg-yellow-500" : team1Score >= team2Score ? "bg-gradient-to-l from-yellow-500 to-yellow-400" : "bg-[#7B2FBE]"
              }`}>{team1Name}</div>
              <div className={`px-4 py-6 flex items-center justify-center font-black text-4xl ${
                isTie ? "bg-yellow-50 text-yellow-700" :
                team1Score >= team2Score ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"
              }`}>
                {team1Score}
              </div>
            </motion.div>

            {/* VS */}
            <div className="flex items-center justify-center">
              <span className="text-gray-300 font-black text-2xl">VS</span>
            </div>

            {/* الفريق الثاني */}
            <motion.div
              className={`flex-1 rounded-3xl overflow-hidden shadow-xl ${
                isTie ? "border-yellow-400 ring-2 ring-yellow-300" :
                team2Score >= team1Score ? "border-yellow-400 ring-2 ring-yellow-300" : "border-gray-200"
              } border-2`}
              animate={!isTie && team2Score >= team1Score ? {
                boxShadow: ["0 4px 20px rgba(234,179,8,0.3)","0 4px 40px rgba(234,179,8,0.7)","0 4px 20px rgba(234,179,8,0.3)"]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className={`px-4 py-3 text-white font-black text-center text-sm ${
                isTie ? "bg-yellow-500" : team2Score >= team1Score ? "bg-gradient-to-l from-yellow-500 to-yellow-400" : "bg-[#7B2FBE]"
              }`}>{team2Name}</div>
              <div className={`px-4 py-6 flex items-center justify-center font-black text-4xl ${
                isTie ? "bg-yellow-50 text-yellow-700" :
                team2Score >= team1Score ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"
              }`}>
                {team2Score}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* زر العب مرة ثانية */}
        {show && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={handlePlayAgain}
            className="bg-[#7B2FBE] text-white font-black text-xl px-14 py-4 rounded-full shadow-xl hover:bg-[#6a22a8] transition-colors border-4 border-[#7B2FBE]/30 mt-2"
          >
            العب مرة ثانية
          </motion.button>
        )}
      </div>
    </div>
  );
}
