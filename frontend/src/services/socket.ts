import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  // ✅ ONLY check existence, NOT connection state
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_URL || "http://127.0.0.1:8080", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
};

export const getSocket = () => socket;


// socket.on("connect", () => {
//   console.log("✅ CONNECTED:", socket?.id);
// });

// socket.on("connect_error", (err) => {
//   console.error("❌ SOCKET ERROR:", err.message);
// });
