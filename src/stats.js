export const PLAYER_STAT_KEYS = ["speed", "physical", "power"];
export const PLAYER_STAT_MIN = 20;
export const PLAYER_STAT_MAX = 90;
export const PLAYER_POINT_BUDGET = 150;

export const DEFAULT_PLAYER_STATS = {
  speed: 55,
  physical: 45,
  power: 50,
};

const PHYSICAL_RESISTANCE_CURVE = [
  { stat: 20, resistance: 0.3 },
  { stat: 40, resistance: 0.5 },
  { stat: 50, resistance: 0.6 },
  { stat: 70, resistance: 1.5 },
  { stat: 90, resistance: 2.0 },
];

const POWER_SHOVE_CURVE = [
  { stat: 20, shove: 760 },
  { stat: 40, shove: 1080 },
  { stat: 50, shove: 1300 },
  { stat: 70, shove: 1680 },
  { stat: 90, shove: 2250 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function playerStatTotal(stats = DEFAULT_PLAYER_STATS) {
  return PLAYER_STAT_KEYS.reduce((total, key) => total + stats[key], 0);
}

export function normalizePlayerStats(stats) {
  const hasLegacyBuild =
    stats &&
    (stats.shoot !== undefined || stats.pass !== undefined || stats.defense !== undefined || stats.keeper !== undefined) &&
    (stats.physical === undefined || stats.power === undefined);
  if (hasLegacyBuild) return { ...DEFAULT_PLAYER_STATS };

  const normalized = { ...DEFAULT_PLAYER_STATS };
  if (stats && stats.physical === undefined) {
    const defense = Number(stats.defense);
    const keeper = Number(stats.keeper);
    if (Number.isFinite(defense) || Number.isFinite(keeper)) {
      const source = [defense, keeper].filter(Number.isFinite);
      normalized.physical = clamp(Math.round(source.reduce((total, value) => total + value, 0) / source.length), PLAYER_STAT_MIN, PLAYER_STAT_MAX);
    }
  }
  if (stats && stats.power === undefined) {
    const shoot = Number(stats.shoot);
    if (Number.isFinite(shoot)) normalized.power = clamp(Math.round(shoot), PLAYER_STAT_MIN, PLAYER_STAT_MAX);
  }
  for (const key of PLAYER_STAT_KEYS) {
    const value = Number(stats?.[key]);
    if (Number.isFinite(value)) {
      normalized[key] = clamp(Math.round(value), PLAYER_STAT_MIN, PLAYER_STAT_MAX);
    }
  }
  if (playerStatTotal(normalized) > PLAYER_POINT_BUDGET) {
    return { ...DEFAULT_PLAYER_STATS };
  }
  let overflow = playerStatTotal(normalized) - PLAYER_POINT_BUDGET;
  while (overflow > 0) {
    const key = PLAYER_STAT_KEYS.find((stat) => normalized[stat] > PLAYER_STAT_MIN);
    if (!key) break;
    const reduction = Math.min(overflow, normalized[key] - PLAYER_STAT_MIN);
    normalized[key] -= reduction;
    overflow -= reduction;
  }
  return normalized;
}

export function roleScores(stats = DEFAULT_PLAYER_STATS) {
  return {
    FW: stats.power * 0.82 + stats.speed * 0.72 + stats.physical * 0.2,
    MD: stats.speed * 0.56 + stats.physical * 0.48 + stats.power * 0.44,
    DF: stats.physical * 0.84 + stats.power * 0.48 + stats.speed * 0.22,
    GK: stats.physical * 0.78 + stats.power * 0.68 - stats.speed * 0.18,
  };
}

export function playerRole(stats = DEFAULT_PLAYER_STATS) {
  const scores = roleScores(stats);
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export function playerStatsFromPointBuild(pointStats) {
  const stats = normalizePlayerStats(pointStats);
  const ratio = (key) => clamp((stats[key] - PLAYER_STAT_MIN) / (PLAYER_STAT_MAX - PLAYER_STAT_MIN), 0, 1);
  return {
    speed: ratio("speed"),
    physical: ratio("physical"),
    power: ratio("power"),
  };
}

export function physicalResistanceFromStat(physicalStat) {
  const physical = clamp(physicalStat ?? 0.5, 0, 1);
  for (let i = 1; i < PHYSICAL_RESISTANCE_CURVE.length; i += 1) {
    const lower = PHYSICAL_RESISTANCE_CURVE[i - 1];
    const upper = PHYSICAL_RESISTANCE_CURVE[i];
    const lowerRatio = (lower.stat - PLAYER_STAT_MIN) / (PLAYER_STAT_MAX - PLAYER_STAT_MIN);
    const upperRatio = (upper.stat - PLAYER_STAT_MIN) / (PLAYER_STAT_MAX - PLAYER_STAT_MIN);
    if (physical <= upperRatio) {
      const t = clamp((physical - lowerRatio) / Math.max(upperRatio - lowerRatio, 0.001), 0, 1);
      return lower.resistance + (upper.resistance - lower.resistance) * t;
    }
  }
  return PHYSICAL_RESISTANCE_CURVE[PHYSICAL_RESISTANCE_CURVE.length - 1].resistance;
}

export function speedDriveFromStat(speedStat, exponent) {
  const speed = clamp(speedStat, 0, 1);
  const middleBandSlowdown =
    1 -
    0.18 *
      clamp((speed - 0.28) / 0.24, 0, 1) *
      clamp((0.86 - speed) / 0.18, 0, 1);
  return Math.pow(speed, exponent) * middleBandSlowdown;
}

export function powerShoveFromStat(powerStat) {
  const power = PLAYER_STAT_MIN + clamp(powerStat, 0, 1) * (PLAYER_STAT_MAX - PLAYER_STAT_MIN);
  for (let i = 1; i < POWER_SHOVE_CURVE.length; i += 1) {
    const lower = POWER_SHOVE_CURVE[i - 1];
    const upper = POWER_SHOVE_CURVE[i];
    if (power <= upper.stat) {
      const t = clamp((power - lower.stat) / Math.max(upper.stat - lower.stat, 0.001), 0, 1);
      return lower.shove + (upper.shove - lower.shove) * t;
    }
  }
  return POWER_SHOVE_CURVE[POWER_SHOVE_CURVE.length - 1].shove;
}

export function speedBoostMultiplier(player) {
  return player?.speedBoostTimer > 0 ? 1.5 : 1;
}

export function speedBoostAccelMultiplier(player) {
  return player?.speedBoostTimer > 0 ? 1.25 : 1;
}

export function skinIndexFromStats(stats) {
  const normalized = normalizePlayerStats(stats);
  return PLAYER_STAT_KEYS.reduce((total, key, index) => total + normalized[key] * (index + 3), 0) % 30;
}
