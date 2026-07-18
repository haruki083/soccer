import {
  AI_DIFFICULTIES,
  DEFAULT_AI_DIFFICULTY,
} from "./appConfig.js";
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

export function normalizeAiDifficultyId(aiDifficulty, fallback = DEFAULT_AI_DIFFICULTY) {
  return AI_DIFFICULTIES[aiDifficulty] ? aiDifficulty : fallback;
}

export function defaultTeamSetting(teamKey) {
  return teamKey === "away"
    ? { tactic: "counter", kit: DEFAULT_AWAY_KIT, aiDifficulty: DEFAULT_AI_DIFFICULTY }
    : { tactic: "balanced", kit: DEFAULT_KIT, aiDifficulty: DEFAULT_AI_DIFFICULTY };
}

export function normalizeTeamSetting(teamKey, settings = {}) {
  const fallback = defaultTeamSetting(teamKey);
  return {
    tactic: normalizeTacticId(settings.tactic, fallback.tactic),
    kit: normalizeKitId(settings.kit, fallback.kit),
    aiDifficulty: normalizeAiDifficultyId(settings.aiDifficulty, fallback.aiDifficulty),
  };
}

export function normalizeTeamSettings(settings = {}) {
  return {
    home: normalizeTeamSetting("home", settings.home),
    away: normalizeTeamSetting("away", settings.away),
  };
}
