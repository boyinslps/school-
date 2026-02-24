import React, { useState } from "react";
import { motion } from "motion/react";
import { Keyboard } from "lucide-react";

interface HomeProps {
  onJoin: (roomId: string, name: string) => void;
}

export default function Home({ onJoin }: HomeProps) {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && name.trim()) {
      onJoin(roomId.trim(), name.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-indigo-100 p-4 text-indigo-600">
            <Keyboard size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            打字競賽
          </h1>
          <p className="mt-2 text-slate-500">
            輸入房間代碼與你的名字，準備開始比賽！
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomId" className="mb-1 block text-sm font-medium text-slate-700">
              房間代碼
            </label>
            <input
              id="roomId"
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="例如: class-101"
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              你的名字
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="例如: 王小明"
            />
          </div>
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-700 active:scale-[0.98]"
          >
            加入房間
          </button>
        </form>
      </motion.div>
    </div>
  );
}
