// import { Platform } from "react-native";
const env = process.env;

export const API_URL = env?.EXPO_PUBLIC_API_URL;
// Platform.OS === "android"
//   ? "http://10.0.2.2:3000"
//   : Platform.OS === "ios"
//     ? "http://localhost:3000"
//     : "http://192.168.0.18:3000";

export const CLOUDINARY_CLOUD_NAME = env?.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET =
  env?.EXPO_PUBLIC_COUDINARY_UPLOAD_PRESET;
