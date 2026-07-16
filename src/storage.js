import {
  BUILD_STORAGE_KEY,
  CONTROLS_STORAGE_KEY,
  DEFAULT_LANGUAGE,
  DEFAULT_MATCH_RULE,
  KIT_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  MATCH_RULE_STORAGE_KEY,
  ONLINE_TEAM_STORAGE_KEY,
  PLAYER_NAME_STORAGE_KEY,
} from "./appConfig.js";
import { DEFAULT_KIT, KIT_STYLES } from "./config.js";
import { DEFAULT_CONTROL_BINDINGS, normalizeControlBindings } from "./controls.js";
import { I18N } from "./i18n.js";
import { cleanPlayerNameInput, normalizeOnlineTeam } from "./playerProfile.js";
import { DEFAULT_PLAYER_STATS, normalizePlayerStats } from "./stats.js";
import { defaultTeamSetting, normalizeTeamSettings } from "./teamSettings.js";

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Setting changes still apply for the current session.
  }
}

function readJsonStorage(key) {
  try {
    return JSON.parse(readStorage(key));
  } catch {
    return null;
  }
}

export function initialLanguage() {
  const saved = readStorage(LANGUAGE_STORAGE_KEY);
  return I18N[saved] ? saved : DEFAULT_LANGUAGE;
}

export function saveLanguage(language) {
  writeStorage(LANGUAGE_STORAGE_KEY, language);
}

export function initialPlayerStats() {
  const saved = readJsonStorage(BUILD_STORAGE_KEY);
  return saved ? normalizePlayerStats(saved) : { ...DEFAULT_PLAYER_STATS };
}

export function savePlayerStats(stats) {
  writeStorage(BUILD_STORAGE_KEY, JSON.stringify(stats));
}

export function initialPlayerName() {
  return cleanPlayerNameInput(readStorage(PLAYER_NAME_STORAGE_KEY) || "");
}

export function savePlayerName(name) {
  writeStorage(PLAYER_NAME_STORAGE_KEY, name);
}

export function initialOnlineTeam() {
  return normalizeOnlineTeam(readStorage(ONLINE_TEAM_STORAGE_KEY));
}

export function saveOnlineTeam(teamKey) {
  writeStorage(ONLINE_TEAM_STORAGE_KEY, teamKey);
}

export function initialMatchRule(matchRules) {
  const saved = readStorage(MATCH_RULE_STORAGE_KEY);
  return matchRules[saved] ? saved : DEFAULT_MATCH_RULE;
}

export function saveMatchRule(matchRule) {
  writeStorage(MATCH_RULE_STORAGE_KEY, matchRule);
}

export function initialKit() {
  const saved = readStorage(KIT_STORAGE_KEY);
  return KIT_STYLES[saved] ? saved : DEFAULT_KIT;
}

export function saveKit(kitId) {
  writeStorage(KIT_STORAGE_KEY, kitId);
}

export function initialTeamSettings() {
  return normalizeTeamSettings({
    home: { tactic: "balanced", kit: initialKit() },
    away: defaultTeamSetting("away"),
  });
}

export function initialControlBindings() {
  const saved = readJsonStorage(CONTROLS_STORAGE_KEY);
  return saved ? normalizeControlBindings(saved) : { ...DEFAULT_CONTROL_BINDINGS };
}

export function saveControlBindings(bindings) {
  writeStorage(CONTROLS_STORAGE_KEY, JSON.stringify(bindings));
}
