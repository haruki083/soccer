export function onlineRequest(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export function roomSetupSignature(online, teamSettings) {
  return JSON.stringify({
    room: online.roomCode,
    host: online.hostId,
    slots: online.slots.map((slot) => ({
      clientId: slot.clientId,
      connected: slot.connected,
      teamKey: slot.teamKey,
      slot: slot.slot,
      name: slot.profile?.name,
      teamPreference: slot.profile?.teamPreference,
      stats: slot.profile?.stats,
      kit: slot.profile?.kit,
    })),
    teamSettings,
  });
}

export async function fetchNetworkOrigin(hostname) {
  if (!["127.0.0.1", "localhost", "::1"].includes(hostname)) return "";
  try {
    const response = await fetch("/api/network");
    if (!response.ok) return "";
    const data = await response.json();
    return data?.lanOrigins?.[0] || "";
  } catch {
    return "";
  }
}

export function setRoomUrl(location, history, roomParam, roomCode, version) {
  if (!roomCode) return;
  const current = new URL(location.href);
  current.searchParams.set(roomParam, roomCode);
  current.searchParams.set("v", version);
  history.replaceState({}, "", current);
}

export function clearRoomUrl(location, history, roomParam, version) {
  const current = new URL(location.href);
  current.searchParams.delete(roomParam);
  current.searchParams.set("v", version);
  history.replaceState({}, "", current);
}

export function shareUrl(location, roomParam, roomCode, networkOrigin, version) {
  if (!roomCode) return "";
  const current = new URL(location.href);
  current.searchParams.set(roomParam, roomCode);
  current.searchParams.set("v", version);
  return networkOrigin
    ? `${networkOrigin}${current.pathname}${current.search}${current.hash}`
    : current.href;
}
