import { Socket, Server as SocketIOServer } from "socket.io";
import User from "../models/User.ts";
import { generateToken } from "../utils/token.ts";

export function registerUserEvents(io: SocketIOServer, socket: Socket) {
  socket.on("testSocket", (data) => {
    socket.emit("testSocket", {
      msg: "realtime updates!",
    });
  });

  socket.on(
    "updateProfile",
    async (data: { name?: string; avatar?: string }) => {
      console.log("updateprofile event: ", data);

      const userId = socket.data.userId;
      if (!userId) {
        return socket.emit("updateProfile", {
          success: false,
          msg: "Unauthorized",
        });
      }

      try {
        // only update fields that are provided
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.avatar) updateData.avatar = data.avatar;

        const updatedUser = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true }, // will return the user with updated values
        );

        if (!updatedUser) {
          return socket.emit("updateProfile", {
            success: false,
            msg: "User not found",
          });
        }

        // gen token with updated value
        const newToken = generateToken(updatedUser);

        socket.emit("updateProfile", {
          success: true,
          token: newToken,
          msg: "Profile updated successfully",
        });
      } catch (error) {
        console.log("Error updating profile: ", error);
        socket.emit("updateProfile", {
          success: false,
          msg: "Error updating profile",
        });
      }
    },
  );

  socket.on("getContacts", async () => {
    try {
      const currentUserId = socket.data.userId;

      if (!currentUserId) {
        socket.emit("getContacts", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }

      const users = await User.find(
        { _id: { $ne: currentUserId } },
        { password: 0 }, // exclude password field
      ).lean(); // will fetch js objects

      const contacts = users.map((user) => ({
        id: user._id,
        name: user.name,
        avatar: user.avatar || "",
      }));

      socket.emit("getContacts", {
        success: true,
        data: contacts,
      });
    } catch (error: any) {
      console.log("getContacts error: ", error);
      socket.emit("getContacts", {
        success: false,
        msg: "Failed to fetch contacts",
      });
    }
  });
}
