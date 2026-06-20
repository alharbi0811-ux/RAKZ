import { API_BASE } from "@/lib/apiBase";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/sections/Navbar";
import { useAuth } from "@/context/AuthContext";
import { History, Play, RotateCcw, Trash2, Trophy, Clock, Users } from "lucide-react";



type CategoryData = { id: string; name: string; img: string };

type GameData = {
  team1Name: string;
  team2Name: string;
  gameName: string;
  team1Categories: CategoryData[];
  team2Categories: CategoryData[];
  team1Tools?: string[];
  team2Tools?: string[];
};

type BoardState = {
  playedCells: string[];
  team1Score: number;
  team2Score: number;
  currentTeam: 1 | 2;
};

type GameSession = {
  id: number;
  gameName: string;
  gameData: GameData;
  boardState: BoardState | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-KW", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }
    fetchHistory();
  }, [user, token]);

  async function fetchHistory() {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {}
    setIsLoading(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {}
    setDeletingId(null);
    setConfirmDelete(null);
  }

  function handleContinue(session: GameSession) {
    localStorage.setItem("rakez-game-data", JSON.stringify(session.gameData));
    if (session.boardState) {
      localStorage.setItem("rakez-played-cells", JSON.stringify(session.boardState.playedCells || []));
      localStorage.setItem("rakez-scores", JSON.stringify({
        team1Score: session.boardState.team1Score || 0,
        team2Score: session.boardState.team2Score || 0,
      }));
      localStorage.setItem("rakez-current-team", JSON.stringify(session.boardState.currentTeam || 1));
    }
    localStorage.setItem("rakez-session-id", String(session.id));
    navigate("/score-page");
  }

  function handleReplay(session: GameSession) {
    localStorage.setItem("rakez-game-data", JSON.stringify(session.gameData));
    localStorage.removeItem("rakez-played-cells");
    localStorage.setItem("rakez-scores", JSON.stringify({ team1Score: 0, team2Score: 0 }));
    localStorage.setItem("rakez-current-team", JSON.stringify(1));
    localStorage.setItem("rakez-session-id", String(session.id));
    navigate("/score-page");
  }

  const POINTS = [200, 400, 600];

  function getProgress(session: GameSession) {
    const allCats = [
      ...(session.gameData.team1Categories || []),
      ...(session.gameData.team2Categories || []),
    ];
    const total = allCats.length * POINTS.length * 2;
    const played = session.boardState?.playedCells?.length || 0;
    return { played, total, pct: total > 0 ? Math.round((played / total) * 100) : 0 };
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-white" dir="rtl">
      <Navbar />

      <main className="pt-36 pb-16 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#7B2FBE] flex items-center justify-center shadow-lg">
              <History size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">سجل ألعابي</h1>
              <p className="text-sm text-gray-500 mt-0.5">جميع الألعاب التي لعبتها سابقاً</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#7B2FBE]/30 border-t-[#7B2FBE] animate-spin" />
              <p className="text-gray-400 font-medium">جاري التحميل...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-20 h-20 rounded-full bg-[#7B2FBE]/10 flex items-center justify-center">
                <History size={36} className="text-[#7B2FBE]/50" />
              </div>
              <p className="text-xl font-black text-gray-400">لا توجد ألعاب سابقة</p>
              <p className="text-sm text-gray-400">ابدأ لعبة جديدة وستظهر هنا</p>
              <button
                onClick={() => navigate("/start-game")}
                className="mt-4 bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors"
              >
                إنشاء لعبة
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {sessions.map((session, i) => {
                  const { played, total, pct } = getProgress(session);
                  const isCompleted = session.status === "completed" || pct === 100;

                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="bg-gradient-to-l from-[#7B2FBE] to-[#5a1f8e] px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Trophy size={18} className="text-yellow-300" />
                          </div>
                          <div>
                            <p className="text-white font-black text-lg">{session.gameName}</p>
                            <div className="flex items-center gap-2 text-white/70 text-xs mt-0.5">
                              <Clock size={11} />
                              <span>{formatDate(session.createdAt)} - {formatTime(session.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isCompleted ? "bg-green-400/20 text-green-200" : "bg-yellow-400/20 text-yellow-200"}`}>
                          {isCompleted ? "مكتملة" : "جارية"}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-5 text-sm text-gray-600">
                          <Users size={15} className="text-[#7B2FBE]" />
                          <span className="font-bold text-gray-800">{session.gameData.team1Name}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-bold text-gray-800">{session.gameData.team2Name}</span>
                        </div>

                        {session.boardState && (
                          <div className="flex items-center gap-6 mb-5">
                            <div className="text-center">
                              <p className="text-xs text-gray-500 mb-1">{session.gameData.team1Name}</p>
                              <p className="text-2xl font-black text-[#7B2FBE]">{session.boardState.team1Score || 0}</p>
                            </div>
                            <div className="text-gray-300 font-black text-lg">-</div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500 mb-1">{session.gameData.team2Name}</p>
                              <p className="text-2xl font-black text-[#7B2FBE]">{session.boardState.team2Score || 0}</p>
                            </div>
                          </div>
                        )}

                        <div className="mb-5">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>التقدم</span>
                            <span>{played}/{total} سؤال ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-[#7B2FBE] to-[#9b5de5] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {!isCompleted && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleContinue(session)}
                              className="flex-1 flex items-center justify-center gap-2 bg-[#7B2FBE] hover:bg-[#8B35D6] text-white font-bold py-3 rounded-full shadow transition-colors"
                            >
                              <Play size={16} />
                              استكمال
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleReplay(session)}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-full transition-colors"
                          >
                            <RotateCcw size={16} />
                            العب من جديد
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfirmDelete(session.id)}
                            disabled={deletingId === session.id}
                            className="w-11 h-11 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">حذف اللعبة؟</h3>
              <p className="text-gray-500 text-sm mb-6">سيتم حذف هذه اللعبة من سجلك نهائياً</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-full transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete!)}
                  disabled={deletingId !== null}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-full transition-colors"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
