import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { LogOut, Eye, Pause, Play, RotateCw, ArrowRight } from "lucide-react";
import { IconBtn } from "@/components/IconBtn";
import LogoQR from "@/components/LogoQR";

const CDN = "https://d442zbpa1tgal.cloudfront.net";
const TOOLS_CDN = "https://d2du33uhi1xfjy.cloudfront.net/static-data/new-home-page";
const X2_ICON = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'64'%20height%3D'64'%20viewBox%3D'0%200%2064%2064'%3E%3Ccircle%20cx%3D'32'%20cy%3D'32'%20r%3D'29'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'5'%2F%3E%3Ctext%20x%3D'32'%20y%3D'41'%20text-anchor%3D'middle'%20font-family%3D'Arial%20Black%2CArial'%20font-weight%3D'900'%20font-size%3D'25'%20fill%3D'black'%3EX2%3C%2Ftext%3E%3C%2Fsvg%3E";

type CategoryData = { id: string; name: string; img: string };
type GameData = {
  team1Name: string; team2Name: string; gameName: string;
  team1Categories: CategoryData[]; team2Categories: CategoryData[];
  team1Tools?: string[]; team2Tools?: string[];
};
type QuestionData = {
  categoryId: string; categoryName: string; points: number;
  catIdx: number; side: "l" | "r"; currentTeam: 1 | 2;
  question: string; answer: string; image?: string; answerImage?: string; pitActive?: boolean;
  externalPageSlug?: string | null; externalPageId?: number | null; qrTemplateId?: number | null;
};

const HELP_TOOLS_MAP: Record<string, { name: string; icon: string }> = {
  double:      { name: "جاوب جوابين",  icon: "https://seenjeemkw.com/assets/handIconBlue-Cf6L4RSE.svg" },
  double_pts:  { name: "دبل نقاطك x2", icon: X2_ICON },
  pit:         { name: "الحفرة",       icon: `${TOOLS_CDN}/circle-replace.png` },
  rest:        { name: "استريح",      icon: `${TOOLS_CDN}/circle-hand.png` },
};

const CIRCULAR_TIMER_CONFIG: Record<number, { color: string; bg: string; duration: number }> = {
  200: { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  duration: 90 },
  400: { color: "#eab308", bg: "rgba(234,179,8,0.12)",  duration: 60 },
  600: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  duration: 40 },
};

function CircularTimerSVG({ timeLeft, totalTime, color, size = 160 }: { timeLeft: number; totalTime: number; color: string; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = size * 0.07;
  const r = cx - strokeW - 2;
  const circ = 2 * Math.PI * r;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const offset = circ * (1 - progress);
  const display = timeLeft.toString().padStart(2, "0");
  const fontSize = Math.round(size * 0.28);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeW} strokeOpacity={0.15} />
      {/* Progress circle */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={strokeW}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.9s linear" }}
      />
      {/* Number */}
      <text
        x={cx} y={cy}
        textAnchor="middle" dominantBaseline="middle"
        transform={`rotate(90, ${cx}, ${cy})`}
        style={{ fontFamily: "'Orbitron', sans-serif", fontSize, fontWeight: 900, fill: color }}
      >
        {display}
      </text>
    </svg>
  );
}

export default function QuestionPage() {
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
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [showCircularTimer, setShowCircularTimer] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [circularTimeLeft, setCircularTimeLeft] = useState(0);
  const [circularRunning, setCircularRunning] = useState(false);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [usedTools, setUsedTools] = useState<{ team1: string[]; team2: string[] }>({ team1: [], team2: [] });
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [flashTool, setFlashTool] = useState<{ name: string; key: number; color: "blue" | "white" | "gold" } | null>(null);
  const [doubleActive, setDoubleActive] = useState(false);
  const [activeTurnTeam, setActiveTurnTeam] = useState<1 | 2 | null>(null);
  const [turnFlash, setTurnFlash] = useState<{ teamName: string; key: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [qrTemplate, setQrTemplate] = useState<{
    templateImageUrl: string | null;
    qrPositionX: number; qrPositionY: number; qrSize: number;
  } | null>(null);

  const DEFAULT_DESIGN = {
    bgColor: "#ffffff", accentColor: "#7B2FBE", textColor: "#111827", cardBgColor: "#ffffff",
    showQr: true, showImage: true, showCategoryBadge: true, showTimer: true,
    questionTextSize: 38, answerTextSize: 52, bgImageUrl: null as string | null,
    questionFontWeight: "extrabold" as string,
    cardBorderRadius: 24, cardBorderWidth: 4,
    positions: {} as Record<string, { x: number; y: number }>,
  };
  const [design, setDesign] = useState({ ...DEFAULT_DESIGN });
  const [answerDesign, setAnswerDesign] = useState({ ...DEFAULT_DESIGN });

  // ── Visual Edit Mode (URL: /question?editMode=1&categoryId=X  OR toggled by admin button) ──
  const _sp = new URLSearchParams(window.location.search);
  const [editMode, setEditMode] = useState(() => _sp.get("editMode") === "1");
  const [editCatId, setEditCatId] = useState<number | null>(() =>
    _sp.get("categoryId") ? Number(_sp.get("categoryId")) : null
  );
  const [editSettings, setEditSettings] = useState({ ...DEFAULT_DESIGN });
  const [editHovered, setEditHovered] = useState<string | null>(null);
  const [editSelected, setEditSelected] = useState<string | null>(null);
  const [editToolbarPos, setEditToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (editMode && !questionData) {
      // Edit mode via URL (no live game): load dummy game data
      setGameData({ team1Name: "الفريق الأول", team2Name: "الفريق الثاني", gameName: "ركز", team1Categories: [], team2Categories: [], team1Tools: ["double", "pit", "rest"], team2Tools: ["double", "pit", "rest"] });
      setQuestionData({ categoryId: editCatId || "sample", categoryName: "معلومات عامة", points: 400, catIdx: 0, currentTeam: 1, side: "l", question: "ما هو أطول نهر في العالم؟", answer: "نهر النيل", image: "", externalPageSlug: null, pitActive: false, answerImage: "" });
      setActiveTurnTeam(1);
      setTeam1Score(800); setTeam2Score(400);
      return;
    }
    if (editMode) return; // Already in live game — keep real data

    const stored = localStorage.getItem("rakez-game-data");
    if (stored) setGameData(JSON.parse(stored));
    else setGameData({
      team1Name: "الفريق الأول", team2Name: "الفريق الثاني", gameName: "ركز",
      team1Categories: [], team2Categories: [],
      team1Tools: ["double", "pit", "rest"], team2Tools: ["double", "pit", "rest"],
    });

    const qStored = localStorage.getItem("rakez-current-question");
    if (qStored) {
      const q = JSON.parse(qStored);
      setQuestionData(q);
      setActiveTurnTeam(q.currentTeam as 1 | 2);
    } else {
      setQuestionData({ categoryId: "sample", categoryName: "معلومات عامة", points: 200, catIdx: 0, currentTeam: 1, side: "l", question: "ما هو أكبر كوكب في المجموعة الشمسية؟", answer: "المشتري", image: "" });
      setActiveTurnTeam(1);
    }

    const scores = localStorage.getItem("rakez-scores");
    if (scores) { const p = JSON.parse(scores); setTeam1Score(p.team1Score || 0); setTeam2Score(p.team2Score || 0); }

    const tools = localStorage.getItem("rakez-used-tools");
    if (tools) setUsedTools(JSON.parse(tools));
  }, []);

  // Regular upward timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isTimerRunning) timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  // Circular countdown timer
  useEffect(() => {
    if (circTimerRef.current) clearInterval(circTimerRef.current);
    if (circularRunning) {
      circTimerRef.current = setInterval(() => {
        setCircularTimeLeft((t) => {
          if (t <= 1) { clearInterval(circTimerRef.current!); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (circTimerRef.current) clearInterval(circTimerRef.current); };
  }, [circularRunning]);

  useEffect(() => {
    fetch("/api/qr-templates/active")
      .then((r) => r.ok ? r.json() : null)
      .then((t) => { if (t) setQrTemplate(t); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const catId = editMode ? (editCatId || questionData?.categoryId) : questionData?.categoryId;
    if (!catId) return;
    fetch(`/api/category-layouts/for-category/${catId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (editMode) {
          const merged = { ...DEFAULT_DESIGN, ...(data?.question || {}) };
          setEditSettings(merged);
          setDesign(merged);
          setAnswerDesign({ ...DEFAULT_DESIGN, ...(data?.answer || {}) });
        } else {
          if (data?.question) setDesign((d) => ({ ...d, ...data.question }));
          if (data?.answer)   setAnswerDesign((d) => ({ ...d, ...data.answer }));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionData?.categoryId, editMode, editCatId]);

  // تبديل الدور بعد 90 ثانية (للأسئلة العادية فقط — لا ينطبق على "ولا كلمة")
  useEffect(() => {
    if (timer === 90 && questionData && gameData) {
      const isBk = questionData.categoryName.includes("كلام") || questionData.categoryName.includes("ولا كلمة");
      if (isBk) return;
      const other = questionData.currentTeam === 1 ? 2 : 1;
      const otherName = questionData.currentTeam === 1 ? gameData.team2Name : gameData.team1Name;
      setActiveTurnTeam(other);
      setTurnFlash({ teamName: otherName, key: Date.now() });
    }
  }, [timer]);

  // Sync editSettings → design in real time (WYSIWYG)
  useEffect(() => {
    if (!editMode) return;
    setDesign({ ...editSettings });
    setAnswerDesign({ ...editSettings });
  }, [editSettings]);

  // ── Auto-Save ──────────────────────────────────────────────────────────────
  const doAutoSave = useCallback(async (settings: typeof DEFAULT_DESIGN) => {
    if (!editMode) return;
    setAutoSaveStatus('saving');
    const token = localStorage.getItem("rakez-token");
    try {
      for (const pageKey of ["question", "answer"]) {
        await fetch("/api/admin/category-layouts", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ categoryId: editCatId, pageKey, settings }),
        });
      }
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2500);
    } catch {
      setAutoSaveStatus('unsaved');
    }
  }, [editMode, editCatId]);

  const scheduleAutoSave = useCallback((settings: typeof DEFAULT_DESIGN) => {
    if (!editMode) return;
    setAutoSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => doAutoSave(settings), 1500);
  }, [editMode, doAutoSave]);

  useEffect(() => {
    if (!editMode) return;
    scheduleAutoSave(editSettings);
  }, [editSettings]);

  // ── Enter / Exit Edit Mode ───────────────────────────────────────────────────
  const handleEnterEditMode = useCallback(() => {
    const catId = questionData?.categoryId ? Number(questionData.categoryId) : null;
    setEditCatId(catId);
    setEditMode(true);
    setAutoSaveStatus('idle');
    setEditSelected(null);
    setEditHovered(null);
    setEditToolbarPos(null);
  }, [questionData]);

  const handleExitEditMode = useCallback(() => {
    setEditMode(false);
    setEditSelected(null);
    setEditHovered(null);
    setEditToolbarPos(null);
    setAutoSaveStatus('idle');
  }, []);

  // ── Drag Support ────────────────────────────────────────────────────────────
  const startDrag = useCallback((id: string, e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    const cur = editSettings.positions?.[id] || { x: 0, y: 0 };
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y };
    setIsDragging(true);
  }, [editMode, editSettings.positions]);

  useEffect(() => {
    if (!editMode) return;
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const nx = d.ox + (e.clientX - d.sx);
      const ny = d.oy + (e.clientY - d.sy);
      setEditSettings(s => ({
        ...s,
        positions: { ...(s.positions || {}), [d.id]: { x: nx, y: ny } },
      }));
    };
    const onUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [editMode]);

  const getPos = (id: string) => editSettings.positions?.[id] || { x: 0, y: 0 };

  // ── Edit Mode helpers ──────────────────────────────────────────────────────
  const handleEditElementClick = (elementId: string, e: React.MouseEvent) => {
    if (!editMode || isDragging) return;
    e.stopPropagation();
    e.preventDefault();
    setEditSelected(elementId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(Math.max(8, rect.left), window.innerWidth - 310);
    const y = Math.min(rect.bottom + 10, window.innerHeight - 320);
    setEditToolbarPos({ x, y });
  };

  const updateEdit = (key: string, value: unknown) =>
    setEditSettings((s) => ({ ...s, [key]: value }));

  const editProps = (elementId: string, draggable = false) =>
    editMode ? {
      onMouseEnter: () => setEditHovered(elementId),
      onMouseLeave: () => setEditHovered(null),
      onClick: (e: React.MouseEvent) => handleEditElementClick(elementId, e),
      ...(draggable && { onMouseDown: (e: React.MouseEvent) => startDrag(elementId, e) }),
      "data-edit-id": elementId,
    } : {};

  const editOutline = (elementId: string, extra?: React.CSSProperties): React.CSSProperties => {
    if (!editMode) return extra || {};
    const isSelected = editSelected === elementId;
    const isHovered = editHovered === elementId;
    const isDrag = isDragging && dragRef.current?.id === elementId;
    return {
      ...extra,
      outline: isSelected ? "2px solid #3b82f6" : isHovered ? "2px dashed #3b82f6" : "2px dashed transparent",
      outlineOffset: "3px",
      cursor: isDrag ? "grabbing" : "grab",
      transition: isDragging ? "none" : "outline 0.12s",
      userSelect: "none",
      boxShadow: isSelected ? "0 0 0 4px rgba(59,130,246,0.15)" : undefined,
    };
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setTimer(0); setIsTimerRunning(true); };
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleOpenCircularTimer = () => {
    if (!questionData) return;
    const pts = questionData.points as 200 | 400 | 600;
    const cfg = CIRCULAR_TIMER_CONFIG[pts] || CIRCULAR_TIMER_CONFIG[200];
    setCircularTimeLeft(cfg.duration);
    setCircularRunning(true);
    setIsTimerRunning(false);
    setShowCircularTimer(true);
  };

  const handleRevealAnswer = () => {
    setCircularRunning(false);
    setShowCircularTimer(false);
    setShowAnswer(true);
  };

  const handleCorrect = () => {
    if (!questionData) return;
    const { points, currentTeam, catIdx, side, pitActive } = questionData;
    localStorage.setItem("rakez-answered-cell", JSON.stringify({ catIdx, points, side, correct: true, team: currentTeam, pitActive: !!pitActive, double: doubleActive }));
    navigate("/score-page");
  };

  const handleWrong = () => {
    if (!questionData) return;
    localStorage.setItem("rakez-answered-cell", JSON.stringify({ catIdx: questionData.catIdx, points: questionData.points, side: questionData.side, correct: false, team: questionData.currentTeam, pitActive: !!questionData.pitActive }));
    navigate("/score-page");
  };

  const handleBackToBoard = () => navigate("/score-page");

  const handleUseTool = (team: 1 | 2, toolId: string) => {
    const key = team === 1 ? "team1" : "team2";
    if (usedTools[key].includes(toolId)) return;
    const updated = { ...usedTools, [key]: [...usedTools[key], toolId] };
    setUsedTools(updated);
    localStorage.setItem("rakez-used-tools", JSON.stringify(updated));
    if (toolId === "double_pts") setDoubleActive(true);
    const tool = HELP_TOOLS_MAP[toolId];
    const color: "blue" | "white" | "gold" = toolId === "double_pts" ? "gold" : toolId === "double" ? "blue" : "white";
    if (tool) setFlashTool({ name: tool.name, key: Date.now(), color });
  };

  if (!gameData || !questionData) return null;

  const team1Tools = (gameData.team1Tools && gameData.team1Tools.length > 0) ? gameData.team1Tools : ["double", "pit", "rest"];
  const team2Tools = (gameData.team2Tools && gameData.team2Tools.length > 0) ? gameData.team2Tools : ["double", "pit", "rest"];
  const ct = questionData.currentTeam;

  // فئة بدون كلام
  const isBadounKalam = questionData.categoryName.includes("كلام") || questionData.categoryName.includes("ولا كلمة");

  const pts = questionData.points as 200 | 400 | 600;
  const circCfg = CIRCULAR_TIMER_CONFIG[pts] || CIRCULAR_TIMER_CONFIG[200];
  const circTotal = circCfg.duration;

  // ── Template display helper ──────────────────────────────────────────────
  const renderTemplate = () => {
    const questionImage = design.showImage && questionData.image && !questionData.image.startsWith(CDN)
      ? questionData.image
      : null;

    // بدون كلام — الباركود يظهر دائماً بغض النظر عن وجود slug أو قالب
    if (isBadounKalam) {
      const qrValue = questionData.externalPageSlug
        ? `${window.location.origin}/p/${questionData.externalPageSlug}`
        : window.location.origin;

      if (qrTemplate) {
        return (
          <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-4">
            <div
              className="relative rounded-2xl overflow-hidden w-full h-full"
              style={{ aspectRatio: "16/9", maxHeight: "100%" }}
            >
              {qrTemplate.templateImageUrl && (
                <img
                  src={qrTemplate.templateImageUrl}
                  alt="قالب"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  left: `${qrTemplate.qrPositionX}%`,
                  top: `${qrTemplate.qrPositionY}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${Math.round((qrTemplate.qrSize / 320) * 100)}%`,
                  zIndex: 2,
                  background: "white",
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <LogoQR value={qrValue} size={200} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="p-4 bg-white dark:bg-[#1e1830] rounded-2xl" style={{ border: `4px solid ${design.accentColor}`, boxShadow: `0 0 32px ${design.accentColor}88` }}>
            <LogoQR value={qrValue} size={280} />
          </div>
        </div>
      );
    }

    if (design.showQr && questionData.externalPageSlug && qrTemplate) {
      return (
        <div className="flex flex-col items-center pb-6 px-4">
          <div
            className="relative rounded-2xl overflow-hidden w-full"
            style={{ maxWidth: 680, aspectRatio: "16/9" }}
          >
            {qrTemplate.templateImageUrl && (
              <img
                src={qrTemplate.templateImageUrl}
                alt="قالب"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: `${qrTemplate.qrPositionX}%`,
                top: `${qrTemplate.qrPositionY}%`,
                transform: "translate(-50%, -50%)",
                width: `${Math.round((qrTemplate.qrSize / 320) * 100)}%`,
                zIndex: 2,
                background: "white",
                padding: 4,
                borderRadius: 4,
              }}
            >
              <LogoQR
                value={`${window.location.origin}/p/${questionData.externalPageSlug}`}
                size={200}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      );
    }
    if (design.showQr && questionData.externalPageSlug && !qrTemplate) {
      return (
        <div className="flex flex-col items-center gap-3 pb-4">
          <div className="p-3 bg-white dark:bg-[#1e1830] rounded-2xl" style={{ border: `4px solid ${design.accentColor}`, boxShadow: `0 0 24px ${design.accentColor}66` }}>
            <LogoQR value={`${window.location.origin}/p/${questionData.externalPageSlug}`} size={180} />
          </div>
          <p className="text-xs font-mono text-gray-400">/p/{questionData.externalPageSlug}</p>
        </div>
      );
    }
    if (questionImage && qrTemplate) {
      return (
        <div className="flex justify-center pb-6 px-4">
          <div
            className="relative rounded-2xl overflow-hidden w-full cursor-zoom-in hover:opacity-95 transition-opacity"
            style={{ maxWidth: 680, aspectRatio: "16/9" }}
            onClick={() => setLightboxImage(questionImage)}
          >
            {qrTemplate.templateImageUrl && (
              <img
                src={qrTemplate.templateImageUrl}
                alt="قالب"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
              />
            )}
            <img
              src={questionImage}
              alt="QR"
              style={{
                position: "absolute",
                left: `${qrTemplate.qrPositionX}%`,
                top: `${qrTemplate.qrPositionY}%`,
                transform: "translate(-50%, -50%)",
                width: `${Math.round((qrTemplate.qrSize / 320) * 100)}%`,
                maxWidth: "90%",
                zIndex: 2,
              }}
            />
          </div>
        </div>
      );
    }
    if (questionImage) {
      return (
        <div className="flex justify-center px-8 pt-36 pb-4">
          <img
            src={questionImage}
            alt="صورة السؤال"
            onClick={() => setLightboxImage(questionImage)}
            className="max-h-[520px] max-w-4xl object-contain rounded-2xl cursor-zoom-in hover:opacity-90 transition-opacity"
          />
        </div>
      );
    }
    return null;
  };

  // ── Shared layout parts ──────────────────────────────────────────────────
  const renderHeader = () => (
    <div className="px-3 py-2 md:px-4 md:py-3 flex items-center justify-between shadow-lg relative" style={{ background: "linear-gradient(135deg, #6A00F4, #7B3FF2, #8E63E6, #A07CE0, #B89AE6)" }}>
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <img src={`${import.meta.env.BASE_URL}logo-white.png`} alt="ركز" className="h-7 md:h-10" />
        <div className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 md:px-4 md:py-2 rounded-full font-bold text-[11px] md:text-sm border border-white/20">
          دور: {ct === 1 ? gameData!.team1Name : gameData!.team2Name}
        </div>
        {questionData.pitActive && (
          <div className="bg-yellow-400 text-black px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-black flex items-center gap-1">
            <span>⚡</span><span className="hidden md:inline">الحفرة نشطة</span>
          </div>
        )}
        {doubleActive && (
          <motion.div
            animate={{ scale: [1, 1.07, 1], boxShadow: ["0 0 8px rgba(234,179,8,0.6)", "0 0 22px rgba(234,179,8,0.95)", "0 0 8px rgba(234,179,8,0.6)"] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="bg-yellow-400 text-black px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-black flex items-center gap-1"
          >
            <span>⚡</span><span>نقاطك x2</span>
          </motion.div>
        )}
      </div>
      <div className="absolute inset-x-0 flex justify-center pointer-events-none">
        <span className="text-white font-bold text-sm md:text-lg">{gameData!.gameName}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
        <IconBtn icon={<Eye size={14} />} label="انتهاء اللعبة" onClick={handleBackToBoard} tooltipPos="bottom"
          className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
        <IconBtn icon={<ArrowRight size={14} />} label="الرجوع" onClick={handleBackToBoard} tooltipPos="bottom"
          className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
        <IconBtn icon={<LogOut size={14} />} label="الخروج"
          onClick={() => { localStorage.removeItem("rakez-game-data"); navigate("/start-game"); }}
          tooltipPos="bottom"
          className="bg-white/15 hover:bg-white/30 border-2 border-white/25 hover:border-white/45 text-white" />
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="hidden md:flex w-[260px] bg-gray-50 dark:bg-[#12101f] border-l-2 border-gray-100 dark:border-purple-900/30 p-4 pt-16 flex-col gap-6">
      <TeamToolCard
        teamName={gameData!.team1Name} score={team1Score} tools={team1Tools}
        usedTools={usedTools.team1} onUseTool={(t) => handleUseTool(1, t)}
        isCurrentTeam={ct === 1} isActiveTurn={!isBadounKalam && activeTurnTeam === 1}
      />
      <div className="border-t-2 border-gray-200" />
      <TeamToolCard
        teamName={gameData!.team2Name} score={team2Score} tools={team2Tools}
        usedTools={usedTools.team2} onUseTool={(t) => handleUseTool(2, t)}
        isCurrentTeam={ct === 2} isActiveTurn={!isBadounKalam && activeTurnTeam === 2}
      />
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col" dir="rtl"
      style={{ background: design.bgColor }}
      onClick={() => { if (editMode) { setEditSelected(null); setEditToolbarPos(null); } }}
    >
      {renderHeader()}
      <div className="flex-1 flex">
        {renderSidebar()}

        {/* Question Area */}
        <div className="flex-1 flex flex-col p-6 pt-10">

          {/* Background click zone — in edit mode */}
          {editMode && (
            <div
              {...editProps("background")}
              style={editOutline("background", { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "auto" })}
            />
          )}

          <div
            className="flex-1 relative flex flex-col"
            style={{
              border: `${(design as typeof DEFAULT_DESIGN).cardBorderWidth ?? 4}px solid ${design.accentColor}`,
              background: design.cardBgColor,
              borderRadius: `${(design as typeof DEFAULT_DESIGN).cardBorderRadius ?? 24}px`,
              ...editOutline("card"),
            }}
            {...editProps("card")}
          >

            {/* Regular timer — مخفي في فئة بدون كلام أو لو أخفاه الأدمن */}
            {!isBadounKalam && design.showTimer && (
              <div
                className="absolute top-0 z-10"
                {...editProps("timer", true)}
                style={{
                  ...editOutline("timer"),
                  transform: `translate(calc(-50% + ${getPos("timer").x}px), calc(-50% + ${getPos("timer").y}px))`,
                  left: "50%",
                }}
              >
                <div className="rounded-2xl px-5 py-2 flex items-center gap-3" style={{ background: design.accentColor, boxShadow: `0 4px 18px ${design.accentColor}80` }}>
                  {editMode && <span className="text-white/60 text-xs select-none px-1">⠿</span>}
                  <button onClick={editMode ? undefined : resetTimer} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors">
                    <RotateCw size={18} color="#ffffff" strokeWidth={2.5} />
                  </button>
                  <span className="text-white text-2xl tracking-widest min-w-[80px] text-center select-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    {formatTime(timer)}
                  </span>
                  <button onClick={editMode ? undefined : toggleTimer} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 flex items-center justify-center transition-colors">
                    {isTimerRunning ? <Pause size={18} color="#ffffff" strokeWidth={2.5} /> : <Play size={18} color="#ffffff" strokeWidth={2.5} />}
                  </button>
                </div>
              </div>
            )}
            {/* Timer placeholder when hidden — allow clicking to show it in edit mode */}
            {editMode && !design.showTimer && (
              <div
                className="absolute top-0 z-10"
                {...editProps("timer", true)}
                style={editOutline("timer", {
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 160, height: 46, background: "#e5e7eb", borderRadius: 16,
                  left: "50%",
                  transform: `translate(calc(-50% + ${getPos("timer").x}px), calc(-50% + ${getPos("timer").y}px))`,
                })}
              >
                <span className="text-gray-400 text-sm font-bold">⏱ مخفي — اضغط</span>
              </div>
            )}

            {/* Question text — hidden in بدون كلام mode */}
            {!isBadounKalam && (
            <div
              className={`px-8 pt-20 pb-4`}
              {...editProps("question-text", true)}
              style={{
                ...editOutline("question-text"),
                transform: editMode ? `translate(${getPos("question-text").x}px, ${getPos("question-text").y}px)` : undefined,
              }}
            >
              {editMode && <div className="text-center text-blue-300 text-xs mb-1 select-none opacity-60">⠿ اسحب لتحريك</div>}
              <p
                className="text-center"
                style={{
                  color: design.textColor,
                  fontSize: design.questionTextSize,
                  fontWeight: (design as typeof DEFAULT_DESIGN).questionFontWeight || "extrabold",
                }}
              >{questionData.question}</p>
            </div>
            )}

            {renderTemplate()}

            {!isBadounKalam && <div className="flex-1" />}

            {/* Bottom row */}
            <div className="flex items-end justify-between px-8 pb-8 mt-auto">
              {design.showCategoryBadge ? (
                <div
                  className="rounded-2xl bg-white dark:bg-[#1a1428] px-4 py-2"
                  style={{
                    border: `2px solid ${design.accentColor}`,
                    ...editOutline("category-badge"),
                    transform: editMode ? `translate(${getPos("category-badge").x}px, ${getPos("category-badge").y}px)` : undefined,
                  }}
                  {...editProps("category-badge", true)}
                >
                  {editMode && <span className="text-blue-300 text-xs mr-1 select-none opacity-60">⠿</span>}
                  <span className="font-black tracking-wide text-[20px]" style={{ color: design.accentColor }}>{questionData.categoryName}</span>
                </div>
              ) : editMode ? (
                <div
                  {...editProps("category-badge", true)}
                  style={editOutline("category-badge", {
                    padding: "8px 16px", background: "#e5e7eb", borderRadius: 12,
                    transform: `translate(${getPos("category-badge").x}px, ${getPos("category-badge").y}px)`,
                  })}
                >
                  <span className="text-gray-400 text-sm font-bold">شارة الفئة (مخفية)</span>
                </div>
              ) : <div />}

              {isBadounKalam ? (
                <button
                  onClick={handleOpenCircularTimer}
                  className="text-white font-black py-3 px-8 rounded-full shadow-lg transition-all hover:-translate-y-0.5 text-[19px]"
                  style={{ background: design.accentColor }}
                >
                  جاهز
                </button>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="text-white font-black py-3 px-8 rounded-full shadow-lg transition-all hover:-translate-y-0.5 text-[19px]"
                  style={{ background: design.accentColor }}
                >
                  اختر الإجابة
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ── Circular Timer Overlay (بدون كلام) ────────────────────────────── */}
      <AnimatePresence>
        {showCircularTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={pageRef} className="fixed inset-0 bg-white dark:bg-[#0d0d1a] z-50 flex flex-col"
            dir="rtl"
          >
            {renderHeader()}

            <div className="flex-1 flex">
              {renderSidebar()}

              <div className="flex-1 flex flex-col p-6 pt-10">
                <div className="flex-1 relative border-4 border-[#7B2FBE] rounded-3xl bg-white dark:bg-[#1e1830] flex flex-col">

                  {/* Circular timer — centered in card */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-5">
                    <CircularTimerSVG
                      timeLeft={circularTimeLeft}
                      totalTime={circTotal}
                      color={circCfg.color}
                      size={280}
                    />
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => { setCircularTimeLeft(circTotal); setCircularRunning(true); }}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                        style={{ background: `${circCfg.color}20`, border: `2px solid ${circCfg.color}` }}
                      >
                        <RotateCw size={18} color={circCfg.color} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => setCircularRunning((r) => !r)}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
                        style={{ background: `${circCfg.color}20`, border: `2px solid ${circCfg.color}` }}
                      >
                        {circularRunning
                          ? <Pause size={18} color={circCfg.color} strokeWidth={2.5} />
                          : <Play  size={18} color={circCfg.color} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-end justify-between px-8 pb-8">
                    <div className="border-2 border-[#7B2FBE] rounded-2xl bg-white dark:bg-[#1a1428] px-4 py-2">
                      <span className="font-black text-[#7B2FBE] tracking-wide text-[20px]">{questionData.categoryName}</span>
                    </div>
                    <button
                      onClick={handleRevealAnswer}
                      className="bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-black py-3 px-8 rounded-full shadow-lg transition-all hover:-translate-y-0.5 text-[19px]"
                    >
                      كشف الإجابة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Answer overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAnswer && !showTeamSelection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col" dir="rtl" style={{ background: answerDesign.bgColor }}>
            <div className="px-6 py-5 flex items-center justify-between shadow-lg shrink-0"
              style={{ background: `linear-gradient(to left, ${answerDesign.accentColor}, ${answerDesign.accentColor}cc)` }}>
              <div className="flex items-center gap-3">
                <img src={`${import.meta.env.BASE_URL}logo-white.png`} alt="ركز" className="h-10" style={{ filter: "drop-shadow(0 0 8px rgba(180,100,255,0.7))" }} />
              </div>
              <div />
              <button onClick={() => setShowAnswer(false)} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                <ArrowRight size={14} /><span>العودة</span>
              </button>
            </div>
            <div className="flex-1 flex items-stretch justify-center p-3">
              <div className="w-full rounded-3xl flex flex-col overflow-hidden"
                style={{ border: `4px solid ${answerDesign.accentColor}`, background: answerDesign.cardBgColor, boxShadow: `0 8px 40px ${answerDesign.accentColor}26` }}>
                <div className="px-16 pt-16 pb-4">
                  <p className="text-center leading-tight w-full" style={{ color: answerDesign.textColor, fontSize: answerDesign.answerTextSize }}>{questionData.answer}</p>
                </div>
                {(questionData.answerImage || questionData.image) ? (
                  <div className="flex-1 flex items-center justify-center px-16 py-4">
                    <img
                      src={questionData.answerImage || questionData.image}
                      alt="صورة الإجابة"
                      onClick={() => setLightboxImage((questionData.answerImage || questionData.image)!)}
                      className="max-h-[700px] max-w-5xl object-contain rounded-2xl cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  </div>
                ) : <div className="flex-1" />}
                <div className="flex justify-center pb-10">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setShowTeamSelection(true)}
                    className="text-white py-3 px-14 rounded-full shadow-lg transition-colors text-[25px]"
                    style={{ background: answerDesign.accentColor }}>
                    التالي
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Team selection overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showTeamSelection && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-[#0d0d1a] z-50 flex flex-col p-6" dir="rtl">
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              <h1 className="text-4xl font-black text-[#7B2FBE] text-center">أي فريق جاوب صح ؟</h1>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      localStorage.setItem("rakez-answered-cell", JSON.stringify({ catIdx: questionData.catIdx, points: questionData.points, side: questionData.side, correct: true, team: 1, pitActive: !!questionData.pitActive, double: doubleActive }));
                      navigate("/score-page");
                    }}
                    className="flex-1 bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg transition-colors">
                    {gameData?.team1Name}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      localStorage.setItem("rakez-answered-cell", JSON.stringify({ catIdx: questionData.catIdx, points: questionData.points, side: questionData.side, correct: true, team: 2, pitActive: !!questionData.pitActive, double: doubleActive }));
                      navigate("/score-page");
                    }}
                    className="flex-1 bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg transition-colors">
                    {gameData?.team2Name}
                  </motion.button>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    localStorage.setItem("rakez-answered-cell", JSON.stringify({ catIdx: questionData.catIdx, points: questionData.points, side: questionData.side, correct: false, team: 0 }));
                    navigate("/score-page");
                  }}
                  className="w-full bg-gray-400 hover:bg-gray-500 text-white py-3 px-10 rounded-full shadow-lg transition-colors font-extrabold text-[25px]">
                  لا أحد
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/85 dark:bg-black/90 flex items-center justify-center cursor-zoom-out p-8">
            <motion.img initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
              src={lightboxImage} alt="صورة مكبّرة" className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Turn switch flash — لا تظهر في فئة "ولا كلمة" */}
      <AnimatePresence>
        {turnFlash && !isBadounKalam && (
          <motion.div
            key={turnFlash.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 1.8, times: [0, 0.1, 0.4, 0.7, 1] }}
            onAnimationComplete={() => setTurnFlash(null)}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              animate={{ backgroundColor: ["rgba(59,130,246,0.3)", "rgba(59,130,246,0.05)", "rgba(59,130,246,0.3)", "rgba(59,130,246,0)"] }}
              transition={{ duration: 1.8 }}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: [0.7, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              className="relative bg-blue-500 text-white px-10 py-6 rounded-3xl font-black text-3xl shadow-2xl border-4 border-blue-300 text-center"
            >
              <div className="text-lg font-bold opacity-80 mb-1">انتهى الوقت!</div>
              <div>دور {turnFlash.teamName} ✨</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Tool flash animation */}
      <AnimatePresence>
        {flashTool && (() => {
          const isBlue = flashTool.color === "blue";
          const isGold = flashTool.color === "gold";
          const overlayColor = isGold
            ? ["rgba(234,179,8,0.35)", "rgba(234,179,8,0.05)", "rgba(234,179,8,0.35)", "rgba(234,179,8,0)"]
            : isBlue
              ? ["rgba(59,130,246,0.35)", "rgba(59,130,246,0.05)", "rgba(59,130,246,0.35)", "rgba(59,130,246,0)"]
              : ["rgba(239,68,68,0.35)", "rgba(239,68,68,0.05)", "rgba(239,68,68,0.35)", "rgba(239,68,68,0)"];
          const cardClass = isGold
            ? "relative bg-yellow-500 text-white px-10 py-5 rounded-3xl font-black text-3xl shadow-2xl border-4 border-yellow-300"
            : isBlue
              ? "relative bg-blue-500 text-white px-10 py-5 rounded-3xl font-black text-3xl shadow-2xl border-4 border-blue-300"
              : "relative bg-red-500 text-white px-10 py-5 rounded-3xl font-black text-3xl shadow-2xl border-4 border-red-300";
          return (
            <motion.div
              key={flashTool.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.1, 0.4, 0.7, 1] }}
              onAnimationComplete={() => setFlashTool(null)}
              className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
            >
              <motion.div
                animate={{ backgroundColor: overlayColor }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0"
              />
              <motion.div
                initial={{ scale: 0.7 }}
                animate={{ scale: [0.7, 1.05, 1] }}
                transition={{ duration: 0.3 }}
                className={cardClass}
              >
                {flashTool.name}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
      {/* ── Visual Edit Mode: Rich Floating Toolbar ───────────────────────────── */}
      {editMode && editSelected && editToolbarPos && (
        <div
          className="fixed z-[9999] rounded-2xl shadow-2xl p-4 w-80"
          style={{
            left: editToolbarPos.x,
            top: editToolbarPos.y,
            background: "rgba(15,15,30,0.97)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(123,47,190,0.4)",
          }}
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Toolbar header */}
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid rgba(123,47,190,0.2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-black text-sm text-white">
                {editSelected === "background" && "خلفية الصفحة"}
                {editSelected === "card" && "البطاقة الرئيسية"}
                {editSelected === "question-text" && "نص السؤال"}
                {editSelected === "timer" && "المؤقت"}
                {editSelected === "category-badge" && "شارة الفئة"}
              </span>
            </div>
            <button
              onClick={() => { setEditSelected(null); setEditToolbarPos(null); }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs"
            >✕</button>
          </div>

          {/* ── Background controls ── */}
          {editSelected === "background" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>لون الخلفية</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={editSettings.bgColor}
                    onChange={(e) => updateEdit("bgColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0" style={{ background: "none" }} />
                  <div>
                    <p className="text-xs text-gray-400 font-mono">{editSettings.bgColor}</p>
                    <div className="flex gap-1 mt-1">
                      {["#ffffff","#0f0f1e","#1a1a2e","#f8f4ff","#e8f4fd"].map(c => (
                        <button key={c} onClick={() => updateEdit("bgColor", c)}
                          className="w-5 h-5 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                          style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Card controls ── */}
          {editSelected === "card" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>خلفية البطاقة</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={editSettings.cardBgColor}
                    onChange={(e) => updateEdit("cardBgColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0" style={{ background: "none" }} />
                  <div className="flex gap-1 flex-wrap">
                    {["#ffffff","#0f0f1e","#1a1a2e","#f8f4ff","#fdf2f8","#f0fdf4"].map(c => (
                      <button key={c} onClick={() => updateEdit("cardBgColor", c)}
                        className="w-5 h-5 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>اللون الرئيسي (إطار + مؤقت + شارة)</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={editSettings.accentColor}
                    onChange={(e) => updateEdit("accentColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0" style={{ background: "none" }} />
                  <div className="flex gap-1 flex-wrap">
                    {["#7B2FBE","#2563eb","#dc2626","#16a34a","#d97706","#0891b2"].map(c => (
                      <button key={c} onClick={() => updateEdit("accentColor", c)}
                        className="w-5 h-5 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>استدارة الزوايا: {(editSettings as typeof DEFAULT_DESIGN).cardBorderRadius}px</p>
                <input type="range" min={0} max={40} value={(editSettings as typeof DEFAULT_DESIGN).cardBorderRadius || 24}
                  onChange={(e) => updateEdit("cardBorderRadius", Number(e.target.value))}
                  className="w-full accent-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>سُمك الإطار: {(editSettings as typeof DEFAULT_DESIGN).cardBorderWidth}px</p>
                <input type="range" min={0} max={10} value={(editSettings as typeof DEFAULT_DESIGN).cardBorderWidth || 4}
                  onChange={(e) => updateEdit("cardBorderWidth", Number(e.target.value))}
                  className="w-full accent-purple-600" />
              </div>
            </div>
          )}

          {/* ── Question text controls ── */}
          {editSelected === "question-text" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>لون النص</p>
                <div className="flex items-center gap-3">
                  <input type="color" value={editSettings.textColor}
                    onChange={(e) => updateEdit("textColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0" style={{ background: "none" }} />
                  <div className="flex gap-1 flex-wrap">
                    {["#111827","#ffffff","#7B2FBE","#2563eb","#dc2626","#fbbf24"].map(c => (
                      <button key={c} onClick={() => updateEdit("textColor", c)}
                        className="w-5 h-5 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>حجم النص: {editSettings.questionTextSize}px</p>
                <input type="range" min={16} max={64} value={editSettings.questionTextSize}
                  onChange={(e) => updateEdit("questionTextSize", Number(e.target.value))}
                  className="w-full accent-purple-600" />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>16</span><span>40</span><span>64</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#7B2FBE" }}>وزن الخط</p>
                <div className="flex gap-2">
                  {[["عادي","normal"],["متوسط","600"],["عريض","700"],["أعرض","900"]].map(([label, val]) => (
                    <button key={val} onClick={() => updateEdit("questionFontWeight", val)}
                      className="flex-1 py-1.5 rounded-lg text-xs transition-all"
                      style={{
                        background: (editSettings as typeof DEFAULT_DESIGN).questionFontWeight === val || (val === "900" && (editSettings as typeof DEFAULT_DESIGN).questionFontWeight === "extrabold") ? "rgba(123,47,190,0.4)" : "rgba(255,255,255,0.05)",
                        color: "white",
                        border: "1px solid rgba(123,47,190,0.2)",
                        fontWeight: val,
                      }}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#7B2FBE" }}>الموضع: ({Math.round(getPos("question-text").x)}, {Math.round(getPos("question-text").y)})</p>
                <button onClick={() => updateEdit("positions", { ...(editSettings.positions || {}), "question-text": { x: 0, y: 0 } })}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc" }}>
                  إعادة للمركز
                </button>
              </div>
            </div>
          )}

          {/* ── Timer controls ── */}
          {editSelected === "timer" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-bold">إظهار المؤقت</span>
                <button
                  onClick={() => updateEdit("showTimer", !editSettings.showTimer)}
                  className={`w-14 h-7 rounded-full transition-colors relative ${editSettings.showTimer ? "bg-purple-600" : "bg-gray-600"}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${editSettings.showTimer ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#7B2FBE" }}>الموضع: ({Math.round(getPos("timer").x)}, {Math.round(getPos("timer").y)})</p>
                <button onClick={() => updateEdit("positions", { ...(editSettings.positions || {}), "timer": { x: 0, y: 0 } })}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc" }}>
                  إعادة للوسط
                </button>
              </div>
            </div>
          )}

          {/* ── Category badge controls ── */}
          {editSelected === "category-badge" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-bold">إظهار شارة الفئة</span>
                <button
                  onClick={() => updateEdit("showCategoryBadge", !editSettings.showCategoryBadge)}
                  className={`w-14 h-7 rounded-full transition-colors relative ${editSettings.showCategoryBadge ? "bg-purple-600" : "bg-gray-600"}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${editSettings.showCategoryBadge ? "right-1" : "left-1"}`} />
                </button>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "#7B2FBE" }}>الموضع: ({Math.round(getPos("category-badge").x)}, {Math.round(getPos("category-badge").y)})</p>
                <button onClick={() => updateEdit("positions", { ...(editSettings.positions || {}), "category-badge": { x: 0, y: 0 } })}
                  className="text-xs px-3 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{ background: "rgba(123,47,190,0.2)", color: "#c084fc" }}>
                  إعادة للموضع الأصلي
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* ── Visual Edit Mode: Smart Status Bar ─────────────────────────────────── */}
      {editMode && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-5 py-2.5 rounded-2xl shadow-2xl"
          style={{ background: "rgba(15,15,30,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(123,47,190,0.3)" }}
        >
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {autoSaveStatus === 'idle' && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
            {autoSaveStatus === 'unsaved' && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
            {autoSaveStatus === 'saving' && <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
            {autoSaveStatus === 'saved' && <div className="w-2 h-2 rounded-full bg-green-400" />}
            <span className="text-xs font-bold" style={{ color: "#c084fc" }}>
              {autoSaveStatus === 'idle' && "وضع التعديل المرئي"}
              {autoSaveStatus === 'unsaved' && "تعديلات غير محفوظة..."}
              {autoSaveStatus === 'saving' && "جاري الحفظ..."}
              {autoSaveStatus === 'saved' && "✓ تم الحفظ تلقائياً"}
            </span>
          </div>

          <div className="w-px h-4 bg-white/20" />
          <span className="text-xs text-gray-500">اضغط على أي عنصر لتعديله — اسحب لتحريكه</span>
          <div className="w-px h-4 bg-white/20" />

          <button
            onClick={handleExitEditMode}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:bg-white/10"
            style={{ color: "#888899" }}
          >
            ✕ خروج من التعديل
          </button>

          {/* Reset all positions button */}
          <button
            onClick={() => updateEdit("positions", {})}
            className="text-xs px-3 py-1.5 rounded-lg font-bold transition-all hover:opacity-80"
            style={{ background: "rgba(123,47,190,0.15)", color: "#c084fc" }}
          >
            إعادة المواضع
          </button>
        </div>
      )}
      {/* ── Floating Admin Edit Button (visible only to admin, only when NOT in edit mode) ── */}
      {isAdmin && !editMode && questionData && (
        <button
          onClick={handleEnterEditMode}
          className="fixed z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{
            bottom: "24px",
            left: "24px",
            background: "linear-gradient(135deg, #7B2FBE 0%, #5B1FA0 100%)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(123,47,190,0.5)",
          }}
          title="وضع التعديل المرئي"
        >
          <span style={{ fontSize: "16px" }}>✏️</span>
          تعديل الصفحة
        </button>
      )}
    </div>
  );
}

function TeamToolCard({ teamName, score, tools, usedTools, onUseTool, isCurrentTeam, isActiveTurn }: {
  teamName: string; score: number; tools: string[]; usedTools: string[];
  onUseTool: (toolId: string) => void; isCurrentTeam: boolean; isActiveTurn: boolean;
}) {
  const activeToolIds = isCurrentTeam ? ["double", "double_pts"] : ["rest"];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-full text-center py-2 rounded-xl font-black text-white text-sm ${isCurrentTeam ? "bg-[#7B2FBE]" : "bg-[#7B2FBE]/50"}`}>
        {teamName}
      </div>
      <div className="text-4xl font-black text-foreground">{score}</div>

      <AnimatePresence>
        {isActiveTurn && (
          <motion.div
            key="turn-indicator"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: 1, opacity: 1,
              boxShadow: [
                "0 0 10px 2px rgba(59,130,246,0.7)",
                "0 0 22px 6px rgba(59,130,246,1)",
                "0 0 10px 2px rgba(59,130,246,0.7)",
              ]
            }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ scale: { duration: 0.3 }, boxShadow: { duration: 1.4, repeat: Infinity } }}
            className="w-full bg-blue-500 rounded-2xl py-2.5 text-white font-black text-center text-base border-2 border-blue-300"
          >
            دورك ✨
          </motion.div>
        )}
      </AnimatePresence>

      {tools.length > 0 && (
        <>
          <p className="text-xs font-bold text-foreground/60">وسائل المساعدة</p>
          <div className="flex flex-row gap-3 justify-center flex-wrap">
            {tools.map((toolId) => {
              const tool = HELP_TOOLS_MAP[toolId];
              if (!tool) return null;
              const used = usedTools.includes(toolId);
              const isAvailableThisTurn = activeToolIds.includes(toolId);
              const isClickable = isAvailableThisTurn && !used;

              return (
                <div key={toolId} className="flex flex-col items-center gap-1">
                  <motion.button
                    whileHover={isClickable ? { scale: 1.1 } : {}}
                    whileTap={isClickable ? { scale: 0.92 } : {}}
                    onClick={() => isClickable && onUseTool(toolId)}
                    disabled={!isClickable}
                    title={tool.name}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                      used
                        ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                        : isAvailableThisTurn
                          ? "bg-[#7B2FBE]/10 border-[#7B2FBE]/60 hover:bg-[#7B2FBE] cursor-pointer shadow-md hover:shadow-[#7B2FBE]/30 hover:shadow-lg"
                          : "bg-gray-50 border-gray-200 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <img
                      src={tool.icon}
                      alt={tool.name}
                      className="w-7 h-7 object-contain"
                      style={
                        isAvailableThisTurn && !used
                          ? { filter: "brightness(0) saturate(100%) invert(18%) sepia(89%) saturate(1200%) hue-rotate(255deg) brightness(1.15)" }
                          : { filter: "grayscale(100%) opacity(0.3)" }
                      }
                    />
                  </motion.button>
                  <span className={`text-[10px] font-bold text-center leading-tight max-w-[52px] ${
                    used ? "text-gray-300" : isAvailableThisTurn ? "text-[#7B2FBE]" : "text-gray-300"
                  }`}>
                    {tool.name}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
