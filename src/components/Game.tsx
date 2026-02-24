import React, { useState, useEffect, useRef, useMemo } from "react";
import { Socket } from "socket.io-client";
import { RoomState } from "../App";
import { motion } from "motion/react";
import { Timer, Zap, Target } from "lucide-react";
import clsx from "clsx";

interface GameProps {
  socket: Socket;
  roomId: string;
  roomState: RoomState;
}

export default function Game({ socket, roomId, roomState }: GameProps) {
  const [input, setInput] = useState("");
  const [compositionText, setCompositionText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);

  const text = roomState.text;
  const characters = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (input.length > 0 && !startTime) {
      setStartTime(Date.now());
    }

    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 60000; // in minutes
      const correctChars = input.split("").filter((char, i) => char === characters[i]).length;
      
      // Calculate CPM (Characters Per Minute) for better support across languages
      const currentWpm = timeElapsed > 0 ? Math.round(correctChars / timeElapsed) : 0;
      const currentAccuracy = Math.round((correctChars / input.length) * 100) || 100;

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);

      const isFinished = input.length === characters.length;

      socket.emit("update_progress", {
        roomId,
        progress: input.length,
        wpm: currentWpm,
        accuracy: currentAccuracy,
        isFinished,
      });
    }
  }, [input, startTime, characters, roomId, socket]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposing) return;
    const val = e.target.value;
    if (val.length <= characters.length) {
      setInput(val);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    setCompositionText(e.data);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    setCompositionText("");
    
    // When composition ends, the input's onChange will fire with the final composed text.
    // However, sometimes we need to manually append it if the browser behaves differently.
    // React's onChange usually handles this well enough.
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const myPlayer = roomState.players[socket.id];
  const sortedPlayers = Object.values(roomState.players).sort((a, b) => b.progress - a.progress);

  return (
    <div className="mx-auto max-w-5xl p-6 pt-12" onClick={handleClick}>
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Zap size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">速度 (CPM)</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{wpm}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Target size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">準確率</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">{accuracy}%</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Timer size={20} />
            <span className="font-semibold text-sm uppercase tracking-wider">進度</span>
          </div>
          <span className="text-3xl font-bold text-slate-900">
            {Math.round((input.length / characters.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Typing Area */}
      <div className="relative mb-12 rounded-2xl bg-white p-8 shadow-sm border border-slate-100 text-2xl leading-relaxed font-mono tracking-wide min-h-[200px]">
        {input.length === 0 && (
          <div className="absolute top-4 right-6 text-sm text-slate-400 animate-pulse flex items-center gap-2">
            <Zap size={16} />
            直接開始打字...
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionUpdate={handleCompositionUpdate}
          onCompositionEnd={handleCompositionEnd}
          className="absolute inset-0 h-full w-full opacity-0 cursor-default"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          disabled={myPlayer?.isFinished}
        />
        <div className="pointer-events-none select-none break-all">
          {characters.map((char, index) => {
            let state = "untyped";
            if (index < input.length) {
              // Normalize special characters for comparison (e.g., full-width vs half-width)
              // This is a simple normalization, can be expanded based on needs
              const normalize = (c: string) => {
                // Convert full-width to half-width for basic punctuation
                return c.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
                        .replace(/\u3000/g, ' ')
                        .replace(/['']/g, "'")
                        .replace(/[""]/g, '"');
              };
              
              const normalizedInputChar = normalize(input[index]);
              const normalizedTargetChar = normalize(char);
              
              state = normalizedInputChar === normalizedTargetChar ? "correct" : "incorrect";
            }

            const isCurrentChar = index === input.length && !myPlayer?.isFinished;

            return (
              <span
                key={index}
                className={clsx(
                  "transition-colors duration-150 relative",
                  state === "untyped" && "text-slate-300",
                  state === "correct" && "text-slate-800",
                  state === "incorrect" && "bg-red-200 text-red-800 rounded-sm",
                  isCurrentChar && "border-b-2 border-indigo-500 animate-pulse"
                )}
              >
                {char}
                {isCurrentChar && isComposing && (
                  <span className="absolute -top-8 left-0 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white shadow-lg">
                    {compositionText}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Race Track */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <h3 className="mb-6 text-lg font-semibold text-slate-900">即時戰況</h3>
        <div className="space-y-6">
          {sortedPlayers.map((player) => {
            const progressPercent = (player.progress / characters.length) * 100;
            const isMe = player.id === socket.id;

            return (
              <div key={player.id} className="relative">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={clsx("font-medium", isMe ? "text-indigo-600" : "text-slate-700")}>
                    {player.name} {isMe && "(你)"}
                  </span>
                  <span className="text-slate-500 font-mono">{player.wpm} CPM</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    className={clsx(
                      "h-full rounded-full",
                      isMe ? "bg-indigo-500" : "bg-slate-400",
                      player.isFinished && "bg-emerald-500"
                    )}
                  />
                </div>
                {/* Car/Avatar indicator */}
                <motion.div
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${progressPercent}% - 16px)` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="absolute -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow-md"
                  style={{ zIndex: 10 }}
                >
                  <div className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                    isMe ? "bg-indigo-500" : "bg-slate-400",
                    player.isFinished && "bg-emerald-500"
                  )}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
