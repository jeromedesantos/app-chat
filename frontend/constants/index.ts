import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : Platform.OS === "ios"
      ? "http://localhost:3000"
      : "http://192.168.0.12:3000";
