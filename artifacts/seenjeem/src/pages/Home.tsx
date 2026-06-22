import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Gamepad2, BookOpenCheck } from "lucide-react";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { HelpTools } from "@/components/sections/HelpTools";
import { Faq } from "@/components/sections/Faq";
import { FeedbackModal } from "@/components/FeedbackModal";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────── Game Modes ─────────────────── */

const MODES = [
  {
    Icon: Gamepad2,
    title: "إنشاء لعبة",
    desc: "قسّم الفريقين، اختار الفئات\nوابدأ التحدي الحقيقي",
    cta: "ابدأ اللعبة",
    badge: null,
    bg: "linear-gradient(145deg, #0f0022 0%, #2d0a6e 55%, #5b1db8 100%)",
    border: "rgba(139,92,246,0.45)",
    glow: "rgba(109,40,217,0.55)",
    glowHover: "rgba(139,92,246,0.22)",
    accent: "#a78bfa",
    accentBg: "rgba(139,92,246,0.85)",
    path: "/start-game",
    adminOnly: false,
  },
  {
    Icon: BookOpenCheck,
    title: "وضع الدراسة",
    desc: "حوّل المذاكرة إلى تحدي\nممتع بين فريقين",
    cta: "ادخل وضع الدراسة",
    badge: "الأفضل للمراجعة",
    bg: "linear-gradient(145deg, #080018 0%, #1e0856 55%, #4c14a8 100%)",
    border: "rgba(167,139,250,0.4)",
    glow: "rgba(79,50,180,0.5)",
    glowHover: "rgba(167,139,250,0.18)",
    accent: "#c4b5fd",
    accentBg: "rgba(109,40,217,0.85)",
    path: "/study-setup",
    adminOnly: true,
  },
];

type Ripple = { x: number; y: number; id: number } | null;

function GameModes() {
  const [, navigate] = useLocation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([null, null]);
  const { user } = useAuth();

  const visibleModes = MODES.filter(m => !m.adminOnly || user?.isAdmin);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, path: string, i: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const next = [...ripples] as Ripple[];
    next[i] = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() };
    setRipples(next);
    setTimeout(() => navigate(path), 300);
  };

  return (
    <section className="py-10 pb-6" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="flex-1 h-px" style={{ background: "rgba(123,47,190,0.15)" }} />
          <span className="text-[10px] font-black tracking-[0.35em] uppercase"
            style={{ color: "rgba(123,47,190,0.45)" }}>اختر وضع اللعب</span>
          <div className="flex-1 h-px" style={{ background: "rgba(123,47,190,0.15)" }} />
        </motion.div>

        <div className={`grid grid-cols-1 gap-5 ${visibleModes.length === 1 ? "max-w-lg mx-auto" : "md:grid-cols-2"}`}>
          {visibleModes.map(({ Icon, title, desc, cta, badge, bg, border, glow, glowHover, accent, accentBg, path }, i) => {
            const dimmed = hoveredIdx !== null && hoveredIdx !== i;

            return (
              <div key={i} className={`game-float-${i}`}>
                <motion.div
                  initial={{ opacity: 0, y: 40, scale: 0.94 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.13, type: "spring", stiffness: 260, damping: 22 }}

                  animate={{ opacity: dimmed ? 0.48 : 1 }}
                  whileHover={{ scale: 1.03, boxShadow: `0 32px 80px ${glow}` }}
                  whileTap={{ scale: 0.96 }}

                  onHoverStart={() => setHoveredIdx(i)}
                  onHoverEnd={() => setHoveredIdx(null)}
                  onClick={(e) => handleClick(e, path, i)}

                  className="relative group cursor-pointer rounded-3xl overflow-hidden flex flex-col"
                  style={{
                    background: bg,
                    border: `1.5px solid ${border}`,
                    boxShadow: `0 10px 40px ${glow}`,
                    minHeight: 320,
                    transition: "box-shadow 0.35s",
                  }}
                >
                  {/* Scanline texture */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
                    style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,1) 3px,rgba(255,255,255,1) 4px)" }} />

                  {/* Center glow on hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(ellipse at 50% 35%, ${glowHover}, transparent 68%)` }} />

                  {/* Shimmer sweep */}
                  <div className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                    style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.10) 50%, transparent 70%)" }} />

                  {/* Corner brackets */}
                  {["top-4 right-4 border-t-2 border-r-2", "top-4 left-4 border-t-2 border-l-2",
                    "bottom-4 right-4 border-b-2 border-r-2", "bottom-4 left-4 border-b-2 border-l-2"].map((cls, j) => (
                    <div key={j} className={`absolute w-6 h-6 pointer-events-none ${cls}`}
                      style={{ borderColor: `${accent}60` }} />
                  ))}

                  {/* Click ripple */}
                  <AnimatePresence>
                    {ripples[i] && (
                      <motion.div
                        key={ripples[i]!.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          left: ripples[i]!.x - 60,
                          top: ripples[i]!.y - 60,
                          width: 120,
                          height: 120,
                          background: "rgba(255,255,255,0.18)",
                        }}
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Badge */}
                  {badge && (
                    <div className="absolute top-5 left-5 z-10">
                      <motion.div
                        animate={{ opacity: [0.65, 1, 0.65] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                        className="px-3 py-1 rounded-full text-[11px] font-black"
                        style={{ background: "rgba(255,255,255,0.1)", color: accent, border: `1px solid ${accent}50` }}>
                        {badge}
                      </motion.div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-10 flex-1">

                    <motion.div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: `1px solid ${accent}45`,
                        boxShadow: `0 0 24px ${accent}20`,
                      }}
                      whileHover={{ boxShadow: `0 0 40px ${accent}55`, scale: 1.08 }}
                    >
                      <Icon size={38} style={{ color: accent }} />
                    </motion.div>

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
                      {title}
                    </h2>

                    <p className="font-medium text-lg mb-8 leading-relaxed whitespace-pre-line"
                      style={{ color: "rgba(255,255,255,0.5)" }}>
                      {desc}
                    </p>

                    <motion.div
                      whileHover={{ scale: 1.07, boxShadow: `0 6px 32px ${glow}` }}
                      whileTap={{ scale: 0.94, y: 3 }}
                      className="py-4 px-10 rounded-2xl font-black text-white text-lg select-none"
                      style={{
                        background: accentBg,
                        border: `1px solid ${accent}50`,
                        boxShadow: `0 4px 0 rgba(0,0,0,0.4), 0 0 24px ${glow}`,
                      }}>
                      {cta}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Section Divider ─────────────────── */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 container mx-auto px-4 max-w-5xl py-2" dir="rtl">
      <div className="flex-1 h-px" style={{ background: "rgba(123,47,190,0.1)" }} />
      <span className="text-[10px] font-black tracking-[0.35em] uppercase"
        style={{ color: "rgba(123,47,190,0.38)" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "rgba(123,47,190,0.1)" }} />
    </div>
  );
}

/* ─────────────────── Page ─────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir="rtl">
      <Navbar />
      <main>
        <Hero />
        <GameModes />
        <About />
        <SectionDivider label="أدواتك" />
        <HelpTools />
        <SectionDivider label="مساعدة" />
        <Faq />
        <div className="h-16" />
      </main>
      <FeedbackModal />
    </div>
  );
}
