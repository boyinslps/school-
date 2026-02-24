import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import { createServer } from "http";

interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
}

interface Room {
  id: string;
  text: string;
  status: "waiting" | "playing" | "finished";
  players: Record<string, Player>;
  startTime?: number;
}

const rooms: Record<string, Room> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", ({ roomId, name }) => {
      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = {
          id: roomId,
          text: "",
          status: "waiting",
          players: {},
        };
      }

      rooms[roomId].players[socket.id] = {
        id: socket.id,
        name,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
      };

      io.to(roomId).emit("room_state", rooms[roomId]);
    });

    socket.on("set_text", ({ roomId, text }) => {
      if (rooms[roomId] && rooms[roomId].status === "waiting") {
        rooms[roomId].text = text;
        io.to(roomId).emit("room_state", rooms[roomId]);
      }
    });

    socket.on("start_game", ({ roomId }) => {
      if (rooms[roomId] && rooms[roomId].status === "waiting") {
        rooms[roomId].status = "playing";
        rooms[roomId].startTime = Date.now();
        // Reset players
        Object.values(rooms[roomId].players).forEach((p) => {
          p.progress = 0;
          p.wpm = 0;
          p.accuracy = 100;
          p.isFinished = false;
          p.finishTime = undefined;
        });
        io.to(roomId).emit("room_state", rooms[roomId]);
      }
    });

    socket.on("update_progress", ({ roomId, progress, wpm, accuracy, isFinished }) => {
      if (rooms[roomId] && rooms[roomId].players[socket.id]) {
        const player = rooms[roomId].players[socket.id];
        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;
        
        if (isFinished && !player.isFinished) {
          player.isFinished = true;
          player.finishTime = Date.now();
        }

        // Check if all players are finished
        const allFinished = Object.values(rooms[roomId].players).every(p => p.isFinished);
        if (allFinished && rooms[roomId].status === "playing") {
          rooms[roomId].status = "finished";
        }

        io.to(roomId).emit("room_state", rooms[roomId]);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Clean up player from rooms
      for (const roomId in rooms) {
        if (rooms[roomId].players[socket.id]) {
          delete rooms[roomId].players[socket.id];
          
          if (Object.keys(rooms[roomId].players).length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit("room_state", rooms[roomId]);
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
