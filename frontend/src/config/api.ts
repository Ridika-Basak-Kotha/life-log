// src/config/api.ts
// ============================================================
// ⚠️ BACKEND CONNECTION SETTINGS
//
// Your backend is running on your laptop/PC.
// From ipconfig you gave:  IPv4 = 192.168.68.102
// Backend port (from server.ts) = 4000
//
// So the phone must call: http://192.168.68.102:4000/api
//
// If your IP ever changes, ONLY change LOCAL_IP below.
// ============================================================

import { Platform } from "react-native";

// 🟢 This is the IP you told me:
const LOCAL_IP = "192.168.68.100"; // <--- CHANGE HERE IF IP CHANGES

// Default host for emulator / simulator
let HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

// If you're using a real phone with Expo Go (most likely),
// we override with your PC's IP in development.
const USE_LOCAL_IP_FOR_DEVICE = true;

if (USE_LOCAL_IP_FOR_DEVICE && __DEV__) {
  HOST = LOCAL_IP;
}

// Backend port from your Node server
const PORT = 4000;

// 🔥 Final base URL used by the whole app
export const API_BASE_URL = `http://${HOST}:${PORT}/api`;

// Backwards compatible aliases (in case other files use these names)
export const apiUrl = API_BASE_URL;
export const BASE_URL = API_BASE_URL;

console.log("🛰️ Using API_BASE_URL:", API_BASE_URL);

// Generic helper for making requests
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: any = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    console.log("❌ JSON parse failed for", path, "body:", text);
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
