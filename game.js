import * as THREE from "./vendor/three.module.js";
import {
  BUILD_STORAGE_KEY,
  CONTROLS_STORAGE_KEY,
  DEFAULT_LANGUAGE,
  DEFAULT_MATCH_RULE,
  KIT_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  MATCH_RULES,
  MATCH_RULE_STORAGE_KEY,
  ONLINE_INPUT_INTERVAL,
  ONLINE_ROOM_PARAM,
  ONLINE_SNAPSHOT_INTERVAL,
  ONLINE_TEAM_KEYS,
  ONLINE_TEAM_STORAGE_KEY,
  PLAYER_NAME_STORAGE_KEY,
} from "./src/appConfig.js";
import {
  aiMovementProfile,
  aiRoleStats,
  createEnemyAiProfile,
} from "./src/aiProfiles.js";
import {
  AWAY_KIT_STYLE,
  DEFAULT_KIT,
  FIELD,
  GOAL_FRONT_START,
  HIT_REACTION_DURATION,
  IMPACT_EFFECT_DURATION,
  ITEM_TYPES,
  KIT_STYLES,
  PITCH_MARKINGS,
  PLAYER_VISUAL_SCALE,
  ROCKET_BALL_FORCE,
  ROCKET_CARRIER_BALL_FORCE,
  ROCKET_PLAYER_KNOCKBACK,
  ROCKET_SPEED,
  ROCKET_TTL,
  SHOCKWAVE_BALL_CLOSE_BONUS,
  SHOCKWAVE_BALL_FORCE,
  SHOCKWAVE_PLAYER_CLOSE_BONUS,
  SHOCKWAVE_PLAYER_FORCE,
  SHOCKWAVE_RADIUS,
  SKIN_ACCENTS,
  SKIN_STYLES,
  SLIDE_COOLDOWN,
  SLIDE_DURATION,
  TACTICS,
  TACTIC_BEHAVIOR,
  TACTIC_ROLE_SETS,
  TEAM,
} from "./src/config.js";
import {
  CONTROL_ACTIONS,
  DEFAULT_CONTROL_BINDINGS,
  isTextEditingTarget,
  keyLabel,
  normalizeControlBindings,
  normalizeKeyName,
} from "./src/controls.js";
import { I18N } from "./src/i18n.js";
import {
  clearHeldItem,
  updateActiveItemEffects as updateActiveItemEffectsState,
  updateAiItemUse as updateAiItemUseLogic,
  updateImpactEffects as updateImpactEffectsState,
  updateItemDrops as updateItemDropsLogic,
  updateStatusTimers as updateStatusTimersState,
} from "./src/itemLogic.js";
import {
  heldItemLabel as formatHeldItemLabel,
  itemCharges as getItemCharges,
  itemIcon as getItemIcon,
  itemName as getItemName,
  kitLabel as getKitLabel,
  matchRuleLabel as getMatchRuleLabel,
  tacticLabel as getTacticLabel,
  translate,
} from "./src/labels.js";
import {
  isTimedMatch as isTimedMatchRule,
  selectedMatchRule as getSelectedMatchRule,
  targetGoals as targetGoalsForRule,
} from "./src/matchRules.js";
import {
  ballEdgeInward,
  ballRescueTarget,
  clampBallXForY,
  crossingYAtX,
  isGoalMouthY,
} from "./src/fieldGeometry.js";
import {
  clamp,
  distance,
  lerp,
  normalize,
} from "./src/math.js";
import {
  cleanPlayerNameInput,
  normalizeOnlineTeam,
  playerNameForDisplay,
} from "./src/playerProfile.js";
import {
  initialOnlineClientId,
  onlineSlotIndex,
  onlineSlotLabel,
  readRoomCodeFromUrl,
  sanitizeRoomCode,
} from "./src/onlineRoom.js";
import {
  applyOnlineSnapshot as applyOnlineSnapshotState,
  onlineSnapshot as createOnlineSnapshot,
} from "./src/onlineSnapshot.js";
import {
  playerRadiusFromStats,
  rocketStunDuration,
  roleColor,
  roleVisual,
  shockwaveStunDuration,
  tacticalRoleFor,
} from "./src/playerModel.js";
import {
  DEFAULT_PLAYER_STATS,
  PLAYER_POINT_BUDGET,
  PLAYER_STAT_KEYS,
  PLAYER_STAT_MAX,
  PLAYER_STAT_MIN,
  normalizePlayerStats,
  physicalResistanceFromStat,
  playerRole as calculatePlayerRole,
  playerStatTotal as calculatePlayerStatTotal,
  playerStatsFromPointBuild,
  powerShoveFromStat,
  roleScores as calculateRoleScores,
  skinIndexFromStats,
  speedBoostAccelMultiplier,
  speedBoostMultiplier,
  speedDriveFromStat,
} from "./src/stats.js";
import {
  defaultTeamSetting,
  normalizeKitId,
  normalizeTacticId,
  normalizeTeamSettings,
} from "./src/teamSettings.js";

(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = null;
  const appShell = document.querySelector(".app-shell");
  const homeScoreEl = document.getElementById("homeScore");
  const awayScoreEl = document.getElementById("awayScore");
  const clockEl = document.getElementById("matchClock");
  const toast = document.getElementById("toast");
  const playPauseButton = document.getElementById("playPauseButton");
  const playPauseIcon = document.getElementById("playPauseIcon");
  const lobbyStartButton = document.getElementById("lobbyStartButton");
  const lobbyStatus = document.getElementById("lobbyStatus");
  const lobbyRule = document.getElementById("lobbyRule");
  const lobbyRole = document.getElementById("lobbyRole");
  const lobbyTactic = document.getElementById("lobbyTactic");
  const lobbyBodyColor = document.getElementById("lobbyBodyColor");
  const lobbyOverlay = document.getElementById("lobbyOverlay");
  const overlayRule = document.getElementById("overlayRule");
  const overlayRole = document.getElementById("overlayRole");
  const overlayTactic = document.getElementById("overlayTactic");
  const onlineBadge = document.getElementById("onlineBadge");
  const onlineStatus = document.getElementById("onlineStatus");
  const onlineSlot = document.getElementById("onlineSlot");
  const createRoomButton = document.getElementById("createRoomButton");
  const copyRoomButton = document.getElementById("copyRoomButton");
  const leaveRoomButton = document.getElementById("leaveRoomButton");
  const onlineNameInput = document.getElementById("onlineNameInput");
  const onlineTeamButtons = document.getElementById("onlineTeamButtons");
  const onlineStatControls = document.getElementById("onlineStatControls");
  const onlineBuildRole = document.getElementById("onlineBuildRole");
  const onlinePointCounter = document.getElementById("onlinePointCounter");
  const roomLinkInput = document.getElementById("roomLinkInput");
  const onlinePlayers = document.getElementById("onlinePlayers");
  const speedButton = document.getElementById("speedButton");
  const resetButton = document.getElementById("resetButton");
  const languageButtons = document.getElementById("languageButtons");
  const settingsButton = document.getElementById("settingsButton");
  const settingsPanelButton = document.getElementById("settingsPanelButton");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsCloseButton = document.getElementById("settingsCloseButton");
  const controlBindings = document.getElementById("controlBindings");
  const resetControlsButton = document.getElementById("resetControlsButton");
  const statControls = document.getElementById("statControls");
  const resetBuildButton = document.getElementById("resetBuildButton");
  const pointCounter = document.getElementById("pointCounter");
  const buildRoleEl = document.getElementById("buildRole");
  const buildTotal = document.getElementById("buildTotal");
  const tacticButtons = document.getElementById("tacticButtons");
  const matchRuleButtons = document.getElementById("matchRuleButtons");
  const kitButtons = document.getElementById("kitButtons");
  const aceName = document.getElementById("aceName");
  const styleName = document.getElementById("styleName");
  const teamPower = document.getElementById("teamPower");
  const possessionFill = document.getElementById("possessionFill");
  const momentumFill = document.getElementById("momentumFill");
  const matchLog = document.getElementById("matchLog");
  const heldItemIcon = document.getElementById("heldItemIcon");
  const heldItemName = document.getElementById("heldItemName");
  const playHeldItemIcon = document.getElementById("playHeldItemIcon");
  const playHeldItemName = document.getElementById("playHeldItemName");
  const itemEffect = document.getElementById("itemEffect");
  const itemUseButton = document.getElementById("itemUseButton");

  const CAPTAINS = {
    ren: {
      name: "REN",
      label: "FIN",
      role: "FW",
      type: "offense",
      color: "#ff4f5e",
    },
    mika: {
      name: "MIKA",
      label: "POA",
      role: "FW",
      type: "offense",
      color: "#ff7a59",
    },
    leo: {
      name: "LEO",
      label: "SPR",
      role: "FW",
      type: "offense",
      color: "#f15bb5",
    },
    nagi: {
      name: "NAGI",
      label: "SNP",
      role: "FW",
      type: "offense",
      color: "#ef476f",
    },
    toma: {
      name: "TOMA",
      label: "TGT",
      role: "FW",
      type: "offense",
      color: "#f4a261",
    },
    yuri: {
      name: "YURI",
      label: "DRB",
      role: "FW",
      type: "offense",
      color: "#ffbe0b",
    },
    jin: {
      name: "JIN",
      label: "SHD",
      role: "FW",
      type: "offense",
      color: "#fb5607",
    },
    riku: {
      name: "RIKU",
      label: "WNG",
      role: "FW",
      type: "offense",
      color: "#ff006e",
    },
    noa: {
      name: "NOA",
      label: "CLT",
      role: "FW",
      type: "offense",
      color: "#ffd166",
    },
    ibuki: {
      name: "IBUKI",
      label: "FOX",
      role: "FW",
      type: "offense",
      color: "#e76f51",
    },
    aoi: {
      name: "AOI",
      label: "PLY",
      role: "CM",
      type: "balanced",
      color: "#4ec7ff",
    },
    kai: {
      name: "KAI",
      label: "RUN",
      role: "FW",
      type: "balanced",
      color: "#06d6a0",
    },
    mei: {
      name: "MEI",
      label: "TMP",
      role: "CM",
      type: "balanced",
      color: "#80ed99",
    },
    raya: {
      name: "RAYA",
      label: "REG",
      role: "CM",
      type: "balanced",
      color: "#48cae4",
    },
    hugo: {
      name: "HUGO",
      label: "BOX",
      role: "CM",
      type: "balanced",
      color: "#00bbf9",
    },
    luca: {
      name: "LUCA",
      label: "CRS",
      role: "CM",
      type: "balanced",
      color: "#90dbf4",
    },
    shiro: {
      name: "SHIRO",
      label: "LNK",
      role: "CM",
      type: "balanced",
      color: "#bde0fe",
    },
    iori: {
      name: "IORI",
      label: "PRS",
      role: "CM",
      type: "balanced",
      color: "#72efdd",
    },
    sena: {
      name: "SENA",
      label: "ANC",
      role: "DF",
      type: "defense",
      color: "#70e000",
    },
    daichi: {
      name: "DAICHI",
      label: "WAL",
      role: "DF",
      type: "defense",
      color: "#2dc653",
    },
    akira: {
      name: "AKIRA",
      label: "SWP",
      role: "DF",
      type: "defense",
      color: "#38b000",
    },
    reo: {
      name: "REO",
      label: "STP",
      role: "DF",
      type: "defense",
      color: "#55a630",
    },
    minato: {
      name: "MINATO",
      label: "LIB",
      role: "DF",
      type: "defense",
      color: "#57cc99",
    },
    gaku: {
      name: "GAKU",
      label: "DST",
      role: "DF",
      type: "defense",
      color: "#2b9348",
    },
    zen: {
      name: "ZEN",
      label: "AIR",
      role: "DF",
      type: "defense",
      color: "#76c893",
    },
    sol: {
      name: "SOL",
      label: "GRD",
      role: "DF",
      type: "defense",
      color: "#95d5b2",
    },
    masa: {
      name: "MASA",
      label: "RFX",
      role: "GK",
      type: "defense",
      color: "#9b5de5",
    },
    elias: {
      name: "ELIAS",
      label: "RCH",
      role: "GK",
      type: "defense",
      color: "#c77dff",
    },
    kuro: {
      name: "KURO",
      label: "CLM",
      role: "GK",
      type: "defense",
      color: "#b5179e",
    },
    rion: {
      name: "RION",
      label: "SGK",
      role: "GK",
      type: "defense",
      color: "#7209b7",
    },
  };

  THREE.ColorManagement.enabled = true;

  const WORLD_SCALE = 0.1;
  const FIELD_WORLD = {
    width: FIELD.width * WORLD_SCALE,
    depth: FIELD.height * WORLD_SCALE,
    goalDepth: FIELD.goalDepth * WORLD_SCALE,
  };
  const CAMERA_SENSITIVITY = 0.0032;
  const CAMERA_TOUCH_SENSITIVITY = 0.0042;
  const EDGE_LOOK_MARGIN = 34;
  const EDGE_LOOK_PIXELS_PER_SECOND = 760;
  const CAMERA_MIN_PITCH = -0.34;
  const CAMERA_MAX_PITCH = 0.42;
  const CAMERA_DEFAULT_PITCH = 0.04;
  const view3d = {
    renderer: null,
    scene: null,
    camera: null,
    overviewCamera: null,
    playCamera: null,
    cameraMode: "setup",
    cameraPosition: new THREE.Vector3(0, 58, 82),
    cameraTarget: new THREE.Vector3(0, 0, 0),
    fieldGroup: null,
    stadiumGroup: null,
    actorGroup: null,
    itemGroup: null,
    rocketGroup: null,
    effectGroup: null,
    ballObject: null,
    tacticLine: null,
    playerObjects: new Map(),
    itemObjects: new Map(),
    rocketObjects: new Map(),
    effectObjects: new Map(),
    materials: new Map(),
    geometries: {},
  };

  function initialLanguage() {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (I18N[saved]) return saved;
    } catch {
      // Local storage can be unavailable in private or file contexts.
    }
    return DEFAULT_LANGUAGE;
  }

  function initialPlayerStats() {
    try {
      return normalizePlayerStats(JSON.parse(localStorage.getItem(BUILD_STORAGE_KEY)));
    } catch {
      return { ...DEFAULT_PLAYER_STATS };
    }
  }

  function savePlayerStats() {
    try {
      localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(state.playerStats));
    } catch {
      // Build changes still apply for the current session.
    }
  }

  function initialPlayerName() {
    try {
      return cleanPlayerNameInput(localStorage.getItem(PLAYER_NAME_STORAGE_KEY) || "");
    } catch {
      return "";
    }
  }

  function savePlayerName() {
    try {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, state.playerName);
    } catch {
      // Name changes still apply for the current session.
    }
  }

  function initialOnlineTeam() {
    try {
      return normalizeOnlineTeam(localStorage.getItem(ONLINE_TEAM_STORAGE_KEY));
    } catch {
      return "home";
    }
  }

  function saveOnlineTeam() {
    try {
      localStorage.setItem(ONLINE_TEAM_STORAGE_KEY, state.onlineTeamPreference);
    } catch {
      // Team choice still applies for the current session.
    }
  }

  function tr(path) {
    return translate(I18N, state.language, DEFAULT_LANGUAGE, path);
  }

  function itemName(type) {
    return getItemName(tr, type);
  }

  function itemIcon(type) {
    return getItemIcon(tr, type);
  }

  function itemCharges(type) {
    return getItemCharges(ITEM_TYPES, type);
  }

  function heldItemLabel(player) {
    return formatHeldItemLabel(tr, ITEM_TYPES, player);
  }

  function tacticLabel(tacticId) {
    return getTacticLabel(tr, tacticId);
  }

  function matchRuleLabel(ruleId) {
    return getMatchRuleLabel(tr, ruleId);
  }

  function kitLabel(kitId) {
    return getKitLabel(tr, kitId);
  }

  function selectedMatchRule(ruleId = state.matchRule) {
    return getSelectedMatchRule(MATCH_RULES, DEFAULT_MATCH_RULE, ruleId);
  }

  function initialMatchRule() {
    try {
      const saved = localStorage.getItem(MATCH_RULE_STORAGE_KEY);
      if (MATCH_RULES[saved]) return saved;
    } catch {
      // Match rule choice still has a default for the current session.
    }
    return DEFAULT_MATCH_RULE;
  }

  function saveMatchRule() {
    try {
      localStorage.setItem(MATCH_RULE_STORAGE_KEY, state.matchRule);
    } catch {
      // Match rule changes still apply for the current session.
    }
  }

  function initialKit() {
    try {
      const saved = localStorage.getItem(KIT_STORAGE_KEY);
      if (KIT_STYLES[saved]) return saved;
    } catch {
      // Kit choice still has a default for the current session.
    }
    return DEFAULT_KIT;
  }

  function saveKit() {
    try {
      localStorage.setItem(KIT_STORAGE_KEY, state.kit);
    } catch {
      // Kit changes still apply for the current session.
    }
  }

  function selectedKitStyle(kitId = state.kit) {
    return KIT_STYLES[kitId] || KIT_STYLES[DEFAULT_KIT];
  }

  function playerKitStyle(player) {
    if (player.teamKey === "away" && player.kitId === "away") return AWAY_KIT_STYLE;
    return selectedKitStyle(player.kitId || teamKitId(player.teamKey));
  }

  function initialTeamSettings() {
    return normalizeTeamSettings({
      home: { tactic: "balanced", kit: initialKit() },
      away: defaultTeamSetting("away"),
    });
  }

  function playerEvent(player, eventKey) {
    const name = player.isHuman && !isOnlineActive() ? tr("ui.myPlayer") : player.name;
    return `${name} ${tr(`event.${eventKey}`)}`;
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.title = tr("appTitle");

    for (const element of document.querySelectorAll("[data-i18n]")) {
      element.textContent = tr(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
      element.setAttribute("aria-label", tr(element.dataset.i18nAriaLabel));
    }
    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
      element.setAttribute("placeholder", tr(element.dataset.i18nPlaceholder));
    }
    for (const button of tacticButtons.querySelectorAll("button[data-tactic]")) {
      button.textContent = tacticLabel(button.dataset.tactic);
    }
    for (const button of matchRuleButtons.querySelectorAll("button[data-match-rule]")) {
      button.textContent = matchRuleLabel(button.dataset.matchRule);
    }
    for (const button of kitButtons.querySelectorAll("button[data-kit]")) {
      button.textContent = kitLabel(button.dataset.kit);
    }

    setActiveButton(languageButtons, "language", state.language);
    setActiveButton(tacticButtons, "tactic", currentTacticSelection());
    setActiveButton(matchRuleButtons, "matchRule", state.matchRule);
    setActiveButton(kitButtons, "kit", currentKitSelection());
    renderBuildControls();
    renderControlBindings();
    renderLog();
    updateHud();
    updateOnlineUi();
  }

  let pendingControlAction = null;

  function initialControlBindings() {
    try {
      return normalizeControlBindings(JSON.parse(localStorage.getItem(CONTROLS_STORAGE_KEY)));
    } catch {
      return { ...DEFAULT_CONTROL_BINDINGS };
    }
  }

  function saveControlBindings() {
    try {
      localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(state.controlBindings));
    } catch {
      // Control changes still apply for the current session.
    }
  }

  function isActionKey(actionId, key) {
    return state.controlBindings[actionId] === key;
  }

  function actionPressed(actionId) {
    return input.keys.has(state.controlBindings[actionId]);
  }

  function isControlKey(key) {
    return CONTROL_ACTIONS.some((action) => isActionKey(action.id, key));
  }

  function setControlBinding(actionId, key) {
    if (!CONTROL_ACTIONS.some((action) => action.id === actionId)) return;
    const oldKey = state.controlBindings[actionId];
    const duplicate = Object.entries(state.controlBindings).find(([id, boundKey]) => id !== actionId && boundKey === key);
    if (duplicate) {
      state.controlBindings[duplicate[0]] = oldKey;
    }
    state.controlBindings[actionId] = key;
    saveControlBindings();
    renderControlBindings();
  }

  function renderControlBindings() {
    if (!controlBindings) return;
    controlBindings.replaceChildren(
      ...CONTROL_ACTIONS.map((action) => {
        const row = document.createElement("div");
        row.className = "control-row";

        const copy = document.createElement("span");
        copy.className = "control-copy";

        const label = document.createElement("strong");
        label.textContent = tr(`controls.${action.id}.label`);

        const detail = document.createElement("span");
        detail.textContent = tr(`controls.${action.id}.detail`);

        const button = document.createElement("button");
        button.className = `control-key-button${pendingControlAction === action.id ? " is-capturing" : ""}`;
        button.type = "button";
        button.dataset.controlAction = action.id;
        button.textContent = pendingControlAction === action.id ? tr("controls.waiting") : keyLabel(state.controlBindings[action.id]);

        copy.append(label, detail);
        row.append(copy, button);
        return row;
      }),
    );
  }

  function playerStatTotal(stats = state.playerStats) {
    return calculatePlayerStatTotal(stats);
  }

  function roleScores(stats = state.playerStats) {
    return calculateRoleScores(stats);
  }

  function playerRole(stats = state.playerStats) {
    return calculatePlayerRole(stats);
  }

  function playerColor(role = playerRole()) {
    return roleColor(role);
  }

  function playerStatsFromBuild() {
    return playerStatsFromPointBuild(state.playerStats);
  }

  function skinIndexFromBuild() {
    return skinIndexFromStats(state.playerStats);
  }

  function localPlayerName() {
    return playerNameForDisplay(state.playerName) || tr("ui.playerFallback");
  }

  function playerNameFromSlot(slotEntry) {
    return playerNameForDisplay(slotEntry?.profile?.name);
  }

  function displayNameForOnlineSlot(slotEntry, teamKey, slot) {
    if (!slotEntry) return "";
    if (slotEntry.clientId === online.clientId) return localPlayerName();
    return playerNameFromSlot(slotEntry) || onlineSlotLabel(teamKey, slot);
  }

  function onlineTeamLabel(teamKey) {
    return teamKey === "away" ? tr("ui.teamAway") : tr("ui.teamHome");
  }

  function onlineProfile() {
    const profileTeam = normalizeOnlineTeam(state.onlineTeamPreference);
    const settings = isOnlineActive() ? teamSetting(profileTeam) : { tactic: state.tactic, kit: state.kit };
    return {
      name: localPlayerName(),
      teamPreference: state.onlineTeamPreference,
      stats: { ...state.playerStats },
      role: playerRole(),
      tactic: settings.tactic,
      matchRule: state.matchRule,
      kit: settings.kit,
      language: state.language,
    };
  }

  function onlineSlotFor(teamKey, slot) {
    if (!online.roomCode) return null;
    return online.slots.find((entry) => entry.teamKey === teamKey && entry.slot === slot) || null;
  }

  function localOnlineSlot() {
    if (!online.roomCode) return null;
    return online.slots.find((entry) => entry.clientId === online.clientId) || null;
  }

  function selectedOnlineTeam() {
    return normalizeOnlineTeam(localOnlineSlot()?.teamKey || state.onlineTeamPreference);
  }

  function onlineTeamCount(teamKey) {
    return online.slots.filter((slot) => slot.teamKey === teamKey && slot.connected).length;
  }

  function teamSetting(teamKey) {
    const key = normalizeOnlineTeam(teamKey);
    if (!state.teamSettings[key]) state.teamSettings[key] = defaultTeamSetting(key);
    return state.teamSettings[key];
  }

  function editableTeamKey() {
    return isOnlineActive() ? selectedOnlineTeam() : "home";
  }

  function editableTeamSetting() {
    return teamSetting(editableTeamKey());
  }

  function currentTacticSelection() {
    return isOnlineActive() ? editableTeamSetting().tactic : state.tactic;
  }

  function currentKitSelection() {
    return isOnlineActive() ? editableTeamSetting().kit : state.kit;
  }

  function setTeamTactic(teamKey, tacticId) {
    const key = normalizeOnlineTeam(teamKey);
    state.teamSettings[key] = {
      ...teamSetting(key),
      tactic: normalizeTacticId(tacticId, defaultTeamSetting(key).tactic),
    };
  }

  function setTeamKit(teamKey, kitId) {
    const key = normalizeOnlineTeam(teamKey);
    state.teamSettings[key] = {
      ...teamSetting(key),
      kit: normalizeKitId(kitId, defaultTeamSetting(key).kit),
    };
  }

  function teamTacticId(teamKey) {
    if (isOnlineActive()) return teamSetting(teamKey).tactic;
    return teamKey === "away" ? "counter" : state.tactic;
  }

  function teamKitId(teamKey) {
    if (isOnlineActive()) return teamSetting(teamKey).kit;
    return teamKey === "away" ? "away" : state.kit;
  }

  function isOnlineActive() {
    return Boolean(online.roomCode && online.connected);
  }

  function isOnlineHost() {
    return isOnlineActive() && online.hostId === online.clientId;
  }

  function canSimulateMatch() {
    return !isOnlineActive() || isOnlineHost();
  }

  function playerBuildFromSlot(slotEntry) {
    return normalizePlayerStats(slotEntry?.profile?.stats);
  }

  function playerRoleFromSlot(slotEntry) {
    return playerRole(playerBuildFromSlot(slotEntry));
  }

  function renderBuildControls() {
    const role = playerRole();
    const total = playerStatTotal();

    buildRoleEl.textContent = role;
    buildTotal.textContent = String(total);
    pointCounter.textContent = `${total}/${PLAYER_POINT_BUDGET}`;
    if (onlineBuildRole) onlineBuildRole.textContent = role;
    if (onlinePointCounter) onlinePointCounter.textContent = `${total}/${PLAYER_POINT_BUDGET}`;

    for (const key of PLAYER_STAT_KEYS) {
      const input = document.getElementById(`stat-${key}`);
      const output = document.getElementById(`statValue-${key}`);
      if (input && output) {
        input.value = state.playerStats[key];
        input.dataset.previous = state.playerStats[key];
        output.textContent = state.playerStats[key];
      }
      const onlineInput = onlineStatControls?.querySelector(`input[data-stat="${key}"]`);
      const onlineOutput = onlineStatControls?.querySelector(`output[data-stat-output="${key}"]`);
      if (onlineInput && onlineOutput) {
        onlineInput.value = state.playerStats[key];
        onlineInput.dataset.previous = state.playerStats[key];
        onlineOutput.textContent = state.playerStats[key];
      }
    }

    renderPlayerNameInput();
  }

  function renderPlayerNameInput() {
    if (!onlineNameInput || document.activeElement === onlineNameInput) return;
    if (onlineNameInput.value !== state.playerName) onlineNameInput.value = state.playerName;
  }

  function updatePlayerName(value) {
    const nextName = cleanPlayerNameInput(value);
    state.playerName = nextName;
    if (onlineNameInput && onlineNameInput.value !== nextName) onlineNameInput.value = nextName;
    savePlayerName();
    updatePlayerNamesFromOnlineSlots();
    updateOnlineUi();
    updateHud();
    sendOnlineProfile(true);
  }

  function canChangeOnlineTeam() {
    return !isOnlineActive() || match.ended || (match.paused && match.elapsed <= 0.01);
  }

  function renderOnlineTeamButtons() {
    if (!onlineTeamButtons) return;
    const active = isOnlineActive();
    const selected = selectedOnlineTeam();
    const locked = active && !canChangeOnlineTeam();

    for (const button of onlineTeamButtons.querySelectorAll("button[data-online-team]")) {
      const teamKey = normalizeOnlineTeam(button.dataset.onlineTeam);
      const count = active ? onlineTeamCount(teamKey) : 0;
      const full = active && count >= 4 && selected !== teamKey;
      button.classList.toggle("is-active", selected === teamKey);
      button.disabled = online.connecting || locked || full;
      button.textContent = active
        ? `${onlineTeamLabel(teamKey)} ${count}/4${full ? ` ${tr("ui.teamFull")}` : ""}`
        : onlineTeamLabel(teamKey);
    }
  }

  function updateOnlineTeamPreference(teamKey) {
    const nextTeam = normalizeOnlineTeam(teamKey);
    if (!ONLINE_TEAM_KEYS.includes(nextTeam)) return;
    if (isOnlineActive() && !canChangeOnlineTeam()) {
      renderOnlineTeamButtons();
      return;
    }
    if (isOnlineActive() && onlineTeamCount(nextTeam) >= 4 && selectedOnlineTeam() !== nextTeam) {
      showToast(tr("toast.teamFull"));
      renderOnlineTeamButtons();
      return;
    }
    if (state.onlineTeamPreference === nextTeam && selectedOnlineTeam() === nextTeam) return;
    state.onlineTeamPreference = nextTeam;
    saveOnlineTeam();
    renderOnlineTeamButtons();
    if (isOnlineActive()) {
      sendOnlineProfile(true);
      showToast(`${onlineTeamLabel(nextTeam)} ${tr("toast.teamChanged")}`);
    }
  }

  function updatePlayerBuild(stat, value) {
    if (!PLAYER_STAT_KEYS.includes(stat)) return;
    const current = state.playerStats[stat];
    const requested = clamp(Math.round(value), PLAYER_STAT_MIN, PLAYER_STAT_MAX);
    const overflow = playerStatTotal() - current + requested - PLAYER_POINT_BUDGET;
    const accepted = overflow > 0 ? Math.max(PLAYER_STAT_MIN, requested - overflow) : requested;

    state.playerStats[stat] = accepted;
    savePlayerStats();
    renderBuildControls();
    setupMatch(true);
    sendOnlineProfile();
  }

  function isTimedMatch() {
    return isTimedMatchRule(selectedMatchRule());
  }

  function targetGoals() {
    return targetGoalsForRule(selectedMatchRule());
  }

  const state = {
    language: initialLanguage(),
    playerName: initialPlayerName(),
    onlineTeamPreference: initialOnlineTeam(),
    playerStats: initialPlayerStats(),
    controlBindings: initialControlBindings(),
    tactic: "balanced",
    matchRule: initialMatchRule(),
    kit: initialKit(),
    teamSettings: initialTeamSettings(),
  };

  const input = {
    keys: new Set(),
    itemQueued: false,
    slideQueued: false,
    cameraYaw: 0,
    cameraPitch: CAMERA_DEFAULT_PITCH,
    looking: false,
    pointerDragging: false,
    pointerInside: false,
    mouseLookArmed: false,
    edgeLookX: 0,
    edgeLookY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
  };

  const match = {
    score: { home: 0, away: 0 },
    secondsLeft: 180,
    duration: 180,
    elapsed: 0,
    paused: true,
    ended: false,
    lastTime: 0,
    speed: 1,
    presentationPlaying: false,
    toastTimer: 0,
    nextItemDrop: 2.5,
    possession: { home: 0.001, away: 0.001 },
    log: [],
  };

  const online = {
    clientId: initialOnlineClientId(),
    roomCode: null,
    hostId: null,
    connected: false,
    connecting: false,
    slots: [],
    shareUrl: "",
    networkOrigin: "",
    eventSource: null,
    lastInputSent: 0,
    lastInputSignature: "",
    lastSnapshotSent: 0,
    remoteInputs: new Map(),
    pendingRoomCode: readRoomCodeFromUrl(),
    lastRoomSetupSignature: "",
    lastProfileSignature: "",
  };

  const ball = {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    radius: 8,
    carrier: null,
    lastTouch: "home",
  };

  let players = [];
  let itemDrops = [];
  let rockets = [];
  let impactEffects = [];

  function checkGoalCrossing(prevX = ball.x, prevY = ball.y) {
    if (ball.x <= 0 && isGoalMouthY(FIELD, crossingYAtX(ball, prevX, prevY, 0))) {
      scoreGoal("away");
      return true;
    }

    if (ball.x >= FIELD.width && isGoalMouthY(FIELD, crossingYAtX(ball, prevX, prevY, FIELD.width))) {
      scoreGoal("home");
      return true;
    }

    return false;
  }

  function cameraForward2d() {
    return normalize(Math.cos(input.cameraYaw), Math.sin(input.cameraYaw));
  }

  function cameraRight2d(forward = cameraForward2d()) {
    return { x: -forward.y, y: forward.x };
  }

  function rotateCameraLook(deltaX, deltaY, sensitivity) {
    input.cameraYaw += deltaX * sensitivity;
    input.cameraPitch = clamp(input.cameraPitch - deltaY * sensitivity, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
  }

  function resetCameraLook(player = humanPlayer()) {
    input.cameraYaw = player?.team.side === -1 ? Math.PI : 0;
    input.cameraPitch = CAMERA_DEFAULT_PITCH;
  }

  function aiRoleColor(teamKey, role) {
    return teamKey === "home" ? roleColor(role) : TEAM[teamKey].shirt;
  }

  function playerVisualKey(player) {
    return `${player.tacticalRole}:${player.color}:${player.kitId || "none"}`;
  }

  function createNameLabelTexture(player, labelText) {
    const canvasLabel = document.createElement("canvas");
    canvasLabel.width = 512;
    canvasLabel.height = 128;
    const labelCtx = canvasLabel.getContext("2d");
    const text = String(labelText || "").slice(0, 18);
    const teamColor = player.teamKey === "away" ? "#4ec7ff" : "#ffd166";

    labelCtx.clearRect(0, 0, canvasLabel.width, canvasLabel.height);
    labelCtx.fillStyle = "rgba(7, 16, 13, 0.58)";
    labelCtx.strokeStyle = teamColor;
    labelCtx.lineWidth = 5;
    labelCtx.beginPath();
    labelCtx.roundRect(16, 24, 480, 80, 30);
    labelCtx.fill();
    labelCtx.globalAlpha = 0.82;
    labelCtx.stroke();
    labelCtx.globalAlpha = 1;
    labelCtx.font = "900 44px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    labelCtx.textAlign = "center";
    labelCtx.textBaseline = "middle";
    labelCtx.lineWidth = 8;
    labelCtx.strokeStyle = "rgba(0, 0, 0, 0.45)";
    labelCtx.strokeText(text, 256, 64);
    labelCtx.fillStyle = "rgba(255, 249, 236, 0.92)";
    labelCtx.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvasLabel);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function updatePlayerNameLabel(player, object) {
    const label = object.userData.nameLabel;
    const material = object.userData.nameLabelMaterial;
    if (!label || !material) return;

    const visible = isOnlineActive() && player.controller !== "ai" && Boolean(player.name);
    label.visible = visible;
    if (!visible) return;

    const labelText = player.name;
    if (object.userData.nameLabelText !== labelText || object.userData.nameLabelTeam !== player.teamKey) {
      if (material.map) material.map.dispose();
      material.map = createNameLabelTexture(player, labelText);
      material.needsUpdate = true;
      object.userData.nameLabelText = labelText;
      object.userData.nameLabelTeam = player.teamKey;
    }
    label.position.y = 5.24 + player.stats.physical * 0.36;
  }

  function goalFrontStartFor(teamKey) {
    const team = TEAM[teamKey];
    const ySpread = (FIELD.goalBottom - FIELD.goalTop) * 0.42;
    return GOAL_FRONT_START.map((slot) => {
      return {
        role: slot.role,
        x: clamp(team.ownGoalX + team.side * FIELD.width * slot.depth, 48, FIELD.width - 48),
        y: clamp(FIELD.height / 2 + slot.lane * ySpread, 52, FIELD.height - 52),
      };
    });
  }

  function findPlayerSlot(layout, role) {
    const tacticalRole = tacticalRoleFor(role);
    let index = layout.findIndex((slot) => slot.role === tacticalRole);
    if (index === -1 && tacticalRole === "FW") index = layout.findIndex((slot) => slot.role === "CM");
    if (index === -1 && tacticalRole === "DF") index = layout.findIndex((slot) => slot.role === "CM");
    if (index === -1) return 1;
    return tacticalRole === "GK" ? 0 : Math.max(1, index);
  }

  function createPlayer(teamKey, slot, base, playerSlot) {
    const slotEntry = onlineSlotFor(teamKey, slot);
    const onlineLocal = isOnlineActive() && slotEntry?.clientId === online.clientId;
    const onlineRemote = isOnlineActive() && slotEntry && slotEntry.clientId !== online.clientId;
    const isHuman = onlineLocal || (!isOnlineActive() && teamKey === "home" && slot === playerSlot);
    const controller = isHuman ? "human" : onlineRemote ? "remote" : "ai";
    const buildPoints = slotEntry ? playerBuildFromSlot(slotEntry) : state.playerStats;
    const buildRole = slotEntry ? playerRoleFromSlot(slotEntry) : playerRole();
    const buildTacticalRole = tacticalRoleFor(buildRole);
    const aiProfile = controller === "ai" && teamKey === "away" ? createEnemyAiProfile(slot, base.role) : null;
    const stats = controller !== "ai" ? playerStatsFromPointBuild(buildPoints) : aiRoleStats(base.role, teamKey, aiProfile);
    const onlineName = displayNameForOnlineSlot(slotEntry, teamKey, slot);
    const displayName = isHuman
      ? isOnlineActive()
        ? onlineName || localPlayerName()
        : "MY PLAYER"
      : onlineRemote
        ? onlineName || onlineSlotLabel(teamKey, slot)
        : `${teamKey === "home" ? "F" : "R"}-${slot + 1}`;

    return {
      id: `${teamKey}-${slot}`,
      teamKey,
      team: TEAM[teamKey],
      controller,
      slot,
      role: controller !== "ai" ? buildRole : base.role,
      baseTacticalRole: controller !== "ai" ? buildTacticalRole : base.role,
      tacticalRole: controller !== "ai" ? buildTacticalRole : base.role,
      aiProfile,
      name: displayName,
      isCaptain: isHuman,
      isHuman,
      isRemote: onlineRemote,
      skinId: controller !== "ai" ? skinIndexFromStats(buildPoints) : null,
      kitId: teamKitId(teamKey),
      homeX: base.x,
      homeY: base.y,
      x: base.x,
      y: base.y,
      vx: 0,
      vy: 0,
      radius: playerRadiusFromStats(stats, controller !== "ai" ? buildTacticalRole : base.role),
      stats,
      cooldown: 0,
      stamina: 1,
      heldItem: null,
      heldItemCharges: 0,
      speedBoostTimer: 0,
      powerBoostTimer: 0,
      magnetTimer: 0,
      shieldTimer: 0,
      shockwaveTimer: 0,
      stunTimer: 0,
      slideTimer: 0,
      slideCooldown: 0,
      slideDirX: teamKey === "home" ? 1 : -1,
      slideDirY: 0,
      slideHitBall: false,
      slideHitPlayers: new Set(),
      hitReactionTimer: 0,
      hitDirX: 0,
      hitDirY: 0,
      facingX: teamKey === "home" ? 1 : -1,
      facingY: 0,
      color: controller !== "ai" ? playerColor(buildRole) : aiRoleColor(teamKey, base.role),
    };
  }

  function setupMatch(resetScore) {
    if (resetScore) {
      const rule = selectedMatchRule();
      match.score.home = 0;
      match.score.away = 0;
      match.duration = rule.seconds || 0;
      match.secondsLeft = match.duration;
      match.elapsed = 0;
      match.ended = false;
      match.paused = true;
      match.nextItemDrop = 2.5;
      match.possession.home = 0.001;
      match.possession.away = 0.001;
      match.log = [];
      logEvent(() => tr("event.playerReady"));
    }

    const homeLayout = goalFrontStartFor("home");
    const awayLayout = goalFrontStartFor("away");
    const playerSlot = findPlayerSlot(homeLayout, playerRole());

    players = [];
    for (let i = 0; i < homeLayout.length; i += 1) {
      players.push(createPlayer("home", i, homeLayout[i], playerSlot));
    }
    for (let i = 0; i < awayLayout.length; i += 1) {
      players.push(createPlayer("away", i, awayLayout[i], -1));
    }

    updateAiTacticalRoles(teamPlan("home"), teamPlan("away"));
    resetCameraLook();
    resetBall("home");
    itemDrops = [];
    rockets = [];
    impactEffects = [];
    resetThreeActors();
    showToast(tr("toast.ready"));
    updateHud();
  }

  function resetBall(teamKey) {
    ball.x = FIELD.width / 2;
    ball.y = FIELD.height / 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.carrier = null;
    ball.lastTouch = teamKey;
  }

  function resetPositions() {
    for (const player of players) {
      player.x = player.homeX;
      player.y = player.homeY;
      player.vx = 0;
      player.vy = 0;
      player.cooldown = 0;
      player.stamina = 1;
      player.heldItem = null;
      player.heldItemCharges = 0;
      player.speedBoostTimer = 0;
      player.powerBoostTimer = 0;
      player.magnetTimer = 0;
      player.shieldTimer = 0;
      player.shockwaveTimer = 0;
      player.stunTimer = 0;
      player.slideTimer = 0;
      player.slideCooldown = 0;
      player.slideDirX = player.facingX || player.team.side;
      player.slideDirY = player.facingY || 0;
      player.slideHitBall = false;
      player.slideHitPlayers?.clear();
      player.hitReactionTimer = 0;
      player.hitDirX = 0;
      player.hitDirY = 0;
    }
  }

  function teamPlan(teamKey) {
    return normalizedPlan(teamTacticId(teamKey));
  }

  function normalizedPlan(tacticId) {
    const id = TACTICS[tacticId] ? tacticId : "balanced";
    const base = TACTICS[id] || TACTICS.balanced;
    return {
      ...base,
      id,
      label: tacticLabel(id),
      tempo: clamp(base.tempo, 0, 1),
      risk: clamp(base.risk, 0, 1),
      press: clamp(base.press, 0.05, 0.98),
      line: clamp(base.line, 0.08, 0.92),
      width: clamp(base.width, 0.2, 0.95),
    };
  }

  function tacticBehavior(plan) {
    return TACTIC_BEHAVIOR[plan?.id] || TACTIC_BEHAVIOR.balanced;
  }

  function tacticAiRole(player, plan) {
    const roles = TACTIC_ROLE_SETS[plan?.id] || TACTIC_ROLE_SETS.balanced;
    return roles[player.slot] || player.baseTacticalRole || player.tacticalRole;
  }

  function applyAiRoleProfile(player, role) {
    player.tacticalRole = role;
    player.role = role;
    player.stats = aiRoleStats(role, player.teamKey, player.aiProfile);
    player.radius = playerRadiusFromStats(player.stats, role);
    player.color = aiRoleColor(player.teamKey, role);
  }

  function updateTeamKits() {
    for (const player of players) {
      player.kitId = teamKitId(player.teamKey);
    }
  }

  function updatePlayerNamesFromOnlineSlots() {
    if (!isOnlineActive()) return;
    for (const player of players) {
      const slotEntry = onlineSlotFor(player.teamKey, player.slot);
      if (!slotEntry) continue;
      if (!player.isHuman && !player.isRemote) continue;
      player.name = displayNameForOnlineSlot(slotEntry, player.teamKey, player.slot) || player.name;
    }
  }

  function updateAiTacticalRoles(homePlan, awayPlan) {
    for (const player of players) {
      if (player.controller !== "ai") {
        player.tacticalRole = player.baseTacticalRole;
        player.radius = playerRadiusFromStats(player.stats, player.tacticalRole);
        player.color = playerColor(player.role);
        continue;
      }

      const plan = player.teamKey === "home" ? homePlan : awayPlan;
      const nextRole = tacticAiRole(player, plan);
      const previousRole = player.tacticalRole;
      applyAiRoleProfile(player, nextRole);
      if (player.teamKey === "home" && previousRole !== nextRole) {
        addImpactEffect("role", player.x, player.y, { color: player.color, radius: 0.82, ttl: 0.34, height: 0.5 });
      }
    }
  }

  function resizeCanvas() {
    initThreeScene();
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const aspect = width / height;
    const viewHeight = Math.max(FIELD_WORLD.depth * 0.78 + 30, (FIELD_WORLD.width + 18) / aspect);
    const viewWidth = viewHeight * aspect;

    view3d.renderer.setPixelRatio(Math.max(1, Math.min(2, window.devicePixelRatio || 1)));
    view3d.renderer.setSize(width, height, false);
    view3d.overviewCamera.left = -viewWidth / 2;
    view3d.overviewCamera.right = viewWidth / 2;
    view3d.overviewCamera.top = viewHeight / 2;
    view3d.overviewCamera.bottom = -viewHeight / 2;
    view3d.overviewCamera.updateProjectionMatrix();
    view3d.overviewCamera.position.set(0, 58, 82);
    view3d.overviewCamera.lookAt(0, 0, 0);

    view3d.playCamera.aspect = aspect;
    view3d.playCamera.updateProjectionMatrix();
  }

  function fieldFit(width, height) {
    const pad = Math.min(28, width * 0.025);
    const scale = Math.min((width - pad * 2) / FIELD.width, (height - pad * 2) / FIELD.height);
    return {
      scale,
      x: (width - FIELD.width * scale) / 2,
      y: (height - FIELD.height * scale) / 2,
    };
  }

  function playerHasBall(player) {
    return false;
  }

  function nearestOpponentDistance(player) {
    let best = Infinity;
    for (const opponent of players) {
      if (opponent.teamKey === player.teamKey) continue;
      best = Math.min(best, distance(player, opponent));
    }
    return best;
  }

  function closestPlayers(teamKey, target, count) {
    return players
      .filter((player) => player.teamKey === teamKey)
      .map((player) => ({ player, d: distance(player, target) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((entry) => entry.player);
  }

  function closestAiFieldPlayers(teamKey, target, count) {
    return players
      .filter(
        (player) =>
          player.teamKey === teamKey &&
          player.controller === "ai" &&
          player.tacticalRole !== "GK" &&
          player.stunTimer <= 0,
      )
      .map((player) => ({ player, d: distance(player, target) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((entry) => entry.player);
  }

  function applyMovement(player, target, dt, urgency) {
    if (player.stunTimer > 0) {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.vx *= Math.pow(0.12, dt);
      player.vy *= Math.pow(0.12, dt);
      player.x = clamp(player.x, 22, FIELD.width - 22);
      player.y = clamp(player.y, 24, FIELD.height - 24);
      if (Math.hypot(player.vx, player.vy) > 8) {
        const facing = normalize(player.vx, player.vy);
        player.facingX = facing.x;
        player.facingY = facing.y;
      }
      return;
    }

    if (player.slideTimer > 0) {
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.vx *= Math.pow(0.11, dt);
      player.vy *= Math.pow(0.11, dt);
      player.x = clamp(player.x, 22, FIELD.width - 22);
      player.y = clamp(player.y, 24, FIELD.height - 24);
      if (Math.hypot(player.vx, player.vy) > 8) {
        const facing = normalize(player.vx, player.vy);
        player.facingX = facing.x;
        player.facingY = facing.y;
      }
      player.stamina = Math.max(0.12, player.stamina - dt * 0.03);
      return;
    }

    const sizeDrag = 1 - Math.pow(player.stats.physical, 1.1) * 0.2;
    const speedDrive = speedDriveFromStat(player.stats.speed, 1.55);
    const speedBoost = speedBoostMultiplier(player);
    const accelBoost = speedBoostAccelMultiplier(player);
    const speed =
      (78 + speedDrive * 388) *
      speedBoost *
      (0.8 + urgency * 0.38) *
      (0.72 + player.stamina * 0.28) *
      sizeDrag;
    const accel = (320 + speedDrive * 930 + (1 - player.stats.physical) * 155) * accelBoost;
    const mix = clamp((accel * dt) / Math.max(speed, 1), 0, 1);

    player.vx = lerp(player.vx, target.x * speed, mix);
    player.vy = lerp(player.vy, target.y * speed, mix);
    if (Math.hypot(player.vx, player.vy) > 8) {
      const facing = normalize(player.vx, player.vy);
      player.facingX = facing.x;
      player.facingY = facing.y;
    }
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.vx *= 0.985;
    player.vy *= 0.985;

    player.x = clamp(player.x, 22, FIELD.width - 22);
    player.y = clamp(player.y, 24, FIELD.height - 24);

    if (urgency > 0.7) {
      player.stamina = Math.max(0.2, player.stamina - dt * 0.08 * urgency);
    } else {
      player.stamina = Math.min(1, player.stamina + dt * 0.05);
    }
  }

  function moveToward(player, targetX, targetY, dt, urgency) {
    const steering = normalize(targetX - player.x, targetY - player.y);
    const slow = Math.min(1, steering.len / 90);
    applyMovement(player, { x: steering.x * slow, y: steering.y * slow }, dt, urgency);
  }

  function humanPlayer() {
    return players.find((player) => player.controller === "human");
  }

  function inputVector() {
    let side = 0;
    let forwardAmount = 0;
    if (actionPressed("moveLeft")) side -= 1;
    if (actionPressed("moveRight")) side += 1;
    if (actionPressed("moveUp")) forwardAmount += 1;
    if (actionPressed("moveDown")) forwardAmount -= 1;
    if (side === 0 && forwardAmount === 0) return { x: 0, y: 0, len: 0 };

    const forward = cameraForward2d();
    const right = cameraRight2d(forward);
    return normalize(
      forward.x * forwardAmount + right.x * side,
      forward.y * forwardAmount + right.y * side,
    );
  }

  function isSliding(player) {
    return player.slideTimer > 0 && player.stunTimer <= 0;
  }

  function startSlide(player, move) {
    if (player.slideCooldown > 0 || player.stunTimer > 0 || player.stamina < 0.18) return false;

    const aim = move.len > 0 ? move : cameraForward2d();
    const speedDrive = speedDriveFromStat(player.stats.speed, 1.35);
    const slideSpeed =
      (540 +
        speedDrive * 560 +
        Math.pow(player.stats.physical, 1.08) * 150) *
      speedBoostMultiplier(player);
    player.slideTimer = SLIDE_DURATION;
    player.slideCooldown = SLIDE_COOLDOWN;
    player.slideDirX = aim.x;
    player.slideDirY = aim.y;
    player.slideHitBall = false;
    player.slideHitPlayers?.clear();
    player.facingX = aim.x;
    player.facingY = aim.y;
    player.vx = aim.x * slideSpeed;
    player.vy = aim.y * slideSpeed;
    player.stamina = Math.max(0.12, player.stamina - 0.24 + player.stats.physical * 0.06);
    addImpactEffect("slide", player.x, player.y, { color: "#ffffff", radius: 0.72, ttl: 0.28, height: 0.08 });
    return true;
  }

  function moveFromPayload(payload) {
    const raw = payload?.move || {};
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    if (!x && !y) return { x: 0, y: 0, len: 0 };
    return normalize(x, y);
  }

  function remoteControlState(player) {
    const control = online.remoteInputs.get(player.id) || null;
    if (!control) return null;
    if (performance.now() - control.receivedAt > 900) return null;
    return control;
  }

  function updateControlledPlayer(player, plan, dt) {
    const remoteControl = player.controller === "remote" ? remoteControlState(player) : null;
    const move = player.controller === "remote" ? moveFromPayload(remoteControl) : inputVector();
    const slideQueued = player.controller === "remote" ? Boolean(remoteControl?.slideQueued) : input.slideQueued;
    const itemQueued = player.controller === "remote" ? Boolean(remoteControl?.itemQueued) : input.itemQueued;
    const sprintingPressed = player.controller === "remote" ? Boolean(remoteControl?.sprint) : actionPressed("sprint");

    if (remoteControl?.facing && move.len <= 0.02) {
      const facing = normalize(remoteControl.facing.x || 0, remoteControl.facing.y || 0);
      player.facingX = facing.x;
      player.facingY = facing.y;
    }

    if (slideQueued) {
      startSlide(player, move);
      if (player.controller === "remote") remoteControl.slideQueued = false;
      else input.slideQueued = false;
    }

    const sprinting =
      sprintingPressed &&
      player.stamina > 0.24 &&
      move.len > 0;
    applyMovement(player, move, dt, sprinting ? 1 : 0.62);

    if (itemQueued) {
      useHeldItem(player);
      if (player.controller === "remote") remoteControl.itemQueued = false;
      else input.itemQueued = false;
    }
  }

  function updateItemDrops(dt) {
    itemDrops = updateItemDropsLogic(match, itemDrops, players, FIELD, itemCharges, (player) => {
      if (!player.isHuman) return;
      logEvent(() => `${tr("event.picked")} ${heldItemLabel(player)}`);
      showToast(heldItemLabel(player));
    }, dt);
  }

  function addImpactEffect(type, x, y, options = {}) {
    const color =
      options.color ||
      (type === "rocket"
        ? "#ff4f5e"
        : type === "shockwave"
          ? "#ff8fab"
          : type === "magnet"
            ? "#9b5de5"
            : "#ffd166");
    impactEffects.push({
      id: `impact-${Math.random().toString(16).slice(2)}`,
      type,
      x,
      y,
      color,
      radius: options.radius || 1,
      ttl: options.ttl || IMPACT_EFFECT_DURATION,
      duration: options.ttl || IMPACT_EFFECT_DURATION,
      height: options.height || 0.18,
    });
    impactEffects = impactEffects.slice(-28);
  }

  function applyKnockback(player, aim, force, reaction = HIT_REACTION_DURATION) {
    const resistance = physicalResistanceFromStat(player?.stats?.physical);
    const power = force / resistance;
    player.vx = aim.x * power;
    player.vy = aim.y * power;
    player.hitReactionTimer = Math.max(player.hitReactionTimer || 0, reaction);
    player.hitDirX = aim.x;
    player.hitDirY = aim.y;
  }

  function applyShockwave(player) {
    const radius = SHOCKWAVE_RADIUS;
    const visibleAction = player.isHuman || player.teamKey === "home";
    const ballDistance = distance(player, ball);
    addImpactEffect("shockwave", player.x, player.y, { radius: 3.0, ttl: 0.62, height: 0.2 });

    if (ballDistance < radius + ball.radius) {
      const fallback = normalize(player.facingX || player.team.side, player.facingY || 0);
      const aim = ballDistance < 2 ? fallback : normalize(ball.x - player.x, ball.y - player.y);
      const force = SHOCKWAVE_BALL_FORCE + (1 - clamp(ballDistance / radius, 0, 1)) * SHOCKWAVE_BALL_CLOSE_BONUS;
      ball.carrier = null;
      ball.vx = aim.x * force + player.vx * 0.28;
      ball.vy = aim.y * force + player.vy * 0.28;
      const pushedY = clamp(ball.y + aim.y * 14, ball.radius, FIELD.height - ball.radius);
      ball.x = clampBallXForY(FIELD, ball.radius, ball.x + aim.x * 14, pushedY);
      ball.y = pushedY;
      ball.lastTouch = player.teamKey;
      if (visibleAction) logEvent(() => tr("event.ballBlast"));
    }

    for (const opponent of players) {
      if (opponent.teamKey === player.teamKey || opponent === player) continue;
      const d = distance(player, opponent);
      if (d > radius + opponent.radius) continue;
      const aim = d < 2 ? normalize(player.facingX || player.team.side, player.facingY || 0) : normalize(opponent.x - player.x, opponent.y - player.y);
      const force = SHOCKWAVE_PLAYER_FORCE + (1 - clamp(d / radius, 0, 1)) * SHOCKWAVE_PLAYER_CLOSE_BONUS;
      if (opponent.shieldTimer > 0) {
        opponent.shieldTimer = Math.max(0, opponent.shieldTimer - 1.8);
        addImpactEffect("shield", opponent.x, opponent.y, { color: "#4ec7ff", radius: 1.45, ttl: 0.4, height: 0.46 });
        if (opponent.isHuman) showToast(tr("toast.shieldBlock"));
        continue;
      }
      applyKnockback(opponent, aim, force, 0.64);
      addImpactEffect("shockwave", opponent.x, opponent.y, { radius: 1.35, ttl: 0.44, height: 0.26 });
      opponent.stunTimer = Math.max(opponent.stunTimer, shockwaveStunDuration(opponent));
    }
  }

  function useHeldItem(player) {
    if (!player.heldItem || player.stunTimer > 0) return false;

    const item = player.heldItem;
    const isVisibleAction = player.isHuman || player.teamKey === "home";

    if (item === "boost") {
      clearHeldItem(player);
      player.speedBoostTimer = ITEM_TYPES.boost.duration;
      if (isVisibleAction) logEvent(() => playerEvent(player, "speedBoost"));
      if (player.isHuman) showToast(itemName("boost"));
      return true;
    }

    if (item === "power") {
      clearHeldItem(player);
      player.powerBoostTimer = ITEM_TYPES.power.duration;
      if (isVisibleAction) logEvent(() => playerEvent(player, "powerCore"));
      if (player.isHuman) showToast(itemName("power"));
      return true;
    }

    if (item === "magnet") {
      clearHeldItem(player);
      player.magnetTimer = ITEM_TYPES.magnet.duration;
      if (isVisibleAction) logEvent(() => playerEvent(player, "magnetOn"));
      if (player.isHuman) showToast(itemName("magnet"));
      return true;
    }

    if (item === "shield") {
      clearHeldItem(player);
      player.shieldTimer = ITEM_TYPES.shield.duration;
      if (isVisibleAction) logEvent(() => playerEvent(player, "shieldOn"));
      if (player.isHuman) showToast(itemName("shield"));
      return true;
    }

    if (item === "shockwave") {
      clearHeldItem(player);
      player.shockwaveTimer = IMPACT_EFFECT_DURATION;
      applyShockwave(player);
      if (isVisibleAction) logEvent(() => playerEvent(player, "shockwave"));
      if (player.isHuman) showToast(itemName("shockwave"));
      return true;
    }

    if (item === "rocket") {
      const facing = normalize(player.facingX || player.team.side, player.facingY || 0);
      rockets.push({
        id: `rocket-${Math.random().toString(16).slice(2)}`,
        x: player.x + facing.x * (player.radius + 18),
        y: player.y + facing.y * (player.radius + 18),
        vx: facing.x * ROCKET_SPEED,
        vy: facing.y * ROCKET_SPEED,
        dirX: facing.x,
        dirY: facing.y,
        radius: 9,
        ownerTeam: player.teamKey,
        ttl: ROCKET_TTL,
      });
      if (isVisibleAction) logEvent(() => playerEvent(player, "rocket"));
      player.heldItemCharges = Math.max(0, (player.heldItemCharges || itemCharges("rocket")) - 1);
      if (player.heldItemCharges <= 0) {
        player.heldItem = null;
      }
      if (player.isHuman) showToast(player.heldItem ? heldItemLabel(player) : itemName("rocket"));
      return true;
    }

    return false;
  }

  function applyRocketToBall(rocket) {
    const aim = normalize(rocket.vx, rocket.vy);
    ball.carrier = null;
    ball.vx = aim.x * ROCKET_BALL_FORCE;
    ball.vy = aim.y * ROCKET_BALL_FORCE;
    ball.x += aim.x * 20;
    ball.y += aim.y * 20;
    addImpactEffect("rocket", ball.x, ball.y, { radius: 1.65, ttl: 0.5, height: 0.2 });
    logEvent(() => tr("event.ballBlast"));
  }

  function applyRocketToPlayer(rocket, player) {
    const aim = normalize(rocket.dirX ?? rocket.vx, rocket.dirY ?? rocket.vy);
    if (player.shieldTimer > 0) {
      player.shieldTimer = Math.max(0, player.shieldTimer - 2.8);
      addImpactEffect("shield", player.x, player.y, { color: "#4ec7ff", radius: 1.35, ttl: 0.38, height: 0.46 });
      if (player.isHuman) showToast(tr("toast.shieldBlock"));
      return;
    }

    if (ball.carrier === player) {
      ball.carrier = null;
      ball.vx = aim.x * ROCKET_CARRIER_BALL_FORCE;
      ball.vy = aim.y * ROCKET_CARRIER_BALL_FORCE;
    }
    player.stunTimer = rocketStunDuration(player);
    applyKnockback(player, aim, ROCKET_PLAYER_KNOCKBACK, 0.82);
    addImpactEffect("rocket", player.x, player.y, { radius: 1.85, ttl: 0.58, height: 0.42 });
    if (player.isHuman || rocket.ownerTeam === "home") logEvent(() => playerEvent(player, "stun"));
    if (player.isHuman) showToast(tr("toast.stunned"));
  }

  function updateRockets(dt) {
    for (const rocket of rockets) {
      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      rocket.ttl -= dt;

      if (distance(rocket, ball) < rocket.radius + ball.radius + 4) {
        applyRocketToBall(rocket);
        rocket.ttl = 0;
        continue;
      }

      for (const player of players) {
        if (player.teamKey === rocket.ownerTeam) continue;
        if (distance(rocket, player) > rocket.radius + player.radius + 3) continue;
        applyRocketToPlayer(rocket, player);
        rocket.ttl = 0;
        break;
      }
    }

    rockets = rockets.filter(
      (rocket) =>
        rocket.ttl > 0 &&
        rocket.x > -40 &&
        rocket.x < FIELD.width + 40 &&
        rocket.y > -40 &&
        rocket.y < FIELD.height + 40,
    );
  }

  function updateStatusTimers(dt) {
    updateStatusTimersState(players, dt);
  }

  function updateImpactEffects(dt) {
    impactEffects = updateImpactEffectsState(impactEffects, dt);
  }

  function updateActiveItemEffects(dt) {
    updateActiveItemEffectsState(players, ball, dt);
  }

  function updateAiItemUse(player, dt) {
    updateAiItemUseLogic(player, ball, dt, aiMovementProfile(player).itemUse, nearestOpponentDistance, useHeldItem);
  }

  function updateCarrier(player, plan, dt) {
    const ai = aiMovementProfile(player);
    const lane =
      (player.slot - 2) * 34 +
      Math.sin(match.elapsed * 1.3 + player.slot) * 18 * plan.width +
      Math.sin(match.elapsed * 1.8 + ai.lanePhase) * ai.laneJitter;
    const targetX = clamp(player.x + player.team.side * (110 + plan.tempo * 165 + ai.attackPush), 28, FIELD.width - 28);
    const targetY = clamp(FIELD.height / 2 + lane, 42, FIELD.height - 42);
    moveToward(player, targetX, targetY, dt, clamp((0.7 + plan.tempo * 0.3 + ai.chaseUrgency) * ai.urgency, 0.36, 1.34));
  }

  function moveToFreeBallSupport(player, plan, dt, rank) {
    const side = player.team.side;
    const behavior = tacticBehavior(plan);
    const ai = aiMovementProfile(player);
    const attacking = ball.lastTouch === player.teamKey || side * ball.vx > 36;
    const leadTime = clamp(distance(player, ball) / 360, 0.24, 1.15);
    const edge = ballEdgeInward(FIELD, ball, 76);
    let projectedX = ball.x + ball.vx * leadTime;
    let projectedY = ball.y + ball.vy * leadTime;
    if (edge.len) {
      projectedX = ball.x + edge.x * (86 + rank * 24);
      projectedY = ball.y + edge.y * (86 + rank * 24);
    }
    projectedX = clamp(projectedX, 32, FIELD.width - 32);
    projectedY = clamp(projectedY, 42, FIELD.height - 42);
    const laneSide = player.homeY < FIELD.height / 2 ? -1 : 1;
    const counterOutlet = plan.id === "counter" && player.tacticalRole === "FW" ? 70 : 0;
    const attackOffset =
      (player.tacticalRole === "FW" ? 126 : player.tacticalRole === "CM" ? 78 : 30) +
      behavior.attackPush +
      ai.attackPush +
      counterOutlet;
    const defendOffset = Math.max(
      24,
      (player.tacticalRole === "DF" ? 118 : player.tacticalRole === "CM" ? 82 : 58) + behavior.defendDrop + ai.defendDrop,
    );
    const xOffset = side * (attacking ? attackOffset : -defendOffset);
    const yOffset = laneSide * (72 + rank * 34) * (0.55 + plan.width * 0.45) * behavior.shapeWidth * ai.shapeWidth;
    const urgency = clamp((0.68 + plan.tempo * 0.18 + plan.press * 0.12 + behavior.chaseUrgency + ai.chaseUrgency) * ai.urgency, 0.38, 1.34);

    moveToward(
      player,
      clamp(projectedX + xOffset, 34, FIELD.width - 34),
      clamp(projectedY + yOffset, 42, FIELD.height - 42),
      dt,
      urgency,
    );
  }

  function updateNonCarrier(player, plan, dt, carriers) {
    const carrier = ball.carrier;
    const side = player.team.side;
    const behavior = tacticBehavior(plan);
    const ai = aiMovementProfile(player);

    if (player.tacticalRole === "GK") {
      const keeperDepth = clamp(behavior.keeperDepth + ai.keeperDepth, 38, 118);
      const keeperX = player.team.ownGoalX === 0 ? keeperDepth : FIELD.width - keeperDepth;
      const keeperY = clamp(ball.y, FIELD.goalTop - 48, FIELD.goalBottom + 48);
      moveToward(player, keeperX, keeperY, dt, clamp(0.55 * ai.urgency + ai.chaseUrgency, 0.32, 1.08));
      return;
    }

    if (!carrier) {
      const chaseCount = clamp(behavior.looseChasers, 1, 3);
      const chasers = closestAiFieldPlayers(player.teamKey, ball, chaseCount);
      const chaseRank = chasers.indexOf(player);
      if (chaseRank === 0) {
        const rescueTarget = ballRescueTarget(FIELD, ball, player);
        if (rescueTarget) {
          moveToward(player, rescueTarget.x, rescueTarget.y, dt, clamp((1.04 + plan.press * 0.06 + behavior.chaseUrgency + ai.chaseUrgency) * ai.urgency, 0.58, 1.36));
          return;
        }
        moveToward(player, ball.x, ball.y, dt, clamp((0.94 + plan.press * 0.08 + behavior.chaseUrgency + ai.chaseUrgency) * ai.urgency, 0.52, 1.34));
        return;
      }
      if (chaseRank > 0) {
        moveToFreeBallSupport(player, plan, dt, chaseRank);
        return;
      }
      holdShape(player, plan, dt, 0.58 + plan.tempo * 0.12);
      return;
    }

    if (carrier.teamKey === player.teamKey) {
      if (carrier === player) return;
      const progress = side === 1 ? carrier.x / FIELD.width : (FIELD.width - carrier.x) / FIELD.width;
      const counterOutlet = plan.id === "counter" && player.tacticalRole === "FW" ? 102 : 0;
      const counterAnchor = plan.id === "counter" && player.tacticalRole === "DF" ? -44 : 0;
      const pressStep = plan.id === "press" ? (player.tacticalRole === "FW" ? 42 : 24) : 0;
      const rolePush =
        (player.tacticalRole === "FW" ? 86 + plan.risk * 76 : player.tacticalRole === "CM" ? 44 : 6) +
        counterOutlet +
        counterAnchor +
        pressStep +
        ai.attackPush;
      const targetX = clamp(
        player.homeX + side * ((plan.line - 0.5) * 170 + (behavior.lineShift + ai.lineShift) * 0.55 + progress * 82 + rolePush),
        35,
        FIELD.width - 35,
      );
      const targetY =
        FIELD.height / 2 +
        (player.homeY - FIELD.height / 2) * (0.54 + plan.width * 0.86) * ai.shapeWidth +
        Math.sin(match.elapsed * 1.8 + player.slot * 1.7 + ai.lanePhase) * (16 + ai.laneJitter * 0.4);
      moveToward(
        player,
        targetX,
        clamp(targetY, 40, FIELD.height - 40),
        dt,
        clamp((0.42 + plan.tempo * 0.2 + behavior.chaseUrgency * 0.4 + ai.chaseUrgency * 0.5) * ai.urgency, 0.3, 1.18),
      );
      return;
    }

    const pressCount = clamp(behavior.carrierPressers, 1, 3);
    const chasers = closestAiFieldPlayers(player.teamKey, carrier, pressCount);
    const pressRadius = Math.max(
      120,
      210 + plan.press * 260 + (player.stats.physical + player.stats.speed) * 70 + behavior.pressRadius + ai.pressRadius,
    );

    if (chasers.includes(player) && distance(player, carrier) < pressRadius) {
      moveToward(
        player,
        carrier.x - carrier.team.side * 8,
        carrier.y,
        dt,
        clamp((0.8 + plan.press * 0.25 + behavior.chaseUrgency + ai.chaseUrgency) * ai.urgency, 0.42, 1.4),
      );
      return;
    }

    holdShape(player, plan, dt, clamp((plan.id === "counter" ? 0.62 : 0.5) * ai.urgency + ai.chaseUrgency * 0.35, 0.28, 1.12));
  }

  function holdShape(player, plan, dt, urgency) {
    const side = player.team.side;
    const behavior = tacticBehavior(plan);
    const ai = aiMovementProfile(player);
    const ballProgress = side === 1 ? ball.x / FIELD.width : (FIELD.width - ball.x) / FIELD.width;
    let roleBias = player.tacticalRole === "FW" ? 58 : player.tacticalRole === "DF" ? -34 : 16;
    if (plan.id === "counter") {
      roleBias = player.tacticalRole === "FW" ? 112 : player.tacticalRole === "DF" ? -74 : -12;
    } else if (plan.id === "press") {
      roleBias = player.tacticalRole === "FW" ? 116 : player.tacticalRole === "DF" ? 12 : 54;
    }
    const targetX = clamp(
      player.homeX + side * ((plan.line - 0.5) * 170 + behavior.lineShift + ai.lineShift + (ballProgress - 0.5) * 178 + roleBias + ai.attackPush * 0.55),
      35,
      FIELD.width - 35,
    );
    const targetY =
      FIELD.height / 2 +
      (player.homeY - FIELD.height / 2) * (0.66 + plan.width * 0.5) * behavior.shapeWidth * ai.shapeWidth +
      (ball.y - FIELD.height / 2) * (behavior.ballPull + ai.ballPull) +
      Math.sin(match.elapsed * 1.45 + player.slot * 1.6 + ai.lanePhase) * (12 + ai.laneJitter * 0.45);
    moveToward(player, targetX, clamp(targetY, 44, FIELD.height - 44), dt, urgency);
  }

  function updateBall(dt) {
    ball.carrier = null;
    if (checkGoalCrossing()) return;

    const prevX = ball.x;
    const prevY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vx *= Math.pow(0.18, dt);
    ball.vy *= Math.pow(0.18, dt);

    if (checkGoalCrossing(prevX, prevY)) return;

    if (ball.y < ball.radius || ball.y > FIELD.height - ball.radius) {
      ball.y = clamp(ball.y, ball.radius, FIELD.height - ball.radius);
      ball.vy *= -0.5;
    }

    const nextX = clampBallXForY(FIELD, ball.radius, ball.x, ball.y);
    if (ball.x !== nextX) {
      ball.x = nextX;
      ball.vx *= -0.44;
    }

    const edge = ballEdgeInward(FIELD, ball, 18);
    if (edge.len && Math.hypot(ball.vx, ball.vy) < 24) {
      ball.vx += edge.x * 18 * dt;
      ball.vy += edge.y * 18 * dt;
    }
  }

  function resolvePossession(dt, homePlan, awayPlan) {
    const ballSpeed = Math.hypot(ball.vx, ball.vy);
    for (const player of players) {
      if (player.stunTimer > 0) continue;
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const d = Math.hypot(dx, dy) || 1;
      const min = player.radius + ball.radius + 1;
      if (d >= min) continue;
      const nx = dx / d;
      const ny = dy / d;
      const overlap = min - d;
      const pushedY = clamp(ball.y + ny * (overlap + 0.8), ball.radius, FIELD.height - ball.radius);
      ball.x = clampBallXForY(FIELD, ball.radius, ball.x + nx * (overlap + 0.8), pushedY);
      ball.y = pushedY;
      const edge = ballEdgeInward(FIELD, ball, 44);
      let impulseX = nx;
      let impulseY = ny;
      if (edge.len) {
        const inwardDot = impulseX * edge.x + impulseY * edge.y;
        if (inwardDot < 0.25) {
          const impulse = normalize(impulseX + edge.x * (0.75 - inwardDot), impulseY + edge.y * (0.75 - inwardDot));
          impulseX = impulse.x;
          impulseY = impulse.y;
          const slide = Math.min(4, overlap * 0.35 + 0.6);
          const slidY = clamp(ball.y + edge.y * slide, ball.radius, FIELD.height - ball.radius);
          ball.x = clampBallXForY(FIELD, ball.radius, ball.x + edge.x * slide, slidY);
          ball.y = slidY;
        }
      }
      const powerCore = player.powerBoostTimer > 0 ? 1.5 : 1;
      const powerRatio = clamp(player.stats.power, 0, 1);
      const powerDrive = Math.pow(powerRatio, 1.05);
      const powerShove = powerShoveFromStat(powerRatio) * powerCore;
      const sliding = isSliding(player);
      const slideFreshHit = sliding && !player.slideHitBall;
      const slideAim = normalize(player.slideDirX || player.facingX || nx, player.slideDirY || player.facingY || ny);
      if (sliding) {
        const slideBlend = normalize(impulseX + slideAim.x * 1.8, impulseY + slideAim.y * 1.8);
        impulseX = slideBlend.x;
        impulseY = slideBlend.y;
      }
      let shove =
        powerShove +
        overlap * 8;
      if (sliding) {
        shove +=
          (slideFreshHit ? 330 : 95) +
          powerDrive * 220;
        if (slideFreshHit) {
          addImpactEffect("slide", ball.x, ball.y, { color: "#ffffff", radius: 1.08, ttl: 0.34, height: 0.16 });
          player.slideHitBall = true;
        }
      }
      const contactMix = sliding
        ? clamp(0.6 + powerDrive * 0.22, 0, 0.96)
        : clamp(ballSpeed > 760 ? 0.22 + powerDrive * 0.3 : 0.42 + powerDrive * 0.36, 0, 0.9);
      ball.vx = lerp(ball.vx, impulseX * shove, contactMix);
      ball.vy = lerp(ball.vy, impulseY * shove, contactMix);
      ball.carrier = null;
      ball.lastTouch = player.teamKey;
      if (player.tacticalRole === "GK" && player.cooldown <= 0 && Math.abs(ball.x - player.team.ownGoalX) < 95) {
        player.cooldown = 0.22;
        if (player.teamKey === "home") logEvent(() => playerEvent(player, "save"));
      }
    }
  }

  function resolvePlayerContact() {
    const handleSlideHit = (attacker, target, dirX, dirY) => {
      if (!isSliding(attacker) || attacker.teamKey === target.teamKey) return;
      if (!attacker.slideHitPlayers) attacker.slideHitPlayers = new Set();
      if (attacker.slideHitPlayers.has(target.id)) return;

      const aim = normalize(attacker.slideDirX || attacker.facingX || dirX, attacker.slideDirY || attacker.facingY || dirY);
      const forwardContact = aim.x * dirX + aim.y * dirY;
      if (forwardContact < -0.05) return;

      attacker.slideHitPlayers.add(target.id);
      const force =
        (410 + attacker.stats.physical * 430 + attacker.stats.speed * 240) *
        speedBoostMultiplier(attacker);
      applyKnockback(target, aim, force, 0.54);
      addImpactEffect("slide", target.x, target.y, { color: "#ffffff", radius: 1.0, ttl: 0.34, height: 0.26 });
      if (target.shieldTimer > 0) {
        target.shieldTimer = Math.max(0, target.shieldTimer - 0.7);
      } else {
        target.stunTimer = Math.max(target.stunTimer, 0.5 + (1 - target.stats.physical) * 1.5);
      }
      if (attacker.isHuman) logEvent(() => playerEvent(attacker, "tackle"));
    };

    for (let i = 0; i < players.length; i += 1) {
      for (let j = i + 1; j < players.length; j += 1) {
        const a = players[i];
        const b = players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.radius + b.radius - 2;
        const d = Math.hypot(dx, dy) || 1;
        if (d >= min) continue;
        const overlap = min - d;
        const nx = dx / d;
        const ny = dy / d;
        const massA = 0.82 + Math.pow(a.stats.physical, 1.28) * 1.78;
        const massB = 0.82 + Math.pow(b.stats.physical, 1.28) * 1.78;
        const totalMass = massA + massB;
        const pushA = overlap * (massB / totalMass);
        const pushB = overlap * (massA / totalMass);
        a.x -= nx * pushA;
        a.y -= ny * pushA;
        b.x += nx * pushB;
        b.y += ny * pushB;

        handleSlideHit(a, b, nx, ny);
        handleSlideHit(b, a, -nx, -ny);
      }
    }
  }

  function scoreGoal(teamKey) {
    match.score[teamKey] += 1;
    const eventKey = teamKey === "home" ? "event.homeGoal" : "event.awayGoal";
    logEvent(() => tr(eventKey));

    const target = targetGoals();
    if (target && match.score[teamKey] >= target) {
      updateHud();
      endMatch(teamKey);
      return;
    }

    showToast(tr(eventKey));
    resetPositions();
    resetBall(teamKey === "home" ? "away" : "home");
    impactEffects = [];
    updateHud();
  }

  function step(dt) {
    if (match.paused || match.ended) return;
    if (!canSimulateMatch()) return;

    match.elapsed += dt;
    if (isTimedMatch()) match.secondsLeft -= dt;
    if (isTimedMatch() && match.secondsLeft <= 0) {
      match.secondsLeft = 0;
      endMatch();
      return;
    }

    const homePlan = teamPlan("home");
    const awayPlan = teamPlan("away");
    updateAiTacticalRoles(homePlan, awayPlan);
    updateStatusTimers(dt);
    updateItemDrops(dt);

    ball.carrier = null;
    match.possession[ball.lastTouch] += dt * 0.35;

    for (const player of players) {
      player.cooldown = Math.max(0, player.cooldown - dt);
      const plan = player.teamKey === "home" ? homePlan : awayPlan;
      if (player.controller === "ai") {
        updateAiItemUse(player, dt);
        updateNonCarrier(player, plan, dt, null);
      } else {
        updateControlledPlayer(player, plan, dt);
      }
    }

    resolvePlayerContact();
    updateActiveItemEffects(dt);
    updateImpactEffects(dt);
    updateBall(dt);
    updateRockets(dt);
    resolvePossession(dt, homePlan, awayPlan);
  }

  function endMatch(winnerKey = null) {
    match.ended = true;
    match.paused = true;
    ball.carrier = null;
    ball.vx = 0;
    ball.vy = 0;
    let eventKey = "event.fullTimeDraw";
    if (winnerKey === "home" || (!winnerKey && match.score.home > match.score.away)) {
      eventKey = "event.homeWin";
    } else if (winnerKey === "away" || (!winnerKey && match.score.away > match.score.home)) {
      eventKey = "event.awayWin";
    }
    logEvent(() => tr(eventKey));
    showToast(tr(eventKey));
  }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("visible");
    match.toastTimer = 1.35;
  }

  function logEvent(text) {
    const elapsed = Math.max(0, Math.floor(match.elapsed));
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    const getText = typeof text === "function" ? text : null;
    match.log.unshift({ time: `${minutes}:${seconds}`, text: getText ? getText() : text, getText });
    match.log = match.log.slice(0, 7);
    renderLog();
  }

  function renderLog() {
    matchLog.replaceChildren(
      ...match.log.map((entry) => {
        const item = document.createElement("li");
        const time = document.createElement("time");
        const text = document.createElement("span");
        time.textContent = entry.time;
        text.textContent = entry.getText ? entry.getText() : entry.text;
        item.append(time, text);
        return item;
      }),
    );
  }

  function onlineRequest(path, options = {}) {
    return fetch(path, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(options.headers || {}),
      },
    });
  }

  function roomSetupSignature() {
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
      teamSettings: state.teamSettings,
    });
  }

  function applyHostSettings(settings) {
    if (!settings) return;
    const incomingTeams = settings.teams || {
      home: { ...teamSetting("home"), tactic: settings.tactic },
      away: teamSetting("away"),
    };
    state.teamSettings = normalizeTeamSettings({
      home: { ...teamSetting("home"), ...(incomingTeams.home || {}) },
      away: { ...teamSetting("away"), ...(incomingTeams.away || {}) },
    });
    if (MATCH_RULES[settings.matchRule]) {
      state.matchRule = settings.matchRule;
      setActiveButton(matchRuleButtons, "matchRule", state.matchRule);
    }
    setActiveButton(tacticButtons, "tactic", currentTacticSelection());
    setActiveButton(kitButtons, "kit", currentKitSelection());
  }

  function applyOnlineRoom(room) {
    if (!room) return;
    online.connected = true;
    online.connecting = false;
    online.roomCode = sanitizeRoomCode(room.code || online.roomCode);
    online.hostId = room.hostId || null;
    online.slots = Array.isArray(room.slots) ? room.slots : [];
    const localSlot = localOnlineSlot();
    if (localSlot && state.onlineTeamPreference !== localSlot.teamKey) {
      state.onlineTeamPreference = normalizeOnlineTeam(localSlot.teamKey);
      saveOnlineTeam();
    }
    applyHostSettings(room.settings);
    updateShareUrl();

    const signature = roomSetupSignature();
    const shouldRefreshPlayers =
      signature !== online.lastRoomSetupSignature &&
      (match.paused || match.elapsed <= 0.01 || !players.length);
    online.lastRoomSetupSignature = signature;
    if (shouldRefreshPlayers) {
      setupMatch(true);
    } else {
      updateAiTacticalRoles(teamPlan("home"), teamPlan("away"));
      updateTeamKits();
      updatePlayerNamesFromOnlineSlots();
      updateHud();
    }
    updateOnlineUi();
  }

  function localSlotText() {
    const slot = localOnlineSlot();
    if (!slot) return tr("ui.onlineAiFill");
    const name = localPlayerName();
    const role = playerRoleFromSlot(slot);
    const hostTag = isOnlineHost() ? tr("ui.onlineHost") : tr("ui.onlineGuest");
    return `${hostTag} / ${name} / ${onlineSlotLabel(slot.teamKey, slot.slot)} / ${role}`;
  }

  function updateOnlineUi() {
    const active = isOnlineActive();
    const pendingCode = !active && !online.connecting ? sanitizeRoomCode(online.pendingRoomCode) : "";
    const statusKey = online.connecting
      ? "ui.onlineConnecting"
      : active
        ? isOnlineHost()
          ? "ui.onlineHost"
          : "ui.onlineGuest"
        : pendingCode
          ? "ui.readyRoom"
        : "ui.onlineSolo";
    const connectedCount = online.slots.filter((slot) => slot.connected).length;
    const roomText = active && online.roomCode
      ? `${tr(statusKey)} ${online.roomCode}`
      : pendingCode
        ? `${tr(statusKey)} ${pendingCode}`
        : tr(statusKey);

    if (onlineBadge) onlineBadge.textContent = active ? `${connectedCount}/8` : tr(statusKey);
    if (onlineStatus) onlineStatus.textContent = roomText;
    if (onlineSlot) onlineSlot.textContent = active ? localSlotText() : pendingCode ? tr("ui.onlinePendingBuild") : tr("ui.onlineAiFill");
    if (createRoomButton) {
      createRoomButton.disabled = online.connecting;
      createRoomButton.textContent = pendingCode ? tr("ui.joinRoom") : active ? tr("ui.copyLink") : tr("ui.createRoom");
    }
    if (copyRoomButton) copyRoomButton.disabled = !active || !online.shareUrl;
    if (leaveRoomButton) leaveRoomButton.disabled = !active && !online.connecting && !pendingCode;
    if (roomLinkInput) {
      roomLinkInput.value = active ? online.shareUrl : pendingCode ? window.location.href : "";
      roomLinkInput.placeholder = active ? "" : tr("ui.onlineSolo");
    }
    renderOnlineTeamButtons();
    renderOnlinePlayers();
  }

  function renderOnlinePlayers() {
    if (!onlinePlayers) return;
    if (!isOnlineActive()) {
      onlinePlayers.replaceChildren();
      return;
    }

    const chips = online.slots.map((slot) => {
      const chip = document.createElement("div");
      chip.className = `online-player-chip${slot.clientId === online.clientId ? " is-you" : ""}${slot.connected ? "" : " is-offline"}`;

      const label = document.createElement("strong");
      const role = playerRoleFromSlot(slot);
      const name = displayNameForOnlineSlot(slot, slot.teamKey, slot.slot) || onlineSlotLabel(slot.teamKey, slot.slot);
      label.textContent = name;

      const detail = document.createElement("span");
      const you = slot.clientId === online.clientId ? ` / ${tr("ui.you")}` : "";
      const host = slot.clientId === online.hostId ? ` / ${tr("ui.onlineHost")}` : "";
      detail.textContent = `${onlineSlotLabel(slot.teamKey, slot.slot)} / ${role} / ${slot.connected ? "ONLINE" : "OFFLINE"}${you}${host}`;

      chip.append(label, detail);
      return chip;
    });
    onlinePlayers.replaceChildren(...chips);
  }

  async function refreshNetworkOrigin() {
    online.networkOrigin = "";
    if (!["127.0.0.1", "localhost", "::1"].includes(window.location.hostname)) return;
    try {
      const response = await fetch("/api/network");
      if (!response.ok) return;
      const data = await response.json();
      const origin = data?.lanOrigins?.[0];
      if (origin) online.networkOrigin = origin;
    } catch {
      // Link sharing still works from the current origin.
    }
  }

  function updateRoomUrl(roomCode = online.roomCode) {
    if (!roomCode) return;
    const current = new URL(window.location.href);
    current.searchParams.set(ONLINE_ROOM_PARAM, roomCode);
    current.searchParams.set("v", "splititems-final");
    window.history.replaceState({}, "", current);
  }

  function clearRoomUrl() {
    const current = new URL(window.location.href);
    current.searchParams.delete(ONLINE_ROOM_PARAM);
    current.searchParams.set("v", "splititems-final");
    window.history.replaceState({}, "", current);
  }

  function updateShareUrl() {
    if (!online.roomCode) {
      online.shareUrl = "";
      return;
    }
    const current = new URL(window.location.href);
    current.searchParams.set(ONLINE_ROOM_PARAM, online.roomCode);
    current.searchParams.set("v", "splititems-final");
    online.shareUrl = online.networkOrigin
      ? `${online.networkOrigin}${current.pathname}${current.search}${current.hash}`
      : current.href;
  }

  function connectOnlineEvents(roomCode) {
    if (online.eventSource) online.eventSource.close();
    const events = new EventSource(`/api/rooms/${encodeURIComponent(roomCode)}/events?clientId=${encodeURIComponent(online.clientId)}`);
    online.eventSource = events;

    events.addEventListener("room", (event) => {
      try {
        applyOnlineRoom(JSON.parse(event.data));
      } catch {
        // A malformed room event should not break local play.
      }
    });

    events.addEventListener("message", (event) => {
      try {
        handleOnlineMessage(JSON.parse(event.data));
      } catch {
        // Ignore malformed relay messages.
      }
    });

    events.onerror = () => {
      if (!online.roomCode) return;
      online.connected = false;
      online.connecting = false;
      updateOnlineUi();
    };
  }

  async function createOnlineRoom() {
    online.pendingRoomCode = "";
    online.connecting = true;
    updateOnlineUi();
    try {
      await refreshNetworkOrigin();
      const response = await onlineRequest("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ clientId: online.clientId, profile: onlineProfile() }),
      });
      if (!response.ok) throw new Error("room-create-failed");
      const data = await response.json();
      online.roomCode = sanitizeRoomCode(data.room?.code || data.roomCode);
      updateRoomUrl(online.roomCode);
      connectOnlineEvents(online.roomCode);
      applyOnlineRoom(data.room);
      showToast(tr("toast.roomCreated"));
    } catch {
      online.connecting = false;
      online.connected = false;
      updateOnlineUi();
      showToast(tr("toast.onlineOffline"));
    }
  }

  async function joinOnlineRoom(roomCode) {
    const code = sanitizeRoomCode(roomCode);
    if (!code) return;
    online.connecting = true;
    online.roomCode = code;
    updateOnlineUi();
    try {
      await refreshNetworkOrigin();
      const response = await onlineRequest(`/api/rooms/${encodeURIComponent(code)}/join`, {
        method: "POST",
        body: JSON.stringify({ clientId: online.clientId, profile: onlineProfile() }),
      });
      if (response.status === 409) {
        showToast(tr("toast.roomFull"));
        throw new Error("room-full");
      }
      if (!response.ok) throw new Error("room-join-failed");
      const data = await response.json();
      updateRoomUrl(code);
      connectOnlineEvents(code);
      online.pendingRoomCode = "";
      applyOnlineRoom(data.room);
      showToast(tr("toast.joinedRoom"));
    } catch (error) {
      online.connecting = false;
      online.connected = false;
      online.roomCode = null;
      updateOnlineUi();
      if (error?.message !== "room-full") showToast(tr("toast.onlineOffline"));
    }
  }

  function leaveOnlineRoom() {
    const roomCode = online.roomCode;
    if (online.eventSource) online.eventSource.close();
    online.eventSource = null;
    online.roomCode = null;
    online.hostId = null;
    online.connected = false;
    online.connecting = false;
    online.slots = [];
    online.pendingRoomCode = "";
    online.shareUrl = "";
    online.remoteInputs.clear();
    online.lastRoomSetupSignature = "";
    online.lastProfileSignature = "";
    if (roomCode) {
      onlineRequest(`/api/rooms/${encodeURIComponent(roomCode)}/leave`, {
        method: "POST",
        body: JSON.stringify({ clientId: online.clientId }),
      }).catch(() => {});
    }
    clearRoomUrl();
    setupMatch(true);
    updateOnlineUi();
  }

  async function copyRoomLink() {
    if (!online.shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(online.shareUrl);
      } else if (roomLinkInput) {
        roomLinkInput.select();
        document.execCommand("copy");
      }
      showToast(tr("toast.copied"));
    } catch {
      if (roomLinkInput) roomLinkInput.select();
      showToast(tr("toast.copyFailed"));
    }
  }

  function sendOnlineMessage(type, payload) {
    if (!isOnlineActive()) return;
    onlineRequest(`/api/rooms/${encodeURIComponent(online.roomCode)}/message`, {
      method: "POST",
      body: JSON.stringify({ clientId: online.clientId, type, payload }),
    }).catch(() => {});
  }

  function sendOnlineProfile(force = false) {
    if (!online.roomCode) return;
    const profile = onlineProfile();
    const signature = JSON.stringify(profile);
    if (!force && signature === online.lastProfileSignature) return;
    online.lastProfileSignature = signature;
    onlineRequest(`/api/rooms/${encodeURIComponent(online.roomCode)}/profile`, {
      method: "POST",
      body: JSON.stringify({ clientId: online.clientId, profile }),
    }).catch(() => {});
  }

  function handleOnlineMessage(message) {
    if (!message || message.senderId === online.clientId) return;
    if (message.type === "input" && isOnlineHost()) {
      const payload = message.payload || {};
      if (!payload.playerId) return;
      online.remoteInputs.set(payload.playerId, {
        ...payload,
        receivedAt: performance.now(),
      });
    } else if (message.type === "snapshot" && !isOnlineHost()) {
      applyOnlineSnapshot(message.payload);
    }
  }

  function onlineInputPayload() {
    const player = humanPlayer();
    if (!player) return null;
    const move = inputVector();
    const facing = cameraForward2d();
    return {
      playerId: player.id,
      move: move.len > 0 ? { x: move.x, y: move.y } : { x: 0, y: 0 },
      sprint: actionPressed("sprint"),
      slideQueued: input.slideQueued,
      itemQueued: input.itemQueued,
      facing: { x: facing.x, y: facing.y },
    };
  }

  function sendOnlineInput(timestamp) {
    if (!isOnlineActive() || isOnlineHost()) return;
    const payload = onlineInputPayload();
    if (!payload) return;
    const hasAction = payload.slideQueued || payload.itemQueued;
    const signature = JSON.stringify(payload);
    if (!hasAction && signature === online.lastInputSignature && timestamp - online.lastInputSent < ONLINE_INPUT_INTERVAL) return;
    if (!hasAction && timestamp - online.lastInputSent < ONLINE_INPUT_INTERVAL) return;
    online.lastInputSignature = signature;
    online.lastInputSent = timestamp;
    sendOnlineMessage("input", payload);
    if (payload.slideQueued) input.slideQueued = false;
    if (payload.itemQueued) input.itemQueued = false;
  }

  function sendOnlineSnapshot(timestamp) {
    if (!isOnlineActive() || !isOnlineHost()) return;
    if (timestamp - online.lastSnapshotSent < ONLINE_SNAPSHOT_INTERVAL) return;
    online.lastSnapshotSent = timestamp;
    sendOnlineMessage("snapshot", createOnlineSnapshot(match, ball, players, itemDrops, rockets));
  }

  function applyOnlineSnapshot(snapshot) {
    const next = applyOnlineSnapshotState(snapshot, match, ball, players);
    if (next.itemDrops) itemDrops = next.itemDrops;
    if (next.rockets) rockets = next.rockets;
  }

  function initOnlineFromUrl() {
    if (online.pendingRoomCode) {
      updateRoomUrl(online.pendingRoomCode);
    }
    updateOnlineUi();
  }

  function formatClock() {
    if (!isTimedMatch()) return matchRuleLabel(state.matchRule);
    const remaining = Math.max(0, Math.ceil(match.secondsLeft));
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function calculatePower() {
    return playerRole();
  }

  function winnerEventKey() {
    if (match.score.home === match.score.away) return "event.fullTimeDraw";
    return match.score.home > match.score.away ? "event.homeWin" : "event.awayWin";
  }

  function updateLobbyDisplay() {
    const rule = matchRuleLabel(state.matchRule);
    const role = calculatePower();
    const tactic = tacticLabel(currentTacticSelection());
    const bodyColor = kitLabel(currentKitSelection());
    const status = match.ended
      ? tr(winnerEventKey())
      : !match.paused
        ? tr("toast.matchOn")
        : match.elapsed > 0
          ? tr("toast.paused")
          : tr("ui.ready");

    if (lobbyStatus) lobbyStatus.textContent = status;
    if (lobbyRule) lobbyRule.textContent = rule;
    if (lobbyRole) lobbyRole.textContent = role;
    if (lobbyTactic) lobbyTactic.textContent = tactic;
    if (lobbyBodyColor) lobbyBodyColor.textContent = bodyColor;
    if (overlayRule) overlayRule.textContent = rule;
    if (overlayRole) overlayRole.textContent = role;
    if (overlayTactic) overlayTactic.textContent = tactic;
    if (lobbyOverlay) lobbyOverlay.hidden = !(match.paused && !match.ended && match.elapsed <= 0.01);
  }

  function isMatchPresentationPlaying() {
    return !match.paused && !match.ended && settingsOverlay.hidden;
  }

  function setMouseLookActive(active) {
    input.looking = active;
    if (active) input.mouseLookArmed = true;
    canvas.classList.toggle("is-looking", active || document.pointerLockElement === canvas);
  }

  function resetEdgeLook() {
    input.edgeLookX = 0;
    input.edgeLookY = 0;
  }

  function updateEdgeLookFromPointer(clientX, clientY) {
    if (!isMatchPresentationPlaying() || document.pointerLockElement === canvas || !input.mouseLookArmed) {
      resetEdgeLook();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const margin = EDGE_LOOK_MARGIN;
    const leftPush = clamp((rect.left + margin - clientX) / margin, 0, 1);
    const rightPush = clamp((clientX - (rect.right - margin)) / margin, 0, 1);
    const topPush = clamp((rect.top + margin - clientY) / margin, 0, 1);
    const bottomPush = clamp((clientY - (rect.bottom - margin)) / margin, 0, 1);
    input.edgeLookX = rightPush - leftPush;
    input.edgeLookY = bottomPush - topPush;
  }

  function updateFallbackMouseLook(dt) {
    if (!isMatchPresentationPlaying() || document.pointerLockElement === canvas || !input.mouseLookArmed) {
      resetEdgeLook();
      return;
    }
    if (!input.edgeLookX && !input.edgeLookY) return;

    rotateCameraLook(
      input.edgeLookX * EDGE_LOOK_PIXELS_PER_SECOND * dt,
      input.edgeLookY * EDGE_LOOK_PIXELS_PER_SECOND * dt,
      CAMERA_SENSITIVITY,
    );
  }

  function requestMouseLookLock() {
    if (!isMatchPresentationPlaying()) return;
    setMouseLookActive(true);
    if (!canvas.requestPointerLock || document.pointerLockElement === canvas) return;
    const keepFallbackLook = () => setMouseLookActive(input.pointerDragging || input.pointerInside || input.mouseLookArmed);
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest?.catch) lockRequest.catch(keepFallbackLook);
    } catch {
      keepFallbackLook();
    }
  }

  function releaseMouseLook() {
    input.pointerDragging = false;
    input.pointerInside = false;
    input.mouseLookArmed = false;
    resetEdgeLook();
    setMouseLookActive(false);
    if (document.pointerLockElement === canvas && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  function syncPresentationMode() {
    const playing = isMatchPresentationPlaying();
    if (match.presentationPlaying === playing) return;
    match.presentationPlaying = playing;
    appShell.classList.toggle("is-playing", playing);
    if (!playing) releaseMouseLook();
    requestAnimationFrame(resizeCanvas);
  }

  function updateHud() {
    syncPresentationMode();
    homeScoreEl.textContent = match.score.home;
    awayScoreEl.textContent = match.score.away;
    clockEl.textContent = formatClock();
    updateLobbyDisplay();

    aceName.textContent = isOnlineActive() ? localPlayerName() : tr("ui.myPlayer");
    styleName.textContent = tacticLabel(currentTacticSelection());
    teamPower.textContent = calculatePower();
    speedButton.textContent = `${match.speed}x`;

    if (possessionFill && momentumFill) {
      const totalPossession = match.possession.home + match.possession.away;
      const possessionPct = clamp((match.possession.home / totalPossession) * 100, 0, 100);
      const fieldMomentum = clamp((ball.x / FIELD.width) * 100, 0, 100);
      const carrierMomentum =
        ball.carrier?.teamKey === "home" ? 8 : ball.carrier?.teamKey === "away" ? -8 : 0;
      possessionFill.style.width = `${possessionPct}%`;
      momentumFill.style.width = `${clamp(fieldMomentum + carrierMomentum, 0, 100)}%`;
    }

    playPauseButton.setAttribute("aria-label", match.paused ? tr("aria.startMatch") : tr("aria.pauseMatch"));
    playPauseIcon.innerHTML = match.paused ? '<path d="M8 5v14l11-7z"></path>' : '<path d="M8 5h3v14H8zM13 5h3v14h-3z"></path>';

    const human = humanPlayer();
    const held = human?.heldItem || null;
    heldItemIcon.textContent = held ? itemIcon(held) : "-";
    heldItemName.textContent = held ? heldItemLabel(human) : tr("ui.empty");
    playHeldItemIcon.textContent = held ? itemIcon(held) : "-";
    playHeldItemName.textContent = held ? heldItemLabel(human) : tr("ui.empty");
    itemUseButton.disabled = !held || !human || human.stunTimer > 0 || match.paused || match.ended;

    if (!human) {
      itemEffect.textContent = tr("status.ready");
    } else if (human.stunTimer > 0) {
      itemEffect.textContent = `${tr("status.stun")} ${Math.ceil(human.stunTimer)}s`;
    } else if (human.speedBoostTimer > 0) {
      itemEffect.textContent = `${tr("status.boost")} ${Math.ceil(human.speedBoostTimer)}s`;
    } else if (human.powerBoostTimer > 0) {
      itemEffect.textContent = `${tr("status.power")} ${Math.ceil(human.powerBoostTimer)}s`;
    } else if (human.magnetTimer > 0) {
      itemEffect.textContent = `${tr("status.magnet")} ${Math.ceil(human.magnetTimer)}s`;
    } else if (human.shieldTimer > 0) {
      itemEffect.textContent = `${tr("status.shield")} ${Math.ceil(human.shieldTimer)}s`;
    } else {
      itemEffect.textContent = tr("status.ready");
    }
  }

  function worldX(x) {
    return (x - FIELD.width / 2) * WORLD_SCALE;
  }

  function worldZ(y) {
    return (y - FIELD.height / 2) * WORLD_SCALE;
  }

  function worldPosition(x, y, elevation = 0) {
    return new THREE.Vector3(worldX(x), elevation, worldZ(y));
  }

  function materialKey(type, color, options = {}) {
    return [
      type,
      color,
      options.opacity ?? 1,
      options.emissive ?? "",
      options.roughness ?? "",
      options.metalness ?? "",
    ].join(":");
  }

  function standardMaterial(color, options = {}) {
    const key = materialKey("standard", color, options);
    if (!view3d.materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: options.emissive || "#000000",
        emissiveIntensity: options.emissiveIntensity || 0,
        metalness: options.metalness ?? 0.04,
        roughness: options.roughness ?? 0.72,
        transparent: options.opacity !== undefined && options.opacity < 1,
        opacity: options.opacity ?? 1,
      });
      view3d.materials.set(key, material);
    }
    return view3d.materials.get(key);
  }

  function basicMaterial(color, options = {}) {
    const key = materialKey("basic", color, options);
    if (!view3d.materials.has(key)) {
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: options.opacity !== undefined && options.opacity < 1,
        opacity: options.opacity ?? 1,
        depthWrite: options.depthWrite ?? true,
        side: options.side ?? THREE.FrontSide,
      });
      view3d.materials.set(key, material);
    }
    return view3d.materials.get(key);
  }

  function lineMaterial(color, opacity = 1) {
    const key = `line:${color}:${opacity}`;
    if (!view3d.materials.has(key)) {
      view3d.materials.set(
        key,
        new THREE.LineBasicMaterial({
          color,
          transparent: opacity < 1,
          opacity,
        }),
      );
    }
    return view3d.materials.get(key);
  }

  function initThreeGeometries() {
    if (view3d.geometries.body) return;
    view3d.geometries.body = new THREE.CapsuleGeometry(0.78, 1.02, 12, 32);
    view3d.geometries.torsoBulge = new THREE.SphereGeometry(0.76, 30, 20);
    view3d.geometries.hipBulge = new THREE.SphereGeometry(0.64, 26, 16);
    view3d.geometries.shoulder = new THREE.CapsuleGeometry(0.22, 1.42, 8, 18);
    view3d.geometries.joint = new THREE.SphereGeometry(0.34, 22, 16);
    view3d.geometries.pelvis = new THREE.SphereGeometry(0.58, 28, 18);
    view3d.geometries.arm = new THREE.CapsuleGeometry(0.17, 1.06, 8, 16);
    view3d.geometries.leg = new THREE.CapsuleGeometry(0.25, 0.82, 10, 18);
    view3d.geometries.head = new THREE.SphereGeometry(0.64, 30, 20);
    view3d.geometries.neck = new THREE.CylinderGeometry(0.22, 0.28, 0.34, 20);
    view3d.geometries.limb = new THREE.CapsuleGeometry(0.18, 1.18, 8, 16);
    view3d.geometries.hand = new THREE.CapsuleGeometry(0.12, 0.1, 8, 12);
    view3d.geometries.foot = new THREE.SphereGeometry(0.28, 18, 12);
    view3d.geometries.shadow = new THREE.CircleGeometry(1.8, 28);
    view3d.geometries.marker = new THREE.TorusGeometry(1.72, 0.06, 8, 40);
    view3d.geometries.statusRing = new THREE.TorusGeometry(2.02, 0.06, 8, 44);
    view3d.geometries.ball = new THREE.SphereGeometry(ball.radius * WORLD_SCALE, 26, 18);
    view3d.geometries.ballPatch = new THREE.TorusGeometry(ball.radius * WORLD_SCALE * 0.46, 0.018, 8, 24);
    view3d.geometries.itemBox = new THREE.BoxGeometry(1.75, 1.75, 1.75);
    view3d.geometries.itemCore = new THREE.OctahedronGeometry(1.08, 0);
    view3d.geometries.shieldCore = new THREE.TorusGeometry(0.9, 0.14, 12, 32);
    view3d.geometries.rocketBody = new THREE.CylinderGeometry(0.32, 0.32, 1.72, 18);
    view3d.geometries.rocketNose = new THREE.ConeGeometry(0.48, 0.9, 18);
    view3d.geometries.rocketFlame = new THREE.ConeGeometry(0.62, 1.16, 16);
    view3d.geometries.rocketTrail = new THREE.CylinderGeometry(0.14, 0.46, 5.8, 18);
    view3d.geometries.rocketTrailGlow = new THREE.CylinderGeometry(0.3, 0.8, 6.8, 18);
    view3d.geometries.impactRing = new THREE.TorusGeometry(1, 0.045, 8, 64);
    view3d.geometries.impactCore = new THREE.SphereGeometry(0.22, 18, 12);
    view3d.geometries.patchBox = new THREE.BoxGeometry(1, 1, 1);
    view3d.geometries.patchDot = new THREE.SphereGeometry(0.11, 10, 8);
    view3d.geometries.visor = new THREE.SphereGeometry(0.5, 18, 10);
    view3d.geometries.faceDot = new THREE.SphereGeometry(0.085, 12, 8);
    view3d.geometries.faceShade = new THREE.SphereGeometry(0.48, 18, 10);
    view3d.geometries.capCrown = new THREE.SphereGeometry(0.66, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    view3d.geometries.capBrim = new THREE.CylinderGeometry(0.48, 0.42, 0.13, 32);
    view3d.geometries.capBand = new THREE.TorusGeometry(0.62, 0.035, 8, 48);
    view3d.geometries.stunStar = new THREE.TorusGeometry(0.22, 0.035, 7, 16);
  }

  function createLine(points, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y]) => worldPosition(x, y, 0.07)));
    return new THREE.Line(geometry, material);
  }

  function addRectLine(group, x1, y1, x2, y2, material) {
    group.add(
      createLine(
        [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
          [x1, y1],
        ],
        material,
      ),
    );
  }

  function addCircleLine(group, cx, cy, radius, start, end, material, segments = 96) {
    const points = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = start + ((end - start) * i) / segments;
      points.push([cx + Math.cos(t) * radius, cy + Math.sin(t) * radius]);
    }
    group.add(createLine(points, material));
  }

  function addGoalMesh(group, fieldX) {
    const side = fieldX === 0 ? -1 : 1;
    const goalWidth = (FIELD.goalBottom - FIELD.goalTop) * WORLD_SCALE;
    const goalDepth = FIELD.goalDepth * WORLD_SCALE;
    const frontX = worldX(fieldX);
    const backX = worldX(fieldX + side * FIELD.goalDepth);
    const centerX = (frontX + backX) / 2;
    const centerZ = worldZ((FIELD.goalTop + FIELD.goalBottom) / 2);
    const topY = 2.75;
    const bottomY = 0.08;
    const postThickness = 0.16;
    const frontPostMaterial = standardMaterial("#fbfaf4", { roughness: 0.32, metalness: 0.02 });
    const rearPostMaterial = standardMaterial("#dfe9e5", { roughness: 0.48, metalness: 0.02 });
    const netPanelMaterial = basicMaterial("#dbe7e1", { opacity: 0.11, depthWrite: false, side: THREE.DoubleSide });
    const netLine = lineMaterial("#e8f2ed", 0.5);

    const addBar = (size, position, material = frontPostMaterial) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      bar.position.set(...position);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);
      return bar;
    };

    const addGoalLine = (points) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      );
      group.add(new THREE.Line(geometry, netLine));
    };

    for (const z of [worldZ(FIELD.goalTop), worldZ(FIELD.goalBottom)]) {
      addBar([postThickness, topY, postThickness], [frontX, topY / 2, z]);
      addBar([postThickness * 0.82, topY, postThickness * 0.82], [backX, topY / 2, z], rearPostMaterial);
      addBar([goalDepth, postThickness * 0.72, postThickness * 0.72], [centerX, topY, z], rearPostMaterial);
      addBar([goalDepth, postThickness * 0.58, postThickness * 0.58], [centerX, bottomY, z], rearPostMaterial);
    }

    addBar([postThickness, postThickness, goalWidth + postThickness], [frontX, topY, centerZ]);
    addBar([postThickness * 0.82, postThickness * 0.82, goalWidth + postThickness], [backX, topY, centerZ], rearPostMaterial);
    addBar([postThickness * 0.62, postThickness * 0.62, goalWidth], [backX, bottomY, centerZ], rearPostMaterial);

    const backNet = new THREE.Mesh(new THREE.BoxGeometry(0.035, topY, goalWidth), netPanelMaterial);
    backNet.position.set(backX, topY / 2, centerZ);
    group.add(backNet);

    const topNet = new THREE.Mesh(new THREE.BoxGeometry(goalDepth, 0.035, goalWidth), netPanelMaterial);
    topNet.position.set(centerX, topY, centerZ);
    group.add(topNet);

    for (const z of [worldZ(FIELD.goalTop), worldZ(FIELD.goalBottom)]) {
      const sideNet = new THREE.Mesh(new THREE.BoxGeometry(goalDepth, topY, 0.035), netPanelMaterial);
      sideNet.position.set(centerX, topY / 2, z);
      group.add(sideNet);
    }

    for (let i = 1; i <= 5; i += 1) {
      const z = worldZ(FIELD.goalTop + ((FIELD.goalBottom - FIELD.goalTop) * i) / 6);
      addGoalLine([[backX, bottomY, z], [backX, topY, z]]);
    }

    for (let i = 1; i <= 3; i += 1) {
      const y = bottomY + ((topY - bottomY) * i) / 4;
      addGoalLine([[backX, y, worldZ(FIELD.goalTop)], [backX, y, worldZ(FIELD.goalBottom)]]);
    }

    for (let i = 1; i <= 3; i += 1) {
      const x = frontX + (backX - frontX) * (i / 4);
      for (const z of [worldZ(FIELD.goalTop), worldZ(FIELD.goalBottom)]) {
        addGoalLine([[x, bottomY, z], [x, topY, z]]);
      }
    }
  }

  function createPitchMesh() {
    const group = new THREE.Group();
    const stripeWidth = FIELD_WORLD.width / 10;
    for (let i = 0; i < 10; i += 1) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(stripeWidth, FIELD_WORLD.depth),
        standardMaterial(i % 2 === 0 ? "#198653" : "#13784a", { roughness: 0.95 }),
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.x = -FIELD_WORLD.width / 2 + stripeWidth * (i + 0.5);
      stripe.receiveShadow = true;
      group.add(stripe);
    }

    const edgeMaterial = standardMaterial("#0a3121", { roughness: 0.78 });
    const wallThickness = 0.38;
    const walls = [
      { size: [FIELD_WORLD.width + wallThickness * 2, 0.34, wallThickness], pos: [0, 0.17, -FIELD_WORLD.depth / 2 - wallThickness / 2] },
      { size: [FIELD_WORLD.width + wallThickness * 2, 0.34, wallThickness], pos: [0, 0.17, FIELD_WORLD.depth / 2 + wallThickness / 2] },
      { size: [wallThickness, 0.34, FIELD_WORLD.depth], pos: [-FIELD_WORLD.width / 2 - wallThickness / 2, 0.17, 0] },
      { size: [wallThickness, 0.34, FIELD_WORLD.depth], pos: [FIELD_WORLD.width / 2 + wallThickness / 2, 0.17, 0] },
    ];
    for (const wall of walls) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...wall.size), edgeMaterial);
      mesh.position.set(...wall.pos);
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    const white = lineMaterial("#f6f2e9", 0.74);
    const penaltyTop = FIELD.height / 2 - PITCH_MARKINGS.penaltyWidth / 2;
    const penaltyBottom = FIELD.height / 2 + PITCH_MARKINGS.penaltyWidth / 2;
    const goalBoxTop = FIELD.height / 2 - PITCH_MARKINGS.goalBoxWidth / 2;
    const goalBoxBottom = FIELD.height / 2 + PITCH_MARKINGS.goalBoxWidth / 2;
    addRectLine(group, 0, 0, FIELD.width, FIELD.height, white);
    group.add(createLine([[FIELD.width / 2, 0], [FIELD.width / 2, FIELD.height]], white));
    addCircleLine(group, FIELD.width / 2, FIELD.height / 2, PITCH_MARKINGS.centerCircleRadius, 0, Math.PI * 2, white);
    addRectLine(group, 0, penaltyTop, PITCH_MARKINGS.penaltyDepth, penaltyBottom, white);
    addRectLine(group, 0, goalBoxTop, PITCH_MARKINGS.goalBoxDepth, goalBoxBottom, white);
    addCircleLine(group, PITCH_MARKINGS.penaltyDepth, FIELD.height / 2, PITCH_MARKINGS.penaltyArcRadius, -Math.PI / 2, Math.PI / 2, white, 48);
    addRectLine(group, FIELD.width - PITCH_MARKINGS.penaltyDepth, penaltyTop, FIELD.width, penaltyBottom, white);
    addRectLine(group, FIELD.width - PITCH_MARKINGS.goalBoxDepth, goalBoxTop, FIELD.width, goalBoxBottom, white);
    addCircleLine(group, FIELD.width - PITCH_MARKINGS.penaltyDepth, FIELD.height / 2, PITCH_MARKINGS.penaltyArcRadius, Math.PI / 2, Math.PI * 1.5, white, 48);

    const centerSpot = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 24),
      basicMaterial("#f6f2e9", { opacity: 0.78, side: THREE.DoubleSide }),
    );
    centerSpot.rotation.x = -Math.PI / 2;
    centerSpot.position.set(0, 0.085, 0);
    group.add(centerSpot);

    addGoalMesh(group, 0);
    addGoalMesh(group, FIELD.width);
    return group;
  }

  function createStadiumMesh() {
    const group = new THREE.Group();
    const concrete = standardMaterial("#284c5d", { roughness: 0.88 });
    const concreteDark = standardMaterial("#193542", { roughness: 0.9 });
    const rail = standardMaterial("#dbe7e6", { roughness: 0.5 });
    const crowdMaterials = [
      standardMaterial("#f6f2e9", { roughness: 0.72 }),
      standardMaterial("#ffd166", { roughness: 0.72 }),
      standardMaterial("#ff6b6b", { roughness: 0.72 }),
      standardMaterial("#4ec7ff", { roughness: 0.72 }),
      standardMaterial("#70e000", { roughness: 0.72 }),
    ];

    const addStand = (side) => {
      const longSide = side === "north" || side === "south";
      const sign = side === "north" || side === "west" ? -1 : 1;
      const baseX = longSide ? 0 : sign * (FIELD_WORLD.width / 2 + 8);
      const baseZ = longSide ? sign * (FIELD_WORLD.depth / 2 + 7) : 0;
      const length = longSide ? FIELD_WORLD.width + 20 : FIELD_WORLD.depth + 10;
      const yaw = longSide ? 0 : Math.PI / 2;

      for (let row = 0; row < 5; row += 1) {
        const depthOffset = row * 1.9;
        const height = 0.75 + row * 0.55;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(length, 0.42, 1.4),
          row % 2 === 0 ? concrete : concreteDark,
        );
        mesh.position.set(baseX, height, baseZ);
        if (longSide) mesh.position.z += sign * depthOffset;
        else mesh.position.x += sign * depthOffset;
        mesh.rotation.y = yaw;
        mesh.receiveShadow = true;
        group.add(mesh);

        const railMesh = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.12), rail);
        railMesh.position.copy(mesh.position);
        railMesh.position.y += 0.36;
        railMesh.rotation.y = yaw;
        group.add(railMesh);
      }

      const crowdCount = longSide ? 38 : 24;
      for (let i = 0; i < crowdCount; i += 1) {
        const row = i % 4;
        const along = (i / (crowdCount - 1) - 0.5) * length * 0.86;
        const dot = new THREE.Mesh(
          new THREE.BoxGeometry(0.46, 0.32, 0.24),
          crowdMaterials[(i + row) % crowdMaterials.length],
        );
        dot.position.set(baseX, 1.55 + row * 0.48, baseZ);
        if (longSide) {
          dot.position.x = along;
          dot.position.z += sign * (1.2 + row * 1.65);
        } else {
          dot.position.x += sign * (1.2 + row * 1.65);
          dot.position.z = along;
        }
        dot.rotation.y = yaw;
        group.add(dot);
      }
    };

    for (const side of ["north", "south", "west", "east"]) addStand(side);

    const lightMaterial = standardMaterial("#dbe7e6", { roughness: 0.34, metalness: 0.18 });
    const glowMaterial = basicMaterial("#fff4dc", { opacity: 0.82, depthWrite: false });
    for (const x of [-FIELD_WORLD.width / 2 - 11, FIELD_WORLD.width / 2 + 11]) {
      for (const z of [-FIELD_WORLD.depth / 2 - 9, FIELD_WORLD.depth / 2 + 9]) {
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 13, 0.28), lightMaterial);
        pole.position.set(x, 6.5, z);
        pole.castShadow = true;
        group.add(pole);

        const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, 1), glowMaterial);
        lamp.position.set(x, 13.3, z);
        lamp.lookAt(0, 1.8, 0);
        group.add(lamp);
      }
    }

    const tunnel = new THREE.Mesh(
      new THREE.BoxGeometry(9, 2.2, 2.2),
      standardMaterial("#0f252d", { roughness: 0.8 }),
    );
    tunnel.position.set(0, 1.1, FIELD_WORLD.depth / 2 + 8.2);
    group.add(tunnel);

    return group;
  }

  function createTacticLine() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1, worldZ(34)),
      new THREE.Vector3(0, 0.1, worldZ(FIELD.height - 34)),
    ]);
    const line = new THREE.Line(geometry, lineMaterial("#ffd166", 0.46));
    line.renderOrder = 4;
    return line;
  }

  function createBallObject() {
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 28),
      basicMaterial("#000000", { opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    group.add(shadow);

    const ballMesh = new THREE.Mesh(view3d.geometries.ball, standardMaterial("#fff9ec", { roughness: 0.38 }));
    ballMesh.position.y = ball.radius * WORLD_SCALE;
    ballMesh.castShadow = true;
    group.add(ballMesh);

    const patch = new THREE.Mesh(view3d.geometries.ballPatch, basicMaterial("#20231f", { opacity: 0.9 }));
    patch.position.y = ball.radius * WORLD_SCALE;
    patch.rotation.x = Math.PI / 2.8;
    group.add(patch);
    group.userData.ballMesh = ballMesh;
    return group;
  }

  function playerAccent(player) {
    if (!player.isHuman) return player.team.trim;
    const index = typeof player.skinId === "number" ? player.skinId : 0;
    return SKIN_ACCENTS[index % SKIN_ACCENTS.length];
  }

  function addPatch(parent, material, position, scale, rotation = [0, 0, 0]) {
    const patch = new THREE.Mesh(view3d.geometries.patchBox, material);
    patch.position.set(...position);
    patch.scale.set(...scale);
    patch.rotation.set(...rotation);
    parent.add(patch);
    return patch;
  }

  function addSkinDecoration(parent, player, accentMaterial) {
    const pattern = player.isHuman ? (player.skinId || 0) % 6 : 1;
    if (pattern === 0) {
      addPatch(parent, accentMaterial, [-0.36, 2.62, 0.98], [0.12, 1.2, 0.05]);
      addPatch(parent, accentMaterial, [0.36, 2.62, 0.98], [0.12, 1.2, 0.05]);
    } else if (pattern === 1) {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.055, 8, 36), accentMaterial);
      belt.position.set(0, 2.42, 0);
      belt.rotation.x = Math.PI / 2;
      parent.add(belt);
    } else if (pattern === 2) {
      for (const [x, y] of [[-0.34, 2.82], [0.28, 2.45], [0, 3.18]]) {
        const dot = new THREE.Mesh(view3d.geometries.patchDot, accentMaterial);
        dot.position.set(x, y, 1.02);
        dot.scale.setScalar(1.65);
        parent.add(dot);
      }
    } else if (pattern === 3) {
      addPatch(parent, accentMaterial, [0, 2.68, 1.02], [0.16, 1.58, 0.05], [0, 0, -0.58]);
    } else if (pattern === 4) {
      addPatch(parent, accentMaterial, [-0.28, 2.75, 1.02], [0.13, 0.86, 0.05], [0, 0, 0.5]);
      addPatch(parent, accentMaterial, [0.28, 2.75, 1.02], [0.13, 0.86, 0.05], [0, 0, -0.5]);
    } else {
      addPatch(parent, accentMaterial, [0, 4.28, 0.91], [0.86, 0.13, 0.06]);
    }
  }

  function createPlayerObject(player) {
    const root = new THREE.Group();
    const kit = playerKitStyle(player);
    const figureMaterial = standardMaterial(kit.base || "#f8fbff", { roughness: 0.36, metalness: 0.02 });
    const footMaterial = standardMaterial(kit.foot || kit.base || "#f8fbff", { roughness: 0.4, metalness: 0.02 });
    const trimMaterial = standardMaterial(kit.trim || kit.accent || "#ffffff", { roughness: 0.38, metalness: 0.02 });
    const capMaterial = standardMaterial(kit.cap || "#ffffff", { roughness: 0.3, metalness: 0.02 });
    const accentMaterial = standardMaterial(kit.accent, {
      emissive: player.isHuman ? kit.accent : "#000000",
      emissiveIntensity: player.isHuman ? 0.05 : 0,
      roughness: 0.42,
      metalness: 0.03,
    });
    const faceShadeMaterial = basicMaterial("#8ea9d6", { opacity: 0.32, depthWrite: false });

    const shadow = new THREE.Mesh(
      view3d.geometries.shadow,
      basicMaterial("#000000", { opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    root.add(shadow);

    const marker = new THREE.Mesh(
      view3d.geometries.marker,
      basicMaterial("#ffd166", { opacity: 0.9, depthWrite: false }),
    );
    marker.rotation.x = Math.PI / 2;
    marker.position.y = 0.12;
    marker.visible = player.isHuman;
    root.add(marker);

    const boostRing = new THREE.Mesh(
      view3d.geometries.statusRing,
      basicMaterial("#70e000", { opacity: 0.84, depthWrite: false }),
    );
    boostRing.rotation.x = Math.PI / 2;
    boostRing.position.y = 0.18;
    boostRing.visible = false;
    root.add(boostRing);

    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.22, 0.08, 8, 44),
      basicMaterial("#4ec7ff", { opacity: 0.82, depthWrite: false }),
    );
    shieldRing.rotation.x = Math.PI / 2;
    shieldRing.position.y = 1.15;
    shieldRing.visible = false;
    root.add(shieldRing);

    const powerRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.16, 0.075, 8, 44),
      basicMaterial("#ffd166", { opacity: 0.86, depthWrite: false }),
    );
    powerRing.rotation.x = Math.PI / 2;
    powerRing.position.y = 0.24;
    powerRing.visible = false;
    root.add(powerRing);

    const magnetRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.48, 0.065, 8, 52),
      basicMaterial("#9b5de5", { opacity: 0.78, depthWrite: false }),
    );
    magnetRing.rotation.x = Math.PI / 2;
    magnetRing.position.y = 0.36;
    magnetRing.visible = false;
    root.add(magnetRing);

    const waveRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.66, 0.08, 8, 56),
      basicMaterial("#ff8fab", { opacity: 0.82, depthWrite: false }),
    );
    waveRing.rotation.x = Math.PI / 2;
    waveRing.position.y = 0.3;
    waveRing.visible = false;
    root.add(waveRing);

    const ballRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.07, 8, 44),
      basicMaterial("#ffffff", { opacity: 0.88, depthWrite: false }),
    );
    ballRing.rotation.x = Math.PI / 2;
    ballRing.position.y = 0.22;
    ballRing.visible = false;
    root.add(ballRing);

    const body = new THREE.Mesh(view3d.geometries.body, figureMaterial);
    body.position.y = 1.66;
    body.scale.set(1.03, 0.96, 0.84);
    body.castShadow = true;
    root.add(body);

    const torsoBulge = new THREE.Mesh(view3d.geometries.torsoBulge, figureMaterial);
    torsoBulge.position.set(0, 1.78, 0.04);
    torsoBulge.scale.set(1.06, 1.18, 0.82);
    torsoBulge.castShadow = true;
    root.add(torsoBulge);

    const hipBulge = new THREE.Mesh(view3d.geometries.hipBulge, figureMaterial);
    hipBulge.position.set(0, 0.98, 0);
    hipBulge.scale.set(1.14, 0.78, 0.82);
    hipBulge.castShadow = true;
    root.add(hipBulge);

    const pelvis = new THREE.Mesh(view3d.geometries.pelvis, figureMaterial);
    pelvis.position.set(0, 0.7, 0.02);
    pelvis.scale.set(1.24, 0.54, 0.78);
    pelvis.castShadow = true;
    root.add(pelvis);

    const neck = new THREE.Mesh(view3d.geometries.neck, figureMaterial);
    neck.position.y = 2.96;
    neck.castShadow = true;
    root.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.48, 0.08);
    root.add(headGroup);

    const head = new THREE.Mesh(view3d.geometries.head, figureMaterial);
    head.scale.set(0.92, 1.06, 0.9);
    head.castShadow = true;
    headGroup.add(head);

    const faceShade = new THREE.Mesh(view3d.geometries.faceShade, faceShadeMaterial);
    faceShade.position.set(0, -0.04, 0.52);
    faceShade.scale.set(1.08, 0.42, 0.12);
    headGroup.add(faceShade);

    const capCrown = new THREE.Mesh(view3d.geometries.capCrown, capMaterial);
    capCrown.position.set(0, 0.16, -0.02);
    capCrown.scale.set(1.02, 0.96, 0.98);
    capCrown.castShadow = true;
    headGroup.add(capCrown);

    const capBand = new THREE.Mesh(view3d.geometries.capBand, trimMaterial);
    capBand.position.set(0, 0.18, 0.01);
    capBand.rotation.x = Math.PI / 2;
    capBand.scale.set(0.9, 0.9, 0.72);
    headGroup.add(capBand);

    const capBrim = new THREE.Mesh(view3d.geometries.capBrim, accentMaterial);
    capBrim.position.set(0, 0.15, 0.62);
    capBrim.scale.set(1.34, 0.3, 0.5);
    capBrim.castShadow = true;
    headGroup.add(capBrim);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.62, 2.42, 0.12);
    root.add(leftArm);

    const leftArmMesh = new THREE.Mesh(view3d.geometries.arm, figureMaterial);
    leftArmMesh.position.set(-0.14, -0.6, 0.02);
    leftArmMesh.rotation.set(0.04, 0, -0.2);
    leftArmMesh.scale.set(0.98, 1.04, 0.94);
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.62, 2.42, 0.12);
    root.add(rightArm);

    const rightArmMesh = new THREE.Mesh(view3d.geometries.arm, figureMaterial);
    rightArmMesh.position.set(0.14, -0.6, 0.02);
    rightArmMesh.rotation.set(0.04, 0, 0.2);
    rightArmMesh.scale.set(0.98, 1.04, 0.94);
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.34, 0.82, 0.02);
    root.add(leftLeg);

    const leftLegMesh = new THREE.Mesh(view3d.geometries.leg, figureMaterial);
    leftLegMesh.position.set(0, -0.38, 0);
    leftLegMesh.rotation.z = 0.03;
    leftLegMesh.scale.set(1, 1, 0.96);
    leftLegMesh.castShadow = true;
    leftLeg.add(leftLegMesh);

    const leftFoot = new THREE.Mesh(view3d.geometries.foot, footMaterial);
    leftFoot.position.set(-0.03, -0.78, 0.22);
    leftFoot.scale.set(0.94, 0.48, 1.12);
    leftFoot.castShadow = true;
    leftLeg.add(leftFoot);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.34, 0.82, 0.02);
    root.add(rightLeg);

    const rightLegMesh = new THREE.Mesh(view3d.geometries.leg, figureMaterial);
    rightLegMesh.position.set(0, -0.38, 0);
    rightLegMesh.rotation.z = -0.03;
    rightLegMesh.scale.set(1, 1, 0.96);
    rightLegMesh.castShadow = true;
    rightLeg.add(rightLegMesh);

    const rightFoot = new THREE.Mesh(view3d.geometries.foot, footMaterial);
    rightFoot.position.set(0.03, -0.78, 0.22);
    rightFoot.scale.set(0.94, 0.48, 1.12);
    rightFoot.castShadow = true;
    rightLeg.add(rightFoot);

    const stunGroup = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const star = new THREE.Mesh(view3d.geometries.stunStar, basicMaterial("#ffd166", { opacity: 0.9, depthWrite: false }));
      star.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.62, 4.62 + i * 0.08, Math.sin((i / 3) * Math.PI * 2) * 0.62);
      stunGroup.add(star);
    }
    stunGroup.visible = false;
    root.add(stunGroup);

    const nameLabelMaterial = new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      depthTest: false,
    });
    const nameLabel = new THREE.Sprite(nameLabelMaterial);
    nameLabel.position.set(0, 5.38, 0);
    nameLabel.scale.set(3.7, 0.92, 1);
    nameLabel.renderOrder = 18;
    nameLabel.visible = false;
    root.add(nameLabel);

    root.userData = {
      body,
      torsoBulge,
      hipBulge,
      pelvis,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      leftFoot,
      rightFoot,
      headGroup,
      head,
      capBrim,
      marker,
      boostRing,
      shieldRing,
      powerRing,
      magnetRing,
      waveRing,
      ballRing,
      stunGroup,
      nameLabel,
      nameLabelMaterial,
      nameLabelText: "",
      nameLabelTeam: "",
      baseRadius: 18,
    };
    return root;
  }

  function createItemObject(drop) {
    const group = new THREE.Group();
    const item = ITEM_TYPES[drop.type];
    const color = item.color;
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 24),
      basicMaterial("#000000", { opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    group.add(shadow);

    const coreMaterial = standardMaterial(color, { emissive: color, emissiveIntensity: 0.28, roughness: 0.48 });
    let core;
    if (drop.type === "shield") {
      core = new THREE.Mesh(view3d.geometries.shieldCore, coreMaterial);
      core.rotation.x = Math.PI / 2;
    } else if (drop.type === "rocket") {
      core = new THREE.Group();
      const body = new THREE.Mesh(view3d.geometries.rocketBody, coreMaterial);
      body.rotation.x = Math.PI / 2;
      const nose = new THREE.Mesh(view3d.geometries.rocketNose, standardMaterial("#fff4dc", { roughness: 0.42 }));
      nose.rotation.x = Math.PI / 2;
      nose.position.z = 0.78;
      core.add(body, nose);
      core.scale.setScalar(0.75);
    } else {
      core = new THREE.Mesh(view3d.geometries.itemCore, coreMaterial);
    }
    core.position.y = 1.25;
    group.add(core);

    const crate = new THREE.Mesh(
      view3d.geometries.itemBox,
      standardMaterial("#fff4dc", { opacity: 0.16, roughness: 0.66 }),
    );
    crate.position.y = 1.25;
    group.add(crate);

    group.userData.core = core;
    group.userData.crate = crate;
    return group;
  }

  function createRocketObject() {
    const group = new THREE.Group();

    const trailGlow = new THREE.Mesh(view3d.geometries.rocketTrailGlow, basicMaterial("#ff4f5e", { opacity: 0.18, depthWrite: false }));
    trailGlow.rotation.x = Math.PI / 2;
    trailGlow.position.z = -3.45;
    group.add(trailGlow);

    const trail = new THREE.Mesh(view3d.geometries.rocketTrail, basicMaterial("#ffd166", { opacity: 0.46, depthWrite: false }));
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -3.05;
    group.add(trail);

    const body = new THREE.Mesh(view3d.geometries.rocketBody, standardMaterial("#ff4f5e", { emissive: "#ff4f5e", emissiveIntensity: 0.32 }));
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    group.add(body);

    const nose = new THREE.Mesh(view3d.geometries.rocketNose, standardMaterial("#fff4dc", { roughness: 0.38 }));
    nose.rotation.x = Math.PI / 2;
    nose.position.z = 1.04;
    nose.castShadow = true;
    group.add(nose);

    const flame = new THREE.Mesh(view3d.geometries.rocketFlame, basicMaterial("#ffd166", { opacity: 0.86, depthWrite: false }));
    flame.rotation.x = -Math.PI / 2;
    flame.position.z = -1.06;
    group.add(flame);
    group.userData.flame = flame;
    group.userData.trail = trail;
    group.userData.trailGlow = trailGlow;
    return group;
  }

  function createImpactObject(effect) {
    const group = new THREE.Group();
    const color = new THREE.Color(effect.color);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const coreMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    const ring = new THREE.Mesh(view3d.geometries.impactRing, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const ring2 = new THREE.Mesh(view3d.geometries.impactRing, ringMaterial);
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.z = Math.PI / 4;
    group.add(ring2);

    const core = new THREE.Mesh(view3d.geometries.impactCore, coreMaterial);
    core.position.y = 0.18;
    group.add(core);

    group.userData.ring = ring;
    group.userData.ring2 = ring2;
    group.userData.core = core;
    group.userData.ringMaterial = ringMaterial;
    group.userData.coreMaterial = coreMaterial;
    return group;
  }

  function initThreeScene() {
    if (view3d.renderer) return;
    initThreeGeometries();
    view3d.scene = new THREE.Scene();
    view3d.scene.background = new THREE.Color("#1d3f53");
    view3d.scene.fog = new THREE.Fog("#1d3f53", 115, 210);
    view3d.overviewCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 260);
    view3d.playCamera = new THREE.PerspectiveCamera(64, 1, 0.1, 240);
    view3d.camera = view3d.overviewCamera;
    view3d.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    view3d.renderer.outputColorSpace = THREE.SRGBColorSpace;
    view3d.renderer.shadowMap.enabled = true;
    view3d.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const hemi = new THREE.HemisphereLight("#d9fff0", "#2e4a57", 2.35);
    view3d.scene.add(hemi);

    const sun = new THREE.DirectionalLight("#fff4dc", 2.55);
    sun.position.set(-28, 72, 48);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -72;
    sun.shadow.camera.right = 72;
    sun.shadow.camera.top = 72;
    sun.shadow.camera.bottom = -72;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 150;
    view3d.scene.add(sun);

    for (const [x, z] of [
      [-58, -42],
      [58, -42],
      [-58, 42],
      [58, 42],
    ]) {
      const flood = new THREE.SpotLight("#fff4dc", 1.35, 150, Math.PI / 5.5, 0.48, 1.4);
      flood.position.set(x, 22, z);
      flood.target.position.set(0, 0.2, 0);
      view3d.scene.add(flood, flood.target);
    }

    view3d.fieldGroup = createPitchMesh();
    view3d.stadiumGroup = createStadiumMesh();
    view3d.actorGroup = new THREE.Group();
    view3d.itemGroup = new THREE.Group();
    view3d.rocketGroup = new THREE.Group();
    view3d.effectGroup = new THREE.Group();
    view3d.ballObject = createBallObject();
    view3d.tacticLine = createTacticLine();

    view3d.scene.add(
      view3d.stadiumGroup,
      view3d.fieldGroup,
      view3d.tacticLine,
      view3d.itemGroup,
      view3d.rocketGroup,
      view3d.effectGroup,
      view3d.actorGroup,
      view3d.ballObject,
    );
  }

  function removeObject(object) {
    if (object?.parent) object.parent.remove(object);
  }

  function resetThreeActors() {
    if (!view3d.renderer) return;
    for (const object of view3d.playerObjects.values()) removeObject(object);
    for (const object of view3d.itemObjects.values()) removeObject(object);
    for (const object of view3d.rocketObjects.values()) removeObject(object);
    for (const object of view3d.effectObjects.values()) removeObject(object);
    view3d.playerObjects.clear();
    view3d.itemObjects.clear();
    view3d.rocketObjects.clear();
    view3d.effectObjects.clear();
  }

  function syncPlayerObjects() {
    const live = new Set();
    for (const player of players) {
      live.add(player.id);
      const visualKey = playerVisualKey(player);
      const existing = view3d.playerObjects.get(player.id);
      if (existing && existing.userData.visualKey !== visualKey) {
        removeObject(existing);
        view3d.playerObjects.delete(player.id);
      }
      if (!view3d.playerObjects.has(player.id)) {
        const object = createPlayerObject(player);
        object.userData.visualKey = visualKey;
        view3d.playerObjects.set(player.id, object);
        view3d.actorGroup.add(object);
      }
      updatePlayerObject(player, view3d.playerObjects.get(player.id));
    }
    for (const [id, object] of view3d.playerObjects.entries()) {
      if (!live.has(id)) {
        removeObject(object);
        view3d.playerObjects.delete(id);
      }
    }
  }

  function updatePlayerObject(player, object) {
    const position = worldPosition(player.x, player.y, 0);
    const moving = Math.min(1, Math.hypot(player.vx, player.vy) / 230);
    const bounce = Math.sin(match.elapsed * 13 + player.slot * 0.8) * 0.1 * moving;
    const hit = clamp((player.hitReactionTimer || 0) / HIT_REACTION_DURATION, 0, 1);
    const slide = clamp((player.slideTimer || 0) / SLIDE_DURATION, 0, 1);
    const slidePose = slide > 0 ? clamp(slide * 1.35, 0, 1) : 0;
    const hitLift = Math.sin(hit * Math.PI) * 1.15;
    const hitWobble = Math.sin(match.elapsed * 46 + player.slot) * hit * 0.16;
    object.visible = true;
    object.position.set(position.x, bounce + hitLift - slidePose * 0.36, position.z);
    object.rotation.set(
      (player.hitDirY || 0) * hit * 0.48 + slidePose * 0.72,
      Math.atan2(player.facingX || player.team.side, player.facingY || 0),
      -(player.hitDirX || 0) * hit * 0.58 + hitWobble,
    );
    const scale = (player.radius / object.userData.baseRadius) * PLAYER_VISUAL_SCALE * (player.stunTimer > 0 ? 0.94 : 1) * (1 + Math.sin(hit * Math.PI) * 0.08);
    const visual = roleVisual(player.tacticalRole);
    object.scale.set(
      scale * visual.scaleX,
      scale * visual.scaleY * (1 - slidePose * 0.08),
      scale * visual.scaleZ * (1 + slidePose * 0.04),
    );

    const swing = Math.sin(match.elapsed * 15 + player.slot) * moving;
    object.userData.leftArm.rotation.x = -swing * 0.44;
    object.userData.rightArm.rotation.x = swing * 0.44;
    object.userData.leftArm.rotation.z = -0.08 - hit * 0.44;
    object.userData.rightArm.rotation.z = 0.08 + hit * 0.44;
    object.userData.leftLeg.rotation.x = swing * 0.5;
    object.userData.rightLeg.rotation.x = -swing * 0.5;
    object.userData.leftFoot.rotation.x = -0.08 - swing * 0.18;
    object.userData.rightFoot.rotation.x = -0.08 + swing * 0.18;
    object.userData.leftFoot.position.y = -0.78 + Math.max(0, swing) * 0.08;
    object.userData.rightFoot.position.y = -0.78 + Math.max(0, -swing) * 0.08;
    object.userData.leftFoot.position.z = 0.22 - swing * 0.08;
    object.userData.rightFoot.position.z = 0.22 + swing * 0.08;
    object.userData.headGroup.rotation.x = player.stunTimer > 0 ? -0.12 : moving * 0.025;
    object.userData.body.rotation.x = player.stunTimer > 0 ? -0.18 : moving * 0.04;
    object.userData.torsoBulge.rotation.x = player.stunTimer > 0 ? -0.12 : moving * 0.025;
    object.userData.hipBulge.rotation.x = player.stunTimer > 0 ? -0.08 : moving * 0.018;
    object.userData.pelvis.rotation.x = player.stunTimer > 0 ? -0.06 : moving * 0.012;
    if (slidePose > 0) {
      object.userData.leftArm.rotation.x = -1.06 * slidePose;
      object.userData.rightArm.rotation.x = -0.86 * slidePose;
      object.userData.leftArm.rotation.z = -0.34;
      object.userData.rightArm.rotation.z = 0.34;
      object.userData.leftLeg.rotation.x = 0.92 * slidePose;
      object.userData.rightLeg.rotation.x = -0.34 * slidePose;
      object.userData.leftFoot.rotation.x = -0.42;
      object.userData.rightFoot.rotation.x = 0.18;
      object.userData.leftFoot.position.y = -0.86;
      object.userData.rightFoot.position.y = -0.74;
      object.userData.leftFoot.position.z = 0.46;
      object.userData.rightFoot.position.z = -0.08;
      object.userData.headGroup.rotation.x = -0.18 * slidePose;
      object.userData.body.rotation.x = 0.2 * slidePose;
      object.userData.torsoBulge.rotation.x = 0.18 * slidePose;
      object.userData.hipBulge.rotation.x = -0.16 * slidePose;
      object.userData.pelvis.rotation.x = -0.12 * slidePose;
    }
    object.userData.marker.visible = player.isHuman && !isMatchPresentationPlaying();
    object.userData.marker.rotation.z += 0.015;
    object.userData.boostRing.visible = player.speedBoostTimer > 0;
    object.userData.boostRing.rotation.z -= 0.075;
    object.userData.shieldRing.visible = player.shieldTimer > 0;
    object.userData.shieldRing.rotation.z += 0.035;
    object.userData.powerRing.visible = player.powerBoostTimer > 0;
    object.userData.powerRing.rotation.z += 0.065;
    object.userData.magnetRing.visible = player.magnetTimer > 0;
    object.userData.magnetRing.rotation.z -= 0.055;
    object.userData.waveRing.visible = player.shockwaveTimer > 0;
    object.userData.waveRing.rotation.z += 0.11;
    object.userData.waveRing.scale.setScalar(1 + (IMPACT_EFFECT_DURATION - player.shockwaveTimer) * 2.4);
    object.userData.ballRing.visible = playerHasBall(player);
    object.userData.ballRing.rotation.z += 0.025;
    object.userData.stunGroup.visible = player.stunTimer > 0;
    object.userData.stunGroup.rotation.y += 0.1;
    updatePlayerNameLabel(player, object);
  }

  function syncItemObjects() {
    const live = new Set();
    for (const drop of itemDrops) {
      live.add(drop.id);
      if (!view3d.itemObjects.has(drop.id)) {
        const object = createItemObject(drop);
        view3d.itemObjects.set(drop.id, object);
        view3d.itemGroup.add(object);
      }
      const object = view3d.itemObjects.get(drop.id);
      const position = worldPosition(drop.x, drop.y, 0);
      const pulse = 1 + Math.sin(drop.pulse) * 0.08;
      object.position.set(position.x, 0, position.z);
      object.scale.setScalar(pulse);
      object.rotation.y += 0.03;
      object.userData.core.rotation.y += 0.045;
      object.userData.crate.rotation.y -= 0.02;
    }
    for (const [id, object] of view3d.itemObjects.entries()) {
      if (!live.has(id)) {
        removeObject(object);
        view3d.itemObjects.delete(id);
      }
    }
  }

  function syncRocketObjects() {
    const live = new Set();
    for (const rocket of rockets) {
      if (!rocket.id) rocket.id = `rocket-${Math.random().toString(16).slice(2)}`;
      live.add(rocket.id);
      if (!view3d.rocketObjects.has(rocket.id)) {
        const object = createRocketObject();
        view3d.rocketObjects.set(rocket.id, object);
        view3d.rocketGroup.add(object);
      }
      const object = view3d.rocketObjects.get(rocket.id);
      const position = worldPosition(rocket.x, rocket.y, 1.32);
      const facing = normalize(rocket.dirX ?? rocket.vx, rocket.dirY ?? rocket.vy);
      const pulse = 1 + Math.sin(match.elapsed * 34) * 0.12;
      object.position.copy(position);
      object.rotation.y = Math.atan2(facing.x, facing.y);
      object.scale.setScalar(1.28);
      object.userData.flame.scale.setScalar(0.92 + Math.sin(match.elapsed * 32) * 0.18);
      object.userData.trail.scale.set(1.0 + pulse * 0.08, 1.0 + pulse * 0.22, 1.0 + pulse * 0.08);
      object.userData.trailGlow.scale.set(1.0 + pulse * 0.08, 1.0 + pulse * 0.18, 1.0 + pulse * 0.08);
    }
    for (const [id, object] of view3d.rocketObjects.entries()) {
      if (!live.has(id)) {
        removeObject(object);
        view3d.rocketObjects.delete(id);
      }
    }
  }

  function syncImpactObjects() {
    const live = new Set();
    for (const effect of impactEffects) {
      live.add(effect.id);
      if (!view3d.effectObjects.has(effect.id)) {
        const object = createImpactObject(effect);
        view3d.effectObjects.set(effect.id, object);
        view3d.effectGroup.add(object);
      }
      const object = view3d.effectObjects.get(effect.id);
      const age = clamp(1 - effect.ttl / effect.duration, 0, 1);
      const fade = clamp(1 - age, 0, 1);
      const position = worldPosition(effect.x, effect.y, effect.height);
      const scale = effect.radius * (0.45 + age * 2.55);
      object.position.copy(position);
      object.userData.ring.scale.setScalar(scale);
      object.userData.ring2.scale.setScalar(scale * 0.72);
      object.userData.core.scale.setScalar(1 + age * 3.2);
      object.userData.ring.rotation.z += 0.08;
      object.userData.ring2.rotation.z -= 0.11;
      object.userData.ringMaterial.opacity = 0.86 * fade;
      object.userData.coreMaterial.opacity = 0.72 * fade;
    }
    for (const [id, object] of view3d.effectObjects.entries()) {
      if (!live.has(id)) {
        removeObject(object);
        view3d.effectObjects.delete(id);
      }
    }
  }

  function updateBallObject() {
    const position = worldPosition(ball.x, ball.y, ball.radius * WORLD_SCALE);
    view3d.ballObject.position.set(position.x, 0, position.z);
    const ballMesh = view3d.ballObject.userData.ballMesh;
    ballMesh.rotation.x += ball.vy * WORLD_SCALE * 0.008;
    ballMesh.rotation.z -= ball.vx * WORLD_SCALE * 0.008;
  }

  function updateTacticLine() {
    const plan = teamPlan("home");
    const lineX = FIELD.width * clamp(0.28 + plan.line * 0.48, 0.18, 0.82);
    view3d.tacticLine.position.x = worldX(lineX);
    view3d.tacticLine.visible = !isMatchPresentationPlaying();
  }

  function updateThreeCamera() {
    const player = humanPlayer();
    if (!isMatchPresentationPlaying() || !player) {
      view3d.camera = view3d.overviewCamera;
      view3d.cameraMode = "setup";
      return;
    }

    const cameraForward = cameraForward2d();
    const forward = new THREE.Vector3(cameraForward.x, 0, cameraForward.y).normalize();
    const shoulder = new THREE.Vector3(-forward.z, 0, forward.x);
    const playerWorld = worldPosition(player.x, player.y, 0);
    const speedRatio = Math.min(1, Math.hypot(player.vx, player.vy) / 260);
    const sizeView = clamp((player.radius - 15) / 9, 0, 1);
    const desiredPosition = playerWorld
      .clone()
      .addScaledVector(forward, -(19.5 + sizeView * 10.5))
      .addScaledVector(shoulder, 1.8 + sizeView * 0.9);
    desiredPosition.y = 12.2 + sizeView * 4.6 + speedRatio * 1.1 + input.cameraPitch * 3.2;

    const desiredTarget = playerWorld.clone().addScaledVector(forward, 14 + speedRatio * 10);
    desiredTarget.y = 4.15 + sizeView * 1.25 + input.cameraPitch * 10.5;

    if (ball) {
      const ballTarget = worldPosition(ball.x, ball.y, 1.1);
      desiredTarget.lerp(ballTarget, playerHasBall(player) ? 0.08 : 0.18);
    }

    if (view3d.cameraMode !== "play") {
      view3d.cameraPosition.copy(desiredPosition);
      view3d.cameraTarget.copy(desiredTarget);
      view3d.cameraMode = "play";
    } else {
      view3d.cameraPosition.lerp(desiredPosition, 0.1);
      view3d.cameraTarget.lerp(desiredTarget, 0.14);
    }

    view3d.playCamera.position.copy(view3d.cameraPosition);
    view3d.playCamera.lookAt(view3d.cameraTarget);
    view3d.camera = view3d.playCamera;
  }

  function renderThreeScene() {
    initThreeScene();
    syncPlayerObjects();
    syncItemObjects();
    syncRocketObjects();
    syncImpactObjects();
    updateBallObject();
    updateTacticLine();
    updateThreeCamera();
    view3d.renderer.render(view3d.scene, view3d.camera);
  }

  function draw() {
    renderThreeScene();
  }

  function drawPitch() {
    const stripe = FIELD.width / 10;
    for (let i = 0; i < 10; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? "#157346" : "#0e683f";
      ctx.fillRect(i * stripe, 0, stripe, FIELD.height);
    }

    ctx.strokeStyle = "rgba(246, 242, 233, 0.72)";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, FIELD.width, FIELD.height);

    ctx.beginPath();
    ctx.moveTo(FIELD.width / 2, 0);
    ctx.lineTo(FIELD.width / 2, FIELD.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(FIELD.width / 2, FIELD.height / 2, PITCH_MARKINGS.centerCircleRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(246, 242, 233, 0.78)";
    ctx.beginPath();
    ctx.arc(FIELD.width / 2, FIELD.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    drawBox(0);
    drawBox(FIELD.width);
    drawGoal(0);
    drawGoal(FIELD.width);
  }

  function drawBox(x) {
    const side = x === 0 ? 1 : -1;
    const penaltyTop = FIELD.height / 2 - PITCH_MARKINGS.penaltyWidth / 2;
    const goalBoxTop = FIELD.height / 2 - PITCH_MARKINGS.goalBoxWidth / 2;
    ctx.strokeStyle = "rgba(246, 242, 233, 0.66)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, penaltyTop, side * PITCH_MARKINGS.penaltyDepth, PITCH_MARKINGS.penaltyWidth);
    ctx.strokeRect(x, goalBoxTop, side * PITCH_MARKINGS.goalBoxDepth, PITCH_MARKINGS.goalBoxWidth);
    ctx.beginPath();
    ctx.arc(x + side * PITCH_MARKINGS.penaltyDepth, FIELD.height / 2, PITCH_MARKINGS.penaltyArcRadius, -Math.PI / 2, Math.PI / 2, side < 0);
    ctx.stroke();
  }

  function drawGoal(x) {
    const side = x === 0 ? -1 : 1;
    ctx.fillStyle = "rgba(246, 242, 233, 0.1)";
    ctx.strokeStyle = "rgba(246, 242, 233, 0.76)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.rect(x, FIELD.goalTop, side * FIELD.goalDepth, FIELD.goalBottom - FIELD.goalTop);
    ctx.fill();
    ctx.stroke();
  }

  function drawTacticalZones() {
    const plan = teamPlan("home");
    const lineX = FIELD.width * clamp(0.28 + plan.line * 0.48, 0.18, 0.82);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 209, 102, 0.34)";
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(lineX, 34);
    ctx.lineTo(lineX, FIELD.height - 34);
    ctx.stroke();
    ctx.restore();
  }

  function drawItemDrops() {
    for (const drop of itemDrops) {
      const item = ITEM_TYPES[drop.type];
      const pulse = 1 + Math.sin(drop.pulse) * 0.08;

      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.beginPath();
      ctx.ellipse(2, 10, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = item.color;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(-15, -15, 30, 30);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#07100d";
      ctx.font = "900 9px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(itemIcon(drop.type), 0, 1);
      ctx.restore();
    }
  }

  function drawRockets() {
    for (const rocket of rockets) {
      const facing = normalize(rocket.dirX ?? rocket.vx, rocket.dirY ?? rocket.vy);

      ctx.save();
      ctx.translate(rocket.x, rocket.y);
      ctx.rotate(Math.atan2(facing.y, facing.x));
      ctx.strokeStyle = "rgba(255, 209, 102, 0.72)";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-58, 0);
      ctx.lineTo(-10, 0);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 79, 94, 0.28)";
      ctx.beginPath();
      ctx.ellipse(-22, 0, 36, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff4f5e";
      ctx.strokeStyle = "#fff4dc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -9);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSkinPattern(player) {
    if (!player.isHuman) return;

    const index = typeof player.skinId === "number" ? player.skinId : 0;
    const pattern = index % 6;
    const accentColors = ["#fff4dc", "#111817", "#ffd166", "#4ec7ff", "#70e000", "#ff4f5e"];
    const accent = accentColors[index % accentColors.length];

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, player.radius - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 4;

    if (pattern === 0) {
      for (let x = -player.radius; x <= player.radius; x += 9) {
        ctx.beginPath();
        ctx.moveTo(x, -player.radius);
        ctx.lineTo(x + 10, player.radius);
        ctx.stroke();
      }
    } else if (pattern === 1) {
      ctx.fillRect(-player.radius, -4, player.radius * 2, 8);
      ctx.fillRect(-4, -player.radius, 8, player.radius * 2);
    } else if (pattern === 2) {
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * 0.32, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pattern === 3) {
      for (let y = -player.radius; y <= player.radius; y += 8) {
        ctx.fillRect(-player.radius, y, player.radius * 2, 4);
      }
    } else if (pattern === 4) {
      ctx.beginPath();
      ctx.moveTo(-player.radius, -player.radius);
      ctx.lineTo(player.radius, 0);
      ctx.lineTo(-player.radius, player.radius);
      ctx.closePath();
      ctx.fill();
    } else {
      for (let y = -player.radius + 4; y < player.radius; y += 10) {
        for (let x = -player.radius + 4; x < player.radius; x += 10) {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(0, player.radius * 0.82, player.radius * 1.15, player.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.isHuman) {
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(13, 16, 15, 0.86)";
      ctx.strokeStyle = "rgba(255, 209, 102, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-23, -player.radius - 28, 46, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffd166";
      ctx.font = "850 10px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tr("ui.you"), 0, -player.radius - 19);
    }

    if (player.speedBoostTimer > 0) {
      ctx.strokeStyle = "rgba(112, 224, 0, 0.88)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.powerBoostTimer > 0) {
      ctx.strokeStyle = "rgba(255, 209, 102, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.magnetTimer > 0) {
      ctx.strokeStyle = "rgba(155, 93, 229, 0.86)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.shockwaveTimer > 0) {
      const wave = 1 - player.shockwaveTimer / IMPACT_EFFECT_DURATION;
      ctx.strokeStyle = `rgba(255, 143, 171, ${0.92 - wave * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 24 + wave * 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.shieldTimer > 0) {
      ctx.strokeStyle = "rgba(78, 199, 255, 0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.stunTimer > 0) {
      ctx.strokeStyle = "rgba(255, 209, 102, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -player.radius - 10, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(14, -player.radius - 10, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (playerHasBall(player)) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.86)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();
    drawSkinPattern(player);

    ctx.strokeStyle = player.team.trim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-player.radius * 0.58, -3);
    ctx.lineTo(player.radius * 0.58, 3);
    ctx.stroke();

    ctx.fillStyle = player.teamKey === "away" ? "#0b1b22" : "#fff9ec";
    ctx.font = "850 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.role, 0, 1);
    ctx.restore();
  }

  function drawBall() {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(2, 7, ball.radius * 1.25, ball.radius * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff9ec";
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#20231f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function tick(timestamp) {
    if (!match.lastTime) match.lastTime = timestamp;
    const realDt = Math.min(0.033, (timestamp - match.lastTime) / 1000);
    match.lastTime = timestamp;

    if (match.toastTimer > 0) {
      match.toastTimer -= realDt;
      if (match.toastTimer <= 0) toast.classList.remove("visible");
    }

    sendOnlineInput(timestamp);
    updateFallbackMouseLook(realDt);

    let remaining = realDt * match.speed;
    while (remaining > 0 && !match.paused && !match.ended) {
      const dt = Math.min(0.025, remaining);
      step(dt);
      remaining -= dt;
    }
    sendOnlineSnapshot(timestamp);

    updateHud();
    draw();
    requestAnimationFrame(tick);
  }

  function setActiveButton(container, dataName, value) {
    for (const button of container.querySelectorAll("button")) {
      button.classList.toggle("is-active", button.dataset[dataName] === value);
    }
  }

  function openSettings() {
    pendingControlAction = null;
    settingsOverlay.hidden = false;
    match.paused = true;
    renderControlBindings();
    updateHud();
  }

  function closeSettings() {
    pendingControlAction = null;
    settingsOverlay.hidden = true;
    renderControlBindings();
  }

  function toggleMatchPlay() {
    if (isOnlineActive() && !isOnlineHost()) {
      showToast(tr("toast.hostOnly"));
      return;
    }
    if (match.ended) setupMatch(true);
    match.paused = !match.paused;
    showToast(match.paused ? tr("toast.paused") : tr("toast.matchOn"));
    updateHud();
    if (!match.paused && !match.ended) requestMouseLookLock();
  }

  function handleStatControlInput(event) {
    const input = event.target.closest("input[data-stat]");
    if (!input) return;
    updatePlayerBuild(input.dataset.stat, Number(input.value));
  }

  statControls.addEventListener("input", handleStatControlInput);
  onlineStatControls?.addEventListener("input", handleStatControlInput);

  resetBuildButton.addEventListener("click", () => {
    state.playerStats = { ...DEFAULT_PLAYER_STATS };
    savePlayerStats();
    renderBuildControls();
    setupMatch(true);
    sendOnlineProfile(true);
  });

  settingsButton.addEventListener("click", openSettings);
  settingsPanelButton.addEventListener("click", openSettings);
  settingsCloseButton.addEventListener("click", closeSettings);
  settingsOverlay.addEventListener("click", (event) => {
    if (event.target === settingsOverlay) closeSettings();
  });

  createRoomButton?.addEventListener("click", () => {
    if (isOnlineActive()) {
      copyRoomLink();
      return;
    }
    if (online.pendingRoomCode) {
      joinOnlineRoom(online.pendingRoomCode);
      return;
    }
    createOnlineRoom();
  });

  onlineNameInput?.addEventListener("input", () => {
    updatePlayerName(onlineNameInput.value);
  });

  onlineNameInput?.addEventListener("blur", () => {
    const nextName = playerNameForDisplay(state.playerName);
    if (nextName !== state.playerName) updatePlayerName(nextName);
    renderPlayerNameInput();
  });

  onlineTeamButtons?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-online-team]");
    if (!button) return;
    updateOnlineTeamPreference(button.dataset.onlineTeam);
  });

  copyRoomButton?.addEventListener("click", copyRoomLink);
  leaveRoomButton?.addEventListener("click", leaveOnlineRoom);

  controlBindings.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-control-action]");
    if (!button) return;
    pendingControlAction = button.dataset.controlAction;
    renderControlBindings();
  });

  resetControlsButton.addEventListener("click", () => {
    state.controlBindings = { ...DEFAULT_CONTROL_BINDINGS };
    saveControlBindings();
    pendingControlAction = null;
    renderControlBindings();
  });

  tacticButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tactic]");
    if (!button) return;
    if (!TACTICS[button.dataset.tactic]) return;
    const tacticId = button.dataset.tactic;
    if (isOnlineActive()) {
      const teamKey = editableTeamKey();
      state.onlineTeamPreference = teamKey;
      setTeamTactic(teamKey, tacticId);
      updateAiTacticalRoles(teamPlan("home"), teamPlan("away"));
      setActiveButton(tacticButtons, "tactic", currentTacticSelection());
      logEvent(() => `${onlineTeamLabel(teamKey)} ${tacticLabel(tacticId)} ${tr("event.tacticSet")}`);
      showToast(`${onlineTeamLabel(teamKey)} ${tacticLabel(tacticId)}`);
      sendOnlineProfile(true);
      updateHud();
      return;
    }

    state.tactic = tacticId;
    updateAiTacticalRoles(teamPlan("home"), teamPlan("away"));
    setActiveButton(tacticButtons, "tactic", state.tactic);
    logEvent(() => `${tacticLabel(tacticId)} ${tr("event.tacticSet")}`);
    showToast(tacticLabel(tacticId));
    sendOnlineProfile(true);
    updateHud();
  });

  matchRuleButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-match-rule]");
    if (!button) return;
    if (!MATCH_RULES[button.dataset.matchRule]) return;
    state.matchRule = button.dataset.matchRule;
    saveMatchRule();
    setActiveButton(matchRuleButtons, "matchRule", state.matchRule);
    setupMatch(true);
    showToast(matchRuleLabel(state.matchRule));
    sendOnlineProfile(true);
    updateHud();
  });

  kitButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-kit]");
    if (!button) return;
    if (!KIT_STYLES[button.dataset.kit]) return;
    const kitId = button.dataset.kit;
    if (isOnlineActive()) {
      const teamKey = editableTeamKey();
      state.onlineTeamPreference = teamKey;
      setTeamKit(teamKey, kitId);
      updateTeamKits();
      setActiveButton(kitButtons, "kit", currentKitSelection());
      showToast(`${onlineTeamLabel(teamKey)} ${kitLabel(kitId)}`);
      sendOnlineProfile(true);
      updateHud();
      return;
    }

    state.kit = kitId;
    saveKit();
    updateTeamKits();
    setActiveButton(kitButtons, "kit", state.kit);
    showToast(kitLabel(state.kit));
    sendOnlineProfile(true);
    updateHud();
  });

  playPauseButton.addEventListener("click", toggleMatchPlay);
  lobbyStartButton.addEventListener("click", toggleMatchPlay);

  speedButton.addEventListener("click", () => {
    match.speed = match.speed === 1 ? 2 : match.speed === 2 ? 4 : 1;
    updateHud();
  });

  resetButton.addEventListener("click", () => {
    if (isOnlineActive() && !isOnlineHost()) {
      showToast(tr("toast.hostOnly"));
      return;
    }
    setupMatch(true);
  });

  languageButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-language]");
    if (!button || !I18N[button.dataset.language]) return;
    state.language = button.dataset.language;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
    } catch {
      // Language still changes for the current session.
    }
    applyLanguage();
    sendOnlineProfile(true);
  });

  itemUseButton.addEventListener("click", () => {
    const player = humanPlayer();
    if (!player || match.paused || match.ended) return;
    if (isOnlineActive() && !isOnlineHost()) {
      input.itemQueued = true;
      sendOnlineInput(performance.now());
      updateHud();
      return;
    }
    useHeldItem(player);
    updateHud();
  });

  canvas.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    input.pointerInside = true;
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;
    setMouseLookActive(isMatchPresentationPlaying());
    updateEdgeLookFromPointer(event.clientX, event.clientY);
  });

  canvas.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    input.pointerInside = false;
    updateEdgeLookFromPointer(event.clientX, event.clientY);
    if (document.pointerLockElement !== canvas) setMouseLookActive(input.pointerDragging || input.mouseLookArmed);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!isMatchPresentationPlaying() || event.button !== 0) return;
    event.preventDefault();
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;

    if (event.pointerType === "touch") {
      input.pointerDragging = true;
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    } else {
      input.pointerInside = true;
      input.mouseLookArmed = true;
      updateEdgeLookFromPointer(event.clientX, event.clientY);
      requestMouseLookLock();
    }

    setMouseLookActive(true);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!isMatchPresentationPlaying() || document.pointerLockElement === canvas) return;

    const isTouch = event.pointerType === "touch";
    if (isTouch && !input.pointerDragging) return;

    if (!isTouch) {
      input.pointerInside = true;
      input.lastPointerX = event.clientX;
      input.lastPointerY = event.clientY;
      input.mouseLookArmed = true;
      updateEdgeLookFromPointer(event.clientX, event.clientY);
      setMouseLookActive(true);
      return;
    }

    const deltaX = event.clientX - input.lastPointerX;
    const deltaY = event.clientY - input.lastPointerY;
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;
    if (!isTouch) setMouseLookActive(true);
    rotateCameraLook(deltaX, deltaY, isTouch ? CAMERA_TOUCH_SENSITIVITY : CAMERA_SENSITIVITY);
  });

  window.addEventListener("pointerup", () => {
    input.pointerDragging = false;
    if (document.pointerLockElement !== canvas) setMouseLookActive(input.pointerInside || input.mouseLookArmed);
  });

  window.addEventListener("pointercancel", () => {
    input.pointerDragging = false;
    if (document.pointerLockElement !== canvas) setMouseLookActive(input.pointerInside || input.mouseLookArmed);
  });

  window.addEventListener("blur", () => {
    if (document.pointerLockElement !== canvas) releaseMouseLook();
  });

  window.addEventListener("mousemove", (event) => {
    if (!isMatchPresentationPlaying()) return;

    if (document.pointerLockElement === canvas) {
      rotateCameraLook(event.movementX, event.movementY, CAMERA_SENSITIVITY);
      return;
    }

    if (!input.mouseLookArmed || isTextEditingTarget(event.target)) return;

    const hasMovement = Number.isFinite(event.movementX) && Number.isFinite(event.movementY);
    const deltaX = hasMovement ? event.movementX : event.clientX - input.lastPointerX;
    const deltaY = hasMovement ? event.movementY : event.clientY - input.lastPointerY;
    input.lastPointerX = event.clientX;
    input.lastPointerY = event.clientY;
    updateEdgeLookFromPointer(event.clientX, event.clientY);
    setMouseLookActive(true);
    rotateCameraLook(deltaX, deltaY, CAMERA_SENSITIVITY);
  });

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) resetEdgeLook();
    setMouseLookActive(
      document.pointerLockElement === canvas || input.pointerDragging || input.pointerInside || input.mouseLookArmed,
    );
  });

  window.addEventListener("keydown", (event) => {
    const key = normalizeKeyName(event.key);
    if (isTextEditingTarget(event.target)) return;

    if (pendingControlAction) {
      event.preventDefault();
      if (key === "escape") {
        pendingControlAction = null;
        renderControlBindings();
        return;
      }
      setControlBinding(pendingControlAction, key);
      pendingControlAction = null;
      renderControlBindings();
      return;
    }

    if (!settingsOverlay.hidden) {
      if (key === "escape") closeSettings();
      event.preventDefault();
      return;
    }

    if (!isControlKey(key)) return;
    event.preventDefault();

    input.keys.add(key);
    if (event.repeat) return;

    if (isActionKey("item", key)) input.itemQueued = true;
    if (isActionKey("slide", key)) input.slideQueued = true;
    if (isActionKey("pause", key)) {
      if (isOnlineActive() && !isOnlineHost()) {
        showToast(tr("toast.hostOnly"));
        return;
      }
      match.paused = !match.paused;
      showToast(match.paused ? tr("toast.paused") : tr("toast.matchOn"));
      if (!match.paused && !match.ended) requestMouseLookLock();
    }
    if (isActionKey("reset", key)) {
      if (isOnlineActive() && !isOnlineHost()) {
        showToast(tr("toast.hostOnly"));
        return;
      }
      setupMatch(true);
    }
  });

  window.addEventListener("keyup", (event) => {
    input.keys.delete(normalizeKeyName(event.key));
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  renderBuildControls();
  renderControlBindings();
  setupMatch(true);
  applyLanguage();
  initOnlineFromUrl();
  requestAnimationFrame(tick);
})();
