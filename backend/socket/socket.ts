import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer, Socket } from "socket.io";
import { registerUserEvent } from "./userEvents.ts";

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // allow all origins
    },
  }); // socket io server instance

  // auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: no token provided"));
    }
    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          return next(new Error("Authentication error: invalid token"));
        }

        // attach user data to socket
        let userData = decoded.user;
        socket.data.user = userData;
        socket.data.userId = userData.id;
        next();
      },
    );
  });

  // when socket connects, register events
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}, username:${socket.data.user.name}`);

    // register events
    registerUserEvent(io, socket);

    // register events
    socket.on("disconnect", () => {
      // user logs out
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}
