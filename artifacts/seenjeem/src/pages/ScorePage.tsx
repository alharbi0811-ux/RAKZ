import { API_BASE } from "@/lib/apiBase";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight, LogOut, Eye, Minus, Plus, RotateCcw, Trophy, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { IconBtn } from "@/components/IconBtn";


const CDN = "https://d442zbpa1tgal.cloudfront.net";
const TOOLS_CDN = "https://d2du33uhi1xfjy.cloudfront.net/static-data/new-home-page";
const X2_ICON = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'64'%20height%3D'64'%20viewBox%3D'0%200%2064%2064'%3E%3Ccircle%20cx%3D'32'%20cy%3D'32'%20r%3D'29'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'5'%2F%3E%3Ctext%20x%3D'32'%20y%3D'41'%20text-anchor%3D'middle'%20font-family%3D'Arial%20Black%2CArial'%20font-weight%3D'900'%20font-size%3D'25'%20fill%3D'black'%3EX2%3C%2Ftext%3E%3C%2Fsvg%3E";

const HELP_TOOLS_MAP: Record<string, { name: string; icon: string }> = {
  double: { name: "جاوب جوابين", icon: "https://seenjeemkw.com/assets/handIconBlue-Cf6L4RSE.svg" },
  double_pts:  { name: "دبل نقاطك x2", icon: X2_ICON },
  pit:    { name: "الحفرة",       icon: `${TOOLS_CDN}/circle-replace.png` },
  rest:   { name: "استريح",      icon: `${TOOLS_CDN}/circle-hand.png` },
};

type CategoryStatus = "open" | "closed" | "in_progress";
type CategoryData = { id: string; name: string; img: string };
type GameData = {
  team1Name: string; team2Name: string; gameName: string;
  team1Categories: CategoryData[]; team2Categories: CategoryData[];
  team1Tools?: string[]; team2Tools?: string[];
};
const POINTS = [200, 400, 600];

export default function ScorePage() {
  const [, navigate] = useLocation();
  const { token, user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [playedCells, setPlayedCells] = useState<Set<string>>(new Set());
  const [showEndModal, setShowEndModal] = useState(false);
  const [loadingCell, setLoadingCell] = useState<string | null>(null);
  const [questionCache, setQuestionCache] = useState<Record<string, any>>({});
  const [usedTools, setUsedTools] = useState<{ team1: string[]; team2: string[] }>({ team1: [], team2: [] });
  const [pitActive, setPitActive] = useState(false);
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, { status: CategoryStatus; lockMessage: string | null }>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("rakez-game-data");
    if (stored) setGameData(JSON.parse(stored));
    else setGameData({
      team1Name: "الفريق الأول", team2Name: "الفريق الثاني", gameName: "ركز",
      team1Categories: [
        { id: "kw", name: "الكويت", img: `${CDN}/1769955614865-48498592.jpg` },
        { id: "gen-info", name: "معلومات عامة", img: `${CDN}/1714490927962-855974365.jpg` },
        { id: "gen-products", name: "منتجات", img: `${CDN}/1714490909938-715756503.jpg` },
      ],
      team2Categories: [
        { id: "new-live1", name: "الغميضة", img: `${CDN}/1772459128688-499091855.jpg` },
        { id: "gen-tech", name: "تكنولوجيا", img: `${CDN}/1755459861188-495099916.jpg` },
        { id: "gen-poetry", name: "عالم الشعر", img: `${CDN}/1738076222656-24201363.jpg` },
      ],
      team1Tools: ["double", "pit", "rest"],
      team2Tools: ["double", "pit", "rest"],
    });

    const scores = localStorage.getItem("rakez-scores");
    if (scores) { const p = JSON.parse(scores); setTeam1Score(p.team1Score || 0); setTeam2Score(p.team2Score || 0); }

    const savedCells = localStorage.getItem("rakez-played-cells");
    if (savedCells) setPlayedCells(new Set(JSON.parse(savedCells)));

    const savedTeam = localStorage.getItem("rakez-current-team");
    if (savedTeam) setCurrentTeam(JSON.parse(savedTeam) as 1 | 2);

    const tools = localStorage.getItem("rakez-used-tools");
    if (tools) setUsedTools(JSON.parse(tools));

    const answered = localStorage.getItem("rakez-answered-cell");
    if (answered) {
      const { catIdx, points, side, correct, team, pitActive, double: isDouble } = JSON.parse(answered);
      localStorage.removeItem("rakez-answered-cell");
      const key = `${catIdx}-${points}-${side ?? "l"}`;
      setPlayedCells((prev) => { const next = new Set(prev); next.add(key); return next; });
      const finalPoints = isDouble ? points * 2 : points;
      if (correct && team !== 0) {
        if (pitActive) {
          if (team === 1) {
            setTeam1Score((s) => s + finalPoints);
            setTeam2Score((s) => s - finalPoints);
          } else {
            setTeam2Score((s) => s + finalPoints);
            setTeam1Score((s) => s - finalPoints);
          }
        } else {
          if (team === 1) setTeam1Score((s) => s + finalPoints);
          else setTeam2Score((s) => s + finalPoints);
        }
      }
      setCurrentTeam((t) => (t === 1 ? 2 : 1));
    }
  }, []);

  useEffect(() => { if (playedCells.size > 0) localStorage.setItem("rakez-played-cells", JSON.stringify([...playedCells])); }, [playedCells]);
  useEffect(() => { localStorage.setItem("rakez-scores", JSON.stringify({ team1Score, team2Score })); }, [team1Score, team2Score]);
  useEffect(() => { localStorage.setItem("rakez-current-team", JSON.stringify(currentTeam)); }, [currentTeam]);

  const allCategories = gameData ? [...gameData.team1Categories, ...gameData.team2Categories] : [];
  const totalCells = allCategories.length * POINTS.length * 2;
  const allPlayed = totalCells > 0 && playedCells.size >= totalCells;

  useEffect(() => {
    if (totalCells > 0 && allPlayed) {
      const t = setTimeout(() => navigate("/win-page"), 1200);
      return () => clearTimeout(t);
    }
  }, [allPlayed, totalCells]);

  useEffect(() => {
    const sessionId = localStorage.getItem("rakez-session-id");
    if (!sessionId || !token) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`${API_BASE}/history/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ boardState: { playedCells: [...playedCells], team1Score, team2Score, currentTeam } }),
      }).catch(() => {});
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [playedCells, team1Score, team2Score, currentTeam, token]);

  // Fetch category statuses
  useEffect(() => {
    if (!gameData) return;
    const cats = [...gameData.team1Categories, ...gameData.team2Categories];
    const ids = cats.map((c) => c.id).filter((id) => !isNaN(Number(id))).join(",");
    if (!ids) return;
    fetch(`${API_BASE}/categories/statuses?ids=${ids}`)
      .then((r) => r.ok ? r.json() : {})
      .then((data) => setCategoryStatuses(data))
      .catch(() => {});
  }, [gameData]);

  const POINTS_LIST = [200, 400, 600];

  useEffect(() => {
    if (!gameData) return;
    const cats = [...gameData.team1Categories, ...gameData.team2Categories];
    const usedIds: number[] = JSON.parse(localStorage.getItem("rakez-used-question-ids") || "[]");
    const excludeParam = usedIds.length ? `&excludeIds=${usedIds.join(",")}` : "";
    cats.forEach((cat) => {
      POINTS_LIST.forEach((pts) => {
        const cacheKey = `${cat.id}-${pts}`;
        setQuestionCache((prev) => {
          if (prev[cacheKey]) return prev;
          fetch(`${API_BASE}/questions/game?categoryId=${cat.id}&points=${pts}${excludeParam}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => { if (data) setQuestionCache((p) => ({ ...p, [cacheKey]: data })); })
            .catch(() => {});
          return prev;
        });
      });
    });
  }, [gameData]);

  if (!gameData) return null;

  const prefetchQuestion = (categoryId: string, pts: number, excludeIds: number[]) => {
    const cacheKey = `${categoryId}-${pts}`;
    const excludeParam = excludeIds.length ? `&excludeIds=${excludeIds.join(",")}` : "";
    fetch(`${API_BASE}/questions/game?categoryId=${categoryId}&points=${pts}${excludeParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setQuestionCache((p) => ({ ...p, [cacheKey]: data })); })
      .catch(() => {});
  };

  const currentTeamKey = currentTeam === 1 ? "team1" : "team2";

  const handlePitToggle = () => setPitActive((v) => !v);

  const handleCellClick = (catIdx: number, points: number, side: "l" | "r") => {
    const key = `${catIdx}-${points}-${side}`;
    if (playedCells.has(key) || loadingCell) return;

    const category = allCategories[catIdx];

    // Block locked/in_progress categories for non-admins
    if (!isAdmin) {
      const catStatus = categoryStatuses[category.id];
      if (catStatus && catStatus.status !== "open") return;
    }

    const cacheKey = `${category.id}-${points}`;
    const cached = questionCache[cacheKey];

    if (pitActive) {
      const updatedTools = { ...usedTools, [currentTeamKey]: [...usedTools[currentTeamKey], "pit"] };
      setUsedTools(updatedTools);
      localStorage.setItem("rakez-used-tools", JSON.stringify(updatedTools));
    }

    const navigateToQuestion = (q: any) => {
      localStorage.setItem("rakez-current-question", JSON.stringify({
        categoryId: category.id, categoryName: category.name,
        points, catIdx, side, currentTeam,
        questionId: q.id, question: q.question, answer: q.answer,
        image: q.image || "",
        answerImage: q.answerImage || "",
        externalPageSlug: q.externalPageSlug || null,
        pitActive,
      }));
      setPitActive(false);
      navigate("/question");
    };

    if (cached) {
      const usedIds: number[] = JSON.parse(localStorage.getItem("rakez-used-question-ids") || "[]");
      const newUsed = [...usedIds, cached.id];
      localStorage.setItem("rakez-used-question-ids", JSON.stringify(newUsed));
      setQuestionCache((prev) => { const next = { ...prev }; delete next[cacheKey]; return next; });
      prefetchQuestion(category.id, points, newUsed);
      navigateToQuestion(cached);
    } else {
      setLoadingCell(key);
      const usedIds: number[] = JSON.parse(localStorage.getItem("rakez-used-question-ids") || "[]");
      const excludeParam = usedIds.length ? `&excludeIds=${usedIds.join(",")}` : "";
      fetch(`${API_BASE}/questions/game?categoryId=${category.id}&points=${points}${excludeParam}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const q = data || { question: "لا توجد أسئلة لهذه الفئة.", answer: "—", image: category.img };
          if (data?.id) {
            const latest: number[] = JSON.parse(localStorage.getItem("rakez-used-question-ids") || "[]");
            const newUsed = [...latest, data.id];
            localStorage.setItem("rakez-used-question-ids", JSON.stringify(newUsed));
            prefetchQuestion(category.id, points, newUsed);
          }
          navigateToQuestion(q);
        })
        .catch(() => setLoadingCell(null))
        .finally(() => setLoadingCell(null));
    }
  };

  const handleEndGame = () => setShowEndModal(true);

  const handleExit = () => {
    const sessionId = localStorage.getItem("rakez-session-id");
    if (sessionId && token) {
      fetch(`${API_BASE}/history/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "completed" }),
      }).catch(() => {});
    }
    ["rakez-game-data","rakez-scores","rakez-played-cells","rakez-current-team","rakez-used-tools","rakez-current-question","rakez-session-id","rakez-used-question-ids"].forEach(k => localStorage.removeItem(k));
    navigate("/start-game");
  };

  const handleResetBoard = () => {
    setPlayedCells(new Set()); setTeam1Score(0); setTeam2Score(0); setCurrentTeam(1);
    setShowEndModal(false); setPitActive(false);
    setUsedTools({ team1: [], team2: [] });
    localStorage.removeItem("rakez-played-cells");
    localStorage.setItem("rakez-scores", JSON.stringify({ team1Score: 0, team2Score: 0 }));
    localStorage.setItem("rakez-current-team", JSON.stringify(1));
    localStorage.removeItem("rakez-used-tools");
  };

  const currentTeamName = currentTeam === 1 ? gameData.team1Name : gameData.team2Name;

  return (
    <div className="score-page-wrapper h-screen overflow-hidden bg-gradient-to-br from-[#f0e8ff] via-[#e8e0f0] to-[#f0f0ff] flex flex-col" dir="rtl">
      {/* Top Bar */}
      <div className="score-topbar shrink-0 px-3 py-2 md:px-6 md:pt-[24px] md:pb-[24px] shadow-lg border-b border-white/10" style={{ background: "linear-gradient(135deg, #6A00F4, #7B3FF2, #8E63E6, #A07CE0, #B89AE6)" }}>
        <div className="flex items-center justify-between h-full relative">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <img src={`${import.meta.env.BASE_URL}logo-white.png`} alt="ركز" className="h-6 md:h-10 md:pl-[22px] md:pr-[22px]" />
            <div className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 md:px-5 md:py-2 md:pt-[10px] md:pb-[10px] md:pl-[25px] md:pr-[25px] rounded-full font-bold border border-white/20 text-[10px] md:text-[15px]">
              دور: {currentTeamName}
            </div>
          </div>
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <span className="text-white font-bold text-xs md:text-lg">{gameData.gameName}</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
            <IconBtn icon={<Eye size={16} />} label="انتهاء اللعبة" onClick={handleEndGame} tooltipPos="bottom"
              className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
            <IconBtn icon={<RotateCcw size={16} />} label="إعادة" onClick={handleResetBoard} tooltipPos="bottom"
              className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
            <IconBtn icon={<LogOut size={16} />} label="الخروج" onClick={handleExit} tooltipPos="bottom"
              className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div className="score-gameboard flex-1 min-h-0 p-2 md:p-4 flex flex-col gap-2 md:gap-4">
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5 md:gap-4">
          {gameData.team1Categories.map((cat, catIdx) => (
            <CategoryCard
              key={cat.id} category={cat} catIdx={catIdx} playedCells={playedCells}
              onCellClick={handleCellClick} teamColor="#7B2FBE" loadingCell={loadingCell}
              catStatus={categoryStatuses[cat.id] ?? { status: "open", lockMessage: null }}
              isAdmin={isAdmin}
            />
          ))}
        </div>
        {/* ─── Diamond Score Zone — في المنتصف بين الدروع ─── */}
        <div style={{position: "relative", flexShrink: 0, height: "120px", margin: "-30px 0", zIndex: 50}}>
          {/* خط الوسط المتوهج */}
          <div style={{position: "absolute", top: "50%", left: "5%", right: "5%", height: "1.5px", background: "linear-gradient(90deg,transparent,#c4b5fd,#8b5cf6,#c4b5fd,transparent)", transform: "translateY(-50%)"}}/>

          {/* ماسة الفريق الأول (يمين - بين العمودين 1 و 2) */}
          <div style={{position: "absolute", top: "50%", right: "33.33%", transform: "translate(50%, -50%)", zIndex: 11, filter: "drop-shadow(0 4px 12px rgba(123,47,190,0.35))"}}>
            <div className="diamond-svg-wrap" style={{position: "relative"}}>
              <svg width="100%" height="100%" viewBox="0 0 380 200" style={{position: "absolute", inset: 0}}>
                <defs>
                  <linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6A00F4"/>
                    <stop offset="50%" stopColor="#8E63E6"/>
                    <stop offset="100%" stopColor="#B89AE6"/>
                  </linearGradient>
                </defs>
                <path d="M 200 17 L 358 96 Q 372 100 358 104 L 200 184 Q 190 192 180 184 L 22 104 Q 8 100 22 96 L 180 17 Q 190 8 200 17 Z" fill="white" stroke="url(#dg1)" strokeWidth="5" strokeLinejoin="round"/>
              </svg>
              <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px"}}>
                <span style={{fontSize: "52px", fontWeight: 900, color: "#4c1d95", lineHeight: 1}}>{team1Score}</span>
                <div style={{display: "flex", alignItems: "center", gap: "28px", direction: "ltr"}}>
                  <button onClick={() => setTeam1Score((s) => s - 200)} style={{width: "54px", height: "54px", borderRadius: "50%", background: "#f3e8ff", border: "2px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                    <Minus size={28} color="#7c3aed" strokeWidth={3}/>
                  </button>
                  <span style={{fontSize: "32px", fontWeight: 900, color: "#6d28d9", direction: "rtl"}}>{gameData.team1Name}</span>
                  <button onClick={() => setTeam1Score((s) => s + 200)} style={{width: "54px", height: "54px", borderRadius: "50%", background: "#f3e8ff", border: "2px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                    <Plus size={28} color="#7c3aed" strokeWidth={3}/>
                  </button>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "12px"}}>
                  {((gameData.team1Tools?.length > 0) ? gameData.team1Tools : ["double","pit","rest"]).map((toolId) => {
                    const tool = HELP_TOOLS_MAP[toolId];
                    if (!tool) return null;
                    const used = usedTools.team1.includes(toolId);
                    const isActive = toolId === "pit" && currentTeam === 1 && !used;
                    return (
                      <motion.button key={toolId}
                        whileHover={isActive ? {scale: 1.1} : {}}
                        whileTap={isActive ? {scale: 0.9} : {}}
                        onClick={() => isActive && handlePitToggle()}
                        disabled={!isActive}
                        title={tool.name}
                        style={{width: "62px", height: "62px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(196,181,253,0.6)", background: isActive && pitActive ? "#facc15" : isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", cursor: isActive ? "pointer" : "not-allowed"}}
                      >
                        <img src={tool.icon} alt={tool.name} style={{width: "36px", height: "36px", objectFit: "contain", opacity: isActive ? 1 : 0.7, filter: "brightness(0) saturate(100%) invert(20%) sepia(86%) saturate(3833%) hue-rotate(264deg) brightness(91%) contrast(101%)"}}/>
                      </motion.button>
                    );
                  })}

                </div>
              </div>
            </div>
          </div>

          {/* ماسة الفريق الثاني (يسار - بين العمودين 2 و 3) */}
          <div style={{position: "absolute", top: "50%", left: "33.33%", transform: "translate(-50%, -50%)", zIndex: 11, filter: "drop-shadow(0 4px 12px rgba(123,47,190,0.35))"}}>
            <div className="diamond-svg-wrap" style={{position: "relative"}}>
              <svg width="100%" height="100%" viewBox="0 0 380 200" style={{position: "absolute", inset: 0}}>
                <defs>
                  <linearGradient id="dg2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#B89AE6"/>
                    <stop offset="50%" stopColor="#8E63E6"/>
                    <stop offset="100%" stopColor="#6A00F4"/>
                  </linearGradient>
                </defs>
                <path d="M 200 17 L 358 96 Q 372 100 358 104 L 200 184 Q 190 192 180 184 L 22 104 Q 8 100 22 96 L 180 17 Q 190 8 200 17 Z" fill="white" stroke="url(#dg2)" strokeWidth="5" strokeLinejoin="round"/>
              </svg>
              <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px"}}>
                <span style={{fontSize: "52px", fontWeight: 900, color: "#4c1d95", lineHeight: 1}}>{team2Score}</span>
                <div style={{display: "flex", alignItems: "center", gap: "28px", direction: "ltr"}}>
                  <button onClick={() => setTeam2Score((s) => s - 200)} style={{width: "54px", height: "54px", borderRadius: "50%", background: "#f3e8ff", border: "2px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                    <Minus size={28} color="#7c3aed" strokeWidth={3}/>
                  </button>
                  <span style={{fontSize: "32px", fontWeight: 900, color: "#6d28d9", direction: "rtl"}}>{gameData.team2Name}</span>
                  <button onClick={() => setTeam2Score((s) => s + 200)} style={{width: "54px", height: "54px", borderRadius: "50%", background: "#f3e8ff", border: "2px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"}}>
                    <Plus size={28} color="#7c3aed" strokeWidth={3}/>
                  </button>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: "20px", marginTop: "12px"}}>
                  {((gameData.team2Tools?.length > 0) ? gameData.team2Tools : ["double","pit","rest"]).map((toolId) => {
                    const tool = HELP_TOOLS_MAP[toolId];
                    if (!tool) return null;
                    const used = usedTools.team2.includes(toolId);
                    const isActive = toolId === "pit" && currentTeam === 2 && !used;
                    return (
                      <motion.button key={toolId}
                        whileHover={isActive ? {scale: 1.1} : {}}
                        whileTap={isActive ? {scale: 0.9} : {}}
                        onClick={() => isActive && handlePitToggle()}
                        disabled={!isActive}
                        title={tool.name}
                        style={{width: "62px", height: "62px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(196,181,253,0.6)", background: isActive && pitActive ? "#facc15" : isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", cursor: isActive ? "pointer" : "not-allowed"}}
                      >
                        <img src={tool.icon} alt={tool.name} style={{width: "36px", height: "36px", objectFit: "contain", opacity: isActive ? 1 : 0.7, filter: "brightness(0) saturate(100%) invert(20%) sepia(86%) saturate(3833%) hue-rotate(264deg) brightness(91%) contrast(101%)"}}/>
                      </motion.button>
                    );
                  })}

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5 md:gap-4">
          {gameData.team2Categories.map((cat, catIdx) => (
            <CategoryCard
              key={cat.id} category={cat} catIdx={catIdx + 3} playedCells={playedCells}
              onCellClick={handleCellClick} teamColor="#9333ea" loadingCell={loadingCell}
              catStatus={categoryStatuses[cat.id] ?? { status: "open", lockMessage: null }}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="score-bottombar shrink-0 hidden px-2 md:px-6 border-t border-white/10 py-2 md:py-4 flex items-center justify-between gap-1 md:gap-4 relative" style={{ background: "linear-gradient(135deg, #6A00F4, #7B3FF2, #8E63E6, #A07CE0, #B89AE6)" }}>
        {/* Team 1 */}
        <div className="flex items-center gap-1 md:gap-2 flex-1">
          <div className="hidden md:flex h-10 items-center bg-white/20 text-white px-4 rounded-full font-black border border-white/20 text-[14px] shrink-0 whitespace-nowrap">
            {gameData.team1Name}
          </div>
          <div className="h-8 md:h-10 flex items-center justify-center bg-white/90 text-[#7B2FBE] font-black text-sm md:text-lg rounded-full shadow-inner px-2 md:px-4 border-2 min-w-[40px] md:min-w-[60px] shrink-0">
            {team1Score}
          </div>
          {/* Tool icons — same height h-10 */}
          {((gameData.team1Tools?.length > 0) ? gameData.team1Tools : ["double", "pit", "rest"]).map((toolId) => {
            const tool = HELP_TOOLS_MAP[toolId];
            if (!tool) return null;
            const used = usedTools.team1.includes(toolId);
            const isActive = toolId === "pit" && currentTeam === 1 && !used;
            return (
              <motion.button
                key={toolId}
                whileHover={isActive ? { scale: 1.1 } : {}}
                whileTap={isActive ? { scale: 0.9 } : {}}
                onClick={() => isActive && handlePitToggle()}
                disabled={!isActive}
                title={tool.name}
                className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-all border-2 ${
                  isActive && pitActive
                    ? "bg-yellow-400 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.9)] cursor-pointer"
                    : isActive
                      ? "bg-white/25 border-white/50 hover:bg-white/40 cursor-pointer"
                      : "bg-white/8 border-white/15 cursor-not-allowed"
                }`}
              >
                <img src={tool.icon} alt={tool.name} className="w-4 h-4 md:w-5 md:h-5 object-contain"
                  style={isActive ? { filter: "brightness(0) invert(1)" } : { filter: "brightness(0) invert(1) opacity(0.35)" }} />
              </motion.button>
            );
          })}
          {/* Score controls */}
          <button onClick={() => setTeam1Score((s) => s - 200)} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shrink-0 shadow-sm">
            <Minus size={14} color="#5a1f8e" strokeWidth={3} />
          </button>
          <button onClick={() => setTeam1Score((s) => s + 200)} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shrink-0 shadow-sm">
            <Plus size={14} color="#5a1f8e" strokeWidth={3} />
          </button>
        </div>

        {/* Center — glowing vertical divider */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex items-center justify-center pointer-events-none h-full">
          <div className="bottombar-divider" />
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
          <button onClick={() => setTeam2Score((s) => s - 200)} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shrink-0 shadow-sm">
            <Minus size={14} color="#5a1f8e" strokeWidth={3} />
          </button>
          <button onClick={() => setTeam2Score((s) => s + 200)} className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors shrink-0 shadow-sm">
            <Plus size={14} color="#5a1f8e" strokeWidth={3} />
          </button>
          {/* Tool icons */}
          {((gameData.team2Tools?.length > 0) ? gameData.team2Tools : ["double", "pit", "rest"]).map((toolId) => {
            const tool = HELP_TOOLS_MAP[toolId];
            if (!tool) return null;
            const used = usedTools.team2.includes(toolId);
            const isActive = toolId === "pit" && currentTeam === 2 && !used;
            return (
              <motion.button
                key={toolId}
                whileHover={isActive ? { scale: 1.1 } : {}}
                whileTap={isActive ? { scale: 0.9 } : {}}
                onClick={() => isActive && handlePitToggle()}
                disabled={!isActive}
                title={tool.name}
                className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 transition-all border-2 ${
                  isActive && pitActive
                    ? "bg-yellow-400 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.9)] cursor-pointer"
                    : isActive
                      ? "bg-white/25 border-white/50 hover:bg-white/40 cursor-pointer"
                      : "bg-white/8 border-white/15 cursor-not-allowed"
                }`}
              >
                <img src={tool.icon} alt={tool.name} className="w-4 h-4 md:w-5 md:h-5 object-contain"
                  style={isActive ? { filter: "brightness(0) invert(1)" } : { filter: "brightness(0) invert(1) opacity(0.35)" }} />
              </motion.button>
            );
          })}
          <div className="h-8 md:h-10 flex items-center justify-center bg-white/90 text-[#7B2FBE] font-black text-sm md:text-lg rounded-full shadow-inner px-2 md:px-4 border-2 min-w-[40px] md:min-w-[60px] shrink-0">
            {team2Score}
          </div>
          <div className="hidden md:flex h-10 items-center bg-white/20 text-white px-4 rounded-full font-black border border-white/20 text-[14px] shrink-0 whitespace-nowrap">
            {gameData.team2Name}
          </div>
        </div>
      </div>

      {/* Pit active indicator */}
      <AnimatePresence>
        {pitActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-black font-black px-6 py-3 rounded-full shadow-xl text-sm border-2 border-yellow-300"
          >
            ⚡ الحفرة نشطة — اضغط على سؤال لتفعيلها
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Game Modal */}
      <AnimatePresence>
        {(showEndModal || allPlayed) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEndModal(false)}
          >
            <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-l from-[#7B2FBE] to-[#5a1f8e] p-8 text-center">
                <Trophy size={64} className="text-yellow-300 mx-auto mb-4" />
                <h2 className="text-3xl font-black text-white mb-2">
                  {team1Score > team2Score ? `فاز ${gameData.team1Name}!` : team2Score > team1Score ? `فاز ${gameData.team2Name}!` : "تعادل!"}
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-around mb-6">
                  <div className="text-center"><p className="text-sm text-foreground/60 mb-1">{gameData.team1Name}</p><p className="text-4xl font-black text-[#7B2FBE]">{team1Score}</p></div>
                  <div className="text-foreground/30 font-black text-2xl">VS</div>
                  <div className="text-center"><p className="text-sm text-foreground/60 mb-1">{gameData.team2Name}</p><p className="text-4xl font-black text-[#9333ea]">{team2Score}</p></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleResetBoard} className="flex-1 bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-bold py-3 rounded-xl transition-colors">لعبة جديدة</button>
                  <button onClick={handleExit} className="flex-1 bg-gray-200 hover:bg-gray-300 text-foreground font-bold py-3 rounded-xl transition-colors">الخروج</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryCard({
  category, catIdx, playedCells, onCellClick, teamColor, loadingCell, catStatus, isAdmin,
}: {
  category: CategoryData; catIdx: number; playedCells: Set<string>;
  onCellClick: (catIdx: number, points: number, side: "l" | "r") => void;
  teamColor: string; loadingCell?: string | null;
  catStatus: { status: string; lockMessage: string | null };
  isAdmin: boolean;
}) {
  const isLocked = catStatus.status !== "open";
  const playerBlocked = isLocked && !isAdmin;

  const btnClass = (played: boolean, isLoading: boolean) => `
    score-btn w-full rounded-xl font-black text-xl transition-all relative
    ${played ? "bg-gray-300/40 text-gray-400 cursor-not-allowed"
      : isLoading ? "bg-[#7B2FBE] text-white cursor-wait"
      : playerBlocked ? "bg-gray-200/40 text-gray-400 cursor-not-allowed"
      : "bg-white/60 hover:bg-[#7B2FBE] text-gray-700 hover:text-white cursor-pointer shadow-sm hover:shadow-lg border border-white/50 hover:border-[#7B2FBE]"}
  `;

  const statusLabel = catStatus.status === "in_progress" ? "جار العمل عليها" : "مغلق";
  const lockMsg = catStatus.lockMessage || statusLabel;

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/50 min-h-0 relative">
      {/* Admin badge for locked categories */}
      {isAdmin && isLocked && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(220,38,38,0.85)", color: "#fff", border: "1px solid rgba(220,38,38,0.5)" }}>
          <Lock size={9} />
          {catStatus.status === "in_progress" ? "جار العمل" : "مغلق"}
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        {/* Player locked overlay */}
        {playerBlocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: "rgba(30,10,60,0.72)", backdropFilter: "blur(4px)" }}>
            <Lock size={28} color="#c084fc" className="mb-2" />
            <span className="text-white font-black text-sm text-center px-3">{lockMsg}</span>
          </div>
        )}

        <div className="score-btn-col flex flex-col justify-center gap-2 shrink-0" style={{width: "110px", padding: "0 4px"}}>
          {POINTS.map((points) => {
            const played = playedCells.has(`${catIdx}-${points}-l`);
            const isLoading = loadingCell === `${catIdx}-${points}-l`;
            return (
              <motion.button key={`l-${points}`} whileHover={!played && !isLoading && !playerBlocked ? { scale: 1.05 } : {}} whileTap={!played && !isLoading && !playerBlocked ? { scale: 0.95 } : {}}
                onClick={() => onCellClick(catIdx, points, "l")} disabled={played || !!loadingCell || playerBlocked} className={btnClass(played, isLoading)}>
                {isLoading ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" /> : points}
              </motion.button>
            );
          })}
        </div>
        <div className="score-img-wrap w-[40%] min-w-[50px] md:min-w-[120px] relative self-stretch flex items-center justify-center">
          <div style={{
            padding: "6px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #6A00F4 0%, #9333EA 50%, #C084FC 100%)",
            boxShadow: "0 4px 12px rgba(123,47,190,0.3)",
            width: "210px",
            height: "210px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img src={category.img} alt={category.name} className="score-cat-img" style={{width: "100%", height: "100%", objectFit: "contain", borderRadius: "14px", background: "white", display: "block"}} />
          </div>
        </div>
        <div className="score-btn-col flex flex-col justify-center gap-2 shrink-0" style={{width: "110px", padding: "0 4px"}}>
          {POINTS.map((points) => {
            const played = playedCells.has(`${catIdx}-${points}-r`);
            const isLoading = loadingCell === `${catIdx}-${points}-r`;
            return (
              <motion.button key={`r-${points}`} whileHover={!played && !isLoading && !playerBlocked ? { scale: 1.05 } : {}} whileTap={!played && !isLoading && !playerBlocked ? { scale: 0.95 } : {}}
                onClick={() => onCellClick(catIdx, points, "r")} disabled={played || !!loadingCell || playerBlocked} className={btnClass(played, isLoading)}>
                {isLoading ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto" /> : points}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 px-3 py-2 text-center font-black text-sm truncate" style={{ color: teamColor }}>
        {category.name}
      </div>
    </div>
  );
}
