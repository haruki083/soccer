export const FIELD = {
  width: 1720,
  height: 1080,
  goalTop: 430,
  goalBottom: 650,
  goalDepth: 54,
};

export const PITCH_MARKINGS = {
  centerCircleRadius: 134,
  penaltyDepth: 238,
  penaltyWidth: 460,
  goalBoxDepth: 94,
  goalBoxWidth: 250,
  penaltyArcRadius: 106,
};

export const TEAM = {
  home: {
    name: "Falcons",
    side: 1,
    shirt: "#ff4f5e",
    trim: "#fff4dc",
    goalX: FIELD.width,
    ownGoalX: 0,
  },
  away: {
    name: "Rivals",
    side: -1,
    shirt: "#4ec7ff",
    trim: "#0b1b22",
    goalX: 0,
    ownGoalX: FIELD.width,
  },
};

export const ITEM_TYPES = {
  boost: {
    name: "SPEED BOOST",
    icon: "SPD",
    color: "#70e000",
    duration: 8,
  },
  rocket: {
    name: "ROCKET",
    icon: "RKT",
    color: "#ff4f5e",
    duration: 0,
    charges: 3,
  },
  shield: {
    name: "SHIELD",
    icon: "SHD",
    color: "#4ec7ff",
    duration: 15,
  },
  power: {
    name: "POWER CORE",
    icon: "PWR",
    color: "#ffd166",
    duration: 9,
  },
  magnet: {
    name: "MAGNET",
    icon: "MAG",
    color: "#9b5de5",
    duration: 7,
  },
  shockwave: {
    name: "SHOCKWAVE",
    icon: "WAV",
    color: "#ff8fab",
    duration: 0,
  },
};

export const ROCKET_SPEED = 650;
export const ROCKET_TTL = 3.0;
export const ROCKET_BALL_FORCE = 1180;
export const ROCKET_CARRIER_BALL_FORCE = 680;
export const ROCKET_PLAYER_KNOCKBACK = 700;
export const SHOCKWAVE_RADIUS = 268;
export const SHOCKWAVE_BALL_FORCE = 1780;
export const SHOCKWAVE_BALL_CLOSE_BONUS = 1180;
export const SHOCKWAVE_PLAYER_FORCE = 1420;
export const SHOCKWAVE_PLAYER_CLOSE_BONUS = 980;
export const SHOCKWAVE_STUN_MIN = 1;
export const SHOCKWAVE_STUN_MAX = 7;
export const ROCKET_STUN_MIN = 3;
export const ROCKET_STUN_MAX = 11;
export const HIT_REACTION_DURATION = 0.72;
export const IMPACT_EFFECT_DURATION = 0.58;
export const SLIDE_DURATION = 0.48;
export const SLIDE_COOLDOWN = 7;
export const PLAYER_RADIUS_BASE = 11.3;
export const PLAYER_RADIUS_PHYSICAL_SCALE = 14.8;
export const PLAYER_VISUAL_SCALE = 1.6;

export const TACTICS = {
  balanced: { label: "BALANCED", line: 0.5, width: 0.55, press: 0.5, tempo: 0.55, risk: 0.5 },
  counter: { label: "COUNTER", line: 0.4, width: 0.46, press: 0.34, tempo: 0.74, risk: 0.68 },
  press: { label: "HIGH PRESS", line: 0.66, width: 0.6, press: 0.9, tempo: 0.66, risk: 0.58 },
};

export const TACTIC_ROLE_SETS = {
  balanced: ["GK", "DF", "CM", "FW"],
  counter: ["GK", "DF", "DF", "FW"],
  press: ["GK", "CM", "FW", "FW"],
};

export const TACTIC_BEHAVIOR = {
  balanced: {
    looseChasers: 2,
    carrierPressers: 1,
    keeperDepth: 62,
    lineShift: 0,
    attackPush: 0,
    defendDrop: 0,
    chaseUrgency: 0,
    pressRadius: 0,
    shapeWidth: 1,
    ballPull: 0.26,
  },
  counter: {
    looseChasers: 1,
    carrierPressers: 1,
    keeperDepth: 56,
    lineShift: -54,
    attackPush: 22,
    defendDrop: 58,
    chaseUrgency: -0.07,
    pressRadius: -70,
    shapeWidth: 1.1,
    ballPull: 0.18,
  },
  press: {
    looseChasers: 3,
    carrierPressers: 3,
    keeperDepth: 92,
    lineShift: 66,
    attackPush: 38,
    defendDrop: -38,
    chaseUrgency: 0.18,
    pressRadius: 150,
    shapeWidth: 0.86,
    ballPull: 0.38,
  },
};

export const GOAL_FRONT_START = [
  { role: "GK", depth: 0.04, lane: 0 },
  { role: "DF", depth: 0.07, lane: -1 },
  { role: "CM", depth: 0.09, lane: 1 },
  { role: "FW", depth: 0.12, lane: 0 },
];

export const ROLE_STATS = {
  GK: { speed: 0.42, physical: 0.94, power: 0.8 },
  DF: { speed: 0.52, physical: 0.88, power: 0.84 },
  CM: { speed: 0.7, physical: 0.58, power: 0.62 },
  FW: { speed: 0.88, physical: 0.42, power: 0.86 },
};

export const ENEMY_AI_ARCHETYPES = [
  {
    statBias: { speed: -0.1, physical: 0.16, power: 0.07 },
    movement: { urgency: 0.93, chaseUrgency: -0.03, pressRadius: 20, attackPush: -10, defendDrop: 18, shapeWidth: 1.08, ballPull: -0.02, itemUse: 0.88 },
  },
  {
    statBias: { speed: 0.15, physical: -0.12, power: -0.03 },
    movement: { urgency: 1.16, chaseUrgency: 0.13, pressRadius: 58, attackPush: 16, defendDrop: -10, shapeWidth: 0.92, ballPull: 0.04, itemUse: 1.16 },
  },
  {
    statBias: { speed: 0.04, physical: -0.06, power: 0.14 },
    movement: { urgency: 1.04, chaseUrgency: 0.04, pressRadius: 24, attackPush: 36, defendDrop: -18, shapeWidth: 0.98, ballPull: 0.02, itemUse: 1.2 },
  },
  {
    statBias: { speed: -0.04, physical: 0.1, power: 0.02 },
    movement: { urgency: 0.98, chaseUrgency: -0.04, pressRadius: -18, attackPush: -24, defendDrop: 34, shapeWidth: 1.14, ballPull: -0.05, itemUse: 0.95 },
  },
  {
    statBias: { speed: 0.08, physical: 0.02, power: -0.04 },
    movement: { urgency: 1.08, chaseUrgency: 0.08, pressRadius: 36, attackPush: 8, defendDrop: 4, shapeWidth: 1.02, ballPull: 0.08, itemUse: 1.05 },
  },
];

export const DEFAULT_AI_MOVEMENT_PROFILE = {
  urgency: 1,
  chaseUrgency: 0,
  pressRadius: 0,
  attackPush: 0,
  defendDrop: 0,
  lineShift: 0,
  shapeWidth: 1,
  ballPull: 0,
  laneJitter: 0,
  lanePhase: 0,
  keeperDepth: 0,
  itemUse: 1,
};

export const ROLE_VISUALS = {
  GK: { color: "#9b5de5", scaleX: 1.16, scaleY: 1.02, scaleZ: 1.16 },
  DF: { color: "#70e000", scaleX: 1.18, scaleY: 0.96, scaleZ: 1.14 },
  CM: { color: "#4ec7ff", scaleX: 1, scaleY: 1, scaleZ: 1 },
  FW: { color: "#ff4f5e", scaleX: 0.84, scaleY: 1.08, scaleZ: 0.88 },
};

export const DEFAULT_KIT = "crimsonBlue";
export const DEFAULT_AWAY_KIT = "skyStripes";
export const KIT_STYLES = {
  crimsonBlue: {
    label: "CRIMSON BODY",
    base: "#d62f50",
    accent: "#123f8c",
    trim: "#f8fbff",
    foot: "#9d1c35",
    cap: "#ffffff",
    pattern: "solid",
  },
  blackWhite: {
    label: "INK BODY",
    base: "#22282c",
    accent: "#f8fbff",
    trim: "#8fa0aa",
    foot: "#111719",
    cap: "#ffffff",
    pattern: "solid",
  },
  redCenter: {
    label: "SUNSET BODY",
    base: "#ff7757",
    accent: "#ffe06a",
    trim: "#8d3025",
    foot: "#d54a35",
    cap: "#fff9ec",
    pattern: "solid",
  },
  skyStripes: {
    label: "SKY BODY",
    base: "#75d9ff",
    accent: "#17232d",
    trim: "#f8fbff",
    foot: "#39a8d2",
    cap: "#ffffff",
    pattern: "solid",
  },
  sash: {
    label: "CHERRY BODY",
    base: "#e21f3b",
    accent: "#ffffff",
    trim: "#17232d",
    foot: "#a80f24",
    cap: "#ffffff",
    pattern: "solid",
  },
  redBlack: {
    label: "GRAPHITE BODY",
    base: "#3a4249",
    accent: "#ff4f5e",
    trim: "#f8fbff",
    foot: "#1b2025",
    cap: "#ffffff",
    pattern: "solid",
  },
};

export const AWAY_KIT_STYLE = {
  label: "AWAY",
  base: "#506dff",
  accent: "#fff4dc",
  trim: "#0b1b22",
  foot: "#314cc7",
  cap: "#ffffff",
  pattern: "solid",
};

export const SKIN_STYLES = [
  "BLAZE",
  "FROST",
  "VOLT",
  "NEON",
  "CROWN",
  "VOID",
  "WAVE",
  "METAL",
  "SOLAR",
  "PIXEL",
];

export const SKIN_ACCENTS = ["#fff4dc", "#111817", "#ffd166", "#4ec7ff", "#70e000", "#ff4f5e"];
