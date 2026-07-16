import {
  DEFAULT_AWAY_KIT,
  DEFAULT_KIT,
  KIT_STYLES,
  TACTICS,
} from "./config.js";

export function normalizeTacticId(tacticId, fallback = "balanced") {
  return TACTICS[tacticId] ? tacticId : fallback;
}

export function normalizeKitId(kitId, fallback = DEFAULT_KIT) {
  return KIT_STYLES[kitId] ? kitId : fallback;
}

export function defaultTeamSetting(teamKey) {
  return teamKey === "away"
    ? { tactic: "counter", kit: DEFAULT_AWAY_KIT }
    : { tactic: "balanced", kit: DEFAULT_KIT };
}

export function normalizeTeamSetting(teamKey, settings = {}) {
  const fallback = defaultTeamSetting(teamKey);
  return {
    tactic: normalizeTacticId(settings.tactic, fallback.tactic),
    kit: normalizeKitId(settings.kit, fallback.kit),
  };
}

export function normalizeTeamSettings(settings = {}) {
  return {
    home: normalizeTeamSetting("home", settings.home),
    away: normalizeTeamSetting("away", settings.away),
  };
}
