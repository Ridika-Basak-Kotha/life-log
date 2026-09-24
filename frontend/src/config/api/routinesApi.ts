// frontend/src/api/routinesApi.ts
// Talks to backend /api/routines endpoints

import { API_BASE_URL } from "../config/api"; // ⬅ if your file exports BASE_URL instead, change this import

export type RoutineStatus = "pending" | "completed";

export interface Routine {
  _id: string;
  title: string;
  notes?: string;
  date: string;      // ISO yyyy-mm-dd
  startTime?: string;
  endTime?: string;
  status: RoutineStatus;
  isCompleted: boolean; // mirrors status === "completed"
}

export interface RoutineStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number; // 0–1
}

function getAuthHeader(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// small helper
async function handleJson(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return res.json();
}

// GET /api/routines?date=YYYY-MM-DD
export async function fetchRoutinesForDate(date: string, token: string) {
  const url = `${API_BASE_URL}/routines?date=${encodeURIComponent(date)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeader(token),
  });
  return handleJson(res) as Promise<{ routines: Routine[] }>;
}

// POST /api/routines
export async function createRoutine(
  payload: {
    title: string;
    notes?: string;
    date: string;
    startTime?: string;
    endTime?: string;
  },
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/routines`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify(payload),
  });
  return handleJson(res) as Promise<{ routine: Routine }>;
}

// PUT /api/routines/:id
export async function updateRoutine(
  id: string,
  payload: Partial<{
    title: string;
    notes: string;
    date: string;
    startTime: string;
    endTime: string;
    status: RoutineStatus;
    isCompleted: boolean;
  }>,
  token: string
) {
  const res = await fetch(`${API_BASE_URL}/routines/${id}`, {
    method: "PUT",
    headers: getAuthHeader(token),
    body: JSON.stringify(payload),
  });
  return handleJson(res) as Promise<{ routine: Routine }>;
}

// DELETE /api/routines/:id
export async function deleteRoutine(id: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/routines/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  });
  return handleJson(res) as Promise<{ success: boolean }>;
}

// POST /api/routines/:id/toggle
export async function toggleRoutine(id: string, token: string) {
  const res = await fetch(`${API_BASE_URL}/routines/${id}/toggle`, {
    method: "POST",
    headers: getAuthHeader(token),
  });
  return handleJson(res) as Promise<{ routine: Routine }>;
}

// GET /api/routines/stats/day?date=YYYY-MM-DD
export async function fetchDailyRoutineStats(date: string, token: string) {
  const url = `${API_BASE_URL}/routines/stats/day?date=${encodeURIComponent(
    date
  )}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeader(token),
  });
  return handleJson(res) as Promise<{ stats: RoutineStats }>;
}
