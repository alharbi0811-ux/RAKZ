import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/* Ambient floating orbs — soft radial blobs that drift in the bg */
const ORBS = [
  { size: 200, left: "6%",  top: "18%", delay: 0,   dur: 8.0, opacity: 0.09 },
  { size: 140, left: "74%", top: "12%", delay: 1.4, dur: 6.5, opacity: 0.07 },
  { size: 100, left: "87%", top: "62%", delay: 0.6, dur: 7.5, opacity: 0.06 },
  { size: 160, left: "32%", top: "78%", delay: 2.1, dur: 9.0, opacity: 0.08 },
  { size: 80,  left: "52%", top: "42%", delay: 1.0, dur: 5.8, opacity: 0.05 },
];

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[40vh] sm:min-h-[48vh] md:min-h-[52vh]">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden rounded-b-[4rem]">
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #3a007a 0%, #5a1ab8 30%, #7B3FF2 60%, #a06eee 85%, #c49cf5 100%)" }} />

        {/* Ambient orbs */}
        {ORBS.map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: o.size,
              height: o.size,
              left: o.left,
              top: o.top,
              background: "radial-gradient(circle, rgba(180,120,255,1) 0%, transparent 70%)",
              filter: "blur(28px)",
              opacity: o.opacity,
            }}
            animate={{ y: [0, -18, 0], opacity: [o.opacity, o.opacity * 1.6, o.opacity] }}
            transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Content — stagger on page load */}
      <div className="relative z-10 text-center flex flex-col items-center pt-16 sm:pt-20 md:pt-24 pb-8 px-4">

        <motion.img
          src="/logo-white.png"
          alt="ركز"
          initial={{ opacity: 0, scale: 0.75, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.75, type: "spring", bounce: 0.4 }}
          className="w-24 sm:w-36 md:w-60 lg:w-80 mb-4"
          style={{
            mixBlendMode: "screen",
            filter: "drop-shadow(0 0 10px rgba(255,255,255,0.6)) drop-shadow(0 0 28px rgba(200,150,255,0.3))",
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="mb-3 flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black"
          style={{
            background: "rgba(234,179,8,0.12)",
            border: "1px solid rgba(234,179,8,0.45)",
            color: "#fbbf24",
            boxShadow: "0 0 18px rgba(234,179,8,0.18)",
            letterSpacing: "0.04em",
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-yellow-400"
          />
          إصدار تجريبي لفترة محدودة
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.5 }}
          className="text-white font-black text-xl sm:text-2xl md:text-4xl tracking-wide mb-2"
          dir="rtl"
        >
          فكر بسرعة...  جاوب بدقة
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-white/65 font-semibold text-sm sm:text-base md:text-xl px-2"
          dir="rtl"
        >
          لعبة أسئلة جماعية — فئات متنوعة لكل المناسبات
        </motion.p>

        {/* Bouncing scroll hint — appears last */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={22} className="text-white/35" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
