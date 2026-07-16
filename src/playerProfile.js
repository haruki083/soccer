import { PLAYER_NAME_MAX_LENGTH } from "./appConfig.js";

export function cleanPlayerNameInput(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function playerNameForDisplay(value) {
  return cleanPlayerNameInput(value).replace(/\s+/g, " ").trim();
}

export function normalizeOnlineTeam(value) {
  return value === "away" ? "away" : "home";
}
