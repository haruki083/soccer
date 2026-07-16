import {
  ONLINE_CLIENT_STORAGE_KEY,
  ONLINE_ROOM_PARAM,
} from "./appConfig.js";

export function makeClientId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function initialOnlineClientId() {
  try {
    const saved = localStorage.getItem(ONLINE_CLIENT_STORAGE_KEY);
    if (saved) return saved;
    const created = makeClientId();
    localStorage.setItem(ONLINE_CLIENT_STORAGE_KEY, created);
    return created;
  } catch {
    return makeClientId();
  }
}

export function readRoomCodeFromUrl() {
  try {
    const room = new URLSearchParams(window.location.search).get(ONLINE_ROOM_PARAM);
    return sanitizeRoomCode(room);
  } catch {
    return "";
  }
}

export function sanitizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
}
