import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import Home from "./components/Home";
import Room from "./components/Room";

export interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
}

export interface RoomState {
  id: string;
  text: string;
  status: "waiting" | "playing" | "finished";
  players: Record<string, Player>;
  startTime?: number;
}

const socket: Socket = io();

export default function App() {
  const [appState, setAppState] = useState<"home" | "room">("home");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    socket.on("room_state", (state: RoomState) => {
      setRoomState(state);
    });

    return () => {
      socket.off("room_state");
    };
  }, []);

  const handleJoinRoom = (id: string, name: string) => {
    setRoomId(id);
    setPlayerName(name);
    setAppState("room");
    socket.emit("join_room", { roomId: id, name });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      {appState === "home" ? (
        <Home onJoin={handleJoinRoom} />
      ) : (
        <Room 
          socket={socket} 
          roomId={roomId} 
          playerName={playerName} 
          roomState={roomState} 
        />
      )}
    </div>
  );
}
