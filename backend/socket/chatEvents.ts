import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../models/Conversation.ts";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  socket.on("getConversations", async () => {
    console.log("getConversations event");

    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("getConversations", {
          success: false,
          msg: "Unauthorized",
        });
      }

      // find all conversation where user is a participant
      const conversations = await Conversation.find({
        participants: userId,
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt",
        })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversations,
      });
    } catch (error: any) {
      console.log("getConversations error:", error?.stack || error);
      socket.emit("getConversations", {
        success: false,
        msg: error?.message || "Failed to fetch conversation",
      });
    }
  });

  socket.on("newConversation", async (data) => {
    console.log("newConversation event: ", data);
    console.log("socket.data.userId:", socket.data.userId);
    console.log("socket.data.user:", socket.data.user);
    // validate incoming data and auth
    if (!socket.data.userId) {
      socket.emit("newConversation", {
        success: false,
        msg: "Unauthenticated: missing userId",
      });
      return;
    }

    if (!data || !data.type) {
      socket.emit("newConversation", {
        success: false,
        msg: "Invalid payload: missing type",
      });
      return;
    }

    if (!Array.isArray(data.participants) || data.participants.length === 0) {
      socket.emit("newConversation", {
        success: false,
        msg: "Invalid payload: participants must be a non-empty array",
      });
      return;
    }
    try {
      if (data.type === "direct") {
        // check if already exists
        const exitingConversation = await Conversation.findOne({
          type: "direct",
          participants: {
            $all: data.participants,
            $size: 2,
          },
        })
          .populate({
            path: "participants",
            select: "name avatar",
          })
          .lean();

        if (exitingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...exitingConversation, isNew: false },
          });
          return;
        }
      }
      // create new conversation
      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "", // can be empty if direct conversation
        avatar: data.avatar || "", // same
        createdBy: socket.data.userId,
      });

      // get all connectect sockets
      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.includes(s.data.userId),
      );

      // join this conversation by all online participants
      connectedSockets.forEach((participantSocket) => {
        participantSocket.join(conversation._id.toString());
      });

      // send conversation data back (populated)
      const populatedConversation = await Conversation.findById(
        conversation._id,
      )
        .populate({
          path: "participants",
          select: "name avatar",
        })
        .lean();

      if (!populatedConversation) {
        throw new Error("Failed to populate conversation");
      }

      // emit conversation to all participants
      io.to(conversation._id.toString()).emit("newConversation", {
        success: true,
        data: { ...populatedConversation, isNew: true },
      });
    } catch (error: any) {
      console.log("newConversation error:", error?.stack || error);
      socket.emit("newConversation", {
        success: false,
        msg: error?.message || "Failed to create new conversation",
      });
    }
  });
}
