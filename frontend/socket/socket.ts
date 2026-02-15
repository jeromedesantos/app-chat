import { API_URL } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("No token found. User must login first");
  }

  // if socket already exists and is connected, return it
  if (socket && socket.connected) {
    console.log("Socket already connected: ", socket?.id);
    return socket;
  }

  // if socket exists but disconnected, reconnect it
  if (socket && !socket.connected) {
    console.log("Reconnecting existing socket...");
    socket.connect();
    return new Promise((resolve) => {
      socket?.on("connect", () => {
        console.log("Socket reconnected: ", socket?.id);
        resolve(socket as Socket);
      });
    });
  }

  // create new socket
  socket = io(API_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // wait for connection
  return new Promise((resolve) => {
    socket?.on("connect", () => {
      console.log("Socket connected: ", socket?.id);
      resolve(socket as Socket);
    });

    socket?.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket?.on("connect_error", (error) => {
      console.log("Socket connection error: ", error);
    });
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
