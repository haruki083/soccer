import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
const portArgIndex = process.argv.findIndex((arg) => arg === "--port" || arg === "-p");
const port = Number(process.env.PORT || (portArgIndex >= 0 ? process.argv[portArgIndex + 1] : 4210)) || 4210;
const teamSize = 4;
const maxClients = teamSize * 2;
const maxPlayerNameLength = 16;
const playerStatMin = 20;
const playerStatMax = 90;
const playerPointBudget = 150;
const staleClientMs = 30_000;
const rooms = new Map();
const defaultKit = "crimsonBlue";
const defaultAwayKit = "skyStripes";
const defaultAiDifficulty = "ai150";
const validTactics = new Set(["balanced", "counter", "press"]);
const validKits = new Set(["crimsonBlue", "blackWhite", "redCenter", "skyStripes", "sash", "redBlack"]);
const validAiDifficulties = new Set(["ai100", "ai150", "ai200", "ai300"]);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("body-too-large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function sanitizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
}

function slotInfo(slotIndex) {
  return {
    teamKey: slotIndex >= teamSize ? "away" : "home",
    slot: slotIndex % teamSize,
  };
}

function sanitizeTeamPreference(value) {
  return value === "away" ? "away" : "home";
}

function sanitizeTactic(value, fallback = "balanced") {
  return validTactics.has(value) ? value : fallback;
}

function sanitizeKit(value, fallback = defaultKit) {
  return validKits.has(value) ? value : fallback;
}

function sanitizeAiDifficulty(value, fallback = defaultAiDifficulty) {
  return validAiDifficulties.has(value) ? value : fallback;
}

function sanitizePlayerName(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxPlayerNameLength) || "PLAYER";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeStats(stats = {}) {
  const fallback = { speed: 55, physical: 45, power: 50 };
  const next = {
    speed: clamp(Math.round(Number(stats.speed ?? fallback.speed)), playerStatMin, playerStatMax),
    physical: clamp(Math.round(Number(stats.physical ?? fallback.physical)), playerStatMin, playerStatMax),
    power: clamp(Math.round(Number(stats.power ?? fallback.power)), playerStatMin, playerStatMax),
  };

  let overflow = next.speed + next.physical + next.power - playerPointBudget;
  for (const key of ["power", "physical", "speed"]) {
    if (overflow <= 0) break;
    const removable = Math.min(overflow, next[key] - playerStatMin);
    next[key] -= removable;
    overflow -= removable;
  }
  return next;
}

function defaultProfile(profile = {}) {
  return {
    name: sanitizePlayerName(profile.name),
    teamPreference: sanitizeTeamPreference(profile.teamPreference),
    stats: sanitizeStats(profile.stats),
    role: profile.role || "FW",
    tactic: sanitizeTactic(profile.tactic),
    matchRule: profile.matchRule || "time3",
    aiDifficulty: sanitizeAiDifficulty(profile.aiDifficulty),
    kit: sanitizeKit(profile.kit),
    language: profile.language || "ja",
  };
}

function defaultTeamSettings(teamKey) {
  return teamKey === "away"
    ? { tactic: "counter", kit: defaultAwayKit }
    : { tactic: "balanced", kit: defaultKit };
}

function normalizeTeamSettings(settings = {}) {
  return {
    home: {
      tactic: sanitizeTactic(settings.home?.tactic, "balanced"),
      kit: sanitizeKit(settings.home?.kit, defaultKit),
    },
    away: {
      tactic: sanitizeTactic(settings.away?.tactic, "counter"),
      kit: sanitizeKit(settings.away?.kit, defaultAwayKit),
    },
  };
}

function roomSettingsPayload(settings) {
  return {
    tactic: sanitizeTactic(settings?.tactic),
    matchRule: settings?.matchRule || "time3",
    aiDifficulty: sanitizeAiDifficulty(settings?.aiDifficulty),
    teams: normalizeTeamSettings(settings?.teams),
  };
}

function occupiedSlotIndexes(room, exceptClientId = "") {
  return new Set(
    [...room.clients.values()]
      .filter((client) => client.clientId !== exceptClientId)
      .map((client) => client.slotIndex),
  );
}

function firstFreeSlotInTeam(room, teamKey, exceptClientId = "") {
  const used = occupiedSlotIndexes(room, exceptClientId);
  const start = teamKey === "away" ? teamSize : 0;
  for (let slot = 0; slot < teamSize; slot += 1) {
    const slotIndex = start + slot;
    if (!used.has(slotIndex)) return slotIndex;
  }
  return -1;
}

function firstFreeSlot(room, preferredTeam, exceptClientId = "") {
  const preferred = sanitizeTeamPreference(preferredTeam);
  const preferredSlot = firstFreeSlotInTeam(room, preferred, exceptClientId);
  if (preferredSlot >= 0) return preferredSlot;
  return firstFreeSlotInTeam(room, preferred === "home" ? "away" : "home", exceptClientId);
}

function moveClientToPreferredTeam(room, client, preferredTeam) {
  const teamKey = sanitizeTeamPreference(preferredTeam);
  if (slotInfo(client.slotIndex).teamKey === teamKey) return true;
  const nextSlot = firstFreeSlotInTeam(room, teamKey, client.clientId);
  if (nextSlot < 0) return false;
  client.slotIndex = nextSlot;
  return true;
}

function updateTeamSettingsFromClient(room, client) {
  if (!room || !client) return;
  if (!room.settings.teams) room.settings.teams = normalizeTeamSettings();
  const teamKey = slotInfo(client.slotIndex).teamKey;
  const fallback = defaultTeamSettings(teamKey);
  const current = room.settings.teams[teamKey] || fallback;
  room.settings.teams[teamKey] = {
    tactic: sanitizeTactic(client.profile.tactic, current.tactic || fallback.tactic),
    kit: sanitizeKit(client.profile.kit, current.kit || fallback.kit),
  };
}

function makeRoom(code) {
  return {
    code,
    hostId: null,
    clients: new Map(),
    settings: {
      tactic: "balanced",
      matchRule: "time3",
      aiDifficulty: defaultAiDifficulty,
      teams: normalizeTeamSettings(),
    },
    createdAt: Date.now(),
  };
}

function getOrCreateRoom(code = "") {
  let roomCode = sanitizeRoomCode(code);
  if (!roomCode) {
    do {
      roomCode = makeRoomCode();
    } while (rooms.has(roomCode));
  }
  if (!rooms.has(roomCode)) rooms.set(roomCode, makeRoom(roomCode));
  return rooms.get(roomCode);
}

function assignClient(room, clientId, profile) {
  const id = String(clientId || "").trim();
  if (!id) return null;

  let client = room.clients.get(id);
  if (client) {
    client.profile = defaultProfile(profile || client.profile);
    moveClientToPreferredTeam(room, client, client.profile.teamPreference);
    updateTeamSettingsFromClient(room, client);
    client.connected = true;
    client.lastSeen = Date.now();
    clearTimeout(client.removeTimer);
    if (client.clientId === room.hostId) {
      room.settings.matchRule = client.profile.matchRule || room.settings.matchRule;
      room.settings.aiDifficulty = client.profile.aiDifficulty || room.settings.aiDifficulty;
    }
    return client;
  }

  const nextProfile = defaultProfile(profile);
  const slotIndex = firstFreeSlot(room, nextProfile.teamPreference);
  if (slotIndex < 0) return null;

  client = {
    clientId: id,
    slotIndex,
    profile: nextProfile,
    connected: true,
    lastSeen: Date.now(),
    stream: null,
    removeTimer: null,
  };
  room.clients.set(id, client);
  updateTeamSettingsFromClient(room, client);
  if (!room.hostId) {
    room.hostId = id;
    room.settings.matchRule = client.profile.matchRule;
    room.settings.aiDifficulty = client.profile.aiDifficulty;
  }
  return client;
}

function connectedClients(room) {
  return [...room.clients.values()].filter((client) => client.connected);
}

function selectHost(room) {
  if (room.hostId && room.clients.get(room.hostId)?.connected) return;
  const nextHost = connectedClients(room).sort((a, b) => a.slotIndex - b.slotIndex)[0];
  room.hostId = nextHost?.clientId || null;
  if (nextHost) {
    room.settings.matchRule = nextHost.profile.matchRule || room.settings.matchRule;
    room.settings.aiDifficulty = nextHost.profile.aiDifficulty || room.settings.aiDifficulty;
  }
}

function roomPayload(room) {
  selectHost(room);
  return {
    code: room.code,
    hostId: room.hostId,
    settings: roomSettingsPayload(room.settings),
    slots: [...room.clients.values()]
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .map((client) => ({
        clientId: client.clientId,
        connected: client.connected,
        host: client.clientId === room.hostId,
        profile: client.profile,
        ...slotInfo(client.slotIndex),
      })),
  };
}

function sendEvent(client, event, data) {
  if (!client.stream) return;
  client.stream.write(`event: ${event}\n`);
  client.stream.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastRoom(room) {
  const payload = roomPayload(room);
  for (const client of room.clients.values()) {
    if (client.connected) sendEvent(client, "room", payload);
  }
}

function relayMessage(room, senderId, type, payload) {
  const message = { senderId, type, payload };
  if (type === "input") {
    const host = room.clients.get(room.hostId);
    if (host?.connected && host.clientId !== senderId) sendEvent(host, "message", message);
    return;
  }
  if (type === "snapshot" && senderId !== room.hostId) return;
  for (const client of room.clients.values()) {
    if (client.connected && client.clientId !== senderId) sendEvent(client, "message", message);
  }
}

function removeClient(room, clientId) {
  const client = room.clients.get(clientId);
  if (!client) return;
  if (client.stream) client.stream.end();
  room.clients.delete(clientId);
  selectHost(room);
  if (room.clients.size === 0) {
    rooms.delete(room.code);
  } else {
    broadcastRoom(room);
  }
}

function markDisconnected(room, clientId) {
  const client = room.clients.get(clientId);
  if (!client) return;
  client.connected = false;
  client.stream = null;
  client.lastSeen = Date.now();
  clearTimeout(client.removeTimer);
  client.removeTimer = setTimeout(() => {
    removeClient(room, clientId);
  }, staleClientMs);
  selectHost(room);
  broadcastRoom(room);
}

function networkOrigins() {
  const origins = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      origins.push(`http://${entry.address}:${port}`);
    }
  }
  return origins;
}

async function serveStatic(req, res, url) {
  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(rootDir, requestPath));
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error("not-file");
    res.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${port}`}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    res.end();
    return;
  }

  if (url.pathname === "/api/network" && req.method === "GET") {
    json(res, 200, { lanOrigins: networkOrigins() });
    return;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    json(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/rooms" && req.method === "POST") {
    const body = await readBody(req);
    const room = getOrCreateRoom();
    const client = assignClient(room, body.clientId, body.profile);
    if (!client) {
      json(res, 409, { error: "room-full" });
      return;
    }
    broadcastRoom(room);
    json(res, 200, { room: roomPayload(room) });
    return;
  }

  const roomMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/([^/]+)$/);
  if (roomMatch) {
    const roomCode = sanitizeRoomCode(roomMatch[1]);
    const action = roomMatch[2];
    const room = rooms.get(roomCode) || (action === "join" ? getOrCreateRoom(roomCode) : null);
    if (!room) {
      json(res, 404, { error: "room-not-found" });
      return;
    }

    if (action === "events" && req.method === "GET") {
      const clientId = String(url.searchParams.get("clientId") || "");
      const client = room.clients.get(clientId);
      if (!client) {
        json(res, 404, { error: "client-not-found" });
        return;
      }
      clearTimeout(client.removeTimer);
      client.connected = true;
      client.stream = res;
      client.lastSeen = Date.now();
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      sendEvent(client, "room", roomPayload(room));
      req.on("close", () => markDisconnected(room, clientId));
      return;
    }

    const body = await readBody(req);
    if (action === "join" && req.method === "POST") {
      const client = assignClient(room, body.clientId, body.profile);
      if (!client) {
        json(res, 409, { error: "room-full" });
        return;
      }
      broadcastRoom(room);
      json(res, 200, { room: roomPayload(room) });
      return;
    }

    if (action === "profile" && req.method === "POST") {
      const client = room.clients.get(String(body.clientId || ""));
      if (!client) {
        json(res, 404, { error: "client-not-found" });
        return;
      }
      client.profile = defaultProfile(body.profile);
      moveClientToPreferredTeam(room, client, client.profile.teamPreference);
      updateTeamSettingsFromClient(room, client);
      client.lastSeen = Date.now();
      if (client.clientId === room.hostId) {
        room.settings.matchRule = client.profile.matchRule || room.settings.matchRule;
        room.settings.aiDifficulty = client.profile.aiDifficulty || room.settings.aiDifficulty;
      }
      broadcastRoom(room);
      json(res, 200, { room: roomPayload(room) });
      return;
    }

    if (action === "message" && req.method === "POST") {
      const clientId = String(body.clientId || "");
      if (!room.clients.has(clientId)) {
        json(res, 404, { error: "client-not-found" });
        return;
      }
      relayMessage(room, clientId, body.type, body.payload);
      json(res, 200, { ok: true });
      return;
    }

    if (action === "leave" && req.method === "POST") {
      removeClient(room, String(body.clientId || ""));
      json(res, 200, { ok: true });
      return;
    }
  }

  if (req.method === "GET") {
    await serveStatic(req, res, url);
    return;
  }

  json(res, 404, { error: "not-found" });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Soccer link server: http://127.0.0.1:${port}/`);
  for (const origin of networkOrigins()) console.log(`LAN link: ${origin}/`);
});
