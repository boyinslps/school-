import { RoomState } from "../App";
import { motion } from "motion/react";
import { Trophy, Medal, RotateCcw, Zap, Target } from "lucide-react";
import clsx from "clsx";

interface LeaderboardProps {
  roomState: RoomState;
  onRestart: () => void;
  isHost: boolean;
}

export default function Leaderboard({ roomState, onRestart, isHost }: LeaderboardProps) {
  const players = Object.values(roomState.players);
  
  // Sort by finish time, then by WPM, then by accuracy
  const sortedPlayers = players.sort((a, b) => {
    if (a.isFinished && b.isFinished) {
      return (a.finishTime || 0) - (b.finishTime || 0);
    }
    if (a.isFinished) return -1;
    if (b.isFinished) return 1;
    
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });

  return (
    <div className="mx-auto max-w-3xl p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 shadow-inner">
            <Trophy size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            比賽結果
          </h2>
          <p className="mt-2 text-lg text-slate-500">
            恭喜所有完成挑戰的同學！
          </p>
        </div>

        <div className="space-y-4">
          {sortedPlayers.map((player, index) => {
            const isTop3 = index < 3;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={clsx(
                  "flex items-center justify-between rounded-2xl border p-5 transition-all hover:shadow-md",
                  index === 0 ? "border-amber-200 bg-amber-50" :
                  index === 1 ? "border-slate-200 bg-slate-50" :
                  index === 2 ? "border-orange-200 bg-orange-50" :
                  "border-slate-100 bg-white"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold shadow-sm",
                    index === 0 ? "bg-amber-400 text-white" :
                    index === 1 ? "bg-slate-300 text-slate-700" :
                    index === 2 ? "bg-orange-400 text-white" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {isTop3 ? <Medal size={24} /> : `#${index + 1}`}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Zap size={14} className="text-indigo-500" />
                        {player.wpm} CPM
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={14} className="text-emerald-500" />
                        {player.accuracy}% 準確率
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {player.isFinished ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      完成
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                      未完成 ({Math.round((player.progress / roomState.text.length) * 100)}%)
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {isHost && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 active:scale-[0.98]"
            >
              <RotateCcw size={20} />
              重新開始比賽
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
