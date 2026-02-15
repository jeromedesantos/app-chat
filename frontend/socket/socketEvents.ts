import { getSocket } from "./socket";

export const testSocket = (payload: any, off: boolean = false) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    // turn off listing to this event
    // payload is the callback
    socket.off("testSocket", payload);
  } else if (typeof payload == "function") {
    // payload as callback for this event
    socket.on("testSocket", payload);
  } else {
    // sending payload as data
    socket.emit("testSocket", payload);
  }
};

export const updateProfile = (payload: any, off: boolean = false) => {
  const socket = getSocket();

  if (!socket) {
    console.log("Socket is not connected");
    return;
  }

  if (off) {
    // turn off listing to this event
    // payload is the callback
    socket.off("updateProfile", payload);
  } else if (typeof payload == "function") {
    // payload as callback for this event
    socket.on("updateProfile", payload);
  } else {
    // sending payload as data
    socket.emit("updateProfile", payload);
  }
};
