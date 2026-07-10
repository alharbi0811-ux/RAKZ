import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "كيف يمكنني إنشاء لعبة في ركز ؟",
    a: "أنشئ حساب جديد في اللعبة وبعدها اضغط على إنشاء لعبة ، قسّم المتواجدين إلى فريقين متساويين ، لكل فريق يختار ٣ فئات ، اختار اسم لكل فريق وبعدها ابدأ اللعبة ."
  },
  {
    q: "هل تتكرر الأسئلة في حال اختيار فئات تم اختيارها مسبقاً ؟",
    a: "لا ، جميع الأسئلة في جميع الفئات مختلفة و غير قابلة للتكرار ، ماعدا اللعبة المجانية لجميع الحسابات الجديدة ثابتة ."
  },
  {
    q: "في حال إيقاف اللعبة ، والرغبة في تكملتها في وقت لاحق هل يمكن الرجوع لها ؟",
    a: 'أي لعبة يتم البدأ فيها يتم حفظها بشكل مباشر في قسم " ألعابي " ، ويمكنكم الرجوع له في أعلى الصفحة .'
  },
  {
    q: "في حال إجابة نصف السؤال ، هل يمكن أخذ نص النقاط ؟",
    a: "لا ، الإجابة يجب أن تكون كاملة لأخذ نقاط السؤال ."
  },
  {
    q: "في حال تواجد كلمة < سنة > فوق السؤال ، فماهو معناها ؟",
    a: "في هذا السؤال في حال جوابك كان ( سنة ٢٠١٠ ) فجوابك يشمل سنة فوق ٢٠١٠ و سنة تحت ٢٠١٠ يعني ( ٢٠٠٩ - ٢٠١٠ - ٢٠١١ )"
  },
  {
    q: "هل يمكنني أخذ سؤال من الفئة التي اختارها الفريق المنافس ؟ أو أخذ أكثر من ٣ أسئلة من نفس الفئة ؟",
    a: "نعم ، يمكنك أخذ أي سؤال في أي فئة من الفئات الستة المختارة ."
  },
  {
    q: "كم هو الوقت المحدد للإجابة لكل فريق ؟",
    a: "الفريق الذي عليه الدور لديه دقيقة واحدة  و نصف، والفريق الثاني لديه 30 ثانية فقط و  تُحسب من بعد جواب الفريق الأول ."
  }
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 relative" dir="rtl">
      <div className="container mx-auto px-4 max-w-3xl">

        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4"
            style={{ background: "rgba(123,47,190,0.1)", color: "#7B2FBE", border: "1px solid rgba(123,47,190,0.18)" }}
          >
            مساعدة
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-foreground"
          >
            الأسئلة الشائعة
          </motion.h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                key={idx}
                className="rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-[#1e1830]"
                style={{
                  border: `1px solid ${isOpen ? "rgba(123,47,190,0.3)" : "rgba(0,0,0,0.08)"}`,
                  boxShadow: isOpen ? "0 4px 24px rgba(123,47,190,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-right transition-colors focus:outline-none bg-white dark:bg-[#1e1830]"
                  style={{ background: isOpen ? "rgba(123,47,190,0.08)" : undefined }}
                >
                  <span className="text-lg font-black text-foreground pl-4 leading-relaxed flex-1">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: isOpen ? "rgba(123,47,190,0.12)" : "rgba(0,0,0,0.05)" }}
                  >
                    <ChevronDown size={16} style={{ color: isOpen ? "#7B2FBE" : "#9ca3af" }} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-3 font-medium text-base leading-relaxed text-gray-600 dark:text-purple-200"
                        style={{
                          borderTop: "1px solid rgba(123,47,190,0.1)",
                        }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
