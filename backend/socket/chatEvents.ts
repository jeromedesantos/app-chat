import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../models/Conversation.ts";
import Message from "../models/Message.ts";

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
      console.log("getConversations error:", error);
      socket.emit("getConversations", {
        success: false,
        msg: error?.message || "Failed to fetch conversation",
      });
    }
  });

  socket.on("newConversation", async (data) => {
    console.log("newConversation event: ", data);

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
      console.log("newConversation error:", error);
      socket.emit("newConversation", {
        success: false,
        msg: "Failed to create new conversation",
      });
    }
  });

  socket.on("newMessage", async (data) => {
    console.log("newMessage event: ", data);

    try {
      const message = await Message.create({
        conversationId: data.conversationId,
        senderId: socket.data.userId,
        content: data.content,
        attachment: data.attachment,
      });

      io.to(data.conversationId.toString()).emit("newMessage", {
        success: true,
        data: {
          id: message._id,
          content: data.content,
          sender: {
            id: data.sender.id,
            name: data.sender.name,
            avatar: data.sender.avatar,
          },
          attachment: data.attachment,
          createdAt: new Date().toISOString(),
          conversationId: data.conversationId,
        },
      });

      // update conversation's last message
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: message._id,
      });
    } catch (error) {
      console.log("newMessage error:", error);
      socket.emit("newMessage", {
        success: false,
        msg: "Failed to send message",
      });
    }
  });

  socket.on("getMessages", async (data: { conversationId: string }) => {
    console.log("getMessages event: ", data);

    try {
      const messages = await Message.find({
        conversationId: data.conversationId,
      })
        .sort({ createdAt: -1 }) // newest first
        .populate<{ senderId: { _id: string; name: string; avatar: string } }>({
          path: "senderId",
          select: "name avatar",
        })
        .lean();

      const messagesWithSender = messages.map((message) => ({
        ...message,
        id: message._id,
        sender: {
          id: message.senderId._id,
          name: message.senderId.name,
          avatar: message.senderId.avatar,
        },
      }));

      socket.emit("getMessages", {
        success: true,
        data: messagesWithSender,
      });
    } catch (error: any) {
      console.log("getMessages error:", error);
      socket.emit("getMessages", {
        success: false,
        msg: "Failed to fetch messages",
      });
    }
  });
}
