export function onlineUiState({
  active,
  connecting,
  pendingRoomCode,
  roomCode,
  shareUrl,
  slots,
  tr,
  isHost,
  localSlotText,
  href,
}) {
  const statusKey = connecting
    ? "ui.onlineConnecting"
    : active
      ? isHost
        ? "ui.onlineHost"
        : "ui.onlineGuest"
      : pendingRoomCode
        ? "ui.readyRoom"
        : "ui.onlineSolo";
  const connectedCount = slots.filter((slot) => slot.connected).length;
  const roomText = active && roomCode
    ? `${tr(statusKey)} ${roomCode}`
    : pendingRoomCode
      ? `${tr(statusKey)} ${pendingRoomCode}`
      : tr(statusKey);

  return {
    statusKey,
    connectedCount,
    badgeText: active ? `${connectedCount}/8` : tr(statusKey),
    statusText: roomText,
    slotText: active ? localSlotText : pendingRoomCode ? tr("ui.onlinePendingBuild") : tr("ui.onlineAiFill"),
    createRoomText: pendingRoomCode ? tr("ui.joinRoom") : active ? tr("ui.copyLink") : tr("ui.createRoom"),
    createRoomDisabled: connecting,
    copyRoomDisabled: !active || !shareUrl,
    leaveRoomDisabled: !active && !connecting && !pendingRoomCode,
    roomLinkValue: active ? shareUrl : pendingRoomCode ? href : "",
    roomLinkPlaceholder: active ? "" : tr("ui.onlineSolo"),
  };
}

export function onlinePlayerRows({
  slots,
  clientId,
  hostId,
  playerRoleFromSlot,
  displayNameForOnlineSlot,
  onlineSlotLabel,
  tr,
}) {
  return slots.map((slot) => {
    const role = playerRoleFromSlot(slot);
    const name = displayNameForOnlineSlot(slot, slot.teamKey, slot.slot) || onlineSlotLabel(slot.teamKey, slot.slot);
    const you = slot.clientId === clientId ? ` / ${tr("ui.you")}` : "";
    const host = slot.clientId === hostId ? ` / ${tr("ui.onlineHost")}` : "";
    return {
      slot,
      name,
      detail: `${onlineSlotLabel(slot.teamKey, slot.slot)} / ${role} / ${slot.connected ? "ONLINE" : "OFFLINE"}${you}${host}`,
      className: `online-player-chip${slot.clientId === clientId ? " is-you" : ""}${slot.connected ? "" : " is-offline"}`,
    };
  });
}
