import { useState } from "react";
import { Socket } from "socket.io-client";
import { RoomState } from "../App";
import Game from "./Game";
import Leaderboard from "./Leaderboard";
import { motion } from "motion/react";
import { Users, Play, FileText, Trophy } from "lucide-react";

interface RoomProps {
  socket: Socket;
  roomId: string;
  playerName: string;
  roomState: RoomState | null;
}

export default function Room({ socket, roomId, playerName, roomState }: RoomProps) {
  const [textInput, setTextInput] = useState("");

  if (!roomState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  const isHost = Object.keys(roomState.players)[0] === socket.id;

  const handleSetText = () => {
    if (textInput.trim()) {
      socket.emit("set_text", { roomId, text: textInput.trim() });
    }
  };

  const handleStartGame = () => {
    if (roomState.text) {
      socket.emit("start_game", { roomId });
    }
  };

  if (roomState.status === "playing") {
    return <Game socket={socket} roomId={roomId} roomState={roomState} />;
  }

  if (roomState.status === "finished") {
    return <Leaderboard roomState={roomState} onRestart={() => socket.emit("start_game", { roomId })} isHost={isHost} />;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-8 md:grid-cols-2"
      >
        {/* Left Column: Room Info & Controls */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              房間: {roomId}
            </h2>
            <p className="mt-1 text-slate-500">
              等待其他玩家加入...
            </p>
          </div>

          {isHost ? (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <div className="mb-4 flex items-center gap-2 text-indigo-600">
                <FileText size={24} />
                <h3 className="text-lg font-semibold">設定比賽文本</h3>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="h-40 w-full resize-none rounded-xl border border-slate-200 p-4 font-mono text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="貼上你想讓學生練習的中文或英文文章..."
              />
              <button
                onClick={handleSetText}
                className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-200 active:scale-[0.98]"
              >
                儲存文本
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">比賽文本</h3>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-600">
                {roomState.text ? (
                  <p className="line-clamp-6">{roomState.text}</p>
                ) : (
                  <p className="italic text-slate-400">等待房主設定文本...</p>
                )}
              </div>
            </div>
          )}

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!roomState.text}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            >
              <Play size={20} />
              開始比賽
            </button>
          )}
        </div>

        {/* Right Column: Players List */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <Users size={24} className="text-indigo-500" />
              <h3 className="text-lg font-semibold">已加入玩家</h3>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-600">
              {Object.keys(roomState.players).length} 人
            </span>
          </div>

          <ul className="space-y-3">
            {Object.values(roomState.players).map((player) => (
              <motion.li
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-900">
                    {player.name}
                    {player.id === socket.id && " (你)"}
                  </span>
                </div>
                {player.id === Object.keys(roomState.players)[0] && (
                  <Trophy size={18} className="text-amber-500" />
                )}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
