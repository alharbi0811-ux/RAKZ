import { API_BASE } from "@/lib/apiBase";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/sections/Navbar";
import { Check, Info, X, Search, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";



type Category = {
  id: string;
  name: string;
  img: string;
  flag?: string;
  status?: string;
  lockMessage?: string | null;
};

type Section = {
  name: string;
  flag?: string;
  categories: Category[];
};

export default function StartGame() {
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [infoCard, setInfoCard] = useState<Category | null>(null);
  const [gameName, setGameName] = useState("");
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [team1Tools, setTeam1Tools] = useState<string[]>(["double", "pit", "rest"]);
  const [team2Tools, setTeam2Tools] = useState<string[]>(["double", "pit", "rest"]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((r) => r.json())
      .then((data) => { setSections(data); setLoadingSections(false); })
      .catch(() => setLoadingSections(false));
  }, []);

  const HELP_TOOLS = [
    { id: "double", name: "جاوب جوابين", icon: "https://seenjeemkw.com/assets/handIconBlue-Cf6L4RSE.svg", color: "#7B2FBE" },
    { id: "double_pts", name: "دبل نقاطك x2", icon: "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'64'%20height%3D'64'%20viewBox%3D'0%200%2064%2064'%3E%3Ccircle%20cx%3D'32'%20cy%3D'32'%20r%3D'29'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'5'%2F%3E%3Ctext%20x%3D'32'%20y%3D'41'%20text-anchor%3D'middle'%20font-family%3D'Arial%20Black%2CArial'%20font-weight%3D'900'%20font-size%3D'25'%20fill%3D'black'%3EX2%3C%2Ftext%3E%3C%2Fsvg%3E", color: "#eab308" },
    { id: "pit", name: "الحفرة", icon: "https://d2du33uhi1xfjy.cloudfront.net/static-data/new-home-page/circle-replace.png", color: "#22c55e" },
    { id: "rest", name: "استريح", icon: "https://d2du33uhi1xfjy.cloudfront.net/static-data/new-home-page/circle-hand.png", color: "#ef4444" },
  ];

  const toggleTool = (team: 1 | 2, toolId: string) => {
    const setter = team === 1 ? setTeam1Tools : setTeam2Tools;
    const current = team === 1 ? team1Tools : team2Tools;
    if (current.includes(toolId)) {
      setter(current.filter((t) => t !== toolId));
    } else if (current.length < 3) {
      setter([...current, toolId]);
    }
  };

  const MAX = 6;

  const toggleCategory = (cat: Category) => {
    setSelectedIds((prev) => {
      if (prev.includes(cat.id)) return prev.filter((id) => id !== cat.id);
      if (prev.length >= MAX) return prev;
      return [...prev, cat.id];
    });
  };

  const team1 = selectedIds.slice(0, 3);
  const team2 = selectedIds.slice(3, 6);

  // Filter sections based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.trim().toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        categories: s.categories.filter((c) =>
          c.name.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.categories.length > 0);
  }, [sections, searchQuery]);

  const totalFiltered = filteredSections.reduce((acc, s) => acc + s.categories.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <Navbar />

      <main className="pt-28 pb-28">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3">إنشاء لعبة</h1>
            <p className="text-foreground/60 text-lg">لعبة جماعية تفاعلية نختبر فيها معرفتكم وثقافتكم</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative w-full max-w-lg">
              <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7B2FBE" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن فئة..."
                dir="rtl"
                className="w-full py-3 pr-12 pl-5 rounded-full text-base font-medium outline-none transition-all"
                style={{
                  background: "#fff",
                  border: "2px solid",
                  borderColor: searchQuery ? "#7B2FBE" : "#e9d5ff",
                  boxShadow: searchQuery ? "0 0 0 3px rgba(123,47,190,0.12)" : "none",
                  color: "#1a1a2e",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: "#e9d5ff", color: "#7B2FBE" }}
                >
                  <X size={11} />
                </button>
              )}
              {searchQuery && totalFiltered > 0 && (
                <span className="absolute -bottom-6 right-2 text-xs font-medium" style={{ color: "#7B2FBE" }}>
                  {totalFiltered} فئة
                </span>
              )}
            </div>
          </motion.div>

          {/* Selection Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-8 mb-8"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-foreground/50 font-medium">فريقك</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all text-sm ${
                      team1[i]
                        ? "bg-[#7B2FBE] border-[#7B2FBE] text-white scale-110"
                        : "border-purple-200 bg-white text-foreground/30"
                    }`}
                  >
                    {team1[i] ? <Check size={16} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-foreground/30 font-black text-xl">VS</div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-foreground/50 font-medium">الفريق المنافس</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all text-sm ${
                      team2[i]
                        ? "bg-violet-400 border-violet-400 text-white scale-110"
                        : "border-purple-200 bg-white text-foreground/30"
                    }`}
                  >
                    {team2[i] ? <Check size={16} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sections with categories */}
          <div className="space-y-6 md:space-y-12">
            {loadingSections ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-[#7B2FBE]/30 border-t-[#7B2FBE] rounded-full animate-spin" />
              </div>
            ) : null}

            {/* No search results */}
            {!loadingSections && searchQuery && filteredSections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Search size={40} className="mx-auto mb-4 text-purple-200" />
                <p className="text-foreground/40 text-lg font-medium">لا توجد فئات تطابق "<span className="text-[#7B2FBE]">{searchQuery}</span>"</p>
              </motion.div>
            )}

            {!loadingSections && filteredSections.map((section, sIdx) => (
              <motion.div
                key={section.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.05 }}
                className="border-2 border-[#7B2FBE] rounded-3xl p-4 md:p-8 shadow-[0_0_24px_rgba(123,47,190,0.3)]"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                  {section.flag && (
                    <img
                      src={section.flag}
                      alt={section.name}
                      className="h-7 w-10 object-cover rounded shadow-sm"
                    />
                  )}
                  <h2 className="text-xl md:text-2xl font-black text-foreground">{section.name}</h2>
                  <div className="flex-1 h-px bg-purple-100" />
                  <span className="text-sm text-foreground/40 font-medium">{section.categories.length} فئة</span>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {section.categories.map((cat, idx) => {
                    const selected = selectedIds.includes(cat.id);
                    const teamIdx = selectedIds.indexOf(cat.id);
                    const isTeam1 = teamIdx >= 0 && teamIdx < 3;
                    const disabled = !selected && selectedIds.length >= MAX;
                    const isLocked = cat.status === "in_progress" || cat.status === "closed";

                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: disabled && !isLocked ? 0.45 : 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`relative rounded-2xl overflow-hidden transition-all group border-2 ${
                          isLocked
                            ? "cursor-not-allowed border-transparent"
                            : selected
                              ? isTeam1
                                ? "cursor-pointer border-[#7B2FBE] shadow-[0_0_18px_rgba(123,47,190,0.5)] scale-[1.03]"
                                : "cursor-pointer border-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.45)] scale-[1.03]"
                              : disabled
                                ? "cursor-not-allowed border-transparent"
                                : "cursor-pointer border-transparent hover:border-[#7B2FBE]/50 hover:shadow-lg hover:scale-[1.02]"
                        }`}
                        onClick={() => !disabled && !isLocked && toggleCategory(cat)}
                      >
                        {/* Card image */}
                        <div className="relative aspect-[4/5] bg-purple-100">
                          <img
                            src={cat.img}
                            alt={cat.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${isLocked ? "" : "group-hover:scale-105"}`}
                          />

                          {/* Dark gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                          {/* Lock overlay for in_progress / closed */}
                          {isLocked && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-20 gap-1.5">
                              <div className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
                                <Lock size={16} className="text-white" />
                              </div>
                              <span className="text-white text-[10px] font-bold text-center px-2 leading-tight opacity-80">
                                {cat.lockMessage || "قيد العمل"}
                              </span>
                            </div>
                          )}

                          {/* Selected color overlay */}
                          {selected && !isLocked && (
                            <div className={`absolute inset-0 ${isTeam1 ? "bg-[#7B2FBE]/35" : "bg-violet-400/35"}`} />
                          )}

                          {/* Info button - top left (hide for locked) */}
                          {!isLocked && (
                            <button
                              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#3193e9] hover:bg-[#2280d0] flex items-center justify-center transition-colors z-10 shadow"
                              onClick={(e) => { e.stopPropagation(); setInfoCard(cat); }}
                            >
                              <Info size={12} className="text-white" />
                            </button>
                          )}

                          {/* Check badge - top right */}
                          {selected && !isLocked && (
                            <div className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 ${isTeam1 ? "bg-[#7B2FBE]" : "bg-violet-400"}`}>
                              <Check size={14} className="text-white" />
                            </div>
                          )}

                          {/* Country flag badge */}
                          {cat.flag && !isLocked && (
                            <div className="absolute bottom-10 right-2 z-10">
                              <img src={cat.flag} alt="flag" className="h-5 w-7 object-cover rounded shadow" />
                            </div>
                          )}

                          {/* Category name at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4 z-10">
                            <p className="text-white font-black text-sm text-center leading-tight drop-shadow-lg">
                              {cat.name}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Game Info Section */}
          {selectedIds.length === MAX && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 md:mt-12"
            >
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-5 md:mb-8 text-center">حدد معلومات الفرق</h2>

              <div className="flex justify-center mb-8">
                <div className="relative w-full max-w-sm">
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-full py-3 px-6 text-right text-foreground font-medium focus:outline-none focus:border-[#7B2FBE] transition-colors"
                    placeholder="اسم اللعبة"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold bg-white px-2">اسم اللعبة</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-foreground mb-4">الفريق الأول</h3>
                  <div className="relative w-full max-w-xs mx-auto mb-6">
                    <input
                      type="text"
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-full py-3 px-6 text-right text-foreground font-medium focus:outline-none focus:border-[#7B2FBE] transition-colors"
                      placeholder="اسم الفريق"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold bg-white px-2">اسم الفريق</span>
                  </div>
                  <p className="text-sm font-bold text-foreground/70 mb-3">الفريق الأول : اختر 3 وسائل مساعدة</p>
                  <div className="flex justify-center gap-3">
                    {HELP_TOOLS.map((tool) => {
                      const selected = team1Tools.includes(tool.id);
                      return (
                        <button key={tool.id} onClick={() => toggleTool(1, tool.id)} className="flex flex-col items-center gap-1">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selected ? "ring-3 ring-[#7B2FBE] bg-[#7B2FBE]/10" : "bg-gray-100"}`}>
                            <img src={tool.icon} alt={tool.name} className="w-10 h-10 object-contain"
                              style={selected ? { filter: "brightness(0) saturate(100%) invert(18%) sepia(89%) saturate(1200%) hue-rotate(255deg) brightness(1.15)" } : { filter: "grayscale(100%) opacity(0.5)" }} />
                          </div>
                          <span className="text-[10px] font-bold text-foreground/60">{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-black text-foreground mb-4">الفريق الثاني</h3>
                  <div className="relative w-full max-w-xs mx-auto mb-6">
                    <input
                      type="text"
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-full py-3 px-6 text-right text-foreground font-medium focus:outline-none focus:border-[#7B2FBE] transition-colors"
                      placeholder="اسم الفريق"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold bg-white px-2">اسم الفريق</span>
                  </div>
                  <p className="text-sm font-bold text-foreground/70 mb-3">الفريق الثاني : اختر 3 وسائل مساعدة</p>
                  <div className="flex justify-center gap-3">
                    {HELP_TOOLS.map((tool) => {
                      const selected = team2Tools.includes(tool.id);
                      return (
                        <button key={tool.id} onClick={() => toggleTool(2, tool.id)} className="flex flex-col items-center gap-1">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selected ? "ring-3 ring-[#7B2FBE] bg-[#7B2FBE]/10" : "bg-gray-100"}`}>
                            <img src={tool.icon} alt={tool.name} className="w-10 h-10 object-contain"
                              style={selected ? { filter: "brightness(0) saturate(100%) invert(18%) sepia(89%) saturate(1200%) hue-rotate(255deg) brightness(1.15)" } : { filter: "grayscale(100%) opacity(0.5)" }} />
                          </div>
                          <span className="text-[10px] font-bold text-foreground/60">{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center"
              >
                <button
                  onClick={async () => {
                    const allCats = sections.flatMap((s) => s.categories);
                    const t1Cats = team1.map((id) => allCats.find((c) => c.id === id)!).filter(Boolean);
                    const t2Cats = team2.map((id) => allCats.find((c) => c.id === id)!).filter(Boolean);
                    const gData = {
                      team1Name: team1Name || "الفريق الأول",
                      team2Name: team2Name || "الفريق الثاني",
                      gameName: gameName || "ركز",
                      team1Categories: t1Cats.map((c) => ({ id: c.id, name: c.name, img: c.img })),
                      team2Categories: t2Cats.map((c) => ({ id: c.id, name: c.name, img: c.img })),
                      team1Tools,
                      team2Tools,
                    };
                    localStorage.setItem("rakez-game-data", JSON.stringify(gData));
                    localStorage.removeItem("rakez-played-cells");
                    localStorage.removeItem("rakez-used-tools");
                    localStorage.removeItem("rakez-used-question-ids");
                    localStorage.setItem("rakez-scores", JSON.stringify({ team1Score: 0, team2Score: 0 }));
                    localStorage.setItem("rakez-current-team", JSON.stringify(1));
                    localStorage.removeItem("rakez-session-id");

                    if (user && token) {
                      try {
                        const res = await fetch(`${API_BASE}/history`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ gameName: gData.gameName, gameData: gData }),
                        });
                        if (res.ok) {
                          const session = await res.json();
                          localStorage.setItem("rakez-session-id", String(session.id));
                        }
                      } catch {}
                    }
                    navigate("/score-page");
                  }}
                  className="bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-black text-xl py-4 px-16 rounded-full shadow-[0_0_40px_rgba(123,47,190,0.6)] transition-all hover:shadow-[0_0_60px_rgba(123,47,190,0.8)] hover:-translate-y-1"
                >
                  ابدأ اللعب
                </button>
              </motion.div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Info Modal */}
      <AnimatePresence>
        {infoCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setInfoCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-52">
                <img src={infoCard.img} alt={infoCard.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button
                  onClick={() => setInfoCard(null)}
                  className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
                <p className="absolute bottom-3 right-4 text-white font-black text-xl drop-shadow-lg">
                  {infoCard.name}
                </p>
              </div>
              <div className="p-6">
                <button
                  className="w-full bg-[#7B2FBE] text-white font-bold py-3 rounded-xl hover:bg-[#8B35D6] transition-colors"
                  onClick={() => { toggleCategory(infoCard); setInfoCard(null); }}
                >
                  {selectedIds.includes(infoCard.id) ? "إلغاء الاختيار" : "اختر هذه الفئة"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
